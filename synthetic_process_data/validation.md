# Synthetic Process Data Validation

## Result

Data integrity, normalization and Excel round-trip: **PASS**.
Executable BPMN readiness: **needs business confirmation**. No BPMN XML or rendering was validated.

Original: `Synthetic_Hackathon_Data_10.xlsx` (unchanged). SHA-256: `a55b15435a702802bbc3d5dbeefbedb8438ae35af66f55d3646c1585ddcaa8e3`.
Corrected workbook: [Synthetic_Hackathon_Data_10_normalized.xlsx](Synthetic_Hackathon_Data_10_normalized.xlsx).

20 process variants; 580 steps; 620 distinct per-step RACI variants.
2340 source-cell corrections, all recorded in Change Log. Source owner/RACI/detail values retained alongside normalized values.

## Corrections

- Process Step Owner: 1140 cells.
- RACI: 1180 cells.
- Detail Type: 20 cells.

## Rules

- Source sheets retained; edits fully logged; original owner/RACI/detail columns preserved.
- Existing 20 variants remain distinct; no source rows removed.
- People lanes use human teams; Maker/Checker duties stay separate.
- Application names, IDs, qualifiers and existing mapping rows remain unchanged.
- Mutually exclusive TRUE/otherwise tax branches use XOR, not inclusive OR.
- Missing apps/data stay missing; no new hosting assignments or BDEs invented.
- Control references are not a complete BPMN flow graph; display order is not execution order.
- Prior process-specific timeout/parking decisions are not silently approved for every variant.
- Source PDF/hash claims are retained but not independently verified against unavailable documents.

## Remaining Issues

These counts are affected process/step records, not structural errors. Full IDs and explanations are in Validation Issues and normalized_process_data.json.

| Issue | Count |
|---|---:|
| APPROVAL_WAIT_MODEL | 20 |
| ATTRIBUTE_ALIAS | 20 |
| CHECKER_REJECTION | 20 |
| INCIDENT_APPLICATION | 60 |
| MISSING_APPLICATION | 300 |
| NO_DATA_MAPPING | 120 |
| NO_EXPLICIT_FLOW_TABLE | 20 |
| PARALLEL_DATA_DEPENDENCY | 20 |
| RACI_CONFIRMATION | 160 |
| REMEDIATION_OUTCOMES | 20 |
| SYNTHETIC_TEMPLATE | 20 |
| TAX_RULE_VOCABULARY | 20 |

## Per-Process Coverage

| Process ID | Name | Steps | App gaps | Data gaps |
|---|---|---:|---:|---:|
| AOB-PR-1001-V01 | Retail Account Onboarding | 29 | 15 | 6 |
| AOB-PR-1001-V02 | Retail Account Onboarding - Variant A | 29 | 15 | 6 |
| AOB-PR-1002-V01 | SME Account Opening | 29 | 15 | 6 |
| AOB-PR-1002-V02 | SME Account Opening - Express | 29 | 15 | 6 |
| AOB-PR-1003-V01 | Corporate KYC Remediation | 29 | 15 | 6 |
| AOB-PR-1003-V02 | Corporate KYC Remediation - Event Driven | 29 | 15 | 6 |
| AOB-PR-1004-V01 | Trade Finance Client Setup | 29 | 15 | 6 |
| AOB-PR-1004-V02 | Trade Finance Client Setup - Multi-Entity | 29 | 15 | 6 |
| AOB-PR-1005-V01 | Treasury Counterparty Onboarding | 29 | 15 | 6 |
| AOB-PR-1005-V02 | Treasury Counterparty Onboarding - NBFI | 29 | 15 | 6 |
| AOB-PR-1006-V01 | Wealth Client Profiling | 29 | 15 | 6 |
| AOB-PR-1006-V02 | Wealth Client Profiling - UHNI | 29 | 15 | 6 |
| AOB-PR-1007-V01 | Cards Customer Enrollment | 29 | 15 | 6 |
| AOB-PR-1007-V02 | Cards Customer Enrollment - CoBrand | 29 | 15 | 6 |
| AOB-PR-1008-V01 | Merchant Onboarding (Payments) | 29 | 15 | 6 |
| AOB-PR-1008-V02 | Merchant Onboarding - Enterprise | 29 | 15 | 6 |
| AOB-PR-1009-V01 | Loan Origination Party Setup | 29 | 15 | 6 |
| AOB-PR-1009-V02 | Loan Origination Party Setup - Secured | 29 | 15 | 6 |
| AOB-PR-1010-V01 | Custody Account Setup | 29 | 15 | 6 |
| AOB-PR-1010-V02 | Custody Account Setup - Global Markets | 29 | 15 | 6 |

## Usage

Use BPMN Steps for human lanes and source-linked application capabilities; use BPMN RACI for all duty-preserving variants.
Keep Application and Step Application Mapping as inventory/many-to-many links, not sequence flows.
BPMN Control References preserves textual rules and scoped step references, not inferred executable edges.
Approve the open decisions, then build and validate BPMN XML/DI separately. The existing single-process renderer is unchanged.

Rerun: `python normalize_process_workbook.py Synthetic_Hackathon_Data_10.xlsx --output-dir synthetic_process_data`.
Requires openpyxl.
