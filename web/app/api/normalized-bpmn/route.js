import data from '../../../workflow/process-workflows.json';
import { generateWorkflowBpmn, workflowNavigation, reviewWorkflowChanges } from '../../../lib/process-workflow.mjs';
import { assessWorkflow, assertEligibleDiagram } from '../../../lib/workflow-quality.mjs';
import { generationFingerprint, readCurrentValidation } from '../../../lib/workflow-evidence.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const diagrams = new Map();

export async function GET(request) {
  const parameters = new URL(request.url).searchParams;
  const processId = parameters.get('process_id');
  const headers = { 'Cache-Control': 'no-store' };
  if (!processId) return Response.json({ source: data.source.normalized_workbook, warning: data.basis, version: data.version, processes: data.workflows.map(workflow => ({ process_id: workflow.process_id, process_name: workflow.name })) }, { headers });
  const workflow = data.workflows.find(workflow => workflow.process_id === processId);
  if (!workflow) {
    return Response.json({ detail: 'Unknown normalized process' }, { status: 404, headers });
  }
  const root = process.env.BPMN_WEB_ROOT || process.cwd();
  const fingerprint = await generationFingerprint(root).catch(() => null);
  const validation = fingerprint ? await readCurrentValidation(root, workflow, data.version, fingerprint) : null;
  const navigation = workflowNavigation(workflow, validation);
  const quality = assessWorkflow(workflow, validation);
  if (parameters.get('navigation') === '1') return Response.json({ ...navigation, gates: quality.gates, version: data.version, basis: data.basis }, { headers });
  if (parameters.get('review') === '1' || parameters.get('quality') === '1') {
    return Response.json({ ...reviewWorkflowChanges(workflow, data), quality, validation }, { headers });
  }
  const diagram = parameters.get('diagram') || 'diagram1_people';
  try { assertEligibleDiagram(diagram, workflow, validation); }
  catch (error) { return Response.json({ detail: error.message, gates: quality.gates }, { status: 409, headers }); }
  if (!navigation.diagrams.includes(diagram)) return Response.json({ detail: 'Unknown workflow diagram' }, { status: 400, headers });
  const key = `${quality.input_sha256}:${data.version}:${fingerprint}:${diagram}`;
  try {
    if (!diagrams.has(key)) diagrams.set(key, generateWorkflowBpmn(workflow, data.version, diagram, validation));
    return new Response(await diagrams.get(key), { headers: { ...headers, 'Content-Type': 'application/xml; charset=utf-8' } });
  } catch (error) {
    diagrams.delete(key);
    console.error('Business process workflow generation failed', error);
    return Response.json({ detail: 'Normalized BPMN generation failed' }, { status: 500, headers });
  }
}