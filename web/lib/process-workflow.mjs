import { BpmnModdle } from 'bpmn-moddle';
import dagre from '@dagrejs/dagre';
import { workflowBasis } from './workflow-spec.mjs';
import { assessWorkflow, assertEligibleDiagram, verifiedApplications } from './workflow-quality.mjs';

const perspectives = ['diagram1_people', 'diagram2_technology', 'diagram3_combined'];
const unresolved = 'Unresolved; assignment and validation required';
const layouts = new WeakMap();

export const sampleFormat = {
  people: ['Requestor', 'Onboarding Ops', 'Approver', 'Data Platform Team', 'Process Ops', 'Steward', 'Process SPECIALIST', 'Integration Team', 'Service Management Team', 'Ops Lead'],
  technology: ['Workflow Orchestration', 'Data Platform', 'Data Quality', 'Request & Workflow', 'ServiceNow', 'Reporting', 'External Data / Consumers', 'Integration & Delivery'],
  colors: { Task: '#9ACAF0', UserTask: '#9ACAF0', ManualTask: '#F6B94F', ServiceTask: '#9DD7AA', ScriptTask: '#9DD7AA', timer: '#FFE275', exception: '#EF9292', success: '#216E39', white: '#FFFFFF', stroke: '#000000' },
  task: { width: 240, height: 160 },
  event: { width: 80, height: 80 },
  phase: { width: 240, height: 120 },
};

const wrappedLabel = text => text.split('\n').map(line => {
  const lines = [''];
  for (const word of line.split(/\s+/)) {
    if (lines.at(-1).length + word.length + 1 > 28) lines.push(word);
    else lines[lines.length - 1] += `${lines.at(-1) ? ' ' : ''}${word}`;
  }
  return lines.join('\n');
}).join('\n');

function proposedTaskType(node, workflow, technology) {
  if (!node.step || !technology) return node.type;
  if (workflow.spec.technical.includes(node.number)) return 'ServiceTask';
  if (/inspect original|physical|in.person|manual|hand over/i.test(node.name)) return 'ManualTask';
  return 'UserTask';
}

export function workflowNavigation(workflow, validation = null) {
  const gates = assessWorkflow(workflow, validation).gates;
  const eligible = perspectives.filter((view, index) => gates[['people', 'technology', 'combined'][index]].status !== 'BLOCKED');
  let first = 1;
  const phases = workflow.spec.phases.map((phase, index) => {
    const id = `${workflow.id}_phase_${index + 1}`;
    const members = workflow.steps.slice(first - 1, phase.end).map(step => step.id);
    first = phase.end + 1;
    return { id, title: phase.title, members, context: ['Sample-format phase projection with adjacent context; full semantic routing retained'], views: Object.fromEntries(eligible.map(view => [view, `${view}__${id}`])) };
  });
  return { steps: workflow.steps.map(step => ({ id: step.id, name: step.name })), phases, diagrams: ['overview', ...eligible, ...phases.flatMap(phase => Object.values(phase.views))] };
}

export function buildWorkflowGraph(workflow) {
  const nodes = [], edges = [], containers = new Map();
  const prefix = workflow.id;
  const stepId = number => `${prefix}-S${String(number).padStart(3, '0')}`;
  const scopes = workflow.spec.instances.map((instance, index) => ({ ...instance, id: `${prefix}_scope_${index + 1}`, parent: 'root' }));
  const remedialReturns = { 'WF-02': [11], 'WF-11': [15], 'WF-12': [28], 'WF-14': [7], 'WF-15': [31], 'WF-16': [37, 42], 'WF-17': [9], 'WF-18': [10, 30], 'WF-20': [36] }[prefix] || [];
  const scopeFor = number => scopes.find(scope => number >= scope.first && number <= scope.last)?.id || 'root';
  const addNode = (id, type, name, parent = 'root', data = {}) => {
    if (nodes.some(node => node.id === id)) throw new Error(`Duplicate node ${id}`);
    nodes.push({ id, type, name, parent, ...data });
    return id;
  };
  const edge = (from, to, label = '', data = {}) => {
    edges.push({ id: `${prefix}_flow_${edges.length + 1}`, from, to, label, ...data });
  };
  const end = (parent, outcome) => {
    const id = `${prefix}_${parent}_${outcome}`;
    if (!nodes.some(node => node.id === id)) addNode(id, 'EndEvent', outcome.replaceAll('_', ' '), parent, { outcome });
    return id;
  };
  const targetFor = (number, parent) => {
    const scope = scopeFor(number);
    if (scope === parent) return stepId(number);
    if (parent === 'root') return scope;
    throw new Error(`Cross-scope return needs explicit routing: ${stepId(number)}`);
  };
  const hold = (origin, parent, resume, reason) => {
    const id = `${origin}_hold`;
    addNode(id, 'IntermediateCatchEvent', 'Hold: resolution or close', parent, { hold: true, owner: unresolved, reason, resumeAt: resume });
    const decision = addNode(`${origin}_resolution`, 'ExclusiveGateway', 'Authorised resolution?', parent);
    edge(id, decision);
    edge(decision, resume, 'Resolved + authorised budget', { condition: 'Recorded resolution, assigned owner and authorised budget; preserve counters and invalidate affected approvals', resume: true });
    edge(decision, end(parent, 'closed'), 'Close / expire / withdraw', { condition: 'Authorised closure disposition recorded' });
    edge(decision, id, 'Still unresolved', { default: true });
    return id;
  };
  for (const step of workflow.steps) {
    const number = Number(step.id.slice(-3));
    addNode(step.id, 'Task', step.name, scopeFor(number), { step, number });
  }
  for (const scope of scopes) addNode(scope.id, 'SubProcess', scope.title, 'root', { scope });

  function buildContainer(parent, first, last) {
    const start = addNode(`${prefix}_${parent}_start`, 'StartEvent', parent === 'root' ? 'Case registered' : 'Each in-scope instance', parent);
    const finish = end(parent, 'complete');
    containers.set(parent, { start, finish });
    const entries = new Map(), exits = new Map();
    const tokens = [];
    for (let number = first; number <= last; number++) {
      const scope = parent === 'root' && scopes.find(candidate => candidate.first === number);
      if (scope) {
        buildContainer(scope.id, scope.first, scope.last);
        tokens.push({ first: number, last: scope.last, id: scope.id, scope });
        number = scope.last;
      } else tokens.push({ first: number, last: number, id: stepId(number) });
    }
    for (const token of tokens) {
      const number = token.first;
      let entry = token.id, output = token.id;
      const step = workflow.steps[number - 1];
      if (!token.scope && step.optional) {
        entry = addNode(`${token.id}_applicability`, 'ExclusiveGateway', 'Required?', parent);
        edge(entry, token.id, 'Required', { condition: 'Applicability confirmed required' });
      }
      entries.set(number, entry);
      const corrections = workflow.spec.corrections.filter(route => route.at === number);
      const routes = workflow.spec.exits.filter(route => route.at === number);
      const technical = !token.scope && workflow.spec.technical.includes(number);
      const decision = !token.scope && workflow.spec.decisions.includes(number);
      const replay = workflow.spec.replay.find(route => route.from === number);
      const repeat = workflow.spec.repeat?.at === number ? workflow.spec.repeat : null;
      if (token.scope || corrections.length || routes.length || technical || decision || replay || repeat) {
        output = addNode(`${token.id}_result`, 'ExclusiveGateway', token.scope ? 'Approved scope ready?' : 'Outcome?', parent);
        edge(token.id, output);
        const held = hold(output, parent, token.id, 'Unresolved result, exhausted retry or incomplete approved scope');
        edge(output, held, 'Unresolved / exhausted', { default: true });
        for (const [index, route] of corrections.entries()) {
          const target = targetFor(route.target, parent);
          edge(output, target, route.kind === 'technical' ? 'Retry failed operation' : 'Correct and recheck', { condition: route.condition, correction: route, resumeAt: stepId(route.target), counter: `${token.id}:${index}:${route.kind}`, limit: route.kind === 'technical' ? 2 : 3, invalidates: 'Affected approvals and dependent checks', failedOnly: route.kind === 'technical' });
        }
        if (technical) edge(output, token.id, 'Technical retry', { condition: 'Transient failure and authorised retry budget remains', counter: `${token.id}:technical`, limit: 2, failedOnly: true });
        if (decision || token.scope) edge(output, end(parent, 'declined'), 'Declined', { condition: token.scope ? 'Explicit scope disposition prevents approval; exclusions recorded' : 'Authorised adverse business decision, not a technical retry' });
        for (const route of routes) edge(output, end(parent, route.target ? `transfer_${route.target}` : route.outcome), route.outcome === 'transfer' ? `Transfer ${route.target}` : route.outcome, { condition: route.condition, transfer: route.target, preserveCase: Boolean(route.target) });
        if (replay) edge(output, targetFor(replay.to, parent), 'Existing issued card', { condition: replay.when, replay: true });
        if (repeat) edge(output, targetFor(repeat.target, parent), 'Next approved wave', { condition: repeat.condition, collection: repeat.collection, bounded: true, noReplay: true });
      }
      exits.set(token.last, output);
      if (!token.scope && workflow.spec.waits.includes(number)) {
        const timeout = addNode(`${token.id}_deadline`, 'BoundaryEvent', 'Configured deadline', parent, { attachedTo: token.id, timer: `\${deadline_${token.id.replaceAll('-', '_')}}` });
        const held = hold(timeout, parent, token.id, 'Evidence or approval deadline elapsed; duration unresolved');
        edge(timeout, held, 'Deadline elapsed');
      }
    }
    const skipOptional = (token, next) => {
      if (entries.get(token.first) !== token.id) {
        const entry = entries.get(token.first);
        edge(entry, next, 'Not applicable', { condition: 'Recorded not-applicable reason', bypass: token.id });
        edge(entry, hold(entry, parent, entry, 'Applicability unresolved'), 'Unknown', { default: true });
      }
    };
    const externalReturns = [...new Set(workflow.spec.corrections.filter(route => scopeFor(route.target) === parent && scopeFor(route.at) !== parent).map(route => route.target))];
    if (externalReturns.length) {
      const resume = addNode(`${parent}_resume`, 'ExclusiveGateway', 'New instance or targeted rework?', parent);
      edge(start, resume);
      edge(resume, entries.get(tokens[0].first), 'New instance', { condition: 'New in-scope instance; no rework target recorded' });
      for (const target of externalReturns) edge(resume, entries.get(target), `Resume ${stepId(target)}`, { condition: `This instance is affected and recorded rework target equals ${stepId(target)}`, resumeAt: stepId(target), targetedResume: true });
      edge(resume, hold(resume, parent, resume, 'Missing or invalid rework target'), 'Unresolved target', { default: true });
    } else edge(start, entries.get(tokens[0].first));
    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index];
      const next = tokens[index + 1] ? entries.get(tokens[index + 1].first) : finish;
      const output = exits.get(token.last);
      const remedial = remedialReturns.includes(token.first) && workflow.spec.corrections.find(route => route.at === token.first);
      if (remedial) {
        const recheck = edges.find(flow => flow.from === output && flow.correction === remedial);
        Object.assign(recheck, { label: 'Remediated: revalidate', condition: 'Remediation recorded; authorised correction budget remains', mandatoryRecheck: true });
      } else {
        edge(output, next, output === token.id ? '' : 'Accepted / complete', { condition: output === token.id ? undefined : 'All required outputs approved; no correction, retry, transfer or unresolved findings; replay mode false and no next wave', normal: true });
      }
      skipOptional(token, next);
    }
    for (const range of workflow.spec.parallel) {
      const [leftFirst, leftLast, rightFirst = leftLast, rightLast = rightFirst] = range.length === 2 ? [range[0], range[0], range[1], range[1]] : range;
      if (!entries.has(leftFirst) || !entries.has(rightFirst)) continue;
      const before = edges.find(flow => flow.to === entries.get(leftFirst) && flow.normal);
      const middle = edges.find(flow => flow.from === exits.get(leftLast) && flow.normal);
      const after = edges.find(flow => flow.from === exits.get(rightLast) && flow.normal);
      if (!before || !middle || !after) throw new Error('Parallel branch boundary missing');
      const split = addNode(`${prefix}_parallel_${leftFirst}`, 'ParallelGateway', 'Independent required work', parent);
      const join = addNode(`${prefix}_join_${rightLast}`, 'ParallelGateway', 'Both branches complete', parent);
      const successor = after.to;
      before.to = split;
      middle.to = join;
      after.to = join;
      edge(split, entries.get(leftFirst));
      edge(split, entries.get(rightFirst));
      edge(join, successor);
    }
  }
  buildContainer('root', 1, workflow.steps.length);
  const graph = { workflow, nodes, edges, containers };
  validateWorkflowGraph(graph);
  return graph;
}

export function validateWorkflowGraph(graph) {
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  for (const flow of graph.edges) {
    if (!nodes.has(flow.from) || !nodes.has(flow.to)) throw new Error(`Dangling flow ${flow.id}`);
    if (nodes.get(flow.from).parent !== nodes.get(flow.to).parent) throw new Error(`Illegal scope crossing ${flow.id}`);
    if (flow.correction && (!flow.counter || !flow.limit || !flow.resumeAt)) throw new Error(`Unbounded correction ${flow.id}`);
  }
  for (const node of nodes.values()) {
    const outgoing = graph.edges.filter(flow => flow.from === node.id);
    if (node.type !== 'EndEvent' && !outgoing.length) throw new Error(`No outcome ${node.id}`);
    if (node.type === 'ExclusiveGateway' && (outgoing.filter(flow => flow.default).length !== 1 || outgoing.filter(flow => !flow.default).some(flow => !flow.condition))) throw new Error(`Incomplete decision ${node.id}`);
  }
  for (const [parent, container] of graph.containers) {
    const seen = new Set([container.start]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const flow of graph.edges) if (seen.has(flow.from) && !seen.has(flow.to)) { seen.add(flow.to); changed = true; }
      for (const node of graph.nodes) if (node.attachedTo && seen.has(node.attachedTo) && !seen.has(node.id)) { seen.add(node.id); changed = true; }
    }
    for (const node of graph.nodes.filter(node => node.parent === parent)) if (!seen.has(node.id)) throw new Error(`Unreachable node ${node.id}`);
    const terminating = new Set(graph.nodes.filter(node => node.parent === parent && node.type === 'EndEvent').map(node => node.id));
    let expanded = true;
    while (expanded) {
      expanded = false;
      for (const flow of graph.edges) if (terminating.has(flow.to) && !terminating.has(flow.from)) { terminating.add(flow.from); expanded = true; }
    }
    for (const node of graph.nodes.filter(node => node.parent === parent)) if (!terminating.has(node.id)) throw new Error(`No terminal route ${node.id}`);
  }
  return graph;
}

export function proposedResponsibility(step) {
  const name = step?.name || '';
  if (/^(approve\b|authori[sz]e\b|sign.off\b)/i.test(name)) return 'Approver';
  if (/^(independently (review|check|verify)\b|review\b.*\bindependently\b|perform\b.*\bindependent (review|check))/i.test(name)) return 'Process Ops';
  if (/screen|risk|compliance|sanction|due diligence|suitability/i.test(name)) return 'Process SPECIALIST';
  if (/transmi|interface|idempot|replay|deliver|distribut|synchron/i.test(name)) return 'Integration Team';
  if (/technical|provision|publish|customer master|ingest/i.test(name)) return 'Data Platform Team';
  if (/duplicate|enrich|reference data/i.test(name)) return 'Steward';
  if (/^(submit|provide)\b/i.test(name)) return 'Requestor';
  return 'Onboarding Ops';
}

function scopeResponsibilities(graph) {
  const assignments = new Map();
  const steps = graph.nodes.filter(node => node.step);
  for (const node of graph.nodes) {
    const origin = steps.find(step => node.id === step.id || node.id.startsWith(`${step.id}_`) || node.attachedTo === step.id);
    assignments.set(node.id, node.hold ? 'Service Management Team' : node.id.endsWith('_resolution') ? 'Ops Lead' : node.type === 'StartEvent' ? 'Requestor' : proposedResponsibility(origin?.step));
  }
  return assignments;
}

function layoutGraph(graph, perspective, phase, workflow) {
  const positions = new Map(), routes = new Map(), lanes = new Map();
  const responsibilities = scopeResponsibilities(graph);
  const assignments = new Map(graph.nodes.map(node => {
    const origin = graph.nodes.find(candidate => candidate.step && (node.id === candidate.id || node.id.startsWith(`${candidate.id}_`))) || graph.nodes.find(candidate => candidate.step && candidate.parent === node.parent) || graph.nodes.find(candidate => candidate.step);
    return [node.id, perspective === 'diagram2_technology' ? verifiedApplications(workflow, origin.step).join(' / ') : responsibilities.get(node.id)];
  }));
  for (const node of graph.nodes.filter(node => node.attachedTo)) assignments.set(node.id, assignments.get(node.attachedTo));
  const laneOrder = perspective === 'diagram2_technology' ? [...new Set(assignments.values())].sort() : sampleFormat.people;
  if (phase) {
    const selected = new Set(graph.nodes.filter(node => phase.members.some(id => node.id === id || node.id.startsWith(`${id}_`))).map(node => node.id));
    for (const flow of graph.edges) if (selected.has(flow.from) || selected.has(flow.to)) {
      if (phase.members.some(id => flow.from === id || flow.from.startsWith(`${id}_`) || flow.to === id || flow.to.startsWith(`${id}_`))) { selected.add(flow.from); selected.add(flow.to); }
    }
    for (const node of graph.nodes) if (selected.has(node.id) && node.parent !== 'root') selected.add(node.parent);
    for (const node of graph.nodes) if (selected.has(node.parent)) selected.add(node.id);
    graph = { ...graph, nodes: graph.nodes.filter(node => selected.has(node.id)), edges: graph.edges.filter(flow => selected.has(flow.from) && selected.has(flow.to)) };
  }
  const layout = parent => {
    const network = new dagre.graphlib.Graph({ multigraph: true });
    network.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 200, edgesep: 40, marginx: 80, marginy: 80 });
    network.setDefaultEdgeLabel(() => ({}));
    for (const node of graph.nodes.filter(node => node.parent === parent)) {
      let { width, height } = node.step ? sampleFormat.task : sampleFormat.event;
      if (node.scope) { const size = layout(node.id); width = size.width + 80; height = size.height + 100; }
      if (node.attachedTo) continue;
      network.setNode(node.id, { width, height });
    }
    for (const flow of graph.edges.filter(flow => graph.nodes.find(node => node.id === flow.from)?.parent === parent)) {
      const from = graph.nodes.find(node => node.id === flow.from);
      network.setEdge(from.attachedTo || flow.from, flow.to, { width: flow.label ? 170 : 0, height: flow.label ? 42 : 0, labelpos: 'c', weight: flow.normal ? 6 : flow.default ? 1 : 2 }, flow.id);
    }
    dagre.layout(network);
    const scopeNodes = graph.nodes.filter(node => node.parent === parent);
    const roles = laneOrder.filter(role => scopeNodes.some(node => assignments.get(node.id) === role));
    const width = network.graph().width + 240;
    let laneTop = 220;
    const scopeLanes = [];
    for (const role of roles) {
      const placed = [];
      for (const id of network.nodes().filter(id => assignments.get(id) === role).sort((left, right) => network.node(left).x - network.node(right).x)) {
        const node = network.node(id);
        const bounds = { x: node.x - node.width / 2 + 160, y: laneTop + 160, width: node.width, height: node.height };
        for (const previous of placed) if (bounds.x < previous.x + previous.width + 80 && bounds.x + bounds.width + 80 > previous.x) bounds.y = Math.max(bounds.y, previous.y + previous.height + 240);
        positions.set(id, bounds);
        placed.push(bounds);
      }
      const height = Math.max(400, ...placed.map(bounds => Math.ceil((bounds.y + bounds.height + 80 - laneTop) / 40) * 40));
      scopeLanes.push({ role, x: 160, y: laneTop, width: width - 160, height });
      laneTop += height;
    }
    lanes.set(parent, scopeLanes);
    for (const node of graph.nodes.filter(node => node.parent === parent && node.attachedTo)) {
      const attached = positions.get(node.attachedTo);
      positions.set(node.id, { x: attached.x + attached.width - 120, y: attached.y + attached.height - 40, ...sampleFormat.event });
    }
    for (const ref of network.edges()) {
      const flow = graph.edges.find(candidate => candidate.id === ref.name);
      const source = positions.get(flow.from), target = positions.get(flow.to);
      const sourceLane = scopeLanes.find(lane => lane.role === assignments.get(flow.from));
      const start = { x: source.x + source.width, y: source.y + source.height / 2 };
      const end = { x: target.x, y: target.y + target.height / 2 };
      const attached = scopeNodes.find(node => node.id === flow.from)?.attachedTo;
      let points;
      if (!attached && end.x > start.x && start.y === end.y) {
        points = [start, end];
      } else {
        const channel = sourceLane.y + 40 + (network.edges().indexOf(ref) % 3) * 40;
        if (attached) { start.x = source.x + source.width / 2; start.y = source.y + source.height; }
        const exitX = source.x + source.width + 80;
        const entryX = target.x - 120;
        points = [start, ...(attached ? [{ x: start.x, y: start.y + 40 }, { x: exitX, y: start.y + 40 }] : []), { x: exitX, y: attached ? start.y + 40 : start.y }, { x: exitX, y: channel }, { x: entryX, y: channel }, { x: entryX, y: end.y }, end].filter((point, index, all) => !index || point.x !== all[index - 1].x || point.y !== all[index - 1].y);
      }
      const middle = points.length === 2 ? { x: (start.x + end.x) / 2, y: start.y - 50 } : { x: source.x + source.width + 220, y: sourceLane.y + 170 };
      routes.set(ref.name, { points, ...middle });
    }
    return { width, height: laneTop + 30 };
  };
  const size = layout('root');
  const translate = (parent, offsetX, offsetY) => {
    for (const lane of lanes.get(parent)) { lane.x += offsetX; lane.y += offsetY; }
    for (const node of graph.nodes.filter(node => node.parent === parent)) {
      const bounds = positions.get(node.id);
      bounds.x += offsetX; bounds.y += offsetY;
      if (node.scope) translate(node.id, bounds.x + 40, bounds.y + 60);
    }
    for (const flow of graph.edges.filter(flow => graph.nodes.find(node => node.id === flow.from)?.parent === parent)) {
      const route = routes.get(flow.id);
      route.points = route.points.map(point => ({ x: point.x + offsetX, y: point.y + offsetY }));
      if (Number.isFinite(route.x)) { route.x += offsetX; route.y += offsetY; }
    }
  };
  translate('root', 0, 0);
  return { positions, routes, lanes, assignments, responsibilities, size };
}

export async function generateWorkflowBpmn(workflow, version, view = 'diagram1_people', validation = null) {
  assertEligibleDiagram(view, workflow, validation);
  const navigation = workflowNavigation(workflow, validation);
  if (!navigation.diagrams.includes(view)) throw new Error('Unknown workflow diagram');
  const graph = buildWorkflowGraph(workflow);
  const moddle = new BpmnModdle();
  const documentation = value => [moddle.create('bpmn:Documentation', { text: JSON.stringify(value) })];
  const process = moddle.create('bpmn:Process', { id: `${workflow.id}_process`, name: workflow.name, isExecutable: false, flowElements: [], documentation: documentation({ version, basis: workflowBasis, status: 'Proposed', requirement: workflow.requirement, routing: workflow.routing_requirement, source_rows: workflow.source_rows, source_evidence: workflow.source_evidence, quality: assessWorkflow(workflow) }) });
  const definitions = moddle.create('bpmn:Definitions', { id: `${workflow.id}_definitions`, targetNamespace: `urn:onboarding:${version}:${workflow.id}`, rootElements: [process], diagrams: [] });
  const plane = moddle.create('bpmndi:BPMNPlane', { id: `${workflow.id}_plane`, bpmnElement: process, planeElement: [] });
  definitions.diagrams.push(moddle.create('bpmndi:BPMNDiagram', { id: `${workflow.id}_diagram`, plane }));
  const elements = new Map([['root', process]]);
  const selectedPhase = navigation.phases.find(phase => view.endsWith(`__${phase.id}`));
  const perspective = view.split('__')[0];
  if (!layouts.has(workflow)) layouts.set(workflow, new Map());
  const cache = layouts.get(workflow);
  const layoutKey = `${perspective === 'diagram2_technology' ? 'technology' : 'people'}:${selectedPhase?.id || 'full'}`;
  if (!cache.has(layoutKey)) cache.set(layoutKey, layoutGraph(graph, perspective, selectedPhase, workflow));
  const { positions, routes, lanes, assignments, responsibilities } = cache.get(layoutKey);
  const technologyOnly = perspective === 'diagram2_technology';
  const technology = technologyOnly || perspective === 'diagram3_combined';
  const shapeColors = (shape, fill = sampleFormat.colors.white, stroke = sampleFormat.colors.stroke) => {
    shape.$attrs['bioc:fill'] = fill;
    shape.$attrs['bioc:stroke'] = stroke;
    return shape;
  };
  for (const node of [...graph.nodes].sort((left, right) => Number(Boolean(right.scope)) - Number(Boolean(left.scope)))) {
    const record = node.step ? {
      step: { 'Process Step ID': node.id, 'Process Step': node.step.name }, details: [],
      normalized: { perspective, ...(technologyOnly ? {} : { team: responsibilities.get(node.id), responsibility_basis: 'Proposed functional responsibility from activity wording; confidence low. Not approved ownership. Source RACI retained separately without claiming activity equivalence.' }), ...(technology ? { application: verifiedApplications(workflow, node.step).join(' / '), application_basis: 'source', application_source_step_ids: node.step.source_step_ids } : {}), raci: technologyOnly ? [] : [{ assignments: { R: responsibilities.get(node.id), A: 'Approver', C: 'Onboarding Ops', I: 'Process Ops' }, basis: 'Proposed role candidates from sample vocabulary; low confidence; named performers and segregation of duties require approval' }] },
      visual_basis: 'Sample Process Onboarding styling; execution types and human responsibilities remain Proposed. Application names require verified source equivalence.',
      requirement_id: node.id, source_step_ids: node.step.source_step_ids, model_basis: workflowBasis, version,
      inputs: 'Required evidence and predecessor outputs; field-level contract unresolved', outputs: 'Recorded activity outcome and supporting evidence',
      controls: graph.edges.filter(flow => flow.from === `${node.id}_result`),
      predecessors: graph.edges.filter(flow => flow.to === node.id).map(flow => flow.from), successors: graph.edges.filter(flow => flow.from === node.id).map(flow => flow.to),
      scope: node.parent, policy: { technical_retries: 2, business_submissions: 3, configured: false, owner: unresolved, counters: 'Persist per case/activity/instance across hold and resume', replay: 'Idempotency key per case/activity/instance/destination; skip already successful side effects', approval: 'Invalidate affected approvals after evidence changes' },
    } : { ...node, model_basis: workflowBasis, version };
    const taskType = proposedTaskType(node, workflow, technology);
    const element = moddle.create(`bpmn:${taskType}`, { id: node.id, name: node.step ? wrappedLabel(`${node.id}\n${node.name}`) : node.name, documentation: documentation(record), incoming: [], outgoing: [] });
    if (node.scope) {
      element.flowElements = [];
      element.loopCharacteristics = moddle.create('bpmn:MultiInstanceLoopCharacteristics', { isSequential: false, loopCardinality: moddle.create('bpmn:FormalExpression', { body: `count(pendingOrAffected(${node.scope.collection}))` }) });
      element.documentation = documentation({ ...record, instance_selection: 'Initial entry: all approved in-scope instances. Re-entry: pending or explicitly affected instances only; exclude completed unaffected peers. Persist activity rework target per instance. Invalidate dependent approvals before re-aggregation.', scope_changes: 'Scope exclusions require explicit approval and recalculation; never silently count an excluded instance as successful.' });
    }
    if (node.hold) element.eventDefinitions = [moddle.create('bpmn:MessageEventDefinition')];
    if (node.timer) {
      element.cancelActivity = true;
      element.eventDefinitions = [moddle.create('bpmn:TimerEventDefinition', { timeDate: moddle.create('bpmn:FormalExpression', { body: node.timer }) })];
    }
    if (node.outcome && node.outcome !== 'complete') element.eventDefinitions = [moddle.create('bpmn:TerminateEventDefinition')];
    elements.set(node.id, element);
    const container = elements.get(node.parent);
    element.$parent = container;
    container.flowElements.push(element);
    if (!positions.has(node.id)) continue;
    const success = node.outcome === 'complete' && node.parent === 'root';
    const fill = node.step ? sampleFormat.colors[taskType] : node.timer ? sampleFormat.colors.timer : success ? sampleFormat.colors.success : node.outcome && node.outcome !== 'complete' ? sampleFormat.colors.exception : sampleFormat.colors.white;
    const shape = shapeColors(moddle.create('bpmndi:BPMNShape', { id: `${node.id}_di`, bpmnElement: element, bounds: moddle.create('dc:Bounds', positions.get(node.id)), isExpanded: node.scope ? true : undefined, isMarkerVisible: node.type === 'ExclusiveGateway' ? true : undefined }), fill, success ? sampleFormat.colors.white : sampleFormat.colors.stroke);
    if (!node.step && !node.scope) {
      const bounds = positions.get(node.id);
      shape.label = moddle.create('bpmndi:BPMNLabel', { bounds: moddle.create('dc:Bounds', { x: bounds.x - 80, y: bounds.y - 140, width: 240, height: 120 }) });
    }
    plane.planeElement.push(shape);
  }
  const laneShapes = [];
  for (const parent of graph.containers.keys()) {
    const scopeLanes = lanes.get(parent) || [];
    const container = elements.get(parent);
    const laneSet = moddle.create('bpmn:LaneSet', { id: `${container.id}_lanes`, lanes: [] });
    laneSet.$parent = container;
    container.laneSets = [laneSet];
    const order = perspective === 'diagram2_technology' ? [...new Set(assignments.values())].sort() : sampleFormat.people;
    order.forEach((role, index) => {
      const members = graph.nodes.filter(node => node.parent === parent && assignments.get(node.id) === role);
      if (!members.length) return;
      const lane = moddle.create('bpmn:Lane', { id: `${container.id}_lane_${index + 1}`, name: role, flowNodeRef: members.map(node => elements.get(node.id)), documentation: documentation(technologyOnly ? { basis: 'Source applications for mapped activities; control nodes grouped for layout, not verified hosting', application: role } : { basis: 'Sample lane vocabulary; proposed grouping, not validated source ownership', responsible_role: role }) });
      lane.$parent = laneSet;
      laneSet.lanes.push(lane);
      const bounds = scopeLanes.find(bounds => bounds.role === role);
      if (bounds) laneShapes.push(shapeColors(moddle.create('bpmndi:BPMNShape', { id: `${lane.id}_di`, bpmnElement: lane, isHorizontal: true, bounds: moddle.create('dc:Bounds', { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }) })));
    });
  }
  plane.planeElement.unshift(...laneShapes);
  for (const node of graph.nodes.filter(node => node.attachedTo)) elements.get(node.id).attachedToRef = elements.get(node.attachedTo);
  for (const route of graph.edges) {
    const source = elements.get(route.from), target = elements.get(route.to);
    const flow = moddle.create('bpmn:SequenceFlow', { id: route.id, name: route.label, sourceRef: source, targetRef: target, documentation: documentation(route) });
    if (route.condition && !route.default) flow.conditionExpression = moddle.create('bpmn:FormalExpression', { body: `${route.condition}${route.counter ? `; persisted counter ${route.counter} < configured limit (${route.limit} proposed); increment on this edge` : ''}` });
    flow.$parent = source.$parent;
    source.$parent.flowElements.push(flow);
    source.outgoing.push(flow); target.incoming.push(flow);
    if (route.default) source.default = flow;
    const position = routes.get(route.id);
    if (!position) continue;
    const diagramEdge = moddle.create('bpmndi:BPMNEdge', { id: `${route.id}_di`, bpmnElement: flow, waypoint: position.points.map(point => moddle.create('dc:Point', point)) });
    if (route.label && Number.isFinite(position.x)) diagramEdge.label = moddle.create('bpmndi:BPMNLabel', { bounds: moddle.create('dc:Bounds', { x: position.x - 85, y: position.y - 21, width: 170, height: 42 }) });
    plane.planeElement.push(diagramEdge);
  }
  const annotation = (id, text, bounds, node, fill) => {
    const owner = node ? elements.get(node.id).$parent : process;
    const item = moddle.create('bpmn:TextAnnotation', { id, text });
    item.$parent = owner;
    owner.artifacts ||= [];
    owner.artifacts.push(item);
    plane.planeElement.push(shapeColors(moddle.create('bpmndi:BPMNShape', { id: `${id}_di`, bpmnElement: item, bounds: moddle.create('dc:Bounds', bounds) }), fill));
    if (node) {
      const association = moddle.create('bpmn:Association', { id: `${id}_association`, sourceRef: elements.get(node.id), targetRef: item, associationDirection: 'None' });
      association.$parent = owner;
      owner.artifacts.push(association);
      const source = positions.get(node.id);
      plane.planeElement.push(moddle.create('bpmndi:BPMNEdge', { id: `${id}_association_di`, bpmnElement: association, waypoint: [{ x: source.x, y: source.y + source.height / 2 }, { x: source.x - 40, y: source.y + source.height / 2 }, { x: source.x - 40, y: bounds.y + bounds.height / 2 }, { x: bounds.x, y: bounds.y + bounds.height / 2 }].map(point => moddle.create('dc:Point', point)) }));
    }
  };
  if (!selectedPhase) {
    const title = technologyOnly ? 'Technology + Process' : perspective === 'diagram3_combined' ? 'People + Process + Technology' : 'People + Process';
    annotation(`${workflow.id}_title`, `${workflow.name}\nProposed ${title}`, { x: 240, y: 40, width: 1000, height: 120 });
  }
  if (perspective === 'diagram3_combined') {
    for (const node of graph.nodes.filter(node => node.step && positions.has(node.id))) {
      const bounds = positions.get(node.id);
      annotation(`${node.id}_system`, `System: ${verifiedApplications(workflow, node.step).join(' / ')}`, { x: bounds.x, y: bounds.y + bounds.height + 40, width: 240, height: 120 }, node);
    }
  }
  if (view === 'overview') {
    process.flowElements = [];
    process.laneSets = [];
    process.artifacts = [];
    definitions.rootElements = [process];
    plane.bpmnElement = process;
    plane.planeElement = [];
    const summary = new Map();
    const summaryNode = (id, type, name, bounds, fill = sampleFormat.colors.white) => {
      const item = moddle.create(`bpmn:${type}`, { id, name: wrappedLabel(name), incoming: [], outgoing: [] });
      item.$parent = process;
      process.flowElements.push(item);
      const shape = shapeColors(moddle.create('bpmndi:BPMNShape', { id: `${id}_di`, bpmnElement: item, isExpanded: type === 'SubProcess' ? false : undefined, isMarkerVisible: type === 'ExclusiveGateway' ? false : undefined, bounds: moddle.create('dc:Bounds', bounds) }), fill, fill === sampleFormat.colors.success ? sampleFormat.colors.white : sampleFormat.colors.stroke);
      if (type !== 'SubProcess') shape.label = moddle.create('bpmndi:BPMNLabel', { bounds: moddle.create('dc:Bounds', { x: bounds.x - 80, y: bounds.y + bounds.height + 20, width: 200, height: 60 }) });
      plane.planeElement.push(shape);
      summary.set(id, { item, bounds });
      return id;
    };
    const summaryEdge = (from, to, label = '', options = {}) => {
      const source = summary.get(from), target = summary.get(to);
      const id = `${workflow.id}_summary_flow_${process.flowElements.length}`;
      const flow = moddle.create('bpmn:SequenceFlow', { id, sourceRef: source.item, targetRef: target.item, name: label, documentation: documentation({ summary_only: true, source_routes: options.routes || [], detail: 'Phase abstraction; consult detailed BPMN for exact conditions, counters and scope' }) });
      flow.$parent = process;
      process.flowElements.push(flow);
      source.item.outgoing.push(flow); target.item.incoming.push(flow);
      const backwards = target.bounds.x < source.bounds.x;
      const vertical = source.bounds.x + source.bounds.width / 2 === target.bounds.x + target.bounds.width / 2 && options.channel === undefined;
      const downward = target.bounds.y > source.bounds.y;
      const start = vertical ? { x: source.bounds.x + source.bounds.width / 2, y: source.bounds.y + (downward ? source.bounds.height : 0) } : { x: source.bounds.x + (backwards ? 0 : source.bounds.width), y: source.bounds.y + source.bounds.height / 2 };
      const end = vertical ? { x: target.bounds.x + target.bounds.width / 2, y: target.bounds.y + (downward ? 0 : target.bounds.height) } : { x: target.bounds.x + (backwards ? target.bounds.width : 0), y: target.bounds.y + target.bounds.height / 2 };
      const channel = options.channel;
      const points = channel !== undefined ? [start, { x: start.x + (backwards ? -40 : 40), y: start.y }, { x: start.x + (backwards ? -40 : 40), y: channel }, { x: end.x + (backwards ? 40 : -40), y: channel }, { x: end.x + (backwards ? 40 : -40), y: end.y }, end] : vertical || start.y === end.y ? [start, end] : [start, { x: start.x + (backwards ? -60 : 60), y: start.y }, { x: start.x + (backwards ? -60 : 60), y: end.y }, end];
      const edge = moddle.create('bpmndi:BPMNEdge', { id: `${id}_di`, bpmnElement: flow, waypoint: points.map(point => moddle.create('dc:Point', point)) });
      if (label) edge.label = moddle.create('bpmndi:BPMNLabel', { bounds: moddle.create('dc:Bounds', { x: options.labelX ?? Math.min(start.x, end.x), y: channel !== undefined ? channel - 100 : Math.max(start.y, end.y) + 20, width: 240, height: 80 }) });
      plane.planeElement.push(edge);
    };
    navigation.phases.forEach((phase, index) => {
      const row = Math.floor(index / 3), column = row % 2 ? 2 - index % 3 : index % 3;
      summaryNode(phase.id, 'SubProcess', phase.title, { x: 160 + column * 480, y: 100 + row * 560, ...sampleFormat.phase });
      summary.get(phase.id).item.documentation = documentation({ members: phase.members, summary_only: true, basis: 'Sample-format phase abstraction; detailed routing is in the full model' });
    });
    const start = summaryNode(`${workflow.id}_summary_start`, 'StartEvent', 'Request', { x: 40, y: 140, width: 40, height: 40 });
    summaryEdge(start, navigation.phases[0].id);
    navigation.phases.forEach((phase, index) => {
      const bounds = summary.get(phase.id).bounds;
      const row = Math.floor(index / 3), backwards = row % 2;
      const gateway = summaryNode(`${phase.id}_result`, 'ExclusiveGateway', '', { x: backwards ? bounds.x - 100 : bounds.x + 320, y: bounds.y + 40, width: 40, height: 40 });
      summaryEdge(phase.id, gateway);
      if (navigation.phases[index + 1]) summaryEdge(gateway, navigation.phases[index + 1].id);
      else {
        const finish = summaryNode(`${workflow.id}_summary_complete`, 'EndEvent', 'Complete', { x: backwards ? bounds.x - 240 : bounds.x + 460, y: bounds.y + 40, width: 40, height: 40 }, sampleFormat.colors.success);
        summaryEdge(gateway, finish);
      }
      const memberOrigin = nodeId => phase.members.some(id => nodeId === id || nodeId.startsWith(`${id}_`));
      const adverse = graph.edges.filter(flow => memberOrigin(flow.from) && graph.nodes.some(node => node.id === flow.to && node.outcome && node.outcome !== 'complete'));
      if (adverse.length) {
        const end = summaryNode(`${phase.id}_closed`, 'EndEvent', 'Closed / declined / transferred', { x: bounds.x + 320, y: bounds.y + 260, width: 40, height: 40 }, sampleFormat.colors.exception);
        summaryEdge(gateway, end, 'Adverse disposition', { routes: adverse.map(flow => flow.id), labelX: bounds.x + 80 });
      }
      const targets = new Map();
      for (const flow of graph.edges.filter(flow => flow.correction && memberOrigin(flow.from))) {
        const target = navigation.phases.find(phase => phase.members.includes(flow.resumeAt));
        if (target) targets.set(target.id, [...(targets.get(target.id) || []), flow.id]);
      }
      let channel = bounds.y - 40;
      for (const [target, routes] of targets) {
        summaryEdge(gateway, target, 'Correct / retry; revalidate', { routes, channel, labelX: bounds.x });
        channel -= 120;
      }
    });
  }
  return (await moddle.toXML(definitions, { format: true })).xml;
}

export function reviewWorkflowChanges(workflow, snapshot) {
  const changes = workflow.steps.map(step => ({ step_id: step.id, template_id: workflow.id, step_name: step.name, field: 'Proposed activity addition', before: 'No validated one-to-one source mapping', after: step.name, basis: `${workflow.requirement} / ${snapshot.version}; source rows retained separately` }));
  for (const step of workflow.steps) changes.push({ step_id: step.id, template_id: workflow.id, step_name: step.name, field: 'Proposed RACI candidates', before: 'No validated source-to-activity RACI mapping', after: `R: ${proposedResponsibility(step)}; A: Approver; C: Onboarding Ops; I: Process Ops`, basis: `${workflow.requirement}; sample role vocabulary and activity wording; low confidence; not approved assignment, source RACI preserved separately` });
  for (const route of workflow.spec.corrections) changes.push({ step_id: workflow.steps[route.at - 1].id, template_id: workflow.id, step_name: workflow.steps[route.at - 1].name, field: 'Proposed correction / retry route', before: 'Shared sample routing', after: `${route.condition} -> ${workflow.steps[route.target - 1].id}; limit ${route.kind === 'technical' ? 2 : 3}; exhausted -> hold`, basis: 'Proposed configurable limit; counters persist; affected approvals invalidated; ownership unresolved' });
  const graph = buildWorkflowGraph(workflow);
  for (const route of graph.edges.filter(flow => flow.transfer || flow.replay || flow.bounded || flow.mandatoryRecheck || flow.targetedResume || flow.bypass)) changes.push({ step_id: route.resumeAt || route.from, template_id: workflow.id, step_name: workflow.name, field: 'Process-specific routing', before: 'Shared sample routing', after: `${route.label}: ${route.from} -> ${route.to}; ${route.condition}`, basis: 'Descriptive requirement route; runtime enforcement and policy validation outstanding' });
  for (const scope of workflow.spec.instances) changes.push({ step_id: workflow.id, template_id: workflow.id, step_name: scope.title, field: 'Multi-instance scope', before: 'Shared sample sequence', after: `${scope.title}; ${scope.collection}; steps ${scope.first}-${scope.last}; rework pending or affected instances only`, basis: 'Explicit scope selection and readiness aggregation; completed unaffected peers excluded' });
  for (const branch of workflow.spec.parallel) changes.push({ step_id: workflow.id, template_id: workflow.id, step_name: workflow.name, field: 'Parallel branches', before: 'Shared sample sequence', after: `Independent required branches ${branch.join(', ')}; AND join before continuation`, basis: 'Both branches must complete; delivery rework preserves the other branch token' });
  for (const row of workflow.source_rows) changes.push({ step_id: row.id, template_id: workflow.id, step_name: row.name, field: 'Source lineage retained', before: row.name, after: row.disposition, basis: 'Workbook unchanged; source correction, merge or semantic removal not asserted' });
  return { process_id: workflow.process_id, version: snapshot.version, quality: assessWorkflow(workflow), changed_steps: workflow.steps.length, change_count: changes.filter(change => change.field !== 'Source lineage retained').length, changes, decisions: [workflowBasis, workflow.routing_requirement, 'Proposed human responsibilities only. Full source metadata, RACI variants, application details and BDE mappings retained separately in process documentation; no positional activity mapping claimed. Technology and Combined are blocked pending evidence-backed application equivalence and independent validation.', 'Used human lanes only; no redundant pool or placeholder annotations. Overview is a phase abstraction; phase XML retains full semantic routing.', 'Source quality is not revised completeness or business accuracy. Proposed repairs do not increase the source score. Named performers, policy values and segregation of duties still require approval.'] };
}