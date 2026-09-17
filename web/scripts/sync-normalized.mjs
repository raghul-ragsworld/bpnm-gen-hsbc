import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import readExcelFile from 'read-excel-file/node';

const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/sync-normalized.mjs <normalized-data-directory>');
const workbookName = 'Synthetic_Hackathon_Data_10_normalized.xlsx';
const workbook = await readFile(resolve(source, workbookName));
const sheets = await readExcelFile(workbook);
const tables = Object.fromEntries(['Process', 'Process Step', 'Process Step Detail', 'Process Step Data'].map(name => {
  const sheet = sheets.find(sheet => sheet.sheet === name);
  if (!sheet) throw new Error(`Missing workbook sheet: ${name}`);
  const [headers, ...rows] = sheet.data;
  return [name, rows.filter(row => row.some(value => value !== null)).map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null])))];
}));
const processIds = new Set(tables.Process.map(process => process['Process ID']));
if (processIds.size !== tables.Process.length) throw new Error('Duplicate process IDs');
const steps = tables['Process Step'];
if (new Set(steps.map(step => step['Process Step ID'])).size !== steps.length || steps.some(step => !processIds.has(step['Process ID']))) throw new Error('Invalid process step references');
const navigation = JSON.parse(await readFile(new URL('../public/onboarding/navigation.json', import.meta.url), 'utf8'));
const templates = Object.fromEntries(await Promise.all(navigation.diagrams.map(async name => [name, await readFile(new URL(`../public/onboarding/${name}.bpmn`, import.meta.url), 'utf8')])));
const snapshot = {
  validation: {
    normalized_workbook: workbookName,
    workbook_sha256: createHash('sha256').update(workbook).digest('hex'),
  },
  steps,
  tables,
  templates,
};
const destination = new URL('../data/', import.meta.url);
await mkdir(destination, { recursive: true });
await writeFile(new URL('normalized-processes.json', destination), JSON.stringify(snapshot));
console.log(`Synced ${tables.Process.length} processes and ${steps.length} steps directly from ${workbookName}`);