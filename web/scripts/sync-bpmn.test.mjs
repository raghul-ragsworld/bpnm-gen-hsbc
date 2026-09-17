import assert from 'node:assert/strict';
import { copyFile, cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

test('sample sync preserves the integrated renderer and live adapter', async () => {
  const sandbox = await mkdtemp(join(tmpdir(), 'bpmn-sync-test-'));
  const source = join(sandbox, 'source');
  const destination = join(sandbox, 'public', 'onboarding');
  const script = join(sandbox, 'scripts', 'sync-bpmn.mjs');
  const bundled = fileURLToPath(new URL('../public/onboarding/', import.meta.url));
  try {
    await mkdir(join(sandbox, 'scripts'), { recursive: true });
    await mkdir(destination, { recursive: true });
    await copyFile(new URL('./sync-bpmn.mjs', import.meta.url), script);
    await cp(bundled, source, { recursive: true });
    const preserved = ['renderer.html', 'live-renderer.js'];
    for (const name of preserved) await copyFile(join(bundled, name), join(destination, name));
    await writeFile(join(source, 'renderer.html'), '<html>unintegrated source renderer</html>');
    const result = spawnSync(process.execPath, [script, source], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    for (const name of preserved) {
      assert.deepEqual(await readFile(join(destination, name)), await readFile(join(bundled, name)));
    }
    const navigation = JSON.parse(await readFile(join(source, 'navigation.json'), 'utf8'));
    const copied = ['navigation.json', 'assets/bpmn-navigated-viewer.js', ...navigation.diagrams.map(name => `${name}.bpmn`)];
    for (const name of copied) {
      assert.deepEqual(await readFile(join(destination, name)), await readFile(join(source, name)));
    }
  } finally {
    await rm(sandbox, { recursive: true, force: true });
  }
});