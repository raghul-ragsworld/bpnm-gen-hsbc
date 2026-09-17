---
title: Sample Process Onboarding AI Accelerator
description: Business requirements for sample and process-specific onboarding workflows in the hackathon proof of concept
author: Hackathon team
ms.date: 2026-09-17
ms.topic: reference
---

## Executive Summary

The hackathon will analyse the synthetic Sample Process Onboarding process in
[Requirements_Document_Hackthon_v4.pdf](Requirements_Document_Hackthon_v4.pdf).
The scenario concerns a city transport authority onboarding the "Urban Bus
Route 42 - Service Setup & Monitoring Process" into a central data store for
governance, validation, publication, and downstream distribution.

The solution will use AI-assisted methods to produce a validated Business
Process Model and Notation (BPMN) model, a reusable business metadata package,
consistently enriched data attributes, and process-improvement recommendations.

The v0.4 PDF received on 10 September 2026 remains authoritative for Sample
Process Onboarding. The user clarification in CR-2026-09-17 extends scope to
process-specific workflows and supersedes the shared sample step and topology
constraint for the 20 additional business processes.

## Business Context and Background

Sample Process Onboarding spans multiple roles, systems, controls, and data
movements. Incomplete or inconsistent metadata limits reuse, governance,
automation, and end-to-end lineage.

The source defines this hierarchy:

`Process -> Process Steps -> Process Step Details -> Process Step Data ->
Applications -> Data (Attributes)`

The worked process is `AOB-PR-1001`. It includes 29 ordered steps (`AOB-001`
through `AOB-029`), role and RACI assignments, applications, data mappings,
controls, validation rules, approval paths, remediation, publication, and
distribution.

## Problem Statement and Business Drivers

The process information is distributed across process, step, application, and
data tables. Without a consistent model, teams cannot reliably:

* Reconstruct the complete process and control flow
* Trace roles, systems, data attributes, and lineage across process steps
* Reuse process concepts across modelling frameworks and tools
* Identify missing, ambiguous, or inconsistent process details
* Apply consistent definitions and governance metadata to data elements

The business drivers are process clarity, governance, metadata quality,
traceability, reuse, and readiness for automation.

## Business Objectives and Success Metrics

### Objectives

<!-- markdownlint-disable MD013 -->

| ID | Objective |
| --- | --- |
| OBJ-001 | Produce a validated BPMN model with swimlanes and the advanced constructs required by the source. |
| OBJ-002 | Produce reusable metadata for process, step, role, system, data attribute, data product, and lineage. |
| OBJ-003 | Apply the supplied data dictionary template to every finalised in-scope attribute. |
| OBJ-004 | Define a repeatable approach for AI-assisted extraction and enrichment. |
| OBJ-005 | Identify gaps, ambiguities, and opportunities, and provide actionable recommendations. |

### Success Metrics

| Metric | Target | Evidence |
| --- | --- | --- |
| Source coverage | Cover the sample's 29 steps and 13 applications. For each additional process, map all source rows and CR-2026-09-17 requirements to retained, changed, added, merged, or removed activities with reasons. | Per-process coverage report mapped to source and requirement IDs |
| BPMN structural validity | 100% of exported BPMN passes the selected structural validator. | Validator output linked to the artefact |
| BPMN visual usability | The model opens visibly and shows required swimlanes and supported control flow. | Viewer import and visual inspection |
| Entity extraction quality | Entity F1 of at least 0.80 on the labelled sample. | Reproducible evaluation report |
| Relationship extraction quality | Relationship F1 of at least 0.70 on the labelled sample. | Reproducible evaluation report |
| Dictionary completeness | Every finalised attribute has every mandatory field or an unresolved marker. | Completeness report |
| Evidence grounding | Claims retain source references and unsupported claims are flagged. | Traceability report |
| Improvement analysis | Every confirmed gap or ambiguity has an impact and recommendation. | Reviewed improvement register |

<!-- markdownlint-enable MD013 -->

The extraction targets apply only to the labelled hackathon sample and do not
claim accuracy across an enterprise process estate.

## Stakeholders and Roles

<!-- markdownlint-disable MD013 -->

| Stakeholder | Business interest | PoC responsibility |
| --- | --- | --- |
| Hackathon sponsor | Business value within agreed constraints | Confirms scope and accepts the demonstration outcome |
| Business or process analyst | Accurate and understandable outputs | Reviews BPMN, traceability, gaps, and recommendations |
| Process subject matter expert | Correct rules and exceptions | Validates ambiguous details when available |
| Data steward | Consistent definitions and ownership | Reviews enrichment and dictionary completeness |
| Architecture and engineering team | Feasible and reproducible delivery | Implements and demonstrates the PoC |
| Source process participants | Accurate role representation | Appear in BPMN swimlanes and metadata |

<!-- markdownlint-enable MD013 -->

Independent SME validation is not confirmed. Outputs must not be described as
HSBC-approved or production-validated.

## Scope

### In Scope

* Use
  [Requirements_Document_Hackthon_v4.pdf](Requirements_Document_Hackthon_v4.pdf),
  version v0.4, as the canonical reference
* Represent `AOB-PR-1001` and steps `AOB-001` through `AOB-029`
* Model intake, triage, completeness, approval, drafting, ingestion,
  validation, enrichment, duplicate handling, specialist review, remediation,
  maker-checker control, publication, distribution, monitoring, and completion
* Generate BPMN with swimlanes and required XOR, AND, inclusive, event-based,
  timer, and loop semantics
* Capture step details, roles, RACI, controls, rules, applications, inputs,
  outputs, and source-to-target transformations
* Represent applications `APP-001` through `APP-013` and their mappings
* Enrich finalised attributes with the supplied data dictionary template
* Model process, system, data attribute, data product, and lineage metadata
* Define ontology concepts, relationships, cardinalities, constraints, and
  inheritance for consistent querying and reuse
* Produce a gap, ambiguity, and recommendation register
* Provide traceability and evaluation views
* Represent all 20 additional business processes with distinct activities,
  decisions, roles, exceptions, and loops as specified in CR-2026-09-17

### Out of Scope

* Production deployment, high availability, and operationalisation
* Enterprise-wide process mining or real-time monitoring
* Broad enterprise repository integration
* Autonomous approval or remediation of business content
* Complete BPMN 2.0 support beyond source-required constructs
* Enterprise approval of the bespoke ontology or canonical model
* Cross-process lineage beyond Sample Process Onboarding
* Non-synthetic or customer data

## Current and Future Business Processes

### Source Process Summary

A requestor submits process attributes and evidence. Onboarding operations
triage the request, validate completeness, and route it for approval. Approved
requests become versioned drafts that are packaged and ingested.

Data-quality validation, reference enrichment, and duplicate detection then
run in parallel. Their outputs join before conditional specialist review and a
bounded remediation loop. Maker-checker control precedes publication to the
onboarding master.

The process records controls and data-quality metrics, distributes the master
record to three consumer paths, records publication events and delivery
outcomes for replay, refreshes the dashboard, and notifies completion.

### Required Control Flow

* Completeness failure returns the request for missing information.
* Approval supports approve, reject, withdraw, and 24-hour timeout outcomes.
* Ingestion failures allow no more than two retries before parking and
  escalation.
* Data-quality checks, enrichment, and duplicate detection run in parallel and
  join before downstream decisions.
* Specialist review is conditional on the documented tax-review basis.
* Remediation allows no more than three attempts and applies documented urgent
  and standard service levels.
* Maker-checker approval is required before publication.
* Delivery records per-consumer outcomes and supports replay by Tracking ID
  without repeating onboarding.
* Completion requires master publication and a corresponding publication event
  for the Tracking ID.

## CR-2026-09-17: Process-Specific Workflows

### Decision and Scope

The user requires different steps for every business process and authorises
changes to requirement steps and loops to reflect the relevant business flow.
This is a product requirements change, not a custom-agent instruction update.
It supersedes the earlier decision to instantiate the same 29-step sample
graph for all processes. Sample Process Onboarding remains an unchanged,
selectable reference, not a mandatory execution template.

The catalogue is the 20 processes in
`Synthetic_Hackathon_Data_10_normalized.xlsx`. Their existing repeated steps
are input evidence, not a constraint on the revised process design. Step
counts may differ; changing titles, owners, or application labels on an
otherwise identical graph does not satisfy this requirement. Shared controls
may be reused only when appropriate to the process.

The flows below are proposed synthetic PoC requirements based on common
process patterns. They are not confirmed HSBC procedures, regulatory advice,
or independently validated industry standards. They may be implemented for
the demonstration without further routine user input. Unsupported policy
thresholds, legal conditions, and service levels remain explicitly unresolved
or configurable; they must not be presented as verified source facts.

### Process-Specific Activity and Routing Requirements

Each item is a distinct requirement, WF-01 through WF-20. Arrows describe the
proposed successful sequence; conditional and failure routes are specified
separately. Variants inherit only applicable parent controls, with the stated
route changes.

1. **WF-01: Retail Account Onboarding.** Capture application and consent ->
   verify identity -> assess screening results -> select account product ->
   approve opening -> create account -> activate customer access -> notify
   completion. Missing evidence returns to capture; corrected identity data
   returns to verification. Screening hits require compliance clearance or
   decline before opening. Provisioning failure retries provisioning only,
   without creating a second account.
2. **WF-02: Retail Account Onboarding - Variant A.** Branch-assisted capture ->
   inspect original identity evidence -> record assisted verification ->
   screening -> resolve discrepancies -> independent opening approval ->
   create account -> hand over access details. Unreadable evidence returns to
   branch capture; discrepancies return to assisted verification. This
   proposed assisted variant adds a manual evidence/review path rather than
   merely renaming digital intake.
3. **WF-03: SME Account Opening.** Capture company application -> verify
   registration -> identify beneficial owners -> verify owners and mandate
   signatories -> assess business risk -> approve mandate -> open account ->
   configure signing permissions. Missing ownership chains return to owner
   identification; invalid mandates return to mandate correction. Unresolved
   ownership or screening concerns route to compliance hold or decline.
4. **WF-04: SME Account Opening - Express.** Check express eligibility ->
   retrieve reusable company evidence -> validate freshness -> screen company
   and owners -> apply express decision -> open account -> activate mandate.
   Ineligible, complex-ownership, stale-evidence, or escalated-risk cases
   transfer to the corresponding WF-03 stage with evidence and case ID,
   rather than repeating express intake. Full recapture is omitted only
   where reusable evidence is valid.
5. **WF-05: Corporate KYC Remediation.** Identify review population -> compare
   existing KYC to required evidence -> request missing documents -> refresh
   ownership -> rescreen -> reassess risk -> independent review -> update KYC
   record -> close review. Missing documents return to the evidence request;
   reviewer findings return to the affected KYC field and trigger relevant
   rechecks. Non-response escalates for a documented restriction or closure
   decision. This workflow does not create a new account.
6. **WF-06: Corporate KYC Remediation - Event Driven.** Receive change event ->
   correlate customer and deduplicate event -> assess materiality -> identify
   impacted fields -> obtain targeted evidence -> run affected checks ->
   approve revised risk -> update KYC and close event. Non-material events
   close with rationale. Material new information returns to impact assessment;
   duplicate events link to the existing case instead of restarting review.
7. **WF-07: Trade Finance Client Setup.** Capture facility request -> validate
   trade profile -> assess counterparties and trade restrictions -> assess
   credit facility -> complete legal documentation -> approve limits ->
   configure trade channels -> test entitlement -> activate facility. Legal
   defects return to documentation, credit changes to assessment, and failed
   entitlement tests to configuration. Sanctions concerns cannot pass directly
   to activation.
8. **WF-08: Trade Finance Client Setup - Multi-Entity.** Capture group structure
   -> identify participating entities -> perform entity-level diligence and
   legal review -> aggregate exposure -> allocate entity limits -> approve
   group structure -> configure cross-entity entitlements -> activate approved
   scope. Entity checks use parallel multi-instance work with an aggregation
   barrier. Failed entities return to their own checks. Partial activation
   requires explicit scope approval and aggregate exposure recalculation;
   entities cannot silently disappear from the join.
9. **WF-09: Treasury Counterparty Onboarding.** Capture counterparty -> confirm
   legal identity -> assess credit and settlement risk -> negotiate trading
   agreements -> approve trading limits -> independently validate settlement
   instructions -> configure dealing access -> activate counterparty.
   Agreement changes return to legal review; settlement validation failures
   return to instruction correction. Activation requires approved limits and
   verified settlement instructions.
10. **WF-10: Treasury Counterparty Onboarding - NBFI.** Classify non-bank
    financial institution -> verify licence or applicable status -> assess
    ownership, funding, and liquidity -> enhanced diligence -> credit review
    -> negotiate collateral terms -> approve limits -> verify settlement ->
    activate permitted products. Status/funding gaps return to enhanced
    diligence; collateral changes return to credit/terms review. Unresolved
    status produces hold or decline, not ordinary treasury activation.
11. **WF-11: Wealth Client Profiling.** Capture objectives and consent -> assess
    knowledge and experience -> assess financial capacity -> assess risk
    tolerance -> reconcile inconsistencies -> determine suitability profile
    -> obtain acknowledgement -> publish profile. Conflicting answers return
    to the affected assessment. Declined acknowledgement returns to discussion
    or withdrawal. A profile is not approval of a specific trade.
12. **WF-12: Wealth Client Profiling - UHNI.** Map household/entity relationships
    -> collect source-of-wealth evidence -> assess complex holdings and
    liquidity needs -> enhanced diligence -> specialist suitability review ->
    approve mandate restrictions -> obtain acknowledgement -> publish
    consolidated profile. Evidence gaps return to source-of-wealth collection;
    specialist objections return to holdings/needs assessment. Consolidation
    waits for all in-scope entity reviews or an explicit scope revision, and
    introduces restrictions beyond the ordinary profiling route.
13. **WF-13: Cards Customer Enrollment.** Capture card application -> verify
    identity and screening -> assess affordability and credit -> decide limit
    -> accept card terms -> provision card -> deliver -> activate. Credit
    decline ends the application; missing evidence returns to assessment.
    Delivery failure returns to address confirmation and delivery only.
    Activation requires authentication and a matching issued-card identity.
14. **WF-14: Cards Customer Enrollment - CoBrand.** Validate partner referral
    and consent -> match partner membership -> verify identity -> assess credit
    -> agree card and partner terms -> provision card -> link rewards account
    -> deliver and activate. Membership mismatch returns to partner correction
    or closes as ineligible. Rewards-link failures retry linking without
    reissuing the card. Card and rewards readiness are tracked separately
    before declaring combined enrollment complete.
15. **WF-15: Merchant Onboarding (Payments).** Capture merchant application ->
    verify business and owners -> assess merchant category/prohibited activity
    -> underwrite payment risk -> agree settlement terms -> verify settlement
    account -> configure gateway -> certify test transaction -> enable
    processing. Underwriting findings return to evidence collection; failed
    transaction tests return to configuration. Prohibited activity ends in
    decline rather than a configuration retry.
16. **WF-16: Merchant Onboarding - Enterprise.** Map entities, outlets, and
    channels -> perform entity diligence -> underwrite aggregate exposure ->
    agree enterprise settlement model -> configure integrations per channel ->
    execute channel certification -> approve rollout waves -> activate and
    reconcile each wave. Certifications may run in parallel but each wave
    requires its own readiness join. Failed channels return to their own
    configuration/certification; activated waves are not replayed.
17. **WF-17: Loan Origination Party Setup.** Capture borrower and related parties
    -> deduplicate party records -> verify identities -> establish borrower,
    guarantor, and relationship roles -> validate consent and authority ->
    approve party data -> create or link party master -> hand off to origination.
    Ambiguous matches require resolution before creation; invalid authority
    returns to evidence capture. Party setup is not loan approval/disbursement.
18. **WF-18: Loan Origination Party Setup - Secured.** Capture borrower, guarantor,
    and security-provider parties -> resolve identities -> verify security
    ownership and authority -> link collateral reference -> validate party-to-
    security relationships -> independent review -> create/link party master
    -> hand off security package. Ownership mismatch returns to security
    evidence; relationship defects return to linkage review. Valuation, legal
    perfection, and lending decisions remain separate downstream gates, not
    implied completed outcomes of this setup.
19. **WF-19: Custody Account Setup.** Capture custody mandate -> verify client
    and tax documentation -> establish market eligibility -> agree servicing
    and settlement instructions -> create custody account -> configure asset
    servicing/reporting -> test settlement -> activate. Missing tax data
    returns to documentation; settlement test failures return to instruction
    correction/configuration. Restricted markets remain disabled.
20. **WF-20: Custody Account Setup - Global Markets.** Identify requested markets
    -> assess jurisdiction and investor eligibility per market -> confirm
    sub-custodians -> collect market-specific tax/registration evidence ->
    configure local settlement/currency instructions -> certify each market
    -> approve enabled-market scope -> activate approved markets. Market work
    runs independently with readiness aggregation. Failures return to that
    market's documentation/configuration. Partial activation explicitly lists
    excluded markets without marking them complete, adding market-specific
    gates beyond domestic setup.

### Loop and BPMN Correctness Rules

* Every decision defines conditions, a default/unresolved outcome, and success,
  correction, rejection, withdrawal, or escalation routes as relevant.
  A rejected business decision is not a technical retry.
* Every loop records its entry condition, exact return step, owning role,
  downstream rechecks, counter, and exhaustion outcome. Where source limits
  are absent, proposed PoC defaults are two technical retries after the initial
  attempt and at most three business correction submissions. These defaults
  are configurable assumptions, not bank policy.
* Counters are scoped to case/activity, persist across pauses, and cannot
  reset on return edges. Exhaustion parks the case with an escalation owner.
  Resume requires a recorded resolution and authorised retry budget; ordinary
  retries must never produce an infinite loop.
* External evidence/approval waits have configurable timeout routes to
  escalation or expiry. Do not automatically copy sample 24-hour/4-hour timers.
  Missing durations remain unresolved and prevent executable approval, not
  creation of a clearly labelled descriptive model.
* Use XOR for mutually exclusive decisions, AND for independent required work,
  inclusive gateways for optional combinations, and event-based gateways for
  competing external outcomes. Optional/rejected branches must not leave an
  AND join waiting indefinitely.
* Parallel branches cannot consume data still being produced by a sibling.
  Join prerequisites before dependent work. Multi-entity, channel, and market
  flows track each instance and define full versus partial completion.
* Checker rejection returns to the named correction step. Changed evidence
  invalidates affected prior approvals and requires review again. Unresolved
  checker paths must not silently become success paths.
* Technical retries and delivery replay use idempotency keys and resume only
  the failed activity/destination. They must not repeat account creation,
  card issuance, publication, or completed market/wave activation.
* Every reachable route ends in success, decline, withdrawal, expiry, or a
  visible owned hold/escalation state. No dangling flows or unreachable required
  activities are permitted; holds expose their resume/close action.

### Data Revision and Viewer Contract

Preserve the original workbook and sample artefacts. Produce a versioned revised
requirement/step dataset per process with stable IDs and no mandatory mapping
to `AOB-001` through `AOB-029`. Each activity records its process, requirement
ID, source step IDs (zero or more), action, owner, inputs, outputs, applications,
controls, predecessors, successors, conditions, and evidence basis. Proposed
additions carry requirement references; merges/removals retain source lineage
and reasons. Unsupported applications and RACI assignments are assessed and,
where defensible, repaired in a working copy as explicitly Proposed values.
Remaining gaps belong in the quality report, not placeholder canvas annotations;
critical gaps block the affected diagram. Original evidence is never overwritten.

Sample Process Onboarding is the sole visual-format reference. Original sample
BPMN/images and workbook remain unchanged; process-specific activities and routing
are not replaced by the sample's 29-step topology.

People/Combined use only human/team lanes participating in the selected process.
Technology uses only participating applications from source mappings or explicitly
labelled proposals. The sample's lane order applies to matching used names, not
to empty lanes or copied application assignments. Remove empty lanes and compact
heights around their contents. Pools represent real participants; omit a redundant
single-process frame but preserve genuine collaboration boundaries. Each visible
node belongs to one performing lane in its scope; timers stay attached to their
host. RACI letters are not lanes. Inferred roles, applications and execution types
remain Proposed, never source-verified or bank-approved.

Retain Georgia labels, white pools, black outlines, 240x160 tasks, 80x80 detail
events/gateways, native BPMN icons, blue/amber/green tasks, yellow timers, red
exceptions and dark-green root success ends. People/Combined show supported A
annotations; Technology/Combined show supported System annotations. Do not show
empty or "Unresolved" annotations. Full views include only relevant title/legend.
Document objects require actual activity-to-BDE mappings; do not fabricate them.
The pool-free overview uses connected 240x120 collapsed phases and 40x40 events/
gateways in a return-row layout. It is an abstraction, not executable routing.
Phase projections have partial DI with adjacent context and full semantic XML.
Coordinates adapt to each graph while preserving sample visual conventions.

Retain one **Business process** tab, a names-only dropdown, and selectable
**Sample Process Onboarding**. Preserve overview, People, Technology, Combined,
phase navigation, step focus, zoom, fit, RACI, provenance, and BPMN download.
Technology and Combined availability is subject to the data and validation gates
below, including direct API/download access. These are shared viewer capabilities,
not shared topology: phase names,
memberships, step options, geometry, and view counts derive from the selected
process. All views represent the same underlying process graph.

One **Step changes** box shows additions, removals, merges, changed activity
data, decisions, loop destinations/limits, roles, and applications, with before,
after, reason, and source/requirement IDs. Separate source corrections from
proposed requirements, display changes, and sample comparisons. Count unique
affected steps separately from field changes. Replace the earlier fixed-workflow
wording with: "As per the revised process requirements, we have changed the
step data and corrected the flow and loops." State alongside it that the
original workbook is preserved and proposed flows are not independently
business-validated. Do not report planned changes as applied.

### Data-First Single-Agent Contract

The BPNM generator performs intake, assessment, traceable repairs, prediction,
generation and validation itself, with no subagent delegation. Accept authorised
file/API/OneLake/Lakehouse and other source snapshots through the same canonical
People (step RACI), Process (identity, steps, details, routing) and Technology
(application mappings) contract. Preserve source versions, hashes, row IDs,
details, owner variants and supplied BDE mappings. These requirements do not
establish that any particular connector is already implemented or connected.

Score original SOURCE data before inference using fixed weights: process identity
and steps 20%, routing and controls 25%, People 25%, Technology 20%, traceability
and mappings 10%. Each component reports passed/total applicable field and
reference checks. Missing, placeholder, conflicting and inferred values fail
source checks. Nonapplicability needs source evidence; no observations is Not
verified. The complete check definitions are in the BPNM generator instructions.

There are two processing paths:

1. Source score strictly greater than 90% with no critical gaps: preserve verified
  data and predict candidate next steps from the process evidence, labelled
  Proposed and kept separate from recorded history.
2. Score at or below 90%, missing data or critical gaps: repair a versioned working
  copy first; distinguish evidence-based corrections from Proposed inferences,
  record before/after/reason/basis and reassess. Do not increase SOURCE quality
  by counting proposals as verified facts. Missing R/A, applicable applications,
  invalid references, ambiguous routes or broken scopes block affected outputs
  if a defensible repair is unavailable.

Generate People + Process with human lanes and no technology content, then
Technology + Process with application lanes and no human/RACI content. Both use
the same canonical graph. Independently validate and reconcile their steps,
details, routes, scopes and mappings before allowing Combined. A missing, failed
or unrun applicable gate blocks Combined. Version/hash gates with their data and
XML so cached results cannot bypass them. Proposed data remains labelled even
when technical validation passes.

Publish Check, Score, Verified Evidence, Status and artifact path for real XML
files. Mandatory checks are official OMG BPMN 2.0.2 XSD validity (including schema
dependencies), warning-free bpmn-js import/export/reimport, per-full-view source
step coverage, exact source metadata fidelity, source details/RACI variant
preservation, BDE mapping fidelity, scope-aware start/end reachability,
cross-perspective consistency and visual layout. Direct source coverage and
proposed replacement accounting are separate. Denominators derive from each
dataset; the sample's 19 files, 29 steps, 62 details, 76 mappings and 56 nodes are
not constants for other processes. An unrun check has no percentage; zero
observations is not 100%. Use PASS, FAIL, BLOCKED, NOT RUN or justified N/A.

Visual checks cover empty lanes, excessive whitespace, text/marker collisions,
external labels, arrow docking on event perimeters, clipped loops, connectors
crossing unrelated shapes and readable selected-step zoom with/without the RACI
panel. Internal task-label bounds alone do not satisfy this gate. Compare actual
desktop/mobile renders against the sample. Technical conformance, data
completeness and independently verified business accuracy are separate measures;
do not label them all "100% accuracy".

### Acceptance and Implementation Status

The data-first contract above supersedes earlier fixed-lane/unresolved-display
rules. It defines required behaviour, not a claim that the current runtime has
implemented the quality gates, repairs, integrations or complete scorecard.
The prior implementation results below are historical evidence only and do not
constitute acceptance against these new gates.

Current local evidence is recorded in
[`web/workflow/evidence/summary.md`](../web/workflow/evidence/summary.md).
The post-gate run generated 136 eligible views for all 20 processes. All 272
original/browser-export XML files passed the hash-checked official OMG schemas;
all 136 views passed warning-free bpmn-js import/export/reimport. Full People
views cover 627/627 proposed activities and 1,792/1,792 scope-local reachable
nodes. They preserve 580/580 source steps, 1,240/1,240 details and 1,520/1,520 BDE
mappings, checked against the normalized source snapshot. This is preservation,
not independent workbook re-extraction or activity equivalence. Source quality
is 64.31% per process, and verified direct source equivalence remains 0/580.
Technology and Combined remain blocked. Missing or stale validation cannot
unlock Combined, including unrun visual checks. Comprehensive layout and
independent business accuracy are NOT RUN; reachability is not token simulation.
Run `npm run validate:workflows` from `web` after generator or source changes;
older reports are invalidated by input, dependency and artifact hashes.

The local UI now uses version CR-2026-09-17.2: 20 process-specific descriptive
models with 627 activities, dynamic phases and a consolidated change review.
The original workbook and sample BPMN remain unchanged. This is an initial
implementation, not full acceptance: source mappings, owners, applications,
timeout values, executable token simulation, full OMG XSD validation and
independent business validation remain outstanding. Retry and idempotency rules
are modelled requirements, not enforced runtime behaviour. Overview is a labelled
phase-navigation summary; detailed perspectives retain the complete routing.

The local sample-format revision adds human/capability lane projections, sample
dimensions/colors, native task markers, annotations, title/legend and connected
pool-free overview summaries. Tests compare actual sample assets and cover
scope-local membership, visible containment, timer attachment and human R.
New activity-to-BDE mappings remain unresolved, so document objects are not
fabricated. This does not establish full OMG schema conformance, runtime
correctness or approved organisational ownership.

Acceptance requires evidence for all 20 processes, not one representative:

* Each WF requirement maps to distinct domain activities, decisions, outcomes,
  and its specified variant route. Compare semantics ignoring labels, IDs, and
  layout; cosmetic differences alone fail. Reuse common subflows only where
  business behaviour is shared.
* Account for every retained, replaced, merged, or removed source row; added
  activities link to versioned requirements. Original workbook/sample stay
  unchanged.
* Test success, correction, decline, applicable withdrawal/expiry, exhaustion,
  checker rejection, partial readiness, and idempotent replay. Graph checks
  detect unreachable nodes, unbounded loops, dangling edges, unsatisfied joins,
  and missing conditions.
* Run BPMN parsing/structural and viewer checks for every generated view.
  Report parser, schema, graph, rendering, and business validation separately;
  one check must not be claimed to prove all five.
* Overview/detail views agree on branches/outcomes. Switching process replaces
  phase/step controls and review records without stale sample data. Downloads
  identify the selected process and requirements version.
* The single review box reconciles with the revised dataset and BPMN. Unknown
  facts and proposed defaults remain visible without requiring routine user
  input during generation.

## Data and Reporting Requirements

### In-Scope Data

The solution must represent every attribute in source section 6, including
process identity and classification, ownership, dates, evidence, routing,
service levels, approvals, change history, ingestion controls, data-quality
outcomes, specialist review, remediation, lineage, publication, delivery, and
completion status.

### Data Dictionary

Each finalised attribute must use the source template. It covers business and
display names, technical name, data types, nullability, classification,
provider, description, validity dates, field type, source dataset and field,
golden-source status, length and uniqueness constraints, refresh expectations,
storage, synonyms, AI restrictions, training permission, dictionary ID, and a
synthetic example. Unknown values must be marked unresolved, not invented.

### Ontology and Glossary

The metadata package must provide:

* Standard concepts across business, application, data, and relationship layers
* Clear definitions for process, step, event, role, owner, rule, measure,
  application, attribute, and data product concepts
* Composition, decomposition, sequence, ownership, assignment, constraint,
  system, data-operation, and lineage relationships
* Cardinalities, constraints, and `is-a` inheritance hierarchies
* Queryability for analysis, reporting, reuse, and interoperability

Every entity and attribute must have a standalone UK English definition of no
more than 60 words. Definitions must use genus and differentia, positive
wording, one term without circularity, and acronyms expanded at first use.

### Traceability Questions

The solution must answer:

* Which roles own, perform, approve, review, support, or receive each step?
* Which applications support each step and interface?
* Which attributes enter, leave, or change at each step?
* Which controls, rules, conditions, timers, and service levels govern a step?
* How does the process sequence and decompose end to end?
* Where does data originate, transform, publish, and reach consumers?
* Which statements are explicit, inferred, ambiguous, or unsupported?

## Business Requirements

<!-- markdownlint-disable MD013 -->

### Process Modelling

| ID | Requirement | Objective | Stakeholders | Acceptance criteria | Priority |
| --- | --- | --- | --- | --- | --- |
| BR-001 | Preserve the sample's 29 steps and give each additional process its CR-2026-09-17 workflow. | OBJ-001, OBJ-002 | Analyst, SME | Sample IDs remain traceable; WF-01 through WF-20 are covered without imposing a common step count or graph. | Must |
| BR-002 | Generate BPMN with swimlanes for participating business and system roles. | OBJ-001 | Analyst, SME | The model visibly separates roles and maps activities to documented performers. | Must |
| BR-003 | Represent required gateways, branches, joins, events, timers, loops, and maker-checker controls. | OBJ-001 | Analyst, architect | Structural and visual checks confirm documented constructs and routes. | Must |
| BR-004 | Do not silently approximate unsupported semantics. | OBJ-001, OBJ-005 | Analyst, engineer | Missing or unsupported semantics produce visible blockers or warnings tied to source steps. | Must |

### Metadata and Traceability

| ID | Requirement | Objective | Stakeholders | Acceptance criteria | Priority |
| --- | --- | --- | --- | --- | --- |
| BR-005 | Produce machine-readable process, step, role, RACI, system, attribute, data product, and lineage metadata. | OBJ-002 | Analyst, steward, engineer | The package validates against a versioned schema and contains every concept type. | Must |
| BR-006 | Retain source IDs and stable generated IDs across metadata and BPMN. | OBJ-002, OBJ-004 | Analyst, engineer | Every element resolves to metadata and source or proposed requirement IDs; merges/removals retain lineage. | Must |
| BR-007 | Represent the sample's 13 applications and supported mappings for each additional process. | OBJ-002 | Analyst, architect | Sample IDs remain covered; additional workflows use evidence-backed mappings or unresolved markers, not copied sample assignments. | Must |
| BR-008 | Represent step-level data direction, operations, transformations, controls, and lineage. | OBJ-002, OBJ-003 | Steward, analyst | Sampled mappings reproduce source IDs, attributes, direction, and logic. | Must |
| BR-009 | Distinguish evidence-supported statements from AI inferences. | OBJ-004, OBJ-005 | Analyst, SME | Claims record source location and status; inferences record confidence and rationale. | Must |

### Data and Ontology

| ID | Requirement | Objective | Stakeholders | Acceptance criteria | Priority |
| --- | --- | --- | --- | --- | --- |
| BR-010 | Apply every mandatory dictionary field to each finalised attribute. | OBJ-003 | Data steward | A report shows populated or unresolved values for every field and attribute. | Must |
| BR-011 | Provide ontology concepts, relationships, cardinalities, constraints, and `is-a` hierarchies. | OBJ-002, OBJ-004 | Steward, architect | Schema and relationship validation cover the source ontology requirements. | Must |
| BR-012 | Make metadata queryable for ownership, rules, decomposition, systems, attributes, and lineage. | OBJ-002 | Analyst, steward | Demonstration queries answer all traceability questions. | Must |
| BR-013 | Apply source glossary rules to every entity and attribute definition. | OBJ-003 | Steward, analyst | Automated and human checks confirm completeness, length, language, and definition quality. | Must |

### Analysis and Evaluation

| ID | Requirement | Objective | Stakeholders | Acceptance criteria | Priority |
| --- | --- | --- | --- | --- | --- |
| BR-014 | Identify missing, ambiguous, inconsistent, and unsupported details and recommend improvements. | OBJ-005 | Sponsor, analyst, SME | A register links findings and recommendations to source evidence and model elements. | Must |
| BR-015 | Evaluate entities, relationships, sequence, branches, grounding, BPMN validity, and dictionary completeness separately. | OBJ-001, OBJ-003, OBJ-004 | Sponsor, analyst, engineer | Each measure includes sample size, method, limitations, and artefact versions. | Must |
| BR-016 | Use deterministic normalised matching against a labelled sample for headline extraction metrics. | OBJ-004 | Engineer, sponsor | Evaluation is reproducible and does not use semantic matching or an LLM judge for headline F1. | Must |
| BR-017 | Let analysts record missing, incorrect, duplicate, unsupported, ungrounded, sequence, mapping, and other issues. | OBJ-005 | Analyst | An issue records type, severity, comment, element, and resolution status. | Should |

<!-- markdownlint-enable MD013 -->

## Benefits and High-Level Economics

Expected benefits are reduced manual interpretation, consistent process and
data metadata, stronger lineage and governance, reusable modelling patterns,
and earlier identification of process design gaps.

The preparation and demonstration spend ceiling is USD 200. This is a budget
constraint, not a validated estimate. Costs must be reported as measured when
available and unavailable when reliable measurements cannot be obtained.

## PoC Delivery Constraints

These delivery decisions support the v0.4 sample and CR-2026-09-17 scope:

* Deliver a three-day PoC using synthetic public data.
* Support one analyst and one run at a time, with fewer than 20 retained runs.
* Keep processing modules independent of the thin user interface.
* Use a versioned canonical model, stable IDs, and deterministic BPMN generation.
* Retain source evidence, prompt and schema versions, model IDs, and raw
  responses needed for reproducibility.
* Allow one automatic model-repair pass and surface remaining failures.
* Show processing status, failures, evaluation, and manual retry.
* Include BPMN Diagram Interchange coordinates and verify visible import.
* Retain run artefacts for seven days and exclude source content from telemetry.
* Treat source content as untrusted data and constrain output to schemas.
* Use managed identity and least privilege where supported.

The planned Azure services remain implementation choices. Availability,
permissions, quota, capacity, and cost are checks, not validated outcomes.

## Assumptions, Dependencies, and Risks

### Assumptions

* The v0.4 PDF governs the sample; CR-2026-09-17 governs additional workflows
  and supersedes their shared-template constraint.
* `AOB-*`, `PSD-AOB-*`, `PSDATA-AOB-*`, and `APP-*` are stable source keys.
* Synthetic examples and application aliases can be used in the demonstration.

### Dependencies

* Reproducible PDF text and table extraction
* A labelled reference sample separated from prompt tuning where practical
* BPMN tooling that supports required constructs and diagram interchange
* Available model capacity and permissions within the budget

### Risks and Mitigations

<!-- markdownlint-disable MD013 -->

| Risk | Impact | Mitigation |
| --- | --- | --- |
| PDF tables lose structure during extraction. | Incorrect relationships | Preserve page evidence, validate mappings, and flag uncertainty. |
| Aliases create duplicate identities. | Fragmented lineage | Retain source labels and model aliases explicitly. |
| BPMN tooling lacks required constructs. | Misleading process model | Test early and block export when semantics cannot be represented. |
| Source routing is ambiguous. | False precision | Record ambiguity and recommend resolution instead of inventing detail. |
| The labelled sample is small. | Misleading accuracy claims | Report counts and restrict conclusions to the evaluated sample. |

<!-- markdownlint-enable MD013 -->

## Acceptance and Approval

The PoC is ready for sponsor review when all Must requirements have objective
evidence, unresolved blockers are visible, and the demonstration includes:

1. Validated BPMN with swimlanes and required control flow.
2. Machine-readable business metadata.
3. Completed or explicitly unresolved data dictionary output.
4. Source-to-process, role, system, data, and lineage traceability.
5. Evaluation results with reproducible methods and limitations.
6. A gap, ambiguity, and improvement recommendation register.
7. Evidence for all 20 CR-2026-09-17 workflows, distinct variants, bounded
  loops, and the consolidated change box.

Acceptance confirms only the hackathon outcome. It does not approve production
use or establish an enterprise standard.

## Source and Decision Precedence

1. Later user/sponsor requirement clarifications, including CR-2026-09-17
2. [Requirements_Document_Hackthon_v4.pdf](Requirements_Document_Hackthon_v4.pdf),
   version v0.4
3. Compatible PoC delivery decisions in this document
4. Architecture decisions and implementation plans

When sources conflict, the higher-priority source governs and the conflict must
be recorded rather than silently reconciled.
