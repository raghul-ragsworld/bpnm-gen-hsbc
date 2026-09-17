'use client';

import { AlertCircle, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

type BusinessProcess = { process_id: string; process_name: string };
type StepReview = {
  process_id: string;
  changed_steps: number;
  change_count: number;
  changes: { step_id: string; template_id: string; step_name: string; field: string; before: string; after: string; basis: string }[];
  decisions: string[];
  quality: {
    source_score: number | null;
    path: string;
    components: { component: string; passed: number; total: number; score: number | null }[];
    critical_gaps: string[];
    gates: Record<string, { status: string; reason: string }>;
    direct_coverage: { passed: number; total: number };
  };
  validation: { checks: { check: string; passed: number | null; total: number | null; status: string }[] } | null;
};

export function BusinessProcessWorkspace() {
  const [processes, setProcesses] = useState<BusinessProcess[]>([]);
  const [selectedId, setSelectedId] = useState('sample');
  const [review, setReview] = useState<StepReview | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadProcesses() {
      try {
        const response = await fetch('/api/normalized-bpmn', { cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
        const body = await response.json();
        if (!response.ok) throw new Error(body.detail || 'Business processes unavailable');
        if (!Array.isArray(body.processes) || !body.processes.every((process: BusinessProcess) => process && typeof process.process_id === 'string' && typeof process.process_name === 'string')) throw new Error('Invalid business process catalog');
        if (!controller.signal.aborted) {
          setProcesses(body.processes);
          setError(null);
        }
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Business processes unavailable');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadProcesses();
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    if (selectedId === 'sample' || !selectedId) return;
    const controller = new AbortController();
    async function loadReview() {
      try {
        const response = await fetch(`/api/normalized-bpmn?${new URLSearchParams({ process_id: selectedId, review: '1' })}`, { cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
        const body = await response.json();
        if (!response.ok) throw new Error(body.detail || 'Step changes unavailable');
        if (!controller.signal.aborted) setReview(body);
      } catch (reason) {
        if (!controller.signal.aborted) setReviewError(reason instanceof Error ? reason.message : 'Step changes unavailable');
      }
    }
    loadReview();
    return () => controller.abort();
  }, [selectedId, refresh]);

  const selected = processes.find(process => process.process_id === selectedId);
  const sample = selectedId === 'sample';
  const renderer = sample ? '/onboarding/renderer.html' : selected ? `/onboarding/renderer.html?${new URLSearchParams({ normalized: selected.process_id, name: selected.process_name })}` : null;
  const currentReview = review?.process_id === selectedId ? review : null;

  return (
    <section className="bpmn-workspace" aria-label="Business process workspace">
      <div className="bpmn-source-toolbar">
        <label className="bpmn-run-label">Business process
          <select aria-label="Business process" value={selectedId} onChange={event => { setSelectedId(event.target.value); setReview(null); setReviewError(null); }}>
            <option value="">{loading ? 'Loading business processes...' : 'Select a business process'}</option>
            <option value="sample">Sample Process Onboarding</option>
            {processes.map(process => <option key={process.process_id} value={process.process_id}>{process.process_name}</option>)}
          </select>
        </label>
        <button className="icon-command" title="Refresh business processes" aria-label="Refresh business processes" onClick={() => { setReview(null); setReviewError(null); setRefresh(value => value + 1); }}><RotateCcw /></button>
      </div>
      {error && <p className="inline-error bpmn-source-error" role="alert"><AlertCircle />{error}</p>}
      {renderer && <details className="step-change-review">
        <summary>Step changes {sample ? ': fixed sample baseline' : currentReview ? `: ${currentReview.change_count} changes across ${currentReview.changed_steps} steps` : reviewError ? ': unavailable' : ': loading...'}</summary>
        {sample ? <p>Sample Process Onboarding is the fixed workflow baseline. No new step-data changes have been applied.</p> : <>
          <p className="review-basis">Proposed working model. Original source records are preserved; responsibility candidates and revised routing are not approved business facts.</p>
          {reviewError && <p role="alert">{reviewError}</p>}
          {currentReview && <>
            <p><strong>Source quality: {currentReview.quality.source_score ?? 'Not verified'}{currentReview.quality.source_score !== null && '%'} | {currentReview.quality.path === 'repair' ? 'Repair required' : 'Prediction eligible'}</strong></p>
            <div className="step-review-table" tabIndex={0} role="region" aria-label="Source quality and validation">
              <table><thead><tr><th>Check</th><th>Passed / Applicable</th><th>Status</th></tr></thead><tbody>
                {currentReview.quality.components.map(item => <tr key={item.component}><th>{item.component}</th><td>{item.passed} / {item.total}</td><td>{item.score === null ? 'NOT VERIFIED' : `${item.score.toFixed(2)}%`}</td></tr>)}
                <tr><th>Direct source-step coverage</th><td>{currentReview.quality.direct_coverage.passed} / {currentReview.quality.direct_coverage.total}</td><td>NOT MAPPED</td></tr>
                {currentReview.validation?.checks.map(item => <tr key={item.check}><th>{item.check}</th><td>{item.total === null ? 'Not measured' : `${item.passed} / ${item.total}`}</td><td>{item.status}</td></tr>)}
              </tbody></table>
            </div>
            {!currentReview.validation && <p>Artifact validation: NOT RUN or stale.</p>}
            <ul>{Object.entries(currentReview.quality.gates).map(([name, gate]) => <li key={name}><strong>{name}: {gate.status}.</strong> {gate.reason}</li>)}</ul>
            <ul>{currentReview.quality.critical_gaps.map(gap => <li key={gap}>{gap}</li>)}</ul>
            <div className="step-review-table" tabIndex={0} role="region" aria-label="Step changes before and after">
              <table><thead><tr><th>Step</th><th>Field</th><th>Before</th><th>After</th><th>Basis</th></tr></thead>
                <tbody>{currentReview.changes.map((change, index) => <tr key={`${change.step_id}:${index}`}>
                  <th scope="row" title={change.step_name}>{change.step_id}<small>{change.template_id}</small></th>
                  <td>{change.field}</td><td>{change.before || 'Not specified'}</td><td>{change.after || 'Not specified'}</td><td>{change.basis}</td>
                </tr>)}</tbody>
              </table>
            </div>
            <ul>{currentReview.decisions.map(decision => <li key={decision}>{decision}</li>)}</ul>
          </>}
        </>}
      </details>}
      {renderer ? <iframe key={`${renderer}:${refresh}`} className="onboarding-renderer" src={renderer} title={`${sample ? 'Sample Process Onboarding' : selected?.process_name} business process`} />
        : <div className="empty-diagram"><strong>{loading ? 'Loading business processes...' : error ? 'Business processes unavailable' : 'Select a business process'}</strong></div>}
    </section>
  );
}