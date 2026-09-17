import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { requirementsVersion, workflowBasis, workflowSpecs, validateWorkflowDefinitions } from '../lib/workflow-spec.mjs';

const document = await readFile(new URL('../../docs/Process_Specific_Steps_Proposed.md', import.meta.url), 'utf8');
const source = JSON.parse(await readFile(new URL('../data/normalized-processes.json', import.meta.url), 'utf8'));
const sections = [...document.matchAll(/^### (WF-\d{2}): (.+)\r?\n([\s\S]*?)(?=^### |^## |$(?![\s\S]))/gm)];
const workflows = sections.map(([, id, name, body]) => {
  const original = source.tables.Process.find(process => process['L4 Process Name'] === name);
  if (!original) throw new Error(`No workbook process for ${name}`);
  const processId = original['Process ID'];
  const sourceSteps = source.steps.filter(step => step['Process ID'] === processId);
  const sourceIds = new Set(sourceSteps.map(step => step['Process Step ID']));
  const sourceEvidence = {
    process: original,
    steps: sourceSteps,
    details: source.tables['Process Step Detail'].filter(record => sourceIds.has(record['Process Step ID'])),
    bde_mappings: source.tables['Process Step Data'].filter(record => sourceIds.has(record['Process Step ID'])),
    provenance: source.validation,
  };
  const steps = [...body.matchAll(/^(\d+)\. (.+)\r?$/gm)].map(([, number, action], index) => {
    if (Number(number) !== index + 1) throw new Error(`Non-sequential steps in ${id}`);
    return { id: `${id}-S${number.padStart(3, '0')}`, name: action.trim().replace(/\.$/, ''), optional: /if required|where required|where applicable/.test(action), source_step_ids: [], mapping_status: 'Proposed addition; source-level equivalence unresolved' };
  });
  return {
    id, process_id: processId, name, steps,
    source_evidence: sourceEvidence,
    source_sha256: createHash('sha256').update(JSON.stringify(sourceEvidence)).digest('hex'),
    requirement: 'docs/Process_Specific_Steps_Proposed.md',
    routing_requirement: body.slice(body.indexOf('Change:') + 7).trim(),
    source_rows: source.steps.filter(step => step['Process ID'] === processId).map(step => ({ id: step['Process Step ID'], name: step['Process Step'], disposition: 'Retained as source evidence; no one-to-one executable mapping asserted' })),
    spec: workflowSpecs.find(spec => spec.id === id),
  };
});
validateWorkflowDefinitions(workflows);
const snapshot = { version: requirementsVersion, basis: workflowBasis, requirements_sha256: createHash('sha256').update(document).digest('hex'), source: source.validation, workflows };
await mkdir(new URL('../workflow/', import.meta.url), { recursive: true });
await writeFile(new URL('../workflow/process-workflows.json', import.meta.url), JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Validated and generated ${workflows.length} workflows / ${workflows.reduce((count, workflow) => count + workflow.steps.length, 0)} detailed activities. Original workbook unchanged.`);