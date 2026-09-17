# Sample Process Onboarding (AOB-PR-1001)

## Deliverables

All three views share one control-flow model. Each XML contains a single process pool,
the same 29 source step IDs, full BPMN DI, and embedded source documentation.

| View | BPMN | SVG | Flow nodes | Gateways | Sequence flows | Lanes |
|---|---|---|---:|---:|---:|---:|
| People - Human responsibilities and process | [diagram1_people.bpmn](diagram1_people.bpmn) | [diagram1_people.svg](diagram1_people.svg) | 56 | 18 | 63 | 10 |
| Technology - Applications and process | [diagram2_technology.bpmn](diagram2_technology.bpmn) | [diagram2_technology.svg](diagram2_technology.svg) | 56 | 18 | 63 | 8 |
| Combined - People, applications and process | [diagram3_combined.bpmn](diagram3_combined.bpmn) | [diagram3_combined.svg](diagram3_combined.svg) | 56 | 18 | 63 | 10 |

## Overview And Phase Views

[Interactive viewer](renderer.html) | [Overview BPMN](overview.bpmn) | [Overview SVG](overview.svg)

The five collapsed overview subprocesses are a non-executable summary abstraction, not executable definitions.
Pass enters Checker (AOB-020); issues enter Remediation (AOB-019). These are alternative paths,
not a requirement to remediate every case. Corrected records return to validation. Approval resolved
includes the authorized timeout-review route. Retry exhaustion and remediation breach remain terminal outcomes.
Detailed diagrams remain authoritative for retry counts, timers, parallel branches and source conditions.

Each phase file retains the full original process XML unchanged, but contains partial DI showing the phase
and adjacent boundary context. It is a projection, not a standalone executable subprocess. Hidden nodes
and flows remain in the XML; missing boundary connectors in the picture do not imply process completion.
Phase DI retains responsibility annotations for People/Combined and application annotations for Technology/Combined.
BDE objects are omitted from phase DI only; full-view DI and source documentation retain them.
The viewer opens detailed views at their first task at readable zoom; Fit all shows the entire projection.
The overview fits the available screen; the phase selector provides access to all phases.

| Phase | Steps | People BPMN / SVG | Technology BPMN / SVG | Combined BPMN / SVG |
|---|---|---|---|---|
| Intake | AOB-001 to AOB-004 | [BPMN](diagram1_people_intake.bpmn) / [SVG](diagram1_people_intake.svg) | [BPMN](diagram2_technology_intake.bpmn) / [SVG](diagram2_technology_intake.svg) | [BPMN](diagram3_combined_intake.bpmn) / [SVG](diagram3_combined_intake.svg) |
| Approval & Draft | AOB-005 to AOB-007 | [BPMN](diagram1_people_approval.bpmn) / [SVG](diagram1_people_approval.svg) | [BPMN](diagram2_technology_approval.bpmn) / [SVG](diagram2_technology_approval.svg) | [BPMN](diagram3_combined_approval.bpmn) / [SVG](diagram3_combined_approval.svg) |
| Ingestion & Validation | AOB-008 to AOB-018 | [BPMN](diagram1_people_validation.bpmn) / [SVG](diagram1_people_validation.svg) | [BPMN](diagram2_technology_validation.bpmn) / [SVG](diagram2_technology_validation.svg) | [BPMN](diagram3_combined_validation.bpmn) / [SVG](diagram3_combined_validation.svg) |
| Remediation & Checker | AOB-019 to AOB-020 | [BPMN](diagram1_people_controls.bpmn) / [SVG](diagram1_people_controls.svg) | [BPMN](diagram2_technology_controls.bpmn) / [SVG](diagram2_technology_controls.svg) | [BPMN](diagram3_combined_controls.bpmn) / [SVG](diagram3_combined_controls.svg) |
| Publication & Completion | AOB-021 to AOB-029 | [BPMN](diagram1_people_publication.bpmn) / [SVG](diagram1_people_publication.svg) | [BPMN](diagram2_technology_publication.bpmn) / [SVG](diagram2_technology_publication.svg) | [BPMN](diagram3_combined_publication.bpmn) / [SVG](diagram3_combined_publication.svg) |

## Technology Capabilities

Eight capability lanes consolidate tools without asserting that different products are the same system.
Source application strings are preserved. Missing application assignments are explicitly proposed, not verified hosting.

| Capability lane | Source or proposed application assignments |
|---|---|
| Request & Workflow | Azure DevOps Boards; Azure DevOps Boards + Power Automate (notifications); Power Automate + SharePoint(BRD: Template Builder) |
| Workflow Orchestration | Power Automate (proposed orchestration) |
| Integration & Delivery | Azure API Management + Azure Functions → Azure Synapse/Databricks; Azure Service Bus; Azure Storage SFTP / Azure API Management + Azure Functions |
| Data Platform | Azure Data Lake Storage (Landing); Azure Data Lake Storage (Onboarding Master) |
| ServiceNow | ServiceNow |
| Data Quality | Microsoft Purview – Data Quality(BRD: DQ Engine) |
| External Data / Consumers | Bloomberg / Market Data Feed(BRD: DDT / External Consumer A) |
| Reporting | Power BI |

## Verification

- XML validated using the official OMG BPMN20.xsd and its imported schemas.
- Source IDs AOB-001 through AOB-029 occur exactly once per view.
- Every task/subprocess has one incoming and one outgoing sequence flow.
- Every gateway exit is labelled; event-based exits lead to message catch events.
- Every boundary timer attaches to an activity, not a gateway.
- No sequence flow crosses process/subprocess scope or the pool boundary.
- Geometry checks cover shape/label overlap, connector/shape intersections, 20px grid,
  nonempty lanes, lane containment, backward loop routing, and evenly spaced parallel task rows.
- Intentional containment (pool/lane/subprocess) and timer attachment are not collisions.
- Cross-lane connectors may cross other connectors; such crossings are not BPMN junctions.
- See render_validation.json for actual bpmn-js import/export and rendered bounds checks.
- Models are descriptive (isExecutable=false). Natural-language conditions preserve source meaning;
  no engine-specific variables, retry implementation, or runtime expression bindings are invented.

## Source And Approved Decisions

Source: ../parsed_process_data.json. User confirmed exclusion of every row containing [added].
Remaining table sizes: Process Ste Data: 76, Process Step Detail: 62, Process Step: 29, Process: 1.
The original file is preserved. Existing BPMN/draw.io files are also unchanged.

- User approved an expanded approval-wait subprocess enclosing event-based gateway AOB-006,
  with an interrupting PT24H boundary timer. Approve/Reject/Withdraw are competing message catches.
  Subprocess outcomes route through an explicit XOR; reject/withdraw ends the case.
- The timeout goes to the explicitly requested Ops Lead ServiceNow review, then AOB-007 after resolution.
  Its accountable party is not specified and is labelled as an open item.
- User approved immediate parking after escalation for an AOB-019 SLA breach.
  The timer represents urgent=4h/standard=24h; attempt exhaustion uses a separate XOR, not a timer.
- User approved omitting unused lanes, retaining explicit R owners, and consolidating technology into
  eight capability lanes. Composite source system strings remain intact; no arbitrary primary tool was selected.
- People/Combined lanes use normalized human teams: Integration Team, Data Platform Team and Service Management Team.
  SNOW and ServiceNow RACI references both map to Service Management Team; ServiceNow remains the application.
  Original owners and full source RACI remain in task documentation and source_raci.md.
  See [normalized_raci.md](normalized_raci.md) and [normalized_model.json](normalized_model.json) for adjusted assignments and assumptions.
- People/Combined lanes consolidate Onboarding Ops with Maker, and Process Ops DQ/Controls with Checker.
  Maker and Checker remain distinct duties; shared lanes identify teams, not individual staff.
  See [source_raci.md](source_raci.md) for all 29 steps, both source variants, and consolidation evidence.
- No Power BI Service lane is fabricated: the retained source says Power BI only.
- People uses generic BPMN tasks and uniform task color, without application or execution-type annotations.
  Technology uses capability lanes and application annotations; Combined uses human lanes plus application annotations.
- Missing application rows do not prove manual execution. Proposed hosting uses Power Automate orchestration,
  except AOB-010 (ServiceNow), AOB-023 (the existing integration stack), and AOB-027 (the master data store).
  All proposals require confirmation. Hosting does not imply automatic execution.
- Technology/Combined use service tasks for source-backed integration/platform execution and user tasks otherwise.
  Task types are descriptive assumptions; AOB-012/013 remain user tasks based on their human R owners.
- AOB-001 and AOB-029 are the requested start/success end events; their original task descriptions
  and BDE transformations are retained in documentation, not converted into hidden executable work.
- Supplemental merge gateways preserve the requested one-in/one-out task degree.
  AOB-023 remains a source step followed by a structural AND split; an AND join precedes AOB-027.
- Retry <=2 means next retry number <=2, so at most two retries are allowed.
- Loop/SLA rows do not imply an additional intermediate delay. Timers are represented once,
  by the approved boundary events, to avoid inventing waits or delaying remediation.

## Open Data Items

No Application row: AOB-003, AOB-004, AOB-005, AOB-006, AOB-010, AOB-011, AOB-014, AOB-015, AOB-016, AOB-017, AOB-018, AOB-019, AOB-020, AOB-023, AOB-027.

No PSDATA row: AOB-003, AOB-005, AOB-011, AOB-024, AOB-025, AOB-026.

These steps have no BDE data-object annotation. Data objects for mapped tasks carry all source/target
and transformation rows in documentation. Mapped gateways/events retain them in their own documentation.

AOB-020 specifies checker approval before publication, but no rejected-checker destination; none is invented.
The rejection outcome remains a source-data open item. Publication is labelled 'Checker approval required'.

AOB-014 consumes 'Enriched Record' in its step row, but the prescribed AND split runs it concurrently
with enrichment AOB-013. The control flow follows the explicit requirement; the data dependency needs clarification.

Application strings with '/' or chained systems are retained within capability lanes. Whether they represent
alternatives, transport hops, or multiple executors is not resolved by the source.

SLA duration selection and exception/approval persistence are descriptive, not deployment-ready expressions.

## Step Traceability

| ID | Step | Owner | RACI | Application |
|---|---|---|---|---|
| AOB-001 | Submit onboarding request | Requestor (Client Service) | R=Requestor, A=Business Approver, C=Onboarding Ops, I=Process Ops | Azure DevOps Boards |
| AOB-002 | Triage and classify | Onboarding Ops (Maker) | R=Maker, A=Ops Lead, C=Process Ops, I=Requestor | Azure DevOps Boards |
| AOB-003 | Completeness gateway | Process Ops (DQ & Controls) | R=Process Ops, A=Ops Lead, C=Maker, I=Requestor | OPEN: no Application row |
| AOB-004 | Request clarification (fail path) | Onboarding Ops (Maker) | R=Maker, A=Ops Lead, C=Process Ops, I=Requestor | OPEN: no Application row |
| AOB-005 | Business approval | Business Approver | R=Approver, A=Approver Lead, C=Requestor, I=Ops | OPEN: no Application row |
| AOB-006 | Approval event gateway | Business Approver | R=Approver, A=Approver Lead, C=Ops Lead, I=ServiceNow / R=Approver, A=Approver Lead, C=ServiceNow, I=Requestor | OPEN: no Application row |
| AOB-007 | Create onboarding draft | Onboarding Ops (Maker) | R=Maker, A=Ops Lead, C=Data Steward, I=Process Ops | Power Automate + SharePoint(BRD: Template Builder) |
| AOB-008 | Package for ingestion | Integration Layer | R=Integration, A=Integration Lead, C=Maker, I=Platform | Azure Storage SFTP / Azure API Management + Azure Functions |
| AOB-009 | Ingest to landing | Data Platform | R=Platform, A=Platform Lead, C=Integration, I=Process Ops | Azure Data Lake Storage (Landing) |
| AOB-010 | Technical error handling | Service Management (ServiceNow Team) | R=SNOW, A=Platform Lead, C=Integration, I=Ops Lead | OPEN: no Application row |
| AOB-011 | Parallel validations start | Data Platform | R=Platform, A=Platform Lead, C=Process Ops, I=Data Steward | OPEN: no Application row |
| AOB-012 | Execute DQ ruleset | Process Ops (DQ & Controls) | R=Process Ops, A=DQ Lead, C=Maker, I=Data Steward | Microsoft Purview – Data Quality(BRD: DQ Engine) |
| AOB-013 | Reference enrichment | Data Steward (Reference Data) | R=Steward, A=Data Owner, C=Process Ops, I=Maker | Azure Data Lake Storage (Landing) |
| AOB-014 | Duplicate detect & merge decision | Process Ops (DQ & Controls) | R=Process Ops, A=DQ Lead, C=Steward, I=Ops | OPEN: no Application row |
| AOB-015 | Validation join | Data Platform | R=Platform, A=Platform Lead, C=Process Ops, I=Data Steward | OPEN: no Application row |
| AOB-016 | Conditional SPECIALIST checks | Process Ops (DQ & Controls) | R=Process Ops, A=Ops Lead, C=Process SPECIALIST, I=Requestor | OPEN: no Application row |
| AOB-017 | Process SPECIALIST review (conditional) | Process SPECIALIST | R=Process SPECIALIST, A=Tax Lead, C=Maker, I=Process Ops | OPEN: no Application row |
| AOB-018 | DQ pass gateway | Process Ops (DQ & Controls) | R=Process Ops, A=DQ Lead, C=Maker, I=Ops Lead | OPEN: no Application row |
| AOB-019 | Remediation loop | Onboarding Ops (Maker) | R=Maker, A=Ops Lead, C=Process Ops, I=Requestor | OPEN: no Application row |
| AOB-020 | Maker-checker (4-eye) | Process Ops (Checker) | R=Checker, A=Ops Lead, C=Data Owner, I=Requestor | OPEN: no Application row |
| AOB-021 | Publish to onboarding master | Data Platform | R=Platform, A=Data Product Owner, C=Process Ops, I=Downstream Systems | Azure Data Lake Storage (Onboarding Master) |
| AOB-022 | Write controls & DQ metrics | Data Platform | R=Platform, A=Data Product Owner, C=Process Ops, I=DQ Dashboard | Azure Data Lake Storage (Onboarding Master) |
| AOB-023 | Distribute to Downstream Systems (transaction) | Integration Layer | R=Integration, A=Integration Lead, C=Platform, I=Downstream Systems / R=Integration, A=Integration Lead, C=Platform, I=Process Ops | OPEN: no Application row |
| AOB-024 | Publish to DDT | Integration Layer | R=Integration, A=Integration Lead, C=Platform, I=Downstream Systems | Bloomberg / Market Data Feed(BRD: DDT / External Consumer A) |
| AOB-025 | Publish to Portfolio Analytics Platform | Integration Layer | R=Integration, A=Integration Lead, C=Platform, I=Downstream Systems | Azure API Management + Azure Functions → Azure Synapse/Databricks |
| AOB-026 | Publish to Client Reporting Hub topic | Integration Layer | R=Integration, A=Integration Lead, C=Platform, I=Downstream Systems | Azure Service Bus |
| AOB-027 | Record publication events | Data Platform | R=Platform, A=Product Owner, C=Integration, I=Process Ops | OPEN: no Application row |
| AOB-028 | Update DQ dashboard | Data Platform | R=Platform, A=Data Product Owner, C=Process Ops, I=Ops Lead | Power BI |
| AOB-029 | Notify completion | Onboarding Ops | R=Ops, A=Ops Lead, C=Integration, I=Requestor | Azure DevOps Boards + Power Automate (notifications) |

## Source BDE Mappings

| Step | PSDATA ID | Source/Target | BDE | Transformation |
|---|---|---|---|---|
| AOB-001 | PSDATA-AOB-001-01 | Source | Process Code | Trim; enforce pattern; reject invalid chars |
| AOB-001 | PSDATA-AOB-001-02 | Source | Process Country | Accept ISO2 or full name; store raw + parsed |
| AOB-001 | PSDATA-AOB-001-03 | Source | Process Currency | Accept ISO4217; store raw + parsed |
| AOB-001 | PSDATA-AOB-001-04 | Source | Process Name | Capture as submitted; defer normalisation to draft creation |
| AOB-001 | PSDATA-AOB-001-05 | Source | Process Open Date | Parse to date; reject invalid formats |
| AOB-001 | PSDATA-AOB-001-06 | Source | Process Status | Validate in allowed list if present at intake |
| AOB-001 | PSDATA-AOB-001-07 | Source | Process Teams | Capture team list as submitted |
| AOB-001 | PSDATA-AOB-001-08 | Source | Process Type | Capture if provided |
| AOB-001 | PSDATA-AOB-001-09 | Source | Process Identifier | If provided, capture and validate basic format; otherwise allow null |
| AOB-001 | PSDATA-AOB-001-10 | Source | Process Model | Capture if provided; no transformation at intake |
| AOB-001 | PSDATA-AOB-001-11 | Source | Owning Organisation Unit ID | Capture if provided; validate legal entity code format if supplied |
| AOB-001 | PSDATA-AOB-001-12 | Source | Process Closed Date | Parse to date if provided; allow null for open Process |
| AOB-001 | PSDATA-AOB-001-13 | Source | Process Level | Capture hierarchy level as submitted |
| AOB-001 | PSDATA-AOB-001-14 | Target | Tracking ID (Correlation ID) | Generate unique ID at intake; persist across all artefacts/events |
| AOB-001 | PSDATA-AOB-001-15 | Source | Supporting Evidence References | Enforce non-empty list requirement at completeness gateway |
| AOB-002 | PSDATA-AOB-002-01 | Target | Route Classification | Apply routing tag (e.g., FD/SA) based on ticket content/ops rules |
| AOB-002 | PSDATA-AOB-002-02 | Target | Urgency | Set urgent/standard; drives SLA and escalation paths |
| AOB-002 | PSDATA-AOB-002-03 | Target | SLA Target | Set SLA targets (approval timeout 24h; remediation urgent 4h/standard 24h) |
| AOB-004 | PSDATA-AOB-004-01 | Target | Missing-field Reason Codes | Populate standard reason codes and free-text resubmission instructions |
| AOB-006 | PSDATA-AOB-006-01 | Target | Approval Outcome | Record approve/reject/withdraw/timeout outcome against Tracking ID |
| AOB-006 | PSDATA-AOB-006-02 | Target | Approval Timestamp | Stamp timestamp of approval outcome (timeout uses timer firing time) |
| AOB-007 | PSDATA-AOB-007-01 | Target | Draft Version | Initialise v1; increment on remediation cycles |
| AOB-007 | PSDATA-AOB-007-02 | Target | Change Log | Create structured change log entry for draft creation |
| AOB-007 | PSDATA-AOB-007-03 | Target | Process Name | Normalise whitespace; max length enforcement |
| AOB-007 | PSDATA-AOB-007-04 | Target | Process Model | Standardise servicing model to approved value set |
| AOB-007 | PSDATA-AOB-007-05 | Target | Owning Organisation Unit ID | Standardise legal/booking entity code to canonical format |
| AOB-007 | PSDATA-AOB-007-06 | Target | Process Level | Standardise hierarchy level representation |
| AOB-008 | PSDATA-AOB-008-01 | Target | Ingestion Checksum | Compute checksum for package payload/file |
| AOB-008 | PSDATA-AOB-008-02 | Target | Encryption Marker | Mark package as encrypted; include method/flag in metadata |
| AOB-008 | PSDATA-AOB-008-03 | Source | Tracking ID (Correlation ID) | Embed into payload headers/metadata for end-to-end replay/idempotency |
| AOB-009 | PSDATA-AOB-009-01 | Target | Schema Validation Status | Set PASS/FAIL based on landing schema validation |
| AOB-009 | PSDATA-AOB-009-02 | Target | Schema Validation Errors | Capture error details when validation fails |
| AOB-010 | PSDATA-AOB-010-01 | Target | Exception Case ID | Create ServiceNow incident and store reference against Tracking ID |
| AOB-010 | PSDATA-AOB-010-02 | Target | Retry Count | Increment per retry attempt; cap at 2 |
| AOB-010 | PSDATA-AOB-010-03 | Target | Parked Status | If retries exhausted, set "Parked – Technical" |
| AOB-012 | PSDATA-AOB-012-01 | Target | DQ Rule Failures | Persist failed rule IDs, field-level failures, severities |
| AOB-012 | PSDATA-AOB-012-02 | Target | Process Open Date | Must be ≤ today; must be ≤ Process Closed Date if present |
| AOB-012 | PSDATA-AOB-012-03 | Target | Process Closed Date | If present, must be ≥ Process Open Date |
| AOB-012 | PSDATA-AOB-012-04 | Target | Process Code | Validate format and uniqueness constraints per ruleset |
| AOB-012 | PSDATA-AOB-012-05 | Target | Process Identifier | If present, validate format only; uniqueness checked after generation at publish |
| AOB-012 | PSDATA-AOB-012-06 | Target | Process Status | Validate against allowed lifecycle status values |
| AOB-013 | PSDATA-AOB-013-01 | Target | Enrichment Applied Flag | Set TRUE once all reference lookups performed successfully |
| AOB-013 | PSDATA-AOB-013-02 | Target | Process Currency | Validate ISO4217; default from billing entity if missing |
| AOB-013 | PSDATA-AOB-013-03 | Target | Process Country | Standardise to approved country reference set |
| AOB-013 | PSDATA-AOB-013-04 | Target | Process Teams | Standardise team codes to approved reference set |
| AOB-014 | PSDATA-AOB-014-01 | Target | Merge Outcome | Fuzzy match; survivorship rules; output merge/reject/proceed with notes |
| AOB-015 | PSDATA-AOB-015-01 | Source | DQ Rule Failures | Consolidate DQ outputs into Validated Draft |
| AOB-015 | PSDATA-AOB-015-02 | Source | Enrichment Applied Flag | Carry enrichment completion status into Validated Draft |
| AOB-015 | PSDATA-AOB-015-03 | Source | Merge Outcome | Carry duplicate/merge decision into Validated Draft |
| AOB-015 | PSDATA-AOB-015-04 | Source | Tracking ID (Correlation ID) | Preserve Tracking ID across consolidated validation outputs |
| AOB-015 | PSDATA-AOB-015-05 | Target | Tax Review Basis | Derive TRUE when Process Status=TAXABLE OR Process Type in tax-review list; else FALSE |
| AOB-016 | PSDATA-AOB-016-01 | Source | Tax Review Basis | Evaluate explicit tax-review trigger basis |
| AOB-016 | PSDATA-AOB-016-02 | Target | Specialist Review Required Flag | Set TRUE/FALSE based on gateway rule evaluation |
| AOB-017 | PSDATA-AOB-017-01 | Source | Tax Review Basis | Present derived tax-review trigger context to SPECIALIST |
| AOB-017 | PSDATA-AOB-017-02 | Target | Specialist Review Outcome | Record SPECIALIST Approved vs Correction Required |
| AOB-018 | PSDATA-AOB-018-01 | Source | DQ Rule Failures | Evaluate DQ failures presence/severity threshold for pass/fail |
| AOB-018 | PSDATA-AOB-018-02 | Source | Merge Outcome | Fail if outcome requires remediation |
| AOB-018 | PSDATA-AOB-018-03 | Source | Specialist Review Outcome | Fail if SPECIALIST correction required (when flag=TRUE) |
| AOB-019 | PSDATA-AOB-019-01 | Target | Remediation Attempt Count | Increment per loop; cap at 3; breach triggers escalation |
| AOB-019 | PSDATA-AOB-019-02 | Target | Change Log | Append remediation corrections and rationale |
| AOB-020 | PSDATA-AOB-020-01 | Target | Process Teams | Validate team code list; checker may correct; log in Change Log |
| AOB-020 | PSDATA-AOB-020-02 | Target | Change Log | Append checker edits, approval/rejection rationale, audit trail |
| AOB-020 | PSDATA-AOB-020-03 | Target | Approval Outcome | Record checker approval/rejection outcome for downstream publish control |
| AOB-021 | PSDATA-AOB-021-01 | Target | Lineage ID (lineage_id) | Stamp lineage identifier at publish |
| AOB-021 | PSDATA-AOB-021-02 | Target | Published Timestamp (published_ts) | Stamp publish timestamp at publish |
| AOB-021 | PSDATA-AOB-021-03 | Target | Process Identifier | Generate during publish/mastering; persist to master; link to Tracking ID |
| AOB-022 | PSDATA-AOB-022-01 | Target | DQ Score | Compute weighted score from rule severities |
| AOB-022 | PSDATA-AOB-022-02 | Target | Approval Outcome | Persist approval/control outcome history for reporting |
| AOB-022 | PSDATA-AOB-022-03 | Target | Remediation Attempt Count | Persist remediation loop count for controls reporting |
| AOB-023 | PSDATA-AOB-023-01 | Source | Tracking ID (Correlation ID) | Attach as idempotency key for consumer deliveries and replay |
| AOB-023 | PSDATA-AOB-023-02 | Source | Onboarding Master Record | Read master record; map outbound consumer payloads for in-scope attributes |
| AOB-023 | PSDATA-AOB-023-03 | Target | Consumer Delivery Status | Record per-consumer delivery success/fail/pending replay |
| AOB-027 | PSDATA-AOB-027-01 | Target | Publication Event Timestamp | Create per-target event with outcome + timestamp; link to Tracking ID |
| AOB-028 | PSDATA-AOB-028-01 | Source | DQ Score | Refresh dashboard KPI values from controls dataset |
| AOB-028 | PSDATA-AOB-028-02 | Source | Onboarding Completion Status | Refresh dashboard completion metrics |
| AOB-029 | PSDATA-AOB-029-01 | Target | Onboarding Completion Status | Set to COMPLETE when master published (AOB-021) and publication event recorded (AOB-027) |
