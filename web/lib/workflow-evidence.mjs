import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { evidenceHash } from './workflow-quality.mjs';

export const evidenceDependencies = [
  'lib/process-workflow.mjs', 'lib/workflow-quality.mjs', 'lib/workflow-spec.mjs',
  'lib/workflow-evidence.mjs', 'scripts/validate-workflows.mjs',
  'scripts/validate-bpmn-schema.ps1', 'package-lock.json',
  'data/normalized-processes.json',
  'public/onboarding/assets/bpmn-navigated-viewer.js',
  'public/onboarding/renderer.html', 'public/onboarding/live-renderer.js',
];

export async function generationFingerprint(root) {
  const entries = await Promise.all(evidenceDependencies.map(async name => [name, evidenceHash(await readFile(path.join(root, name), 'utf8'))]));
  return evidenceHash(Object.fromEntries(entries));
}

export function reportMatches(report, workflow, version, fingerprint) {
  return report?.input_sha256 === evidenceHash(workflow) && report.version === version && report.dependencies_sha256 === fingerprint;
}

export async function readCurrentValidation(root, workflow, version, fingerprint) {
  try {
    const directory = path.join(root, 'workflow', 'evidence', workflow.id);
    const report = JSON.parse(await readFile(path.join(directory, 'report.json'), 'utf8'));
    if (!reportMatches(report, workflow, version, fingerprint) || !report.files?.length) return null;
    for (const file of report.files) {
      for (const artifact of [file.artifact, file.roundtrip]) {
        if (!artifact || !/^[\w-]+(?:\.roundtrip)?\.bpmn$/.test(artifact.path)) return null;
        if (evidenceHash(await readFile(path.join(directory, artifact.path), 'utf8')) !== artifact.sha256) return null;
      }
    }
    for (const schema of report.schemas || []) {
      if (evidenceHash(await readFile(schema.path, 'utf8')) !== schema.sha256) return null;
    }
    if (!report.schemas?.length) return null;
    return report;
  } catch {
    return null;
  }
}