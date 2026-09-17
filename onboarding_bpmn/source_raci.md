# Source RACI And Lane Consolidation

Source: ../parsed_process_data.json; rows marked [added] excluded. R = Responsible,
A = Accountable, C = Consulted, I = Informed. Assignments below retain source wording.

## Consolidation Decisions

- Onboarding Ops (Maker) and Onboarding Ops share the Onboarding Ops lane: the same explicit team name.
  Maker remains the R duty at AOB-002/004/007/019; Ops remains R at AOB-029.
- Process Ops (DQ & Controls) and Process Ops (Checker) share the Process Ops lane: the same explicit team name.
  Checker remains the R duty at AOB-020; Process Ops remains R on the DQ/control steps.
- These are team-level groupings, not proof of individual identity. Maker and Checker must be different
  individuals for the same record under the source four-eye control. Their lanes remain distinct.
- Generic Ops is mapped to Onboarding Ops only at AOB-029, where the owner makes the link explicit.
  Other generic Ops mentions are not assigned to a team. Product Owner is not assumed to be Data Product Owner.
- Ops Lead, DQ Lead, Approver Lead, Tax Lead, Data Owner and other accountable roles are not merged
  with executing teams merely because they supervise or approve their work.
- People and Combined lanes use normalized human responsibilities, with the approved team groupings above.
  Integration Layer maps to Integration Team; Data Platform maps to Data Platform Team. Original owners remain below.
  SNOW and ServiceNow in RACI map to Service Management Team; ServiceNow is the application, not a person.
- Ten responsibility lanes remain; technology capabilities are separate in the Technology view.
  Nine groups own source steps; Ops Lead is the supplemental approval-timeout review lane.
  This is not a staff count. RACI-only stakeholders do not require extra execution lanes.

## People Responsibilities

| Consolidated lane | Source owner labels | Responsible duties (source R) | Source steps |
|---|---|---|---|
| Requestor | Requestor (Client Service) | Requestor | AOB-001 |
| Onboarding Ops | Onboarding Ops; Onboarding Ops (Maker) | Maker; Ops | AOB-002, AOB-004, AOB-007, AOB-019, AOB-029 |
| Process Ops | Process Ops (Checker); Process Ops (DQ & Controls) | Checker; Process Ops | AOB-003, AOB-012, AOB-014, AOB-016, AOB-018, AOB-020 |
| Approver | Business Approver | Approver | AOB-005, AOB-006 |
| Integration Team | Integration Layer | Integration | AOB-008, AOB-023, AOB-024, AOB-025, AOB-026 |
| Data Platform Team | Data Platform | Platform | AOB-009, AOB-011, AOB-015, AOB-021, AOB-022, AOB-027, AOB-028 |
| Service Management Team | Service Management (ServiceNow Team) | SNOW | AOB-010 |
| Steward | Data Steward (Reference Data) | Steward | AOB-013 |
| Process SPECIALIST | Process SPECIALIST | Process SPECIALIST | AOB-017 |
| Ops Lead | Supplemental timeout review | Ops Lead (approved modelling addition) | No separate source step ID |

## Process-Step RACI

AOB-006 and AOB-023 contain distinct source RACI variants. Both are listed with their detail types;
they are not silently combined into a new assignment. Repeated identical assignments are collapsed.

| Step | Process activity | Original owner | Lane | R | A | C | I | Source detail types |
|---|---|---|---|---|---|---|---|---|
| AOB-001 | Submit onboarding request | Requestor (Client Service) | Requestor | Requestor | Business Approver | Onboarding Ops | Process Ops | Submit onboarding request / Application; Submit onboarding request / Input; Submit onboarding request / Tracking; Submit onboarding request / Output |
| AOB-002 | Triage and classify | Onboarding Ops (Maker) | Onboarding Ops | Maker | Ops Lead | Process Ops | Requestor | Triage and classify / Application; Triage and classify / Output |
| AOB-003 | Completeness gateway | Process Ops (DQ & Controls) | Process Ops | Process Ops | Ops Lead | Maker | Requestor | Completeness gateway / Gateway Rule (XOR); Completeness gateway / Mandatory Fields; Completeness gateway / Evidence Rule |
| AOB-004 | Request clarification (fail path) | Onboarding Ops (Maker) | Onboarding Ops | Maker | Ops Lead | Process Ops | Requestor | Request clarification / Output |
| AOB-005 | Business approval | Business Approver | Approver | Approver | Approver Lead | Requestor | Ops | Business approval / Control |
| AOB-006 | Approval event gateway | Business Approver | Approver | Approver | Approver Lead | Ops Lead | ServiceNow | Approval event gateway / Event-based Gateway; Approval event gateway / Output |
| AOB-006 | Approval event gateway | Business Approver | Approver | Approver | Approver Lead | ServiceNow | Requestor | Approval event gateway / SLA Timer |
| AOB-007 | Create onboarding draft | Onboarding Ops (Maker) | Onboarding Ops | Maker | Ops Lead | Data Steward | Process Ops | Create onboarding draft / Application; Create onboarding draft / Data Control; Create onboarding draft / Output |
| AOB-008 | Package for ingestion | Integration Layer | Integration Team | Integration | Integration Lead | Maker | Platform | Package for ingestion / Application; Package for ingestion / Output |
| AOB-009 | Ingest to landing | Data Platform | Data Platform Team | Platform | Platform Lead | Integration | Process Ops | Ingest to landing / Application; Ingest to landing / Output |
| AOB-010 | Technical error handling | Service Management (ServiceNow Team) | Service Management Team | SNOW | Platform Lead | Integration | Ops Lead | Technical error handling / Exception Path; Technical error handling / Output |
| AOB-011 | Parallel validations start | Data Platform | Data Platform Team | Platform | Platform Lead | Process Ops | Data Steward | Parallel validations start / Gateway (AND) |
| AOB-012 | Execute DQ ruleset | Process Ops (DQ & Controls) | Process Ops | Process Ops | DQ Lead | Maker | Data Steward | Execute DQ ruleset / Application; Execute DQ ruleset / Rule Set; Execute DQ ruleset / Output |
| AOB-013 | Reference enrichment | Data Steward (Reference Data) | Steward | Steward | Data Owner | Process Ops | Maker | Reference enrichment / Application; Reference enrichment / Enrichment; Reference enrichment / Output |
| AOB-014 | Duplicate detect & merge decision | Process Ops (DQ & Controls) | Process Ops | Process Ops | DQ Lead | Steward | Ops | Duplicate detect & merge decision / Rule; Duplicate detect & merge decision / Output |
| AOB-015 | Validation join | Data Platform | Data Platform Team | Platform | Platform Lead | Process Ops | Data Steward | Validation join / Gateway (AND Join); Validation join / Output |
| AOB-016 | Conditional SPECIALIST checks | Process Ops (DQ & Controls) | Process Ops | Process Ops | Ops Lead | Process SPECIALIST | Requestor | Conditional SPECIALIST checks / Gateway Rule (Inclusive); Conditional SPECIALIST checks / Rule Basis; Conditional SPECIALIST checks / Output |
| AOB-017 | Process SPECIALIST review (conditional) | Process SPECIALIST | Process SPECIALIST | Process SPECIALIST | Tax Lead | Maker | Process Ops | Process SPECIALIST review (conditional) / Control; Process SPECIALIST review (conditional) / Routing Rule; Process SPECIALIST review (conditional) / Output |
| AOB-018 | DQ pass gateway | Process Ops (DQ & Controls) | Process Ops | Process Ops | DQ Lead | Maker | Ops Lead | DQ pass gateway / Gateway Rule (XOR) |
| AOB-019 | Remediation loop | Onboarding Ops (Maker) | Onboarding Ops | Maker | Ops Lead | Process Ops | Requestor | Remediation loop / Loop Rule; Remediation loop / Output |
| AOB-020 | Maker-checker (4-eye) | Process Ops (Checker) | Process Ops | Checker | Ops Lead | Data Owner | Requestor | Maker-checker (4-eye) / Control; Maker-checker (4-eye) / Output |
| AOB-021 | Publish to onboarding master | Data Platform | Data Platform Team | Platform | Data Product Owner | Process Ops | Downstream Systems | Publish to onboarding master / Application; Publish to onboarding master / Output |
| AOB-022 | Write controls & DQ metrics | Data Platform | Data Platform Team | Platform | Data Product Owner | Process Ops | DQ Dashboard | Write controls & DQ metrics / Application; Write controls & DQ metrics / Output |
| AOB-023 | Distribute to Downstream Systems (transaction) | Integration Layer | Integration Team | Integration | Integration Lead | Platform | Downstream Systems | Distribute to Downstream Systems / Transaction |
| AOB-023 | Distribute to Downstream Systems (transaction) | Integration Layer | Integration Team | Integration | Integration Lead | Platform | Process Ops | Distribute to Downstream Systems / Completion Rule; Distribute to Downstream Systems / Output |
| AOB-024 | Publish to DDT | Integration Layer | Integration Team | Integration | Integration Lead | Platform | Downstream Systems | Publish to DDT / Application |
| AOB-025 | Publish to Portfolio Analytics Platform | Integration Layer | Integration Team | Integration | Integration Lead | Platform | Downstream Systems | Publish to Portfolio Analytics Platform / Application |
| AOB-026 | Publish to Client Reporting Hub topic | Integration Layer | Integration Team | Integration | Integration Lead | Platform | Downstream Systems | Publish to Client Reporting Hub topic / Application |
| AOB-027 | Record publication events | Data Platform | Data Platform Team | Platform | Product Owner | Integration | Process Ops | Record publication events / Audit; Record publication events / Output |
| AOB-028 | Update DQ dashboard | Data Platform | Data Platform Team | Platform | Data Product Owner | Process Ops | Ops Lead | Update DQ dashboard / Application; Update DQ dashboard / Output |
| AOB-029 | Notify completion | Onboarding Ops | Onboarding Ops | Ops | Ops Lead | Integration | Requestor | Notify completion / Application; Notify completion / Output |

## RACI Participant Inventory

These are exact source labels, including systems and recipients, not unique people.

| Assignment | Source labels |
|---|---|
| R | Approver; Checker; Integration; Maker; Ops; Platform; Process Ops; Process SPECIALIST; Requestor; SNOW; Steward |
| A | Approver Lead; Business Approver; DQ Lead; Data Owner; Data Product Owner; Integration Lead; Ops Lead; Platform Lead; Product Owner; Tax Lead |
| C | Data Owner; Data Steward; Integration; Maker; Onboarding Ops; Ops Lead; Platform; Process Ops; Process SPECIALIST; Requestor; ServiceNow; Steward |
| I | DQ Dashboard; Data Steward; Downstream Systems; Maker; Ops; Ops Lead; Platform; Process Ops; Requestor; ServiceNow |

## Participant-Level RACI

Each row uses an exact source participant label. Aliases are not merged here; lane grouping is described above.
A step may appear under both C and I where its source detail rows differ; see the process-step table for context.

| Source participant | R steps | A steps | C steps | I steps |
|---|---|---|---|---|
| Approver | AOB-005, AOB-006 | - | - | - |
| Approver Lead | - | AOB-005, AOB-006 | - | - |
| Business Approver | - | AOB-001 | - | - |
| Checker | AOB-020 | - | - | - |
| DQ Dashboard | - | - | - | AOB-022 |
| DQ Lead | - | AOB-012, AOB-014, AOB-018 | - | - |
| Data Owner | - | AOB-013 | AOB-020 | - |
| Data Product Owner | - | AOB-021, AOB-022, AOB-028 | - | - |
| Data Steward | - | - | AOB-007 | AOB-011, AOB-012, AOB-015 |
| Downstream Systems | - | - | - | AOB-021, AOB-023, AOB-024, AOB-025, AOB-026 |
| Integration | AOB-008, AOB-023, AOB-024, AOB-025, AOB-026 | - | AOB-009, AOB-010, AOB-027, AOB-029 | - |
| Integration Lead | - | AOB-008, AOB-023, AOB-024, AOB-025, AOB-026 | - | - |
| Maker | AOB-002, AOB-004, AOB-007, AOB-019 | - | AOB-003, AOB-008, AOB-012, AOB-017, AOB-018 | AOB-013 |
| Onboarding Ops | - | - | AOB-001 | - |
| Ops | AOB-029 | - | - | AOB-005, AOB-014 |
| Ops Lead | - | AOB-002, AOB-003, AOB-004, AOB-007, AOB-016, AOB-019, AOB-020, AOB-029 | AOB-006 | AOB-010, AOB-018, AOB-028 |
| Platform | AOB-009, AOB-011, AOB-015, AOB-021, AOB-022, AOB-027, AOB-028 | - | AOB-023, AOB-024, AOB-025, AOB-026 | AOB-008 |
| Platform Lead | - | AOB-009, AOB-010, AOB-011, AOB-015 | - | - |
| Process Ops | AOB-003, AOB-012, AOB-014, AOB-016, AOB-018 | - | AOB-002, AOB-004, AOB-011, AOB-013, AOB-015, AOB-019, AOB-021, AOB-022, AOB-028 | AOB-001, AOB-007, AOB-009, AOB-017, AOB-023, AOB-027 |
| Process SPECIALIST | AOB-017 | - | AOB-016 | - |
| Product Owner | - | AOB-027 | - | - |
| Requestor | AOB-001 | - | AOB-005 | AOB-002, AOB-003, AOB-004, AOB-006, AOB-016, AOB-019, AOB-020, AOB-029 |
| SNOW | AOB-010 | - | - | - |
| ServiceNow | - | - | AOB-006 | AOB-006 |
| Steward | AOB-013 | - | AOB-014 | - |
| Tax Lead | - | AOB-017 | - | - |

## Unresolved Source Questions

- No person identifiers or staffing roster: shared team names do not prove the same individual.
- Confirm whether the C/I variants at AOB-006 and AOB-023 are intentional detail-specific assignments.
- Resolve generic Ops, Product Owner versus Data Product Owner, and system recipients before headcount analysis.
- The supplemental Ops Lead timeout review has no complete source RACI; A/C/I remain unspecified.
