import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { BpmnModdle } from 'bpmn-moddle';
import { generateTemplateBpmn, processCatalog, templateWarning, reviewTemplateChanges } from '../lib/template-bpmn.mjs';

const data = JSON.parse(await readFile(new URL('../data/normalized-processes.json', import.meta.url), 'utf8'));
const template = await readFile(new URL('../public/onboarding/diagram1_people.bpmn', import.meta.url), 'utf8');

test('catalog contains business names only', () => {
  assert.equal(processCatalog(data).length, 20);
  assert.deepEqual(Object.keys(processCatalog(data)[0]), ['process_id', 'process_name']);
});

test('all workbook processes and views retain sample topology, geometry and provenance', async () => {
  const topology = elements => elements.filter(element => element.$type === 'bpmn:SequenceFlow').map(element => [element.id, element.sourceRef.id, element.targetRef.id]);
  const geometry = model => model.rootElement.diagrams.flatMap(diagram => diagram.plane.planeElement.map(element => ({
    id: element.id,
    bounds: element.bounds && [element.bounds.x, element.bounds.y, element.bounds.width, element.bounds.height],
    label: element.label?.bounds && [element.label.bounds.x, element.label.bounds.y, element.label.bounds.width, element.label.bounds.height],
    waypoints: element.waypoint?.map(point => [point.x, point.y]),
    colors: element.$attrs,
  })));
  assert.equal(Object.keys(data.templates).length, 19);
  for (const [name, source] of Object.entries(data.templates)) {
    const original = await new BpmnModdle().fromXML(source);
    const originalElements = Object.values(original.elementsById);
    assert.ok(geometry(original).length > 0);
    for (const selected of processCatalog(data)) {
      const xml = await generateTemplateBpmn(data, selected.process_id, source);
      const parsed = await new BpmnModdle().fromXML(xml);
      assert.deepEqual(parsed.warnings, []);
      const elements = Object.values(parsed.elementsById);
      assert.deepEqual(topology(elements), topology(originalElements));
      assert.deepEqual(elements.map(element => element.$type), originalElements.map(element => element.$type));
      assert.deepEqual(geometry(parsed), geometry(original));
      const process = elements.find(element => element.$type === 'bpmn:Process');
      assert.equal(process.name, selected.process_name);
      assert.equal(process.isExecutable, false);
      assert.equal(JSON.parse(process.documentation[0].text).process_id, selected.process_id);
      const records = elements.filter(element => /^AOB-\d{3}$/.test(element.id)).map(element => JSON.parse(element.documentation[0].text));
      if (name === 'diagram1_people') assert.equal(records.length, 29);
      assert.ok(records.every(record => record.step['Process ID'] === selected.process_id));
      assert.ok(records.every(record => record.model_basis === templateWarning));
    }
  }
});

test('unknown processes and incomplete template mappings are rejected', async () => {
  await assert.rejects(generateTemplateBpmn(data, 'missing', template), /Unknown normalized process/);
  await assert.rejects(generateTemplateBpmn({ ...data, steps: [] }, processCatalog(data)[0].process_id, template), /29-step/);
});

test('review reports actual generated label changes without mutating workbook records', async () => {
  const before = JSON.stringify(data.steps);
  const selected = processCatalog(data)[0];
  const review = await reviewTemplateChanges(data, selected.process_id);
  assert.equal(review.process_id, selected.process_id);
  assert.equal(review.changed_steps, 29);
  assert.equal(review.change_count, review.changes.length);
  assert.ok(review.changes.every(change => change.before !== change.after && change.step_id.startsWith(`${selected.process_id}-`)));
  const label = review.changes.find(change => change.template_id === 'AOB-025' && change.field === 'Diagram label');
  assert.equal(label.before, data.steps.find(step => step['Process Step ID'] === label.step_id)['Process Step']);
  const generated = await new BpmnModdle().fromXML(await generateTemplateBpmn(data, selected.process_id, template));
  assert.equal(generated.elementsById['AOB-025'].name, `AOB-025\n${label.after}`);
  assert.equal(JSON.stringify(data.steps), before);
});