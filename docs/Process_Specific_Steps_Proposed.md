# Proposed Process-Specific Steps

Date: 2026-09-17
Status: Proposed requirements implemented locally as descriptive BPMN (CR-2026-09-17.2); workbook unchanged; independent business validation outstanding.

## Purpose and Baseline

This standalone file records the proposed steps and routing changes for the
20 business processes in `Synthetic_Hackathon_Data_10_normalized.xlsx`.
It elaborates CR-2026-09-17 in [Business requirements](BusinessRequiremnts.md).

The source workbook has 29 rows per process. The previous implementation mapped
them to the same sample `AOB-001` through `AOB-029` graph: 580 source steps in total. The proposal has
627 detailed activity definitions across process-specific flows of 20 to 44
steps. This revision expands the earlier 163 high-level activities; it does
not add padding to meet a quota. Twenty-nine is neither a minimum nor a maximum.
Counts exclude gateways, timers, start/end events, runtime repetitions, and
additional instances of per-entity/channel/market work. They are not final
BPMN element counts or changes to source AOB IDs.

The proposed workflows differ in activities and routing, not just labels.
They are synthetic PoC designs, not independently validated HSBC procedures
or regulatory requirements. Missing policy facts remain unresolved.
Sample Process Onboarding and the original workbook remain unchanged.

## Step Counts

| Requirement | Process | Current source steps | Proposed detailed steps |
| --- | --- | ---: | ---: |
| WF-01 | Retail Account Onboarding | 29 | 24 |
| WF-02 | Retail Account Onboarding - Variant A | 29 | 28 |
| WF-03 | SME Account Opening | 29 | 32 |
| WF-04 | SME Account Opening - Express | 29 | 20 |
| WF-05 | Corporate KYC Remediation | 29 | 34 |
| WF-06 | Corporate KYC Remediation - Event Driven | 29 | 26 |
| WF-07 | Trade Finance Client Setup | 29 | 36 |
| WF-08 | Trade Finance Client Setup - Multi-Entity | 29 | 42 |
| WF-09 | Treasury Counterparty Onboarding | 29 | 30 |
| WF-10 | Treasury Counterparty Onboarding - NBFI | 29 | 38 |
| WF-11 | Wealth Client Profiling | 29 | 22 |
| WF-12 | Wealth Client Profiling - UHNI | 29 | 35 |
| WF-13 | Cards Customer Enrollment | 29 | 25 |
| WF-14 | Cards Customer Enrollment - CoBrand | 29 | 31 |
| WF-15 | Merchant Onboarding (Payments) | 29 | 33 |
| WF-16 | Merchant Onboarding - Enterprise | 29 | 44 |
| WF-17 | Loan Origination Party Setup | 29 | 23 |
| WF-18 | Loan Origination Party Setup - Secured | 29 | 37 |
| WF-19 | Custody Account Setup | 29 | 27 |
| WF-20 | Custody Account Setup - Global Markets | 29 | 40 |
| Total | 20 processes | 580 | 627 |

## Proposed Steps and Changes

Each numbered list defines detailed activities, including conditional reviews.
Ascending order is the default route, not an instruction to execute every
conditional activity. The routing notes override it for branches, joins,
transfers, and corrections. Activities marked "if required" are bypassed only
with a recorded not-applicable reason; unresolved applicability means hold.
Each proposal ID is formed from its requirement and three-digit list position,
for example `WF-01-S001`. These are proposed requirement IDs, not source AOB IDs.
Repeated entity/channel/market activities have one definition and separately
identified runtime instances. A failed instance must not replay completed peers.
The change notes compare the proposal with shared-template behaviour; they
are not a cell-level audit of changes already made to the source workbook.

### WF-01: Retail Account Onboarding

1. Register application and case identifier.
2. Record consent and privacy acknowledgement.
3. Capture personal details.
4. Capture residence and contact details.
5. Capture intended account use.
6. Collect identity evidence.
7. Validate evidence completeness and readability.
8. Verify identity against supplied evidence.
9. Verify contact-channel ownership.
10. Search for an existing customer record.
11. Resolve ambiguous customer matches if required.
12. Perform customer screening.
13. Review potential screening matches if required.
14. Assess customer risk and additional evidence needs.
15. Collect and assess enhanced evidence if required.
16. Check product eligibility.
17. Present account terms and disclosures.
18. Record customer acceptance.
19. Obtain opening approval.
20. Create or link the customer master.
21. Create the account using an idempotent request.
22. Configure digital-access entitlements.
23. Verify account readiness and activate access.
24. Notify the customer and close the case.

Change: Expand identity, duplicate resolution, screening, product, and access
controls into 24 activities. Evidence failure returns to step 6 and repeats
step 7 and step 8. An ambiguous match enters step 11 before step 12; otherwise
bypass step 11. A screening hit enters step 13 for clearance, hold, or decline;
clear cases proceed to step 14. Product ineligibility returns to step 16 for
an eligible selection or closes as declined. Approval corrections return to
the affected capture/check and repeat step 19. Provisioning retries only the
failed step 20, step 21, or step 22, then repeat readiness at step 23.

### WF-02: Retail Account Onboarding - Variant A

1. Register the branch visit and application case.
2. Capture the customer's assisted-service needs.
3. Explain privacy terms and record consent.
4. Capture personal details with the customer.
5. Capture residence and contact details.
6. Inspect original identity documents.
7. Record document authenticity checks.
8. Capture legible evidence copies.
9. Record the staff verifier's attestation.
10. Compare captured details with original evidence.
11. Obtain corrected evidence for discrepancies if required.
12. Verify contact details with the customer.
13. Search existing customer records.
14. Resolve potential duplicate identities if required.
15. Run customer screening.
16. Obtain compliance disposition for screening hits if required.
17. Record intended account use and funding expectations.
18. Assess customer risk.
19. Obtain enhanced-diligence clearance if required.
20. Select an eligible account product.
21. Explain account terms and charges.
22. Obtain customer signature or recorded acceptance.
23. Submit the branch evidence pack for independent checking.
24. Record independent opening approval.
25. Create or link the customer and account records.
26. Configure the agreed access channels.
27. Complete identity-checked access handover.
28. Issue confirmation and archive the branch evidence pack.

Change: Add original-document inspection, staff attestation, signature, and
handover controls rather than copying the digital route. Discrepancies at
step 10 enter step 11 then repeat step 6 through step 10; clear cases bypass
step 11. Unreadable copies repeat step 8. Screening hits stop at step 16 until
clearance or decline. Checker findings return to the affected evidence step
and repeat step 23 and step 24. Failed handover returns to step 27 after
identity correction without recreating the account. The branch interpretation
of Variant A remains a proposed design assumption.

### WF-03: SME Account Opening

1. Register the company application.
2. Record the applicant's authority and consent.
3. Capture legal and trading names.
4. Capture registration and incorporation details.
5. Validate the company registry record.
6. Collect incorporation evidence.
7. Capture registered and operating addresses.
8. Capture business activities and expected turnover.
9. Map direct shareholders.
10. Trace indirect ownership chains.
11. Identify beneficial owners under the applicable policy.
12. Collect beneficial-owner identity evidence.
13. Verify beneficial-owner identities.
14. Identify directors and authorised signatories.
15. Verify director and signatory identities.
16. Screen the company.
17. Screen owners and relevant associated parties.
18. Resolve screening matches if required.
19. Assess jurisdiction and business-activity risk.
20. Collect enhanced business evidence if required.
21. Search for existing company/customer records.
22. Resolve duplicate company matches if required.
23. Define account products and currencies.
24. Capture the operating mandate.
25. Validate signing rules and authority evidence.
26. Obtain acceptance of account terms.
27. Independently review the ownership and mandate pack.
28. Approve account opening and mandate.
29. Create or link the company customer master.
30. Open approved accounts.
31. Configure and verify signing permissions.
32. Activate the mandate and notify the company.

Change: Expand ownership tracing, associated-party checks, and signing controls.
Ownership gaps return to step 9 and repeat dependent identity/screening checks.
Company screening at step 16 and party screening at step 17 may run in parallel
after their inputs are ready; both must finish before step 18. Mandate defects
return to step 24 and repeat step 25, step 27, and step 28. Unresolved ownership
or screening issues hold/decline the case. Permission-test failures repeat
step 31, not account opening.

### WF-04: SME Account Opening - Express

1. Register the express request.
2. Confirm the applicant's authority and consent.
3. Identify an existing verified company record.
4. Evaluate express-route eligibility.
5. Retrieve the approved company evidence pack.
6. Check evidence freshness and reuse permission.
7. Confirm unchanged ownership and business activities.
8. Confirm signatory identities and authority remain valid.
9. Run current company screening.
10. Run current owner/signatory screening.
11. Assess express-route risk conditions.
12. Select an eligible express product.
13. Confirm the operating mandate.
14. Obtain acceptance of current terms.
15. Check the reused evidence and changed fields.
16. Record the express opening decision.
17. Link the existing customer record.
18. Create the approved account.
19. Apply and test the mandate permissions.
20. Activate access and issue confirmation.

Change: Keep this route shorter because validated evidence is reused. Failure
at step 4 transfers to WF-03 step 3; stale evidence at step 6 transfers to
WF-03 step 6; changed ownership at step 7 transfers to WF-03 step 9. Screening
hits transfer to WF-03 step 18 with both screening results. Transfers retain
the case/evidence and end express processing. No screening concerns are
automatically cleared; changed mandate data is revalidated before step 16.

### WF-05: Corporate KYC Remediation

1. Select the corporate review population.
2. Assign a case owner and review priority.
3. Confirm the customer and linked legal entities.
4. Retrieve the current KYC snapshot.
5. Determine the applicable evidence requirements.
6. Compare existing data with those requirements.
7. Build a field-level remediation plan.
8. Send a consolidated evidence request.
9. Record response deadlines and communication preferences.
10. Receive customer documents.
11. Validate completeness and document authenticity.
12. Refresh corporate registration details.
13. Refresh operating activities and jurisdictions.
14. Reconstruct the ownership structure.
15. Reidentify beneficial owners.
16. Verify new or changed owners.
17. Verify directors and authorised signatories.
18. Update expected activity and funding information.
19. Screen the corporate entity.
20. Screen associated parties.
21. Assess screening matches if required.
22. Assess adverse information where required by policy.
23. Reassess the customer risk classification.
24. Obtain enhanced-diligence findings if required.
25. Resolve contradictory evidence if required.
26. Submit the revised KYC pack for independent review.
27. Record the reviewer's disposition.
28. Approve the revised risk and review outcome.
29. Apply approved KYC changes with version history.
30. Record any authorised restriction or removal of restriction.
31. Synchronise the approved customer risk information.
32. Verify downstream acknowledgement.
33. Set the next review trigger or date.
34. Notify relevant owners and close the review.

Change: Add population selection, evidence gaps, ownership refresh, approval,
and controlled downstream updates without creating a new account. Incomplete
evidence at step 11 returns to step 8. Non-response at step 9 enters an owned
escalation, not assumed closure/restriction. Contradictions at step 25 return
to the affected evidence task and re-run dependent checks. Reviewer correction
at step 27 returns to step 7 and requires step 26 through step 28 again.
Screening branches at step 19 and step 20 join before step 21. Delivery failures
repeat only step 31 for the unacknowledged destination, then step 32.

### WF-06: Corporate KYC Remediation - Event Driven

1. Receive the customer-change event.
2. Validate event origin and required fields.
3. Correlate the event to a customer and entity.
4. Detect duplicate or already handled events.
5. Retrieve the current KYC version.
6. Classify the change type.
7. Assess materiality and urgency.
8. Define the impacted KYC fields and controls.
9. Preserve unaffected evidence with its validity basis.
10. Assign the targeted review owner.
11. Request change-specific supporting evidence.
12. Validate the received evidence.
13. Update changed corporate or activity fields.
14. Reconstruct affected ownership relationships if required.
15. Verify newly affected parties if required.
16. Screen the changed entity/party scope.
17. Resolve screening concerns if required.
18. Reassess the effect on customer risk.
19. Obtain specialist input if required.
20. Independently review the targeted changes.
21. Approve the revised KYC/risk outcome.
22. Apply versioned changes with the originating event ID.
23. Update impacted monitoring or restriction instructions.
24. Notify affected downstream consumers.
25. Confirm acknowledgement and record event disposition.
26. Close the event-linked review.

Change: Scope remediation to a material event instead of redoing the full KYC
population review. Duplicate events at step 4 link to the existing case and
close; non-material events at step 7 close with rationale. Bad evidence at
step 12 returns to step 11. New material facts return to step 7 and recompute
scope; reviewer corrections return to step 8 and repeat step 20 and step 21.
Downstream retries resume step 24 only for affected failed destinations.

### WF-07: Trade Finance Client Setup

1. Register the trade-facility request.
2. Confirm applicant authority and requested products.
3. Retrieve or establish the client identity evidence.
4. Verify legal entity details.
5. Verify relevant owners and signatories.
6. Capture the trading business model.
7. Capture goods and service categories.
8. Identify trading countries and transport routes.
9. Capture expected transaction volumes and currencies.
10. Identify material trade counterparties.
11. Screen the client and associated parties.
12. Screen relevant counterparties and trade restrictions.
13. Resolve screening or restriction concerns if required.
14. Assess trade-specific financial-crime risk.
15. Collect additional trade evidence if required.
16. Capture the requested credit facility.
17. Obtain financial statements and credit inputs.
18. Assess facility creditworthiness.
19. Define proposed collateral and guarantee requirements.
20. Propose product and currency limits.
21. Obtain credit approval.
22. Draft facility and trade-product agreements.
23. Complete legal review of agreements.
24. Obtain authorised signatures.
25. Confirm collateral and other activation prerequisites.
26. Independently review the complete setup pack.
27. Approve activation scope and limits.
28. Create or link the facility record.
29. Configure product and currency limits.
30. Configure customer channel access.
31. Configure maker/checker entitlements.
32. Validate settlement and charging instructions.
33. Test trade submission and approval entitlements.
34. Reconcile configuration with approved terms.
35. Activate approved trade products.
36. Notify the client and retain the activation evidence.

Change: Expand trade risk, credit, legal execution, and entitlement testing.
Screening concerns stop at step 13 pending clearance/decline. Credit changes
return to step 17 and repeat step 18 through step 21. Legal defects return to
step 22; material term changes require credit reapproval at step 21. Missing
prerequisites hold step 25. Entitlement failures return to step 30 or step 31,
then repeat step 33 and step 34 before activation.

### WF-08: Trade Finance Client Setup - Multi-Entity

1. Register the group facility request.
2. Identify the parent and participating legal entities.
3. Map ownership and control relationships.
4. Confirm the sponsor's authority for each entity.
5. Define requested products and countries by entity.
6. Assign entity review owners.
7. Collect each entity's registration evidence.
8. Verify each entity's legal identity.
9. Identify entity owners and signatories.
10. Verify associated-party identities.
11. Capture each entity's trade profile.
12. Capture entity transaction volumes and currencies.
13. Screen each entity and associated parties.
14. Assess entity trade restrictions and counterparties.
15. Resolve entity screening concerns if required.
16. Assign entity risk outcomes.
17. Collect entity financial and credit evidence.
18. Assess entity credit exposure.
19. Review local legal capacity and agreement requirements.
20. Reconcile entity review readiness.
21. Aggregate group exposure and concentrations.
22. Assess cross-guarantees and shared collateral if required.
23. Allocate entity and product sublimits.
24. Approve the group credit structure.
25. Draft group agreements.
26. Draft entity agreements and local addenda.
27. Complete group and local legal review.
28. Obtain authorised group and entity signatures.
29. Confirm collateral and conditions precedent.
30. Record the explicitly approved entity activation scope.
31. Independently review group and entity setup packs.
32. Create or link the group facility hierarchy.
33. Configure entity facilities and sublimits.
34. Configure cross-entity access boundaries.
35. Configure signatory and maker/checker rules per entity.
36. Validate entity settlement instructions.
37. Test entity product access.
38. Test group-level exposure aggregation.
39. Reconcile every activation-scope entity's readiness.
40. Approve the coordinated activation release.
41. Activate only the approved entities and products.
42. Issue entity-specific confirmations and record exclusions.

Change: Run step 7 through step 19 per entity, then join at step 20 before
group exposure work. Failed entity checks return to that entity's evidence
or review task, not completed peers. Entity exclusion at step 30 requires
step 21 through step 24 again with the changed scope and affected legal
review, then step 30 and step 31. Failed tests return to the affected step 33,
step 34, or step 35 before repeating step 37 through step 40. Readiness joins
must cover all explicitly in-scope entities; no silent partial completion.

### WF-09: Treasury Counterparty Onboarding

1. Register the counterparty request.
2. Capture legal name and entity identifiers.
3. Verify incorporation and legal capacity.
4. Identify ownership and authorised contacts.
5. Retrieve available diligence evidence.
6. Screen the entity and relevant parties.
7. Resolve screening concerns if required.
8. Identify requested treasury products.
9. Confirm dealing and settlement jurisdictions.
10. Collect financial and credit information.
11. Assess counterparty credit risk.
12. Assess settlement and operational risk.
13. Propose product, tenor, and exposure limits.
14. Obtain credit-limit approval.
15. Determine required trading agreements.
16. Negotiate agreement terms.
17. Complete legal review.
18. Obtain authorised execution of agreements.
19. Record collateral/netting applicability and approvals.
20. Collect standing settlement instructions.
21. Authenticate instructions through an independent channel.
22. Validate account, currency, and routing details.
23. Independently review the counterparty setup pack.
24. Create or link the counterparty master.
25. Configure approved products and limits.
26. Configure settlement instructions.
27. Configure trader and operations access.
28. Test dealing permissions and settlement routing.
29. Approve readiness and activate the counterparty.
30. Notify dealing/operations teams and archive evidence.

Change: Separate credit, legal execution, independent instruction validation,
and operational readiness. Agreement corrections return to step 16 and repeat
step 17 and step 18; changed credit terms also repeat step 13 and step 14.
Instruction failures return to step 20 and repeat step 21 and step 22. Failed
routing tests return to step 26; permission failures return to step 27. Both
approved limits and verified instructions are required before step 29.

### WF-10: Treasury Counterparty Onboarding - NBFI

1. Register the NBFI onboarding request.
2. Classify the institution and business model.
3. Identify requested products and jurisdictions.
4. Verify legal entity registration.
5. Verify licence, exemption, or applicable status.
6. Capture supervisory and regulatory evidence.
7. Map ownership and control.
8. Verify controllers and authorised representatives.
9. Identify material funding sources.
10. Assess funding concentration and stability.
11. Review liquidity information.
12. Review leverage and asset composition.
13. Assess client-money or custody arrangements where applicable.
14. Screen the institution and relevant parties.
15. Resolve screening or status concerns if required.
16. Collect enhanced-diligence evidence.
17. Assess governance and financial-crime controls.
18. Record the enhanced-diligence outcome.
19. Collect credit and financial evidence.
20. Assess counterparty credit risk.
21. Evaluate product and tenor suitability for the institution.
22. Define collateral and margin requirements.
23. Propose exposure and concentration limits.
24. Obtain credit and risk approval.
25. Negotiate trading agreements.
26. Negotiate collateral documentation.
27. Complete legal review and execution.
28. Confirm collateral/operational prerequisites.
29. Collect standing settlement instructions.
30. Independently authenticate settlement instructions.
31. Validate currency, account, and routing details.
32. Review the complete activation pack independently.
33. Create or link the counterparty record.
34. Configure product restrictions and limits.
35. Configure collateral and margin operations.
36. Configure settlement and access permissions.
37. Test product restrictions, collateral operations, and settlement.
38. Activate permitted products and notify operations.

Change: Add status, funding, liquidity, governance, and collateral controls.
Unresolved status at step 5 enters hold/decline; evidence remediation repeats
step 5 and step 6 before progression. Funding gaps return to step 9, and
enhanced-diligence gaps return to step 16. Collateral changes return to step 22
and repeat approval at step 24 plus affected agreements. Settlement failures
return to step 29. Readiness test failures return only to the affected step 34,
step 35, or step 36 and repeat step 37; no unrestricted activation is allowed.

### WF-11: Wealth Client Profiling

1. Register the profiling request and client identity.
2. Record consent for collecting profile information.
3. Capture investment objectives.
4. Capture investment time horizon.
5. Capture income and recurring commitments.
6. Capture assets and liabilities.
7. Determine liquidity and emergency-funding needs.
8. Assess financial capacity for loss.
9. Assess investment knowledge.
10. Capture prior investment experience.
11. Assess risk tolerance.
12. Record client restrictions and preferences.
13. Check questionnaire completeness.
14. Compare objectives, capacity, and tolerance for consistency.
15. Discuss and correct conflicting answers if required.
16. Derive the proposed suitability profile.
17. Review the profile against supporting responses.
18. Explain profile implications and limitations to the client.
19. Obtain client acknowledgement.
20. Approve and version the profile.
21. Publish the profile to authorised advisory users.
22. Set a review trigger and notify the client.

Change: Decompose suitability into capacity, knowledge, experience, tolerance,
and acknowledgement, without unnecessary account provisioning. Incomplete
responses return from step 13 to the affected capture task. Contradictions
enter step 15 then repeat step 14; consistent responses bypass step 15.
Declined acknowledgement at step 19 returns to step 18 for discussion, then
to affected assessment tasks if facts change, or closes as withdrawn. A profile
is not approval of a particular trade.

### WF-12: Wealth Client Profiling - UHNI

1. Register the UHNI profiling engagement.
2. Confirm authorised participants and consent.
3. Map household members and relevant legal entities.
4. Identify beneficial interests and decision authorities.
5. Define the scope of consolidated profiling.
6. Collect source-of-wealth explanations.
7. Obtain evidence supporting material wealth sources.
8. Validate source-of-wealth consistency.
9. Collect current source-of-funds information.
10. Screen relevant parties and jurisdictions.
11. Resolve enhanced-diligence concerns if required.
12. Inventory liquid investment holdings.
13. Inventory private, illiquid, and concentrated holdings.
14. Capture liabilities and pledged assets.
15. Identify currencies and cross-border exposures.
16. Assess household liquidity needs.
17. Assess entity-specific cash commitments.
18. Capture investment and succession objectives.
19. Assess investment knowledge and complex-product experience.
20. Assess risk tolerance by decision-making party.
21. Assess consolidated capacity for loss.
22. Identify concentration and liquidity conflicts.
23. Obtain specialist input on complex holdings if required.
24. Define entity-specific restrictions.
25. Reconcile completed entity-level assessments.
26. Draft the consolidated suitability profile.
27. Perform specialist suitability review.
28. Resolve review inconsistencies if required.
29. Agree mandate constraints and permitted scope.
30. Explain the profile to authorised participants.
31. Obtain required acknowledgements.
32. Independently approve the consolidated profile.
33. Publish versioned household/entity profiles.
34. Configure monitoring and review triggers.
35. Notify relationship owners and retain evidence.

Change: Expand wealth evidence, complex assets, entity assessments, and mandate
restrictions. Bad wealth evidence returns to step 6 and repeat step 7 and
step 8. Entity-specific assessments may run independently but must reconcile
at step 25 before consolidation. Scope exclusions require step 5 again and
reassessment of consolidated capacity. Reviewer issues enter step 28 then
return to the affected assessment and repeat step 26 and step 27. Step 32
requires all acknowledgements in the approved scope; missing consent cannot
be treated as a successful join.

### WF-13: Cards Customer Enrollment

1. Register the card application.
2. Record consent and required disclosures.
3. Capture personal and contact details.
4. Collect identity evidence.
5. Verify identity.
6. Search for existing customer/card applications.
7. Resolve potential duplicate applications if required.
8. Run customer screening.
9. Resolve screening concerns if required.
10. Capture employment, income, and commitments.
11. Obtain authorised credit information.
12. Assess affordability.
13. Assess credit risk.
14. Record the credit decision.
15. Determine the approved card product and limit.
16. Present pricing and card terms.
17. Record customer acceptance.
18. Confirm delivery address and method.
19. Create or link the card account.
20. Provision the physical or digital card.
21. Dispatch the card or secure digital-access details.
22. Confirm delivery outcome.
23. Authenticate the activation request.
24. Activate the matching issued card.
25. Send confirmation and record servicing handoff.

Change: Separate affordability, credit, issuance, delivery, and activation.
Identity failure returns to step 4. Missing credit evidence returns to step 10
or step 11 and repeats assessment; decline at step 14 ends the application.
Failed delivery at step 22 returns to step 18 and retries step 21 only for
the existing issued card. Authentication failure at step 23 holds activation
for verified correction and bounded retry; it never triggers new issuance.

### WF-14: Cards Customer Enrollment - CoBrand

1. Receive the partner referral.
2. Validate partner origin and referral identifier.
3. Deduplicate the referral.
4. Record bank and partner data-sharing consent.
5. Capture partner membership details.
6. Validate membership eligibility with the partner.
7. Resolve membership/identity mismatches if required.
8. Capture customer application details.
9. Collect identity evidence.
10. Verify identity and existing customer matches.
11. Run customer screening.
12. Resolve screening concerns if required.
13. Capture income and financial commitments.
14. Retrieve authorised credit information.
15. Assess affordability and credit risk.
16. Record the card credit decision.
17. Determine product eligibility and limit.
18. Present card pricing and terms.
19. Present partner rewards terms and preferences.
20. Record acceptance of applicable terms.
21. Confirm delivery details.
22. Create or link the card account.
23. Provision the co-branded card.
24. Request rewards-account linkage with the partner.
25. Validate the rewards-link acknowledgement.
26. Dispatch the card or digital-access details.
27. Confirm delivery outcome.
28. Authenticate the activation request.
29. Activate the issued card.
30. Reconcile card and rewards readiness.
31. Confirm combined enrollment and retain partner references.

Change: Add partner referral, separate consents, membership, and rewards-link
controls. Duplicate referrals at step 3 reuse the existing case. Membership
errors enter step 7 then return to step 5; ineligible cases close. Credit
decline at step 16 stops issuance. After step 23, rewards work at step 24 and
step 25 may run parallel to delivery/activation at step 26 through step 29;
both join at step 30. Failed linkage retries step 24 only. Failed delivery
returns to step 21 and step 26, not issuance. Combined completion requires
both branches even if the card is already active.

### WF-15: Merchant Onboarding (Payments)

1. Register the merchant application.
2. Confirm applicant authority and consent.
3. Capture legal and trading details.
4. Verify business registration.
5. Identify beneficial owners and controllers.
6. Verify relevant party identities.
7. Capture sales channels and trading locations.
8. Capture goods, services, and merchant category.
9. Review website or point-of-sale business evidence.
10. Check prohibited and restricted activity rules.
11. Screen the merchant and associated parties.
12. Resolve screening or activity concerns if required.
13. Capture expected payment volumes and ticket sizes.
14. Capture refund, chargeback, and fulfilment practices.
15. Assess fraud and payment-processing risk.
16. Assess financial and settlement exposure.
17. Define proposed limits and reserves if applicable.
18. Record underwriting approval.
19. Agree pricing and settlement terms.
20. Obtain acceptance of the merchant agreement.
21. Collect settlement-account details.
22. Verify account ownership and routing.
23. Confirm applicable security/integration prerequisites.
24. Create merchant and terminal/channel identifiers.
25. Configure the payment gateway.
26. Configure fraud controls and processing limits.
27. Configure settlement and refund routes.
28. Provision authorised merchant-user access.
29. Test authorisation, capture, and refund processing.
30. Test settlement and reconciliation.
31. Resolve certification findings if required.
32. Approve readiness and enable processing.
33. Issue merchant confirmation and monitoring handoff.

Change: Add activity restrictions, payment exposure, ownership verification,
and transaction/settlement certification. Prohibited activity at step 10
declines; uncertain activity enters step 12 for a decision. Underwriting
corrections return to step 13 or step 14 and repeat step 15 through step 18.
Account-validation errors return to step 21. Failed tests enter step 31,
return to the affected step 25 through step 28, and repeat step 29 and step 30.
Passed tests bypass step 31; processing remains disabled until step 32.

### WF-16: Merchant Onboarding - Enterprise

1. Register the enterprise merchant programme.
2. Identify the sponsor and authorised entity representatives.
3. Map legal entities and ownership.
4. Map outlets, brands, channels, and countries.
5. Define proposed rollout scope and waves.
6. Collect entity registration evidence.
7. Verify entity identities.
8. Verify relevant owners and controllers.
9. Capture goods and services by channel.
10. Assess merchant categories and restricted activities.
11. Screen entities and relevant parties.
12. Resolve entity screening concerns if required.
13. Capture channel volumes and transaction profiles.
14. Assess channel fulfilment and chargeback exposure.
15. Review channel fraud and security controls.
16. Reconcile completed entity/channel risk assessments.
17. Aggregate enterprise payment and settlement exposure.
18. Define enterprise limits and reserve requirements.
19. Allocate channel and entity sublimits.
20. Obtain enterprise underwriting approval.
21. Design the enterprise settlement model.
22. Capture settlement accounts by entity and currency.
23. Verify settlement-account ownership.
24. Agree enterprise commercial terms.
25. Execute master and entity agreements.
26. Define routing and reconciliation requirements.
27. Approve the integration design.
28. Create the merchant identifier hierarchy.
29. Configure gateway integrations per channel.
30. Configure terminal or application credentials.
31. Configure limits, fraud rules, and access rights.
32. Configure settlement and refund routing.
33. Configure entity/channel reconciliation reporting.
34. Test authorisation and capture per channel.
35. Test refunds and exception handling per channel.
36. Test settlement and reconciliation per channel.
37. Resolve channel certification findings if required.
38. Aggregate readiness for the proposed rollout wave.
39. Approve wave activation and rollback arrangements.
40. Activate the approved wave.
41. Monitor initial processing and reconciliation.
42. Resolve or roll back failed wave components if required.
43. Approve progression to the next wave if any.
44. Close programme onboarding and hand off monitoring.

Change: Add enterprise hierarchy, aggregate underwriting, channel certification,
and controlled rollout. Entity/channel reviews join at step 16. Certification
at step 34 through step 37 runs per channel; failures return only to affected
configuration at step 29 through step 33 and retest. Each wave joins at step 38
and needs step 39 approval. Failed production checks at step 41 enter step 42
for owned remediation/rollback and return to affected certification before
step 38; settled transactions must not be blindly reversed. Healthy waves
bypass step 42. Step 43 advances to step 38 for the next defined wave, bounded
by the approved wave list; after the last wave proceed to step 44. Completed
waves are never reactivated by retry.

### WF-17: Loan Origination Party Setup

1. Register the party-setup request and origination reference.
2. Identify borrower and associated party types.
3. Capture consent and permitted data uses.
4. Capture party names and identifiers.
5. Capture contact and address information.
6. Collect identity or incorporation evidence.
7. Validate evidence completeness.
8. Search the party master for existing matches.
9. Resolve ambiguous identity matches if required.
10. Verify individual or legal entity identity.
11. Capture relevant ownership/control details.
12. Screen parties under applicable onboarding policy.
13. Resolve screening concerns if required.
14. Identify borrower, co-borrower, and guarantor roles.
15. Capture party-to-party relationships.
16. Collect authority and representation evidence.
17. Validate authority for each requested role.
18. Check relationship consistency and duplicate roles.
19. Independently review the party pack.
20. Approve party data and relationship scope.
21. Create or link party master records idempotently.
22. Publish relationships to the origination case.
23. Confirm acceptance and hand off for lending assessment.

Change: Expand party identity, authority, relationships, and origination handoff
without adding lending decisions to setup. Evidence gaps return to step 6.
Ambiguous matches enter step 9 then repeat step 8; clear matches bypass it.
Authority failures return to step 16. Relationship corrections return to
step 14 or step 15, repeat step 18, then step 19 and step 20. Handoff failures
retry step 22 without duplicating master records. This does not approve or
disburse a loan.

### WF-18: Loan Origination Party Setup - Secured

1. Register the secured-party setup request.
2. Link the origination case and proposed security references.
3. Identify borrowers and co-borrowers.
4. Identify guarantors and third-party security providers.
5. Record consent and representation permissions.
6. Capture each party's identity and contact details.
7. Collect individual or entity identity evidence.
8. Validate evidence completeness.
9. Search for existing party master matches.
10. Resolve ambiguous matches if required.
11. Verify party identities.
12. Capture relevant ownership and control structures.
13. Screen parties under applicable policy.
14. Resolve screening concerns if required.
15. Define borrower and guarantor roles.
16. Define security-provider roles.
17. Capture party-to-party relationships.
18. Collect authority to act and sign for each party.
19. Validate representative and signatory authority.
20. Capture asset/security references supplied by the applicant.
21. Collect evidence of security ownership.
22. Compare ownership evidence with security-provider identities.
23. Identify joint owners or additional required providers.
24. Obtain missing party consents or authority evidence if required.
25. Link parties to the appropriate collateral references.
26. Validate guarantor and security-provider relationship scope.
27. Record reported competing interests for downstream legal review.
28. Identify outstanding valuation and legal-perfection prerequisites.
29. Reconcile the identity, authority, and security linkage pack.
30. Obtain specialist clarification of linkage ambiguities if required.
31. Independently review the complete party/security pack.
32. Approve party data and proposed linkage scope.
33. Create or link party master records.
34. Record approved party-to-security relationships.
35. Publish the package with unresolved downstream prerequisites.
36. Confirm receipt by origination and collateral/legal owners.
37. Close setup and hand off outstanding prerequisite ownership.

Change: Add security-provider identification, ownership comparison, joint-party
consent, and explicit downstream legal/valuation handoff. Ownership mismatch
at step 22 returns to step 21; newly identified providers at step 23 repeat
step 4 through step 19 for those parties only. Missing authority returns to
step 18. Linkage issues at step 26 or step 30 return to step 25 and repeat
step 29 through step 32. Failed handoff retries step 35 only. Step 28 and
step 35 must preserve unresolved valuation, perfection, and lending gates;
setup completion cannot imply those downstream decisions are approved.

### WF-19: Custody Account Setup

1. Register the custody mandate request.
2. Confirm client identity and representative authority.
3. Retrieve or collect client diligence evidence.
4. Verify legal identity and relevant ownership details.
5. Screen the client and relevant parties.
6. Resolve screening concerns if required.
7. Identify requested custody services and asset types.
8. Determine eligible markets and investor status.
9. Collect applicable tax documentation.
10. Validate tax-document completeness and status.
11. Agree account ownership and segregation requirements.
12. Agree asset-servicing instructions.
13. Collect settlement and cash-account instructions.
14. Independently verify settlement instructions.
15. Agree reporting recipients and delivery formats.
16. Present custody terms and fee arrangements.
17. Obtain authorised mandate execution.
18. Independently review the setup pack.
19. Approve account scope and restrictions.
20. Create the custody account idempotently.
21. Configure eligible asset types and market restrictions.
22. Configure settlement and cash-account links.
23. Configure asset servicing and reporting.
24. Provision authorised user access.
25. Test settlement, servicing, and reporting readiness.
26. Approve readiness and activate the account.
27. Confirm activation and hand off to custody operations.

Change: Separate custody ownership, tax, settlement, servicing, and reporting
controls. Ineligible market requests at step 8 are excluded with explicit
scope agreement or declined. Tax failures return to step 9; instruction
failures return to step 13 and repeat step 14. Checker changes require
step 18 and step 19 again. Failed tests return to the affected step 21 through
step 24 and repeat step 25; account creation is not repeated. Restricted
markets remain disabled at activation.

### WF-20: Custody Account Setup - Global Markets

1. Register the global custody request.
2. Confirm client identity and authorised mandate scope.
3. Retrieve approved client diligence evidence.
4. Screen the client and relevant parties.
5. Resolve screening concerns if required.
6. List requested markets, currencies, and asset classes.
7. Map investing legal entities to each market.
8. Assign market onboarding owners.
9. Assess jurisdiction and investor eligibility per market.
10. Identify local registration and investor-ID requirements.
11. Confirm a suitable sub-custodian or local servicing arrangement.
12. Review market-specific operating constraints.
13. Collect local investor registration evidence.
14. Validate or obtain local investor identifiers where required.
15. Collect market-specific tax documentation.
16. Validate tax status and relief eligibility evidence.
17. Agree local account ownership and segregation arrangements.
18. Capture local settlement instructions.
19. Independently verify market settlement instructions.
20. Capture currency cash-funding arrangements.
21. Validate local cut-offs and settlement-calendar requirements.
22. Define local corporate-action and income instructions.
23. Define market reporting and reconciliation requirements.
24. Complete local mandate or account documentation.
25. Obtain local legal/operations clearance where required.
26. Reconcile each market's documentary readiness.
27. Approve the intended enabled-market scope and exclusions.
28. Create or link global and local account references.
29. Configure market and instrument restrictions.
30. Configure local settlement and currency cash links.
31. Configure corporate-action and income servicing.
32. Configure market-level reporting and reconciliation.
33. Provision authorised market access.
34. Test local settlement and cash funding.
35. Test market servicing and reporting.
36. Resolve market certification findings if required.
37. Aggregate readiness across the approved activation scope.
38. Approve release of ready markets and document exclusions.
39. Activate only approved markets and currencies.
40. Notify stakeholders and track deferred-market follow-up.

Change: Add local registration, tax, sub-custody, currency, and servicing
controls. Step 9 through step 26 runs independently per market; unresolved
eligibility at step 9 holds that market rather than proceeding. Documentary
failures return to the affected step 13, step 15, or step 18 and revalidate.
After scope approval, step 28 through step 36 runs per market; failed tests
enter step 36 then return to affected configuration at step 29 through step 33
and retest. Readiness joins at step 37 cover the approved scope only. Changing
scope at step 38 requires step 27 approval again; exclusions remain recorded
as deferred/declined, never complete. Already active markets are not replayed.

## Shared Loop and Control Requirements

* Record conditions, return destination, owner, dependent rechecks, counter,
  and exhaustion outcome for each loop. Business rejection is not a retry.
* Where source limits are absent, proposed configurable defaults are two
  technical retries after the initial attempt and three business correction
  submissions. These are PoC assumptions, not bank policy.
* Preserve case/activity counters across pauses and return edges. Exhaustion
  parks the case with an escalation owner. Resume requires a recorded
  resolution and authorised retry budget.
* Corrected evidence invalidates affected approvals. Checker rejection returns
  to an identified correction task and requires reapproval.
* Retry only failed operations using idempotency keys. Do not duplicate account
  creation, issuance, publication, or completed market/wave activation.
* Use XOR for exclusive outcomes, AND for independent required work, inclusive
  gateways for optional combinations, and event-based gateways for competing
  external events. Optional or rejected branches cannot strand an AND join.
* Do not run dependent work in parallel before its inputs are available.
  Multi-instance work needs explicit aggregation and partial-completion rules.
* Configure evidence/approval timeouts; do not copy sample timer values without
  support. Unknown durations remain unresolved and block executable approval,
  but not a clearly labelled descriptive model.
* Every route reaches success, decline, withdrawal, expiry, or an owned hold
  with a resume/close action. Detect dangling flows and unreachable work.

## Required Change Record and Validation

Implementation must produce a versioned dataset and one consolidated UI review
box with source/requirement IDs, before, after, reason, and evidence basis.
Distinguish additions, removals, merges, data corrections, display changes,
and proposed routing changes. Retain lineage for all original source rows.

Do not infer a one-to-one mapping between these detailed activity definitions
and the 29 source rows. Source mapping, executable graph construction, and
remaining exception-task decomposition remain implementation work. Retain the
proposed `WF-xx-Snnn` requirement IDs as provenance when assigning stable BPMN
IDs; never pad, truncate, or reuse a graph to enforce a 29-step constraint.

The expanded lists supersede the earlier 7-to-9-activity summaries for detailed
step counts. Those summaries remain high-level scope descriptions. Validate
that each count matches its numbered list and that every routing reference
resolves within the named process. A loop repeats an activity instance; it
does not increase the number of distinct activity definitions in this table.

Preserve the sample option and shared viewer features, but derive step/phase
options, layout, and view counts from each selected process. Overview, People,
Technology, and Combined views must agree on underlying routing.

Validate each process's success, correction, decline, applicable expiry or
withdrawal, exhausted retries, checker rejection, partial readiness, and replay.
Report source coverage, BPMN parsing/schema, graph, rendering, and business
validation separately. Cosmetic differences alone do not prove different flows.

The local implementation now generates these 20 activity sets and their routing
from `web/workflow/process-workflows.json`, with dynamic steps, phases and views.
The workbook, original sample BPMN and custom agent remain unchanged. Requirements
remain proposed: descriptive conditions and bounded-retry metadata are not a
runtime enforcing policy, persistence or permissions. Source mappings, ownership,
applications and timeout values are unresolved. Parser/graph/view tests do not
establish full OMG XSD conformance, executable token soundness or business validity.
See `web/README.md` for regeneration and validation commands. Nothing is deployed.