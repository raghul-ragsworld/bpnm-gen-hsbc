import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = process.argv[2];
if (!source) throw new Error('Usage: npm run sync:bpmn -- <path-to-onboarding_bpmn>');
const destination = fileURLToPath(new URL('../public/onboarding/', import.meta.url));
const navigation = JSON.parse(await readFile(resolve(source, 'navigation.json'), 'utf8'));
if (!Array.isArray(navigation.diagrams) || !navigation.diagrams.length ||
    navigation.diagrams.some((name) => typeof name !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(name))) {
  throw new Error('Invalid diagram manifest');
}
const files = ['navigation.json', 'assets/bpmn-navigated-viewer.js',
  ...navigation.diagrams.map((name) => `${name}.bpmn`)];
await Promise.all(files.map((file) => readFile(resolve(source, file))));
for (const file of files) {
  const target = resolve(destination, file);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(source, file), target);
}
console.log(`Copied ${files.length} unchanged sample data/assets to ${destination}; integrated renderer preserved`);