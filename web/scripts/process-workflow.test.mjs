import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { evidenceHash } from '../lib/workflow-quality.mjs';
import { BpmnModdle } from 'bpmn-moddle';
import { validateWorkflowDefinitions, workflowSpecs } from '../lib/workflow-spec.mjs';
import { buildWorkflowGraph, generateWorkflowBpmn, workflowNavigation, reviewWorkflowChanges, proposedResponsibility, sampleFormat } from '../lib/process-workflow.mjs';

const snapshot = JSON.parse(await readFile(new URL('../workflow/process-workflows.json', import.meta.url), 'utf8'));

test('synthetic verified mappings unlock technology without human metadata and reconcile combined topology', async () => {
  const workflow = structuredClone(snapshot.workflows[0]);
  workflow.steps.forEach((step, index) => {
    step.mapping_status = 'Verified';
    step.source_step_ids = [workflow.source_evidence.steps[index]['Process Step ID']];
    workflow.source_evidence.details.push({ 'PSD ID': `synthetic-${index}`, 'Process Step ID': step.source_step_ids[0], 'Detail Type': 'Application', 'Detail Value': `Test application ${index % 2 + 1}` });
  });
  const validation = { input_sha256: evidenceHash(workflow), files: [] };
  for (const view of ['diagram1_people', 'diagram2_technology', 'diagram3_combined']) {
    const parsed = await new BpmnModdle().fromXML(await generateWorkflowBpmn(workflow, snapshot.version, view, validation));
    assert.equal(parsed.warnings.length, 0);
    const elements = Object.values(parsed.elementsById);
    const topology = evidenceHash(elements.filter(element => element.$type === 'bpmn:SequenceFlow').map(flow => `${flow.sourceRef.id}->${flow.targetRef.id}`).sort());
    if (validation.files.length) assert.equal(topology, validation.files[0].topology_sha256);
    for (const task of elements.filter(element => element.$instanceOf?.('bpmn:Task'))) {
      const record = JSON.parse(task.documentation[0].text);
      if (view === 'diagram2_technology') {
        assert.equal(record.normalized.team, undefined);
        assert.deepEqual(record.normalized.raci, []);
        assert.ok(record.normalized.application);
      } else if (view === 'diagram1_people') assert.equal(record.normalized.application, undefined);
    }
    if (view === 'diagram3_combined') assert.equal(elements.filter(element => element.$type === 'bpmn:TextAnnotation' && element.id.endsWith('_system')).length, workflow.steps.length);
    validation.files.push({ view, topology_sha256: topology, ...Object.fromEntries(['schema', 'viewer', 'reachability', 'fidelity', 'coverage', 'layout'].map(key => [key, { status: 'PASS' }])) });
  }
});

test('proposed performing roles distinguish approval from requesting or recording it', () => {
  assert.equal(proposedResponsibility({ name: 'Approve account opening and mandate' }), 'Approver');
  for (const name of ['Independently review the targeted changes', 'Review the complete activation pack independently']) assert.equal(proposedResponsibility({ name }), 'Process Ops');
  for (const name of ['Obtain opening approval', 'Record independent opening approval', 'Open approved accounts', 'Configure maker/checker entitlements']) assert.equal(proposedResponsibility({ name }), 'Onboarding Ops');
  assert.equal(proposedResponsibility({ name: 'Submit the branch evidence pack for independent checking' }), 'Requestor');
  assert.equal(proposedResponsibility({ name: 'Perform customer screening' }), 'Process SPECIALIST');
  assert.equal(proposedResponsibility({ name: 'Publish the completed setup' }), 'Data Platform Team');
});

test('20 distinct requirement workflows contain 627 activities and retain all source rows', async () => {
  validateWorkflowDefinitions(snapshot.workflows);
  assert.equal(snapshot.workflows.reduce((count, workflow) => count + workflow.steps.length, 0), 627);
  assert.equal(new Set(snapshot.workflows.map(workflow => workflow.steps.length)).size, 20);
  assert.equal(snapshot.workflows.reduce((count, workflow) => count + workflow.source_rows.length, 0), 580);
  snapshot.workflows.forEach((workflow, index) => assert.deepEqual(workflow.spec, JSON.parse(JSON.stringify(workflowSpecs[index])), 'Run sync:workflows after changing routing specifications'));
  const requirements = await readFile(new URL('../../docs/Process_Specific_Steps_Proposed.md', import.meta.url));
  assert.equal(snapshot.requirements_sha256, createHash('sha256').update(requirements).digest('hex'), 'Regenerate the snapshot after requirements changes');
});

test('every graph is reachable, bounded and process-specific', () => {
  for (const workflow of snapshot.workflows) {
    const graph = buildWorkflowGraph(workflow);
    assert.equal(graph.nodes.filter(node => node.step).length, workflow.steps.length);
    for (const route of graph.edges.filter(route => route.correction || route.failedOnly)) {
      assert.ok(route.limit > 0 && route.counter);
      assert.ok(graph.edges.some(edge => edge.from === route.from && edge.default));
    }
    for (const scope of graph.nodes.filter(node => node.scope)) assert.ok(graph.containers.has(scope.id));
    const review = reviewWorkflowChanges(workflow, snapshot);
    assert.equal(review.changed_steps, workflow.steps.length);
    assert.equal(review.changes.filter(change => change.field === 'Source lineage retained').length, 29);
    assert.equal(review.change_count, review.changes.length - workflow.source_rows.length);
  }
});

test('all process perspectives parse without warnings, retain activity counts and matching topology', async () => {
  for (const workflow of snapshot.workflows) {
    const navigation = workflowNavigation(workflow);
    assert.equal(navigation.phases.flatMap(phase => phase.members).length, workflow.steps.length);
    let signature;
    for (const view of navigation.diagrams) {
      const xml = await generateWorkflowBpmn(workflow, snapshot.version, view);
      const parsed = await new BpmnModdle().fromXML(xml);
      assert.equal(parsed.warnings.length, 0, `${workflow.id} ${view}`);
      const elements = Object.values(parsed.elementsById);
      const participant = elements.find(element => element.$type === 'bpmn:Participant');
      const plane = elements.find(element => element.$type === 'bpmndi:BPMNPlane');
      const shapes = new Map(elements.filter(element => element.$type === 'bpmndi:BPMNShape').map(shape => [shape.bpmnElement.id, shape]));
      const contains = (outer, inner) => inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width + 0.01 && inner.y + inner.height <= outer.y + outer.height + 0.01;
      if (view === 'overview') {
        assert.equal(participant, undefined, 'Sample overview has no pool');
        assert.equal(plane.bpmnElement.$type, 'bpmn:Process');
        assert.equal(elements.filter(element => element.$type === 'bpmn:SubProcess').length, navigation.phases.length);
        assert.equal(elements.filter(element => element.$type === 'bpmn:Lane').length, 0);
        assert.ok(elements.some(element => element.$type === 'bpmn:SequenceFlow'));
        assert.ok(elements.some(element => element.$type === 'bpmn:StartEvent'));
        for (const shape of shapes.values()) if (shape.bpmnElement.$type === 'bpmn:SubProcess') assert.deepEqual({ width: shape.bounds.width, height: shape.bounds.height }, sampleFormat.phase);
        continue;
      }
      assert.equal(participant, undefined, 'Single-process model does not need a redundant pool');
      assert.equal(plane.bpmnElement.$type, 'bpmn:Process');
      const technology = view.startsWith('diagram2');
      assert.ok(plane.bpmnElement.laneSets[0].lanes.every(lane => sampleFormat.people.includes(lane.name) && lane.flowNodeRef.length));
      assert.deepEqual(JSON.parse(plane.bpmnElement.documentation[0].text).source_evidence, workflow.source_evidence);
      for (const container of elements.filter(element => element.$type === 'bpmn:Process' || element.$type === 'bpmn:SubProcess')) {
        const lanes = container.laneSets?.flatMap(set => set.lanes) || [];
        assert.ok(lanes.length, `${container.id} has lanes`);
        const members = lanes.flatMap(lane => lane.flowNodeRef || []);
        const nodes = container.flowElements.filter(element => element.$instanceOf('bpmn:FlowNode'));
        assert.deepEqual(members.map(node => node.id).sort(), nodes.map(node => node.id).sort(), 'Each flow node belongs to exactly one lane within its scope');
        for (const lane of lanes) {
          const laneShape = shapes.get(lane.id);
          if (!laneShape) { assert.ok(view.includes('__'), 'Only partial DI may omit lanes'); continue; }
          assert.equal(laneShape.isHorizontal, true);
          if (container.$type === 'bpmn:SubProcess') assert.ok(contains(shapes.get(container.id).bounds, laneShape.bounds), `${lane.id} inside its container`);
          const role = JSON.parse(lane.documentation[0].text).responsible_role;
          for (const node of lane.flowNodeRef || []) {
            assert.equal(node.$parent, container);
            if (!shapes.has(node.id)) { assert.ok(view.includes('__'), 'Only partial DI may omit nodes'); continue; }
            assert.ok(contains(laneShape.bounds, shapes.get(node.id).bounds), `${node.id} inside ${lane.id}`);
            if (node.$instanceOf('bpmn:Task')) {
              const record = JSON.parse(node.documentation[0].text);
              if (!technology) assert.equal(record.normalized.team, role);
              assert.equal(record.normalized.raci[0].assignments.R, record.normalized.team);
              assert.match(record.normalized.raci[0].basis, /Proposed/);
              assert.match(record.normalized.responsibility_basis, /Not approved/);
              for (const category of ['A', 'C', 'I']) assert.ok(record.normalized.raci[0].assignments[category]);
              assert.equal(record.source_step_ids.length, 0, 'Proposals cannot claim source equivalence');
            }
          }
        }
      }
      assert.equal(elements.filter(element => element.$instanceOf?.('bpmn:Task')).length, workflow.steps.length);
      const topology = elements.filter(element => element.$type === 'bpmn:SequenceFlow').map(flow => `${flow.sourceRef.id}->${flow.targetRef.id}`).sort();
      if (signature) assert.deepEqual(topology, signature); else signature = topology;
      for (const shape of elements.filter(element => element.$type === 'bpmndi:BPMNShape')) assert.ok(Number.isFinite(shape.bounds.x) && shape.bounds.width > 0);
    }
  }
});

test('express transfers preserve evidence, delivery bypasses issuance, and multi-scope/wave rules remain explicit', () => {
  const trade = buildWorkflowGraph(snapshot.workflows[6]);
  assert.ok(trade.edges.some(edge => edge.from === 'WF-07-S025_result' && edge.to === 'WF-07-S021' && edge.correction));
  const express = buildWorkflowGraph(snapshot.workflows[3]);
  assert.ok(express.edges.filter(edge => edge.transfer).every(edge => edge.preserveCase));
  for (const index of [12, 13]) {
    const graph = buildWorkflowGraph(snapshot.workflows[index]);
    assert.ok(graph.edges.some(edge => edge.replay && edge.to.endsWith(index === 12 ? 'S021' : 'S026')));
  }
  const enterprise = buildWorkflowGraph(snapshot.workflows[15]);
  assert.equal(enterprise.nodes.filter(node => node.scope).length, 2);
  assert.ok(enterprise.edges.some(edge => edge.collection === 'approvedWaves' && edge.bounded && edge.noReplay));
  assert.equal(buildWorkflowGraph(snapshot.workflows[19]).nodes.filter(node => node.scope).length, 2);
});

test('remediation cannot bypass required revalidation and all perspectives reject unknown views', async () => {
  for (const [index, number, target] of [[10, 15, 14], [14, 31, 25], [15, 37, 29], [16, 9, 8], [19, 36, 29]]) {
    const workflow = snapshot.workflows[index];
    const graph = buildWorkflowGraph(workflow);
    const origin = `${workflow.id}-S${String(number).padStart(3, '0')}_result`;
    const outgoing = graph.edges.filter(edge => edge.from === origin);
    assert.ok(outgoing.some(edge => edge.mandatoryRecheck && edge.resumeAt.endsWith(`S${String(target).padStart(3, '0')}`)));
    assert.ok(!outgoing.some(edge => edge.normal));
  }
  await assert.rejects(() => generateWorkflowBpmn(snapshot.workflows[0], snapshot.version, 'invented-view'), /Unknown workflow diagram/);
});

test('external scope corrections resume at the affected activity instead of replaying the scope', async () => {
  for (const [index, target] of [[11, 'WF-12-S012'], [15, 'WF-16-S029']]) {
    const workflow = snapshot.workflows[index];
    const graph = buildWorkflowGraph(workflow);
    assert.ok(graph.edges.some(flow => flow.targetedResume && flow.to === target));
    const xml = await generateWorkflowBpmn(workflow, snapshot.version);
    assert.ok(xml.includes('pendingOrAffected('));
    assert.ok(xml.includes('exclude completed unaffected peers'));
  }
});

test('format constants and generated task styling match the unchanged sample BPMN assets', async () => {
  for (const view of ['diagram1_people', 'diagram2_technology', 'diagram3_combined']) {
    const sample = await new BpmnModdle().fromXML(await readFile(new URL(`../public/onboarding/${view}.bpmn`, import.meta.url), 'utf8'));
    const source = Object.values(sample.elementsById);
    const lanes = source.filter(element => element.$type === 'bpmn:Lane').map(lane => lane.name);
    assert.deepEqual(lanes, view === 'diagram2_technology' ? sampleFormat.technology : sampleFormat.people);
    const sampleTasks = source.filter(element => element.$type === 'bpmndi:BPMNShape' && element.bpmnElement.$instanceOf('bpmn:Task'));
    for (const shape of sampleTasks) {
      assert.equal(shape.bounds.width, sampleFormat.task.width);
      assert.equal(shape.bounds.height, sampleFormat.task.height);
      assert.equal(shape.get('bioc:fill'), sampleFormat.colors[shape.bpmnElement.$type.split(':')[1]]);
    }
    if (view !== 'diagram1_people') {
      await assert.rejects(generateWorkflowBpmn(snapshot.workflows[0], snapshot.version, view), /blocked/);
      continue;
    }
    const generated = await new BpmnModdle().fromXML(await generateWorkflowBpmn(snapshot.workflows[0], snapshot.version, view));
    const elements = Object.values(generated.elementsById);
    for (const shape of elements.filter(element => element.$type === 'bpmndi:BPMNShape' && element.bpmnElement.$instanceOf('bpmn:Task'))) {
      assert.equal(shape.bounds.width, sampleFormat.task.width);
      assert.equal(shape.bounds.height, sampleFormat.task.height);
      assert.equal(shape.get('bioc:fill'), sampleFormat.colors[shape.bpmnElement.$type.split(':')[1]]);
      assert.equal(shape.get('bioc:stroke'), sampleFormat.colors.stroke);
    }
    assert.equal(elements.filter(element => element.$type === 'bpmn:TextAnnotation' && /_(account|system)$/.test(element.id)).length, 0);
  }
});