import { createHash } from 'node:crypto';

export const evidenceHash = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const present = value => typeof value === 'string' && value.trim() && !/unresolved|unknown|not specified|tbd|unassigned/i.test(value);
export const parseRaci = text => Object.fromEntries([...String(text || '').matchAll(/(?:^|,)\s*([RACI])\s*=\s*([^,]+)/g)].map(([, role, value]) => [role, value.trim()]));
export const qualityPath = (score, critical) => score !== null && score > 90 && !critical.length ? 'predict' : 'repair';

export function verifiedApplications(workflow, step) {
  if (step.mapping_status !== 'Verified' || !step.source_step_ids?.length) return [];
  const evidence = workflow.source_evidence;
  if (!step.source_step_ids.every(id => evidence?.steps.some(source => source['Process Step ID'] === id))) return [];
  const applications = step.source_step_ids.map(id => evidence.details.filter(detail => detail['Process Step ID'] === id && detail['Detail Type'] === 'Application' && present(detail['Detail Value'])).map(detail => detail['Detail Value']));
  return applications.every(values => values.length) ? [...new Set(applications.flat())].sort() : [];
}

export function assessWorkflow(workflow, validation = null) {
  const evidence = workflow.source_evidence || { steps: [], details: [], bde_mappings: [] };
  const steps = evidence.steps;
  const identifiers = steps.map(step => step['Process Step ID']);
  const checks = [];
  const add = (component, id, passed, reason) => checks.push({ component, id, passed: Boolean(passed), reason });
  for (const step of steps) {
    const id = step['Process Step ID'];
    add('identity', `${id}:identity`, present(id) && identifiers.filter(value => value === id).length === 1 && step['Process ID'] === workflow.process_id, 'Unique step ID and valid process parent');
    add('identity', `${id}:action`, present(step['Process Step']) && present(step['Process Step Description']), 'Action and full description supplied');
    const details = evidence.details.filter(detail => detail['Process Step ID'] === id);
    const variants = [...new Set(details.map(detail => detail.RACI))];
    for (const role of ['R', 'A', 'C', 'I']) add('people', `${id}:${role}`, variants.length && variants.every(variant => present(parseRaci(variant)[role])), `Every supplied RACI variant has ${role}; missing or unsupported N/A fails`);
    add('people', `${id}:consistency`, variants.length && ['R', 'A'].every(role => new Set(variants.map(variant => parseRaci(variant)[role])).size === 1), 'Conflicting R/A variants require review');
    add('technology', `${id}:application`, details.some(detail => detail['Detail Type'] === 'Application' && present(detail['Detail Value'])), 'Explicit application detail; absence is not evidence of a manual step');
  }
  for (const control of ['start_end', 'conditional_routes', 'bounded_corrections', 'joins_scopes']) add('routing', `${workflow.id}:${control}`, false, 'Source workbook has no explicit routing table; revised requirements are Proposed, not source facts');
  add('traceability', `${workflow.id}:snapshot`, /^[a-f0-9]{64}$/.test(evidence.provenance?.workbook_sha256 || ''), 'Source workbook fingerprint supplied');
  for (const [kind, records, key] of [['details', evidence.details, 'PSD ID'], ['bde', evidence.bde_mappings, 'PSDATA ID']]) {
    const ids = records.map(record => record[key]);
    for (const record of records) add('traceability', `${kind}:${record[key]}`, present(record[key]) && ids.filter(id => id === record[key]).length === 1 && identifiers.includes(record['Process Step ID']), 'Unique mapping identifier and existing step reference');
  }
  const weights = { identity: 20, routing: 25, people: 25, technology: 20, traceability: 10 };
  const components = Object.entries(weights).map(([component, weight]) => {
    const applicable = checks.filter(check => check.component === component);
    const passed = applicable.filter(check => check.passed).length;
    return { component, weight, passed, total: applicable.length, score: applicable.length ? passed / applicable.length * 100 : null };
  });
  const score = steps.length && components.every(component => component.score !== null) ? Math.round(components.reduce((sum, component) => sum + component.score * component.weight / 100, 0) * 100) / 100 : null;
  const mapped = workflow.steps.filter(step => step.mapping_status === 'Verified' && step.source_step_ids?.length && step.source_step_ids.every(id => identifiers.includes(id)));
  const technologyReady = workflow.steps.length > 0 && workflow.steps.every(step => verifiedApplications(workflow, step).length);
  const perspectivesPassed = validation?.input_sha256 === evidenceHash(workflow) && ['diagram1_people', 'diagram2_technology'].every(view => {
    const result = validation.files?.find(file => file.view === view);
    return result && ['schema', 'viewer', 'reachability', 'fidelity', 'coverage', 'layout'].every(check => result[check]?.status === 'PASS');
  });
  const signatures = validation?.files?.filter(file => ['diagram1_people', 'diagram2_technology'].includes(file.view)).map(file => file.topology_sha256);
  const combinedReady = technologyReady && perspectivesPassed && signatures?.length === 2 && Boolean(signatures[0]) && signatures[0] === signatures[1];
  const critical = ['Source routing is not explicitly specified', ...(mapped.length !== workflow.steps.length ? ['Revised activities have no validated source equivalence; source applications and RACI cannot be transplanted'] : []), ...(checks.some(check => !check.passed && check.component === 'people') ? ['Source RACI incomplete or conflicting'] : [])];
  return {
    process_id: workflow.process_id, input_sha256: evidenceHash(workflow), source_sha256: evidenceHash(evidence),
    source_score: score, components, checks, path: qualityPath(score, critical), critical_gaps: critical,
    source_counts: { steps: steps.length, details: evidence.details.length, bde_mappings: evidence.bde_mappings.length },
    direct_coverage: { passed: new Set(mapped.flatMap(step => step.source_step_ids)).size, total: steps.length },
    proposed_activities: workflow.steps.length,
    gates: {
      people: { status: 'PROPOSED', reason: 'Human responsibility candidates only; not approved ownership or business accuracy' },
      technology: { status: technologyReady ? 'PROPOSED' : 'BLOCKED', reason: technologyReady ? 'Verified source application mappings; revised routing remains Proposed' : 'No evidence-backed application mapping for revised activities; capability guesses are not applications' },
      combined: { status: combinedReady ? 'PROPOSED' : 'BLOCKED', reason: combinedReady ? 'Both perspectives passed artifact checks with matching topology; business approval is not implied' : 'Technology mapping and independent perspective validation have not passed' },
    },
  };
}

export function assertEligibleDiagram(view, workflow, validation = null) {
  const gate = view.startsWith('diagram2_') ? 'technology' : view.startsWith('diagram3_') ? 'combined' : 'people';
  if (gate !== 'people' && (!workflow || assessWorkflow(workflow, validation).gates[gate].status === 'BLOCKED')) {
    const error = new Error(`${gate} diagram blocked: revised activity/application equivalence and independent validation are required`);
    error.code = 'DIAGRAM_BLOCKED';
    throw error;
  }
}