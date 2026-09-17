import { BpmnModdle } from 'bpmn-moddle';

export const templateWarning = 'Fixed Sample Process Onboarding workflow applied. The source workbook is preserved; template-derived semantics are not independently business-validated.';

export function processCatalog(data) {
  return data.tables.Process.map(process => ({
    process_id: process['Process ID'],
    process_name: process['L4 Process Name'],
  }));
}

export async function generateTemplateBpmn(data, processId, templateXml) {
  const selected = processCatalog(data).find(process => process.process_id === processId);
  if (!selected) throw new Error('Unknown normalized process');
  const steps = data.steps.filter(step => step['Process ID'] === processId);
  const records = new Map();
  for (const step of steps) {
    const match = step['Process Step ID'].match(/-S(\d{3})$/);
    if (!match || records.has(`AOB-${match[1]}`)) throw new Error('Invalid template step mapping');
    const details = data.tables['Process Step Detail'].filter(detail => detail['Process Step ID'] === step['Process Step ID']);
    const applications = details.filter(detail => detail['Detail Type'] === 'Application').map(detail => detail['Detail Value']);
    records.set(`AOB-${match[1]}`, {
      step,
      template_step_id: `AOB-${match[1]}`,
      details,
      'BDE mappings': data.tables['Process Step Data'].filter(record => record['Process Step ID'] === step['Process Step ID']),
      normalized: {
        team: details[0]?.['Process Step Owner'] || 'Unassigned',
        application: [...new Set(applications)].join('; ') || 'Not specified in source',
        application_basis: applications.length ? 'source' : 'missing',
        raci: [],
      },
      source_workbook: data.validation.normalized_workbook,
      source_workbook_sha256: data.validation.workbook_sha256,
      model_basis: templateWarning,
    });
  }
  if (records.size !== 29 || Array.from({ length: 29 }, (_, index) => `AOB-${String(index + 1).padStart(3, '0')}`).some(identifier => !records.has(identifier))) {
    throw new Error('Process does not match the 29-step sample template');
  }
  const moddle = new BpmnModdle();
  const { rootElement, warnings } = await moddle.fromXML(templateXml);
  if (warnings.length) throw new Error('Sample template contains XML warnings');
  const documentation = text => [moddle.create('bpmn:Documentation', { text })];
  rootElement.id = `${processId}_${rootElement.id}`;
  rootElement.targetNamespace = `urn:onboarding:${processId}`;
  const visited = new WeakSet();
  function visit(element) {
    if (!element?.$descriptor || visited.has(element)) return;
    visited.add(element);
    if (element.$type === 'bpmn:Process') {
      element.id = `${processId}_${element.id}`;
      element.name = selected.process_name;
      element.isExecutable = false;
      element.documentation = documentation(JSON.stringify({ process_id: processId, source: data.validation, model_basis: templateWarning }));
    }
    if (element.$type === 'bpmn:Participant') element.name = selected.process_name;
    const record = records.get(element.id);
    if (record) {
      const suffix = ` - ${selected.process_name}`;
      const sourceName = record.step['Process Step'];
      const label = sourceName.endsWith(suffix) ? sourceName.slice(0, -suffix.length) : sourceName;
      element.name = `${element.id}\n${label.split(' (')[0]}`;
      element.documentation = documentation(JSON.stringify(record));
    } else if (element.$type !== 'bpmn:Process' && element.documentation?.length) {
      element.documentation = documentation(`${templateWarning}\nTemplate element: ${element.id || element.$type}`);
    }
    for (const property of element.$descriptor.properties) {
      if (property.isReference || property.isAttr) continue;
      const value = element[property.name];
      for (const child of Array.isArray(value) ? value : [value]) visit(child);
    }
  }
  visit(rootElement);
  return (await moddle.toXML(rootElement, { format: true })).xml;
}

export async function reviewTemplateChanges(data, processId) {
  const template = data.templates.diagram1_people;
  const original = await new BpmnModdle().fromXML(template);
  const generated = await new BpmnModdle().fromXML(await generateTemplateBpmn(data, processId, template));
  const changes = [];
  const uniqueValues = (details, field, type) => [...new Set(details.filter(detail => !type || detail['Detail Type'] === type).map(detail => detail[field]).filter(Boolean))].sort().join('; ');
  for (const element of Object.values(generated.elementsById)) {
    if (!/^AOB-\d{3}$/.test(element.id)) continue;
    const record = JSON.parse(element.documentation[0].text);
    const baseline = JSON.parse(original.elementsById[element.id].documentation[0].text);
    const addChange = (field, before, after, basis) => {
      if (before === after) return;
      changes.push({ step_id: record.step['Process Step ID'], template_id: element.id, step_name: record.step['Process Step'], field, before, after, basis });
    };
    addChange('Process step', baseline.step['Process Step'], record.step['Process Step'], 'Selected workbook record replaces sample metadata');
    for (const [field, key, type] of [['Owner', 'Process Step Owner'], ['RACI', 'RACI'], ['Applications', 'Detail Value', 'Application']]) {
      addChange(field, uniqueValues(baseline.details, key, type), uniqueValues(record.details, key, type), 'Workbook difference from the sample, not an inferred correction');
    }
    addChange('Diagram label', record.step['Process Step'], element.name.slice(element.id.length + 1), 'Process suffix and parenthetical aliases omitted on canvas; full wording preserved in source details');
    if (!element.$type.endsWith('Task')) addChange('BPMN element', 'Process Step row; BPMN type unspecified', element.$type.replace('bpmn:', ''), 'Mapped to the fixed sample workflow; source description retained');
    const lane = Object.values(generated.elementsById).find(candidate => candidate.$type === 'bpmn:Lane' && candidate.flowNodeRef?.includes(element));
    if (lane) addChange('Diagram lane', uniqueValues(record.details, 'Process Step Owner'), lane.name, 'Fixed sample human-team lane; original owner and RACI retained');
  }
  return {
    process_id: processId,
    baseline: 'Sample Process Onboarding',
    changed_steps: new Set(changes.map(change => change.step_id)).size,
    change_count: changes.length,
    source: data.validation,
    changes,
    workflow_basis: templateWarning,
    decisions: [
      'Sample gateways, branches, loops, approval timeout, retry limits, remediation and parallel delivery are preserved. No execution paths were inferred from workbook row order.',
      'The source workbook is not edited. Changes apply to generated labels, metadata and workflow mappings; no new historical data-fix log is claimed.',
      'Known model constraints remain visible: checker rejection is unspecified; enrichment and duplicate detection have an unresolved dependency; gateway 016 is inclusive in the fixed sample while normalization identifies an XOR tax rule.',
    ],
  };
}