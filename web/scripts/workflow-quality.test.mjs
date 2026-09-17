import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { assessWorkflow, assertEligibleDiagram, qualityPath, evidenceHash } from '../lib/workflow-quality.mjs';
import { reportMatches, readCurrentValidation } from '../lib/workflow-evidence.mjs';

test('fresh reports accept browser export filenames and reject tampered artifacts', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'workflow-evidence-'));
  try {
    const workflow = { id: 'test', steps: [] };
    const directory = path.join(root, 'workflow/evidence/test');
    await mkdir(directory, { recursive: true });
    const schemaPath = path.join(root, 'schema.xsd');
    await writeFile(schemaPath, 'schema');
    const file = { artifact: { path: 'diagram1_people.bpmn', sha256: evidenceHash('xml') }, roundtrip: { path: 'diagram1_people.roundtrip.bpmn', sha256: evidenceHash('xml') } };
    const report = { input_sha256: evidenceHash(workflow), version: 'current', dependencies_sha256: 'current', files: [file], schemas: [{ path: schemaPath, sha256: evidenceHash('schema') }] };
    for (const artifact of [file.artifact, file.roundtrip]) await writeFile(path.join(directory, artifact.path), 'xml');
    await writeFile(path.join(directory, 'report.json'), JSON.stringify(report));
    assert.ok(await readCurrentValidation(root, workflow, 'current', 'current'));
    await writeFile(path.join(directory, file.roundtrip.path), 'tampered');
    assert.equal(await readCurrentValidation(root, workflow, 'current', 'current'), null);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('reports are bound to the full workflow, version and generator dependencies', () => {
  const workflow = { id: 'test', steps: [] };
  const report = { input_sha256: evidenceHash(workflow), version: 'current', dependencies_sha256: 'current' };
  assert.equal(reportMatches(report, workflow, 'current', 'current'), true);
  assert.equal(reportMatches(report, workflow, 'old', 'current'), false);
  assert.equal(reportMatches(report, workflow, 'current', 'changed'), false);
  assert.equal(reportMatches(report, { ...workflow, steps: ['changed'] }, 'current', 'current'), false);
});

test('technology needs verified equivalence; combined additionally needs matching validated perspectives', () => {
  const workflow = { id: 'test', process_id: 'test', steps: [{ id: 'revised', source_step_ids: ['source'], mapping_status: 'Proposed' }], source_evidence: { steps: [{ 'Process Step ID': 'source', 'Process ID': 'test' }], details: [{ 'Process Step ID': 'source', 'Detail Type': 'Application', 'Detail Value': 'Test application' }], bde_mappings: [] } };
  assert.throws(() => assertEligibleDiagram('diagram2_technology', workflow), /blocked/);
  workflow.steps[0].mapping_status = 'Verified';
  assert.doesNotThrow(() => assertEligibleDiagram('diagram2_technology', workflow));
  assert.throws(() => assertEligibleDiagram('diagram3_combined', workflow), /blocked/);
  const validation = { input_sha256: evidenceHash(workflow), files: ['diagram1_people', 'diagram2_technology'].map(view => ({ view, topology_sha256: 'matching', ...Object.fromEntries(['schema', 'viewer', 'reachability', 'fidelity', 'coverage', 'layout'].map(check => [check, { status: 'PASS' }])) })) };
  assert.doesNotThrow(() => assertEligibleDiagram('diagram3_combined', workflow, validation));
  for (const status of [undefined, 'NOT RUN', 'FAIL']) {
    validation.files[1].layout = status ? { status } : undefined;
    assert.throws(() => assertEligibleDiagram('diagram3_combined', workflow, validation), /blocked/);
  }
  validation.files[1].layout = { status: 'PASS' };
  validation.files[1].topology_sha256 = 'different';
  assert.throws(() => assertEligibleDiagram('diagram3_combined', workflow, validation), /blocked/);
  validation.files[1].topology_sha256 = 'matching';
  validation.input_sha256 = 'stale';
  assert.throws(() => assertEligibleDiagram('diagram3_combined', workflow, validation), /blocked/);
});

test('strict quality threshold and critical gaps override prediction', () => {
  assert.equal(qualityPath(90, []), 'repair');
  assert.equal(qualityPath(90.01, []), 'predict');
  assert.equal(qualityPath(100, ['missing application']), 'repair');
  assert.equal(qualityPath(null, []), 'repair');
});

test('all processes retain evidence without crediting proposals as source facts', async () => {
  const { workflows } = JSON.parse(await readFile(new URL('../workflow/process-workflows.json', import.meta.url)));
  for (const workflow of workflows) {
    const before = JSON.stringify(workflow);
    const report = assessWorkflow(workflow);
    assert.ok(report.source_score <= 75);
    assert.equal(report.direct_coverage.passed, 0);
    assert.equal(report.source_counts.steps, 29);
    assert.ok(report.source_counts.details > 0);
    assert.equal(report.gates.combined.status, 'BLOCKED');
    assert.equal(JSON.stringify(workflow), before);
    const missing = structuredClone(workflow);
    missing.source_evidence.details = [];
    assert.ok(assessWorkflow(missing).source_score < report.source_score);
  }
  assert.throws(() => assertEligibleDiagram('diagram3_combined__phase'), /blocked/);
  assert.throws(() => assertEligibleDiagram('diagram2_technology'), /blocked/);
  assert.doesNotThrow(() => assertEligibleDiagram('diagram1_people'));
});