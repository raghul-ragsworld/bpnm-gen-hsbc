(() => {
  const parameters = new URLSearchParams(location.search);
  if (!parameters.has('run')) return;
  const runId = parameters.get('run');
  const processId = parameters.get('process_id');
  const processName = parameters.get('name') || 'Published process';
  const publishedViews = (parameters.get('views') || 'people,technology,combined').split(',').filter(view => ['people', 'technology', 'combined'].includes(view));
  const availableViews = publishedViews.length ? [...new Set(publishedViews)] : ['people'];
  let detailView = availableViews.includes('people') ? 'people' : availableViews[0];
  const viewSelect = document.getElementById('view');
  const phaseSelect = document.getElementById('phase');
  const stepSelect = document.getElementById('step');
  const status = document.getElementById('status');
  const canvasElement = document.getElementById('canvas');
  const panel = document.getElementById('raci');
  const heading = document.querySelector('h1');
  const viewer = new BpmnJS({
    container: '#canvas',
    bpmnRenderer: { defaultLabelColor: '#17231c' },
    textRenderer: {
      defaultStyle: { fontFamily: 'Georgia', fontSize: 18 },
      externalStyle: { fontFamily: 'Georgia', fontSize: 16 },
    },
  });
  window.viewer = viewer;
  document.body.dataset.overview = 'true';
  heading.textContent = processName;
  heading.style.overflowWrap = 'anywhere';
  document.title = heading.textContent;
  viewSelect.replaceChildren(new Option('Process overview', 'overview'), ...availableViews.map(view => new Option(view[0].toUpperCase() + view.slice(1), view)));
  phaseSelect.replaceChildren(new Option('Overview', 'overview'), new Option('Full model', 'full'));
  let currentXml = '';
  let currentView = '';
  let busy = false;
  let disposed = false;
  let steps = [];
  let fitMode = true;
  const controller = new AbortController();
  const downloadButton = document.createElement('button');
  downloadButton.textContent = 'Download BPMN';
  downloadButton.disabled = true;
  downloadButton.addEventListener('click', () => {
    if (!currentXml) return;
    const url = URL.createObjectURL(new Blob([currentXml], { type: 'application/xml' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${processId || runId}.${currentView}.bpmn`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  status.before(downloadButton);

  function append(parent, tag, text) {
    const element = document.createElement(tag);
    element.textContent = text;
    parent.append(element);
    return element;
  }

  function documentation(element) {
    return (element.businessObject.documentation || []).map(item => item.text).filter(Boolean).join('\n');
  }

  function phaseFor(step) {
    try {
      const record = JSON.parse(documentation(step));
      const phase = record?.phase_name || record?.phase;
      return typeof phase === 'string' ? phase.trim() : '';
    } catch { return ''; }
  }

  function scopeSteps() {
    return phaseSelect.value.startsWith('phase:') ? steps.filter(step => phaseFor(step) === phaseSelect.value.slice(6)) : steps;
  }

  function updatePhases() {
    const previous = phaseSelect.value;
    const phases = [...new Set(steps.map(phaseFor).filter(Boolean))];
    phaseSelect.replaceChildren(new Option('Overview', 'overview'), new Option('Full model', 'full'), ...phases.map(phase => new Option(phase, `phase:${phase}`)));
    phaseSelect.value = [...phaseSelect.options].some(option => option.value === previous) ? previous : 'full';
  }

  function showScope() {
    document.body.dataset.overview = String(viewSelect.value === 'overview');
    const selected = scopeSteps();
    if (phaseSelect.value.startsWith('phase:') && selected.length && canvasElement.clientWidth && canvasElement.clientHeight) {
      const left = Math.min(...selected.map(step => step.x)) - 60;
      const top = Math.min(...selected.map(step => step.y)) - 60;
      const right = Math.max(...selected.map(step => step.x + step.width)) + 60;
      const bottom = Math.max(...selected.map(step => step.y + step.height)) + 60;
      fitMode = true;
      viewer.get('canvas').viewbox({ x: left, y: top, width: right - left, height: bottom - top });
    } else fit();
    showDetails();
  }

  function showDetails() {
    panel.replaceChildren();
    const selected = stepSelect.value ? steps.filter(step => step.id === stepSelect.value) : scopeSteps();
    for (const step of selected) {
      const title = append(panel, 'h3', '');
      const button = append(title, 'button', step.businessObject.name || step.id);
      button.className = 'step-heading';
      button.addEventListener('click', () => selectStep(step.id));
      const raw = documentation(step);
      let record;
      try { record = JSON.parse(raw); } catch { record = null; }
      if (record && typeof record === 'object') {
        const list = append(panel, 'dl', '');
        for (const [key, value] of Object.entries(record)) {
          append(list, 'dt', key.replaceAll('_', ' '));
          append(list, 'dd', typeof value === 'string' ? value : JSON.stringify(value));
        }
      } else {
        append(panel, 'p', raw || 'No RACI or source metadata published for this step.');
      }
    }
    if (!selected.length) append(panel, 'p', 'No process steps published.');
  }

  function fit() {
    if (!canvasElement.clientWidth || !canvasElement.clientHeight) return;
    fitMode = true;
    viewer.get('canvas').zoom('fit-viewport');
  }

  function focus(identifier) {
    const target = viewer.get('elementRegistry').get(identifier);
    if (!target) return fit();
    const width = canvasElement.clientWidth;
    const height = canvasElement.clientHeight;
    if (!width || !height) return;
    fitMode = false;
    viewer.get('canvas').viewbox({ x: target.x - Math.min(160, width / 4), y: target.y - 100, width, height });
  }

  function selectStep(identifier) {
    viewSelect.value = detailView;
    document.body.dataset.overview = 'false';
    const phase = phaseFor(steps.find(step => step.id === identifier));
    phaseSelect.value = phase ? `phase:${phase}` : 'full';
    stepSelect.value = identifier;
    document.getElementById('raci-toggle').checked = true;
    document.body.dataset.raci = 'true';
    focus(identifier);
    showDetails();
  }

  function inspect(result) {
    const registry = viewer.get('elementRegistry');
    const shapes = registry.getAll().filter(item => !item.labelTarget && !item.waypoints);
    const overflows = [];
    for (const shape of shapes) {
      if (!/Task$/.test(shape.type) && shape.type !== 'bpmn:Task' && shape.type !== 'bpmn:TextAnnotation') continue;
      const visual = registry.getGraphics(shape)?.querySelector('.djs-visual');
      for (const label of visual?.querySelectorAll('text') || []) {
        const box = label.getBBox();
        if (box.x < -3 || box.y < -3 || box.x + box.width > shape.width + 3 || box.y + box.height > shape.height + 3) overflows.push(shape.id);
      }
    }
    const report = { name: currentView, run_id: runId, warnings: result.warnings.map(warning => warning.message), rendered_shapes: shapes.length, label_overflows: overflows };
    window.renderReports = [report];
    return report;
  }

  async function refresh() {
    if (busy || disposed) return;
    busy = true;
    const requestedSelection = viewSelect.value;
    const requestedView = requestedSelection === 'overview' ? detailView : requestedSelection;
    try {
      const query = new URLSearchParams({ view: requestedView });
      if (processId) query.set('process_id', processId);
      const response = await fetch(`/api/pipeline/bpmn-runs/${encodeURIComponent(runId)}?${query}`, { cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `BPMN request failed (${response.status})`);
      }
      const xml = await response.text();
      if (disposed || requestedSelection !== viewSelect.value) return;
      if (xml !== currentXml || requestedView !== currentView) {
        const previousStep = stepSelect.value;
        const previousBox = currentXml && currentView === requestedView ? viewer.get('canvas').viewbox() : null;
        const result = await viewer.importXML(xml);
        if (disposed || requestedSelection !== viewSelect.value) return;
        currentXml = xml;
        currentView = requestedView;
        downloadButton.disabled = false;
        steps = viewer.get('elementRegistry').getAll().filter(element => !element.labelTarget && !element.waypoints && element.businessObject?.$instanceOf('bpmn:FlowNode') && !['bpmn:StartEvent', 'bpmn:EndEvent'].includes(element.type));
        stepSelect.replaceChildren(new Option('Whole diagram', ''), ...steps.map(step => new Option(`${step.id}: ${step.businessObject.name || step.id}`, step.id)));
        stepSelect.value = steps.some(step => step.id === previousStep) ? previousStep : '';
        const participant = viewer.get('elementRegistry').getAll().find(element => element.type === 'bpmn:Participant');
        heading.textContent = participant?.businessObject.name || processName;
        document.title = heading.textContent;
        updatePhases();
        showDetails();
        if (previousBox && !fitMode) viewer.get('canvas').viewbox(previousBox);
        else showScope();
        inspect(result);
      }
      const report = window.renderReports?.[0];
      const issues = (report?.warnings.length || 0) + (report?.label_overflows.length || 0);
      status.textContent = `${heading.textContent} | ${issues ? `${issues} rendering issues` : 'Current'} | Checked ${new Date().toLocaleTimeString()}`;
      window.renderError = null;
    } catch (error) {
      if (disposed) return;
      viewer.clear();
      currentXml = '';
      downloadButton.disabled = true;
      steps = [];
      stepSelect.replaceChildren(new Option('Whole diagram', ''));
      panel.replaceChildren();
      window.renderReports = [];
      const message = error.name === 'TimeoutError' ? 'The API did not respond in time. Check the API connection and refresh.' : error.message;
      window.renderError = message;
      status.textContent = message;
    } finally {
      busy = false;
      if (!disposed && requestedSelection !== viewSelect.value) refresh();
    }
  }

  viewer.on('canvas.viewbox.changed', event => {
    document.getElementById('zoom-level').textContent = `${Math.round(event.viewbox.scale * 100)}%`;
  });
  viewer.on('element.click', event => {
    const identifier = event.element.labelTarget?.id || event.element.id;
    if (steps.some(step => step.id === identifier)) selectStep(identifier);
  });
  viewSelect.addEventListener('change', () => {
    if (viewSelect.value === 'overview') phaseSelect.value = 'overview';
    else {
      detailView = viewSelect.value;
      if (phaseSelect.value === 'overview') phaseSelect.value = 'full';
    }
    document.body.dataset.overview = String(viewSelect.value === 'overview');
    viewer.clear();
    currentXml = '';
    downloadButton.disabled = true;
    steps = [];
    panel.replaceChildren();
    stepSelect.replaceChildren(new Option('Whole diagram', ''));
    status.textContent = 'Loading';
    fitMode = true;
    refresh();
  });
  phaseSelect.addEventListener('change', () => {
    viewSelect.value = phaseSelect.value === 'overview' ? 'overview' : detailView;
    stepSelect.value = '';
    if (currentXml) showScope();
    else refresh();
  });
  stepSelect.addEventListener('change', () => {
    if (stepSelect.value) selectStep(stepSelect.value);
    else if (currentXml) showScope();
  });
  document.getElementById('fit').addEventListener('click', () => {
    document.getElementById('raci-toggle').checked = false;
    document.body.dataset.raci = 'false';
    stepSelect.value = '';
    phaseSelect.value = viewSelect.value === 'overview' ? 'overview' : 'full';
    fit();
    showDetails();
  });
  document.getElementById('actual-size').addEventListener('click', () => {
    const identifier = stepSelect.value || scopeSteps()[0]?.id;
    if (identifier) selectStep(identifier);
  });
  for (const [identifier, factor] of [['zoom-in', 1.4], ['zoom-out', 1 / 1.4]]) {
    document.getElementById(identifier).addEventListener('click', () => {
      if (!currentXml) return;
      fitMode = false;
      const canvas = viewer.get('canvas');
      canvas.zoom(Math.min(5, Math.max(0.02, canvas.zoom() * factor)));
    });
  }
  document.getElementById('raci-toggle').addEventListener('change', event => {
    if (event.target.checked && viewSelect.value === 'overview') {
      viewSelect.value = detailView;
      phaseSelect.value = 'full';
      document.body.dataset.overview = 'false';
    }
    document.body.dataset.raci = String(event.target.checked);
  });
  canvasElement.addEventListener('pointerdown', () => { fitMode = false; });
  canvasElement.addEventListener('wheel', () => { fitMode = false; }, { passive: true });
  const observer = new ResizeObserver(() => {
    if (!currentXml || busy) return;
    viewer.get('canvas').resized();
    if (fitMode) showScope();
  });
  observer.observe(canvasElement);
  const timer = setInterval(() => { if (!document.hidden) refresh(); }, 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('pagehide', () => {
    disposed = true;
    controller.abort();
    clearInterval(timer);
    observer.disconnect();
    viewer.destroy();
  }, { once: true });
  refresh();
})();