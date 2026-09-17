# BPMN Generator

Standalone local repository extracted on 2026-09-17 from the Latest process
onboarding project. Original projects and source files are unchanged. No remote,
commit, deployment, cloud connector, or Python API is required to run the web UI.

## Run

Requires Node.js 22 or later and npm. From this repository:

```powershell
cd web
npm ci
npm run dev
```

Open http://127.0.0.1:3010. The first screen is Business process, with the unchanged
Sample Process Onboarding, 20 process choices, and a consolidated Step changes
and quality report. The old project's server can keep running on port 3000.

## Share With A Colleague

The localhost URL only works on the machine running the server. To run a separate
copy, install Git and Node.js 22 or later, then run:

```powershell
git clone https://github.com/raghul-ragsworld/bpnm-gen-hsbc.git BPMN-Generator
cd BPMN-Generator/web
npm ci
npm run dev
```

Then open http://127.0.0.1:3010 on that machine. The repository includes committed
source and artifacts, not installed dependencies or environment files. Private
repository access must be granted separately. No Python API is needed.
On Windows with Edge, run `npm run validate:workflows` to
refresh evidence for the new location; until then, the quality report may show
artifact validation as stale. The VS Code run task uses `npm` from PATH.

## Validate

From `web`:

```powershell
npm run test:workflows
npm run typecheck
npm run lint
npm run validate:workflows
```

Full XML validation requires Windows PowerShell 5.1 and Microsoft Edge. Official
OMG schemas are cached under `web/workflow/schema`; missing schemas are downloaded
and hash-checked. Reports and generated XML are in
[web/workflow/evidence/summary.md](web/workflow/evidence/summary.md).
Regenerate reports after moving the repository or changing source/generator
dependencies. Copied reports are not new validation certificates.

Source quality, source preservation, proposed activity coverage, technical XML
validity, visual acceptance, and independent business accuracy are separate.
Technology and Combined remain gated on supported mappings and component checks.
Missing, stale, failed, or unrun applicable checks cannot unlock Combined.

## Contents

- `web/lib/`: canonical workflow graph, generation, quality gates, evidence freshness,
  and the retained legacy template generator.
- `web/app/api/normalized-bpmn/`: local catalog, navigation, quality and XML endpoint.
- `web/public/onboarding/`: fixed sample XML, renderer, navigation and viewer assets.
- `web/data/` and `web/workflow/`: normalized source, proposed workflows, schemas,
  XML artifacts, screenshots and validation reports.
- [docs/BusinessRequiremnts.md](docs/BusinessRequiremnts.md) and
  [docs/Process_Specific_Steps_Proposed.md](docs/Process_Specific_Steps_Proposed.md):
  retained requirements and provenance; older application/deployment sections are
  historical context, not standalone capabilities.
- [.github/agents/bpnm-generator.agent.md](.github/agents/bpnm-generator.agent.md):
  single VS Code agent instructions, not an AI service inside the website.
- `generate_onboarding.py`, `normalize_process_workbook.py`,
  `test_normalize_process_workbook.py`, and `repair_bpmn_for_drawio.py`: retained
  sample generation, workbook normalization and draw.io utilities.
- `onboarding_bpmn/`, `synthetic_process_data/`, root BPMN/draw.io files and
  `parsed_process_data.json`: preserved sample/source artifacts.

The unrelated Pipeline/Data agent UI, Azure infrastructure, backend services,
environment secrets, original Git history, node_modules and build caches were
not extracted. The bundled live-renderer adapter is retained for asset integrity;
its external pipeline-run mode is not supported by this standalone app.

## Refresh Inputs

Only run these when intentionally updating the corresponding snapshot, from `web`:

```powershell
node scripts/sync-normalized.mjs ../synthetic_process_data
npm run sync:workflows
npm run validate:workflows
```

`npm run sync:bpmn -- ../onboarding_bpmn` refreshes bundled sample assets while
preserving the integrated renderer. Do not overwrite the fixed sample casually.

Optional legacy Python utilities require Python 3.12 and
`python -m pip install -r requirements.txt` from the repository root. Normalization
accepts `--source` for an original workbook; its normalized output is not a
substitute for the original input. Historical source paths embedded in provenance
are retained as evidence, not used as runtime dependencies.

Dependency audit findings inherited from the source project must be reviewed
before production use. This repository is a local descriptive BPMN tool, not an
approved executable banking workflow.