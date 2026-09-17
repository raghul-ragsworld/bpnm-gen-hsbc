import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { BpmnModdle } from 'bpmn-moddle';
import { chromium } from 'playwright';
import { generateWorkflowBpmn, workflowNavigation } from '../lib/process-workflow.mjs';
import { assessWorkflow, evidenceHash } from '../lib/workflow-quality.mjs';
import { generationFingerprint } from '../lib/workflow-evidence.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'workflow/evidence');
const schemaRoot = path.resolve(process.env.BPMN_SCHEMA_DIR || path.join(root, 'workflow/schema'));
const snapshot = JSON.parse(await readFile(path.join(root, 'workflow/process-workflows.json'), 'utf8'));
const source = JSON.parse(await readFile(path.join(root, 'data/normalized-processes.json'), 'utf8'));
for (const workflow of snapshot.workflows) {
  const steps = source.steps.filter(step => step['Process ID'] === workflow.process_id);
  const identifiers = new Set(steps.map(step => step['Process Step ID']));
  const expected = {
    process: source.tables.Process.find(process => process['Process ID'] === workflow.process_id),
    steps,
    details: source.tables['Process Step Detail'].filter(record => identifiers.has(record['Process Step ID'])),
    bde_mappings: source.tables['Process Step Data'].filter(record => identifiers.has(record['Process Step ID'])),
    provenance: source.validation,
  };
  assert.deepEqual(workflow.source_evidence, expected, `${workflow.id}: evidence differs from normalized source; run sync:workflows`);
  assert.equal(workflow.source_sha256, evidenceHash(expected), `${workflow.id}: source hash mismatch`);
}
const dependencies = await generationFingerprint(root);
const officialHashes = {
  'BPMN20.xsd': 'a07c159cb0594573dd7c97b1370dd116112378f377e43c89a8bf512ac5030705',
  'BPMNDI.xsd': 'f0dff1cd559d1514d8ebfc8c646f58402bcaced27ec22e2aa6456c2dcc80b038',
  'Semantic.xsd': 'c4318842f7d2bbc262d7954c9452c501db16f0868eac0b8732ec5d7fb384d9a7',
  'DI.xsd': 'd5754bf7a91e647d6f2b6121115032238d6871b12d7ce64e620a8452b7cf4c01',
  'DC.xsd': 'a2f90e5ad9bb48c6915e4e034b4e27ac838264a1d4f27bfc70dbdfc69351312d',
};
await mkdir(schemaRoot, { recursive: true });
const schemas = [];
for (const [name, expected] of Object.entries(officialHashes)) {
  const destination = path.join(schemaRoot, name);
  const url = `https://www.omg.org/spec/BPMN/20100501/${name}`;
  let text;
  try { text = await readFile(destination, 'utf8'); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Schema download failed: ${response.status} ${url}`);
    text = await response.text();
    if (evidenceHash(text) !== expected) throw new Error(`Official schema hash mismatch: ${name}`);
    await writeFile(destination, text);
  }
  if (evidenceHash(text) !== expected) throw new Error(`Local schema differs from verified OMG publication: ${name}`);
  schemas.push({ path: destination, url, sha256: expected });
}
const measured = (passed, total) => ({ passed, total, status: total ? passed === total ? 'PASS' : 'FAIL' : 'N/A' });
const notApplicable = { passed: null, total: null, status: 'N/A' };

function reachability(elements) {
  const scopes = elements.filter(element => ['bpmn:Process', 'bpmn:SubProcess'].includes(element.$type) && element.flowElements?.length);
  const results = scopes.map(scope => {
    const nodes = scope.flowElements.filter(element => element.$instanceOf('bpmn:FlowNode'));
    const flows = scope.flowElements.filter(element => element.$type === 'bpmn:SequenceFlow');
    const edges = flows.map(flow => [flow.sourceRef.id, flow.targetRef.id]);
    for (const node of nodes.filter(node => node.attachedToRef)) edges.push([node.attachedToRef.id, node.id]);
    const traverse = (seeds, reverse = false) => {
      const reached = new Set(seeds.map(node => node.id));
      let previous;
      do {
        previous = reached.size;
        for (const [source, target] of edges) if (reached.has(reverse ? target : source)) reached.add(reverse ? source : target);
      } while (previous !== reached.size);
      return reached;
    };
    const fromStart = traverse(nodes.filter(node => node.$type === 'bpmn:StartEvent'));
    const toEnd = traverse(nodes.filter(node => node.$type === 'bpmn:EndEvent'), true);
    const failures = nodes.filter(node => !fromStart.has(node.id) || !toEnd.has(node.id)).map(node => node.id);
    const invalidFlows = flows.filter(flow => flow.sourceRef.$parent !== scope || flow.targetRef.$parent !== scope).map(flow => flow.id);
    return { scope: scope.id, ...measured(nodes.length - failures.length, nodes.length), failures, invalid_flows: invalidFlows };
  });
  const result = measured(results.reduce((sum, scope) => sum + scope.passed, 0), results.reduce((sum, scope) => sum + scope.total, 0));
  if (results.some(scope => scope.invalid_flows.length)) result.status = 'FAIL';
  return { ...result, scopes: results, method: 'Scope-local forward/reverse graph traversal; boundary events reachable from host. Not token simulation.' };
}

async function inspect(xml, workflow, overview) {
  const parsed = await new BpmnModdle().fromXML(xml);
  const elements = Object.values(parsed.elementsById);
  const process = elements.find(element => element.$type === 'bpmn:Process');
  const evidence = JSON.parse(process.documentation[0].text).source_evidence;
  const retained = Object.fromEntries(['steps', 'details', 'bde_mappings'].map(key => [key, measured(workflow.source_evidence[key].filter((record, index) => evidenceHash(record) === evidenceHash(evidence?.[key]?.[index] ?? null)).length, workflow.source_evidence[key].length)]));
  const tasks = elements.filter(element => element.$instanceOf?.('bpmn:Task'));
  const coverage = overview ? notApplicable : measured(workflow.steps.filter(step => tasks.some(task => task.id === step.id && JSON.parse(task.documentation[0].text).step['Process Step'] === step.name)).length, workflow.steps.length);
  return {
    warnings: parsed.warnings.map(warning => warning.message),
    reachability: reachability(elements), retained,
    fidelity: { ...measured(Number(evidenceHash(evidence) === evidenceHash(workflow.source_evidence)), 1), basis: 'Exact original evidence snapshot preserved in process documentation; does not establish revised-activity equivalence' },
    coverage,
    topology_sha256: evidenceHash(elements.filter(element => element.$type === 'bpmn:SequenceFlow').map(flow => `${flow.$parent.id}:${flow.sourceRef.id}->${flow.targetRef.id}`).sort()),
  };
}

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BPMN_BROWSER_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined), headless: true });
const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'));
const validator = { node: process.version, browser: browser.version(), platform: process.platform, schema_engine: 'System.Xml.Schema via Windows PowerShell', packages: Object.fromEntries(['playwright', 'bpmn-js', 'bpmn-moddle'].map(name => [name, lock.packages[`node_modules/${name}`].version])) };
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.setContent('<html><body style="margin:0"><div id="canvas" style="width:1440px;height:1000px"></div></body></html>');
await page.addScriptTag({ path: path.join(root, 'public/onboarding/assets/bpmn-navigated-viewer.js') });
const reports = [];
try {
  for (const workflow of snapshot.workflows) {
    const directory = path.join(output, workflow.id);
    await mkdir(directory, { recursive: true });
    const quality = assessWorkflow(workflow);
    const report = { workflow: workflow.id, process_id: workflow.process_id, name: workflow.name, version: snapshot.version, generated_at: new Date().toISOString(), input_sha256: quality.input_sha256, dependencies_sha256: dependencies, validator, schemas, quality, source_comparison: { status: 'PASS', basis: 'Exact snapshot equality against data/normalized-processes.json; not independent workbook re-extraction' }, files: [], checks: [] };
    const validateViews = async views => {
      for (const view of views) {
        const xml = await generateWorkflowBpmn(workflow, snapshot.version, view, report);
        const artifact = { path: `${view}.bpmn`, sha256: evidenceHash(xml) };
        await writeFile(path.join(directory, artifact.path), xml);
        const semantic = await inspect(xml, workflow, view === 'overview');
        const rendered = await page.evaluate(async ({ xml, overview }) => {
          window.validationViewer?.destroy();
          const viewer = new window.BpmnJS({ container: '#canvas', textRenderer: { defaultStyle: { fontFamily: 'Georgia', fontSize: overview ? 20 : 18 }, externalStyle: { fontFamily: 'Georgia', fontSize: 16 } } });
          window.validationViewer = viewer;
          try {
            const first = await viewer.importXML(xml);
            const saved = await viewer.saveXML({ format: true });
            const second = await viewer.importXML(saved.xml);
            viewer.get('canvas').zoom('fit-viewport');
            const box = document.querySelector('#canvas .viewport').getBBox();
            return { xml: saved.xml, warnings: [...first.warnings, ...second.warnings].map(warning => warning.message), nonblank: box.width > 0 && box.height > 0, rendered_elements: viewer.get('elementRegistry').getAll().length };
          } catch (error) { return { error: error.message }; }
        }, { xml, overview: view === 'overview' });
        const roundtrip = { path: `${view}.roundtrip.bpmn`, sha256: evidenceHash(rendered.xml || '') };
        await writeFile(path.join(directory, roundtrip.path), rendered.xml || '');
        const roundtripSemantic = rendered.xml ? await inspect(rendered.xml, workflow, view === 'overview') : null;
        const viewerPassed = !rendered.error && !rendered.warnings.length && rendered.nonblank && semantic.topology_sha256 === roundtripSemantic?.topology_sha256 && roundtripSemantic?.fidelity.status === 'PASS' && roundtripSemantic?.reachability.status === 'PASS';
        report.files.push({ view, artifact, roundtrip, ...semantic, viewer: { ...measured(Number(viewerPassed), 1), warnings: rendered.warnings || [], error: rendered.error, nonblank: rendered.nonblank, rendered_elements: rendered.rendered_elements }, layout: { status: 'NOT RUN', passed: null, total: null, reason: 'Nonblank rendering tested; comprehensive connector and label collision review not certified' } });
        if (view === 'overview') await page.screenshot({ path: path.join(directory, 'overview.png') });
      }
      const manifest = path.join(directory, 'schema-manifest.json');
      await writeFile(manifest, JSON.stringify(report.files.flatMap(file => [file.artifact, file.roundtrip].map(artifact => path.join(directory, artifact.path)))));
      const result = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(root, 'scripts/validate-bpmn-schema.ps1'), '-Manifest', manifest, '-Schema', schemas[0].path], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
      if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || 'Schema validator failed');
      const validations = JSON.parse(result.stdout.replace(/^\uFEFF/, ''));
      for (const file of report.files) {
        const results = [file.artifact, file.roundtrip].map(artifact => validations.find(result => result.path === path.join(directory, artifact.path)));
        file.schema = { ...measured(results.filter(result => result?.status === 'PASS').length, 2), results };
      }
    };
    await validateViews(workflowNavigation(workflow).diagrams);
    const extra = workflowNavigation(workflow, report).diagrams.filter(view => !report.files.some(file => file.view === view));
    if (extra.length) await validateViews(extra);
    const full = report.files.filter(file => /^diagram\d_\w+$/.test(file.view));
    const filesCheck = (name, key) => ({ check: name, ...measured(report.files.filter(file => file[key].status === 'PASS').length, report.files.length) });
    report.quality = assessWorkflow(workflow, report);
    report.checks = [
      filesCheck('OMG BPMN XSD (original + browser export per view)', 'schema'),
      filesCheck('bpmn-js import/export/reimport, warning-free and nonblank', 'viewer'),
      { check: 'Proposed activity coverage (per full perspective)', ...measured(full.reduce((sum, file) => sum + file.coverage.passed, 0), full.reduce((sum, file) => sum + file.coverage.total, 0)) },
      { check: 'Scope-aware reachability (nodes per full perspective)', ...measured(full.reduce((sum, file) => sum + file.reachability.passed, 0), full.reduce((sum, file) => sum + file.reachability.total, 0)) },
      ...['steps', 'details', 'bde_mappings'].map(key => ({ check: `Exact source ${key} preserved (per full perspective)`, ...measured(full.reduce((sum, file) => sum + file.retained[key].passed, 0), full.reduce((sum, file) => sum + file.retained[key].total, 0)) })),
      { check: 'Verified direct source-step equivalence', ...measured(quality.direct_coverage.passed, quality.direct_coverage.total) },
      { check: 'Cross-perspective consistency', status: report.quality.gates.combined.status === 'BLOCKED' ? 'BLOCKED' : 'PASS', passed: null, total: null },
      { check: 'Comprehensive visual layout', status: 'NOT RUN', passed: null, total: null },
      { check: 'Independent business accuracy', status: 'NOT RUN', passed: null, total: null },
    ];
    await writeFile(path.join(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    reports.push(report);
    console.log(`${workflow.id}: ${report.files.length} views; source ${quality.source_score}%; schema ${report.checks[0].passed}/${report.checks[0].total}; viewer ${report.checks[1].passed}/${report.checks[1].total}`);
  }
} finally { await browser.close(); }
const summary = { generated_at: new Date().toISOString(), version: snapshot.version, dependencies_sha256: dependencies, processes: reports.map(report => ({ workflow: report.workflow, name: report.name, source_score: report.quality.source_score, views: report.files.length, gates: report.quality.gates, checks: report.checks, report: `${report.workflow}/report.json` })) };
await writeFile(path.join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
await writeFile(path.join(output, 'summary.md'), '# Current Workflow Evidence\n\nSource preservation is not validated activity equivalence. Proposed models are not business-approved.\n\n| Process | Source quality | Views | XSD | Viewer | Evidence |\n| --- | --- | --- | --- | --- | --- |\n' + reports.map(report => `| ${report.workflow} ${report.name} | ${report.quality.source_score}% | ${report.files.length} | ${report.checks[0].passed}/${report.files.length} | ${report.checks[1].passed}/${report.files.length} | [Report](${report.workflow}/report.json) |`).join('\n') + '\n\nTechnology/Combined availability is recorded in each report. Comprehensive visual layout and independent business accuracy are not certified.\n');
if (reports.some(report => report.files.some(file => ['schema', 'viewer', 'reachability', 'fidelity'].some(key => file[key].status !== 'PASS') || file.coverage.status === 'FAIL' || file.warnings.length))) process.exitCode = 1;