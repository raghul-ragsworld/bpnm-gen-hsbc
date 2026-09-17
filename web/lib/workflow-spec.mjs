export const requirementsVersion = 'CR-2026-09-17.2';
export const workflowBasis = 'Proposed synthetic requirements, implemented as descriptive BPMN. Not independently business-validated; not executable bank policy.';

const phase = (end, title) => ({ end, title });
const correction = (at, target, condition, kind = 'business') => ({ at, target, condition, kind });
const exit = (at, outcome, condition, target) => ({ at, outcome, condition, target });

export const workflowSpecs = [
  {
    count: 24, phases: [phase(9, 'Identity and consent'), phase(15, 'Customer diligence'), phase(19, 'Product and approval'), phase(24, 'Account and access')],
    corrections: [correction(7, 6, 'Evidence incomplete'), correction(8, 6, 'Identity mismatch'), correction(11, 10, 'Match unresolved'), correction(16, 16, 'Alternative eligible product requested'), correction(19, 6, 'Opening pack needs correction')],
    decisions: [13, 15, 19], technical: [20, 21, 22, 24], waits: [6, 18, 19],
  },
  {
    count: 28, phases: [phase(12, 'Branch evidence inspection'), phase(19, 'Identity and risk review'), phase(24, 'Signature and independent approval'), phase(28, 'Account and assisted handover')],
    corrections: [correction(8, 8, 'Copy unreadable'), correction(11, 6, 'Original evidence corrected'), correction(14, 13, 'Duplicate match unresolved'), correction(24, 6, 'Checker requires corrected evidence'), correction(27, 27, 'Handover identity correction required')],
    decisions: [16, 19, 24], technical: [25, 26, 28], waits: [6, 22, 24],
  },
  {
    count: 32, phases: [phase(8, 'Company registration'), phase(15, 'Ownership and authority'), phase(22, 'Screening and risk'), phase(28, 'Mandate approval'), phase(32, 'Account permissions')],
    corrections: [correction(11, 9, 'Ownership chain incomplete'), correction(13, 12, 'Owner identity evidence invalid'), correction(25, 24, 'Mandate invalid'), correction(28, 24, 'Checker rejects mandate'), correction(31, 31, 'Permission verification failed', 'technical')],
    decisions: [18, 28], parallel: [[16, 17]], technical: [29, 30, 32], waits: [12, 26, 28],
  },
  {
    count: 20, phases: [phase(8, 'Express eligibility and evidence reuse'), phase(11, 'Current screening'), phase(16, 'Express mandate decision'), phase(20, 'Opening and activation')],
    corrections: [correction(15, 13, 'Changed mandate needs correction'), correction(19, 19, 'Permission verification failed', 'technical')],
    exits: [exit(4, 'transfer', 'Not express eligible', 'WF-03-S003'), exit(6, 'transfer', 'Evidence stale', 'WF-03-S006'), exit(7, 'transfer', 'Ownership or activities changed', 'WF-03-S009'), exit(8, 'transfer', 'Signatory authority changed', 'WF-03-S014'), exit(11, 'transfer', 'Screening concern or escalated risk', 'WF-03-S018')],
    decisions: [16], technical: [17, 18, 20], waits: [14, 16],
  },
  {
    count: 34, phases: [phase(9, 'Review population and gap plan'), phase(18, 'Corporate evidence refresh'), phase(25, 'Screening and reassessment'), phase(28, 'Independent KYC approval'), phase(34, 'Versioned update and closure')],
    corrections: [correction(11, 8, 'Evidence incomplete'), correction(25, 8, 'Contradictory evidence requires correction'), correction(27, 7, 'Reviewer findings require remediation'), correction(32, 31, 'Destination acknowledgement missing', 'technical')],
    decisions: [21, 28], parallel: [[19, 20]], technical: [29, 31], waits: [10, 26, 28],
  },
  {
    count: 26, phases: [phase(7, 'Event correlation and materiality'), phase(12, 'Targeted evidence'), phase(19, 'Affected KYC checks'), phase(21, 'Change approval'), phase(26, 'Event-linked update')],
    corrections: [correction(12, 11, 'Targeted evidence invalid'), correction(18, 7, 'New material facts change scope'), correction(20, 8, 'Reviewer requires revised impact scope'), correction(25, 24, 'Downstream acknowledgement missing', 'technical')],
    exits: [exit(4, 'duplicate', 'Event already handled; link existing case'), exit(7, 'non-material', 'No material KYC impact; record rationale')],
    decisions: [17, 21], technical: [22, 24], waits: [11, 21],
  },
  {
    count: 36, phases: [phase(10, 'Client and trade profile'), phase(15, 'Trade restrictions and diligence'), phase(21, 'Facility credit approval'), phase(27, 'Legal and activation prerequisites'), phase(36, 'Trade configuration and certification')],
    corrections: [correction(18, 17, 'Credit evidence needs correction'), correction(23, 22, 'Legal defects'), correction(25, 21, 'Terms or prerequisites changed; reapprove credit before revising agreements'), correction(26, 17, 'Independent reviewer rejects setup'), correction(33, 30, 'Entitlement test failed', 'technical')],
    decisions: [13, 21, 27], technical: [28, 29, 30, 31, 35, 36], waits: [15, 21, 24, 25],
  },
  {
    count: 42, phases: [phase(6, 'Group scope and review ownership'), phase(20, 'Entity diligence and readiness'), phase(24, 'Group exposure and credit'), phase(31, 'Group and local legal approval'), phase(42, 'Entity configuration and activation')],
    instances: [{ first: 7, last: 19, collection: 'participatingEntities', title: 'Review each participating entity' }],
    corrections: [correction(8, 7, 'Entity evidence invalid'), correction(15, 13, 'Entity screening needs correction'), correction(24, 21, 'Credit structure requires revision'), correction(27, 25, 'Local or group legal defects'), correction(30, 21, 'Entity excluded; recalculate exposure and legal scope'), correction(31, 25, 'Independent setup review requires correction'), correction(37, 33, 'Entity entitlement test failed', 'technical'), correction(38, 33, 'Exposure aggregation test failed', 'technical')],
    decisions: [15, 24, 40], technical: [32, 33, 34, 35, 41, 42], waits: [7, 28, 29, 40],
  },
  {
    count: 30, phases: [phase(9, 'Counterparty and product scope'), phase(14, 'Credit and settlement risk'), phase(19, 'Trading agreements'), phase(23, 'Independent settlement verification'), phase(30, 'Dealing configuration and activation')],
    corrections: [correction(17, 16, 'Legal agreement defects'), correction(19, 13, 'Changed terms affect credit limits'), correction(22, 20, 'Settlement instructions invalid'), correction(23, 16, 'Independent reviewer requires corrections'), correction(28, 26, 'Settlement or permission test failed', 'technical')],
    decisions: [7, 14, 29], technical: [24, 25, 26, 27, 30], waits: [18, 20, 29],
  },
  {
    count: 38, phases: [phase(8, 'NBFI status and controllers'), phase(18, 'Funding and enhanced diligence'), phase(24, 'Credit and collateral decision'), phase(28, 'Trading and collateral agreements'), phase(32, 'Settlement verification'), phase(38, 'Restricted-product activation')],
    corrections: [correction(6, 5, 'Status evidence requires correction'), correction(10, 9, 'Funding evidence incomplete'), correction(18, 16, 'Enhanced diligence needs evidence'), correction(26, 22, 'Collateral terms changed; repeat credit approval'), correction(31, 29, 'Settlement validation failed'), correction(32, 16, 'Independent review findings'), correction(37, 34, 'Product or collateral test failed', 'technical')],
    decisions: [5, 15, 24], technical: [33, 34, 35, 36, 38], waits: [16, 24, 27, 28],
  },
  {
    count: 22, phases: [phase(7, 'Objectives and financial position'), phase(12, 'Capacity and investment experience'), phase(17, 'Consistency and suitability review'), phase(22, 'Acknowledgement and publication')],
    corrections: [correction(13, 3, 'Questionnaire incomplete'), correction(15, 14, 'Conflicting answers corrected; reassess consistency'), correction(17, 8, 'Profile review requires reassessment'), correction(19, 18, 'Client requests further explanation')],
    exits: [exit(19, 'withdrawn', 'Client declines acknowledgement and withdraws')],
    technical: [21, 22], waits: [19],
  },
  {
    count: 35, phases: [phase(5, 'Household and entity scope'), phase(11, 'Wealth and enhanced diligence'), phase(25, 'Complex holdings and entity assessment'), phase(29, 'Consolidated suitability'), phase(35, 'Acknowledgement and monitoring')],
    instances: [{ first: 12, last: 24, collection: 'inScopeEntities', title: 'Assess each household entity' }],
    corrections: [correction(8, 6, 'Wealth evidence inconsistent'), correction(22, 12, 'Entity concentration or liquidity conflict'), correction(25, 5, 'Explicit entity scope revision'), correction(28, 12, 'Specialist objections require reassessment'), correction(31, 30, 'Acknowledgement discussion required')],
    decisions: [11, 32], technical: [33, 34, 35], waits: [7, 31, 32],
  },
  {
    count: 25, phases: [phase(9, 'Application and customer verification'), phase(15, 'Affordability and credit decision'), phase(18, 'Terms and delivery agreement'), phase(25, 'Card issuance and activation')],
    corrections: [correction(5, 4, 'Identity mismatch'), correction(13, 10, 'Credit evidence incomplete'), correction(22, 18, 'Delivery failed; preserve issued card', 'technical'), correction(23, 23, 'Activation authentication failed')],
    replay: [{ from: 18, to: 21, when: 'Existing card already issued; retry delivery only' }],
    decisions: [9, 14], technical: [19, 20, 21, 24, 25], waits: [17, 22],
  },
  {
    count: 31, phases: [phase(7, 'Partner referral and membership'), phase(12, 'Customer identity'), phase(17, 'Credit and product decision'), phase(23, 'Combined terms and issuance'), phase(31, 'Rewards linkage and card activation')],
    corrections: [correction(7, 5, 'Partner membership mismatch'), correction(15, 13, 'Credit evidence incomplete'), correction(25, 24, 'Rewards acknowledgement failed', 'technical'), correction(27, 21, 'Delivery failed; confirm details and retry existing card', 'technical'), correction(28, 28, 'Activation authentication failed')],
    replay: [{ from: 21, to: 26, when: 'Existing card already issued; retry delivery only' }],
    exits: [exit(3, 'duplicate', 'Referral already linked to an existing case'), exit(6, 'declined', 'Partner membership ineligible')],
    parallel: [[24, 25, 26, 29]], decisions: [12, 16], technical: [22, 23, 24, 26, 29, 31], waits: [20, 27],
  },
  {
    count: 33, phases: [phase(9, 'Merchant identity and sales channels'), phase(18, 'Activity and payment underwriting'), phase(23, 'Agreement and settlement verification'), phase(28, 'Gateway and fraud configuration'), phase(33, 'Payment certification and activation')],
    corrections: [correction(16, 13, 'Underwriting evidence needs correction'), correction(22, 21, 'Settlement account verification failed'), correction(31, 25, 'Certification findings require configuration changes', 'technical')],
    exits: [exit(10, 'declined', 'Prohibited business activity')], decisions: [12, 18, 32], technical: [24, 25, 26, 27, 28, 33], waits: [20, 23, 32],
  },
  {
    count: 44, phases: [phase(5, 'Enterprise hierarchy and rollout scope'), phase(16, 'Entity and channel diligence'), phase(20, 'Aggregate underwriting'), phase(27, 'Enterprise settlement and agreements'), phase(37, 'Channel integration and certification'), phase(44, 'Controlled rollout waves')],
    instances: [{ first: 6, last: 15, collection: 'entitiesAndChannels', title: 'Review each entity and channel' }, { first: 29, last: 37, collection: 'channelsInScope', title: 'Configure and certify each channel' }],
    corrections: [correction(15, 13, 'Channel risk evidence incomplete'), correction(20, 17, 'Underwriting structure rejected'), correction(23, 22, 'Settlement ownership invalid'), correction(37, 29, 'Channel certification failed', 'technical'), correction(39, 38, 'Wave readiness requires review'), correction(42, 29, 'Remediate failed components; retest before release', 'technical')],
    repeat: { at: 43, target: 38, collection: 'approvedWaves', condition: 'Another approved, not-yet-activated wave remains' },
    decisions: [12, 20, 39], technical: [28, 40, 44], waits: [25, 39],
  },
  {
    count: 23, phases: [phase(7, 'Party request and evidence'), phase(13, 'Identity matching and screening'), phase(18, 'Roles and signing authority'), phase(23, 'Party approval and origination handoff')],
    corrections: [correction(7, 6, 'Identity evidence incomplete'), correction(9, 8, 'Ambiguous master match'), correction(17, 16, 'Authority invalid'), correction(18, 14, 'Relationship inconsistency'), correction(20, 14, 'Checker requires corrected relationships'), correction(23, 22, 'Handoff acknowledgement failed', 'technical')],
    decisions: [13, 20], technical: [21, 22], waits: [6, 20],
  },
  {
    count: 37, phases: [phase(8, 'Borrower and security-provider evidence'), phase(14, 'Party identity and screening'), phase(19, 'Role and authority validation'), phase(28, 'Security ownership and linkage'), phase(32, 'Independent security-pack review'), phase(37, 'Party records and downstream handoff')],
    corrections: [correction(8, 7, 'Party evidence incomplete'), correction(10, 9, 'Master match ambiguous'), correction(19, 18, 'Authority invalid'), correction(22, 21, 'Security ownership mismatch'), correction(23, 4, 'New security provider identified; process new parties only'), correction(26, 25, 'Relationship scope invalid'), correction(30, 25, 'Linkage ambiguity requires correction'), correction(32, 25, 'Independent reviewer rejects linkage'), correction(36, 35, 'Handoff acknowledgement missing', 'technical')],
    decisions: [14, 32], technical: [33, 34, 35], waits: [24, 32],
  },
  {
    count: 27, phases: [phase(8, 'Custody identity and eligibility'), phase(15, 'Tax and servicing instructions'), phase(19, 'Mandate execution and approval'), phase(27, 'Custody configuration and settlement test')],
    corrections: [correction(8, 7, 'Market excluded; obtain revised scope agreement'), correction(10, 9, 'Tax evidence invalid'), correction(14, 13, 'Settlement instructions invalid'), correction(19, 13, 'Checker requires revised instructions'), correction(25, 21, 'Settlement or servicing test failed', 'technical')],
    decisions: [6, 19, 26], technical: [20, 21, 22, 23, 24, 27], waits: [9, 17, 19],
  },
  {
    count: 40, phases: [phase(8, 'Global market scope'), phase(16, 'Local eligibility and tax'), phase(26, 'Local custody instructions and clearance'), phase(33, 'Market account configuration'), phase(40, 'Market certification and approved activation')],
    instances: [{ first: 9, last: 26, collection: 'requestedMarkets', title: 'Establish each market readiness' }, { first: 28, last: 36, collection: 'approvedMarkets', title: 'Configure and certify each market' }],
    corrections: [correction(14, 13, 'Local investor documentation invalid'), correction(16, 15, 'Local tax documentation invalid'), correction(19, 18, 'Settlement instructions invalid'), correction(25, 24, 'Local clearance needs corrected documents'), correction(36, 29, 'Market certification failed', 'technical'), correction(38, 27, 'Explicit market exclusion changes activation scope')],
    decisions: [5, 9, 27, 38], technical: [28, 29, 30, 31, 32, 33, 39, 40], waits: [13, 24, 25, 38],
  },
].map((spec, index) => ({ id: `WF-${String(index + 1).padStart(2, '0')}`, corrections: [], decisions: [], technical: [], waits: [], exits: [], instances: [], parallel: [], replay: [], ...spec }));

export function validateWorkflowDefinitions(workflows) {
  if (workflows.length !== 20) throw new Error('Expected 20 workflow definitions');
  const identifiers = new Set();
  for (const workflow of workflows) {
    const spec = workflowSpecs.find(candidate => candidate.id === workflow.id);
    if (!spec || identifiers.has(workflow.id) || workflow.steps.length !== spec.count) throw new Error(`Invalid workflow ${workflow.id}`);
    identifiers.add(workflow.id);
    workflow.steps.forEach((step, index) => {
      if (step.id !== `${workflow.id}-S${String(index + 1).padStart(3, '0')}` || !step.name) throw new Error(`Invalid step ${step.id}`);
    });
    if (spec.phases.at(-1).end !== spec.count || spec.phases.some((entry, index) => entry.end <= (spec.phases[index - 1]?.end || 0))) throw new Error(`Invalid phases ${spec.id}`);
    for (const route of [...spec.corrections, ...spec.exits, ...spec.replay]) {
      for (const key of ['at', 'from', 'to', 'target']) {
        if (typeof route[key] === 'number' && (route[key] < 1 || route[key] > spec.count)) throw new Error(`Invalid route ${spec.id}`);
      }
      if (typeof route.target === 'string' && !workflows.some(target => target.steps.some(step => step.id === route.target))) throw new Error(`Invalid transfer ${route.target}`);
    }
  }
  return workflows;
}