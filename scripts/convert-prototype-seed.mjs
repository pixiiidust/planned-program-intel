// Hand-conversion of the prototype strawman corpus (prototype/src/data.js)
// into the typed SeedBundle the real app loads. Stopgap per issue #8: the
// slice-2 intelligence pipeline replaces this generator and its output.
//
// What it does:
//  - mechanical field mapping (status names, eventId → EventRef, dueIn → days)
//  - tags each Decision with the Signal type that would have produced it (ADR-0003)
//  - adds three hand-authored quieter siblings so every headline Decision has
//    an unresolved high-similarity sibling (the Precedent landing place, #11)
//  - adds one escalated Decision so the Waiting tab renders seeded content
//  - emits packages/adapters/src/demo/seed.ts (type-checked against @ppi/domain)
//
// Run: node scripts/convert-prototype-seed.mjs

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EVENTS, INITIAL_DECISIONS } from '../prototype/src/data.js';

const STATUS_MAP = { needs_decision: 'open', blocked: 'blocked', escalated: 'escalated', decided: 'resolved' };

// The Signal that would have produced each Decision (ADR-0003 honesty rule).
const SIGNAL_MAP = {
  d1: 'contract.summarized',
  d2: 'quote.received',
  d3: 'approval.stalled',
  d4: 'policy.checked',
  d5: 'registration.pace_updated',
  d6: 'contract.summarized',
  d7: 'quote.received',
  d8: 'quote.received',
  d9: 'quote.received',
  d10: 'quote.received',
  d11: 'quote.received',
  d12: 'registration.pace_updated',
  d13: 'contract.summarized',
  d14: 'quote.received',
  d15: 'quote.received',
  d16: 'policy.checked',
};

function convert(d) {
  return {
    id: d.id,
    title: d.title,
    problem: d.problem,
    actionNeeded: d.actionNeeded,
    event: EVENTS[d.eventId],
    type: d.type,
    signalType: SIGNAL_MAP[d.id],
    urgency: d.urgency,
    dueInDays: d.dueIn ? parseInt(d.dueIn, 10) : null,
    status: STATUS_MAP[d.status],
    ...(d.blockedBy ? { blockedBy: d.blockedBy } : {}),
    owner: d.owner,
    recommendation: d.recommendation,
    evidence: { ...d.evidence, precedents: [] },
    whatsDifferent: d.whatsDifferent,
    risks: d.risks,
    constraints: d.constraints,
    escalationPaths: d.escalationPaths,
    resolution: d.resolution ?? null,
    escalation: d.escalation ?? null,
  };
}

// --- Hand-authored additions -------------------------------------------------

// Quieter sibling of d1 (Lisbon force majeure) — the Precedent landing place.
const d17 = {
  id: 'd17',
  title: 'Berlin venue contract missing cancellation cap',
  problem: 'The draft contract leaves cancellation liability uncapped. Full committed spend is exposed if either side cancels.',
  actionNeeded: 'Request a liability-cap addendum before signature. Signing is three weeks out.',
  event: EVENTS.emea,
  type: 'contract',
  signalType: 'contract.summarized',
  urgency: {
    level: 'medium',
    because: 'Signature is 21 days out. The exposure is real (~€180K) but there is time to negotiate without trading anything.',
  },
  dueInDays: 21,
  status: 'open',
  owner: { name: 'Priya Nair', role: 'Procurement Lead', whyRouted: 'Policy P-114 routes contract-term exceptions to procurement.' },
  recommendation: {
    action: 'Request a cancellation-cap addendum (1.5× deposit) before signing. No trade needed yet — ask early.',
    why: 'Protective addendums on international venue contracts succeed most often when asked before the hold deadline adds pressure.',
    track: { worked: 41, total: 48, basis: 'protective addendums requested on international venue contracts' },
  },
  evidence: {
    caseCount: 48,
    workedCount: 41,
    patterns: [
      {
        outcome: 'worked',
        title: 'Ask for protective terms early, before deadline pressure',
        count: '29 of the 41 successes',
        example: { event: 'Global SKO 2024 — Lisbon', detail: 'Clause accepted with no trade when requested three weeks before signature.' },
        takeaway: 'Early asks cost nothing. Late asks cost trades.',
      },
      {
        outcome: 'failed',
        title: 'Sign first, amend later',
        count: '5 of the 7 failures',
        example: { event: 'EMEA Summit 2024 — Prague', detail: 'Post-signature amendment talks went nowhere. Exposure stayed.' },
        takeaway: 'Leverage disappears at signature.',
      },
    ],
    exceptions: [],
    cases: [
      { event: 'Global SKO 2024 — Lisbon', when: '2024', similarity: 0.9, outcome: 'worked', patternIndex: 0, detail: 'Clause accepted with no trade. Asked early.', tags: ['Iberia', 'hotel'] },
      { event: 'Global SKO 2025 — Barcelona', when: '2025', similarity: 0.86, outcome: 'worked', patternIndex: 0, detail: 'Addendum accepted for a 5% earlier deposit.', tags: ['Iberia', 'convention center'] },
      { event: 'EMEA Summit 2024 — Prague', when: '2024', similarity: 0.81, outcome: 'failed', patternIndex: 1, detail: 'Signed without the cap. Amendment talks stalled.', tags: ['Central Europe', 'hotel'] },
    ],
    precedents: [],
  },
  whatsDifferent: [],
  risks: [],
  constraints: ['Policy P-114: cancellation exposure over $250K requires legal sign-off.'],
  escalationPaths: [{ name: 'Sofia Reyes', role: 'Legal Counsel, Contracts', why: 'Owns sign-off for cancellation exposure over $250K (P-114).' }],
  resolution: null,
  escalation: null,
};

// Quieter sibling of d2 (Berlin AV quote).
const d18 = {
  id: 'd18',
  title: 'Lisbon AV quote 9% over benchmark',
  problem: 'The venue’s in-house AV quote is €418K against a €385K budget line for the 850-person kickoff.',
  actionNeeded: 'Re-quote with a preferred vendor before AV sign-off.',
  event: EVENTS.sko,
  type: 'budget',
  signalType: 'quote.received',
  urgency: {
    level: 'medium',
    because: 'AV sign-off is 20 days out. The variance sits inside the discretion band, but a late re-quote loses the leverage window.',
  },
  dueInDays: 20,
  status: 'open',
  owner: { name: 'Dana Ortiz', role: 'Event Lead', whyRouted: 'Budget variances under 15% sit with the event lead.' },
  recommendation: {
    action: 'Re-quote with preferred vendor StageCraft GmbH. Ask the venue to waive its outside-AV fee in the same message.',
    why: 'Preferred-vendor re-quotes at venues with exclusivity clauses have repeatedly closed variances this size.',
    track: { worked: 95, total: 106, basis: 're-quotes with preferred AV vendors at venues with exclusivity clauses' },
  },
  evidence: {
    caseCount: 106,
    workedCount: 95,
    patterns: [
      {
        outcome: 'worked',
        title: 'Re-quote with a preferred vendor, then negotiate the outside-AV fee',
        count: '71 of the 95 successes',
        example: { event: 'DACH Partner Day 2025 — Berlin', detail: 'StageCraft came in 15% under the in-house quote. Venue waived its fee.' },
        takeaway: 'Outside-AV fees are negotiable when F&B spend is high.',
      },
      {
        outcome: 'worked',
        title: 'Use the outside quote as leverage to reprice the in-house offer',
        count: '24 of the 95 successes',
        example: { event: 'Nordics Summit 2025 — Stockholm', detail: 'Venue matched the outside price within 48 hours.' },
        takeaway: 'Sometimes the quote’s only job is to exist.',
      },
    ],
    exceptions: [],
    cases: [
      { event: 'DACH Partner Day 2025 — Berlin', when: '2025', similarity: 0.88, outcome: 'worked', patternIndex: 0, detail: 'StageCraft 15% under in-house. Fee waived.', tags: ['Berlin', 'exclusivity clause'] },
      { event: 'Paris Customer Day 2024', when: '2024', similarity: 0.84, outcome: 'worked', patternIndex: 0, detail: 'Preferred vendor 12% under. Fee waived.', tags: ['France', 'fee waiver'] },
      { event: 'Madrid Kickoff 2023', when: '2023', similarity: 0.78, outcome: 'failed', detail: 'Outside vendor missed the rigging spec. €7K in change orders.', tags: ['Iberia', 'outside vendor'] },
    ],
    precedents: [],
  },
  whatsDifferent: [],
  risks: [],
  constraints: ['The SKO AV budget line is €385K.'],
  escalationPaths: [{ name: 'Tom Okafor', role: 'AV Category Manager', why: 'Negotiated the StageCraft rate card. Can pressure-test both quotes.' }],
  resolution: null,
  escalation: null,
};

// Quieter sibling of d3 (Austin approval stall).
const d19 = {
  id: 'd19',
  title: 'Roadshow venue license sign-off sitting in legal',
  problem: 'The NYC venue license has been in legal review for 4 days with no response. The signing window closes in 8 days.',
  actionNeeded: 'Send legal a quantified cost-of-delay note before the window tightens.',
  event: EVENTS.roadshow,
  type: 'approval',
  signalType: 'approval.stalled',
  urgency: {
    level: 'medium',
    because: 'Eight days of runway remain. Past it, the venue reprices the date (~$6K) — bounded, but avoidable by acting this week.',
  },
  dueInDays: 8,
  status: 'open',
  owner: { name: 'Dana Ortiz', role: 'Event Lead', whyRouted: 'You own the escalation path for stalled approvals on your events.' },
  recommendation: {
    action: 'Send the cost-of-delay figure to the legal reviewer today and ask for a committed review date.',
    why: 'Quantified cost-of-delay has unblocked stalled approvals fastest. Vague urgency has not.',
    track: { worked: 17, total: 21, basis: 'approval stalls broken with a quantified cost-of-delay escalation' },
  },
  evidence: {
    caseCount: 21,
    workedCount: 17,
    patterns: [
      {
        outcome: 'worked',
        title: 'Escalate with a quantified cost-of-delay',
        count: '13 of the 17 successes',
        example: { event: 'Q1 Exec Offsite 2026 — Denver', detail: 'Cost figure attached. Approved in 6 hours.' },
        takeaway: 'Quantified cost-of-delay moves approvals. Vague urgency doesn’t.',
      },
      {
        outcome: 'failed',
        title: 'Wait for the reviewer to resurface',
        count: '4 of the 4 failures',
        example: { event: 'Board Retreat 2025 — Sonoma', detail: 'Waited politely. The hold lapsed — $11K avoidable.' },
        takeaway: 'Waiting out a stall has a measurable price.',
      },
    ],
    exceptions: [],
    cases: [
      { event: 'Q1 Exec Offsite 2026 — Denver', when: '2026', similarity: 0.85, outcome: 'worked', patternIndex: 0, detail: 'Cost-of-delay note. Approved in 6 hours.', tags: ['delegate path'] },
      { event: 'Board Retreat 2025 — Sonoma', when: '2025', similarity: 0.79, outcome: 'failed', patternIndex: 1, detail: 'Waited. Hold lapsed. $11K avoidable spend.', tags: ['waited'] },
    ],
    precedents: [],
  },
  whatsDifferent: [],
  risks: [],
  constraints: [],
  escalationPaths: [{ name: 'Mei Lin', role: 'Chief of Staff to VP Events', why: 'Can nudge legal with delegated authority when deadlines compress.' }],
  resolution: null,
  escalation: null,
};

// One escalated Decision so the Waiting tab renders seeded content.
const d20 = {
  id: 'd20',
  title: 'SKO keynote speaker fee 40% over the talent envelope',
  problem: 'The shortlisted keynote speaker quotes $120K against an $85K envelope. Alternatives score lower with sales leadership.',
  actionNeeded: 'Decide whether the fee gap is worth the draw, or book the lower-cost alternative.',
  event: EVENTS.sko,
  type: 'budget',
  signalType: 'quote.received',
  urgency: {
    level: 'high',
    because: 'The speaker holds the date for 10 more days. Past that, rebooking at this tier typically adds 15–20%.',
  },
  dueInDays: 10,
  status: 'escalated',
  owner: { name: 'Dana Ortiz', role: 'Event Lead', whyRouted: 'Talent decisions sit with the event lead until they breach the envelope.' },
  recommendation: {
    action: 'Hold the envelope: book the second-choice speaker and reinvest $20K of the gap in the opening production.',
    why: 'Speaker-fee overruns at this tier have not moved session scores. Production quality has.',
    track: { worked: 6, total: 9, basis: 'keynote bookings decided against tier-priced fee gaps' },
  },
  evidence: {
    caseCount: 9,
    workedCount: 6,
    patterns: [
      {
        outcome: 'worked',
        title: 'Book the second choice, spend the gap on production',
        count: '5 of the 6 successes',
        example: { event: 'Global SKO 2026 — Marseille', detail: 'Second-choice keynote plus upgraded opening. Session scores up year over year.' },
        takeaway: 'The room remembers the show, not the fee.',
      },
      {
        outcome: 'failed',
        title: 'Stretch the envelope for a marquee name',
        count: '2 of the 3 failures',
        example: { event: 'Global SKO 2023 — Orlando', detail: 'Envelope stretched 35%. Scores flat; the overrun came out of breakouts.' },
        takeaway: 'Marquee fees trade against the rest of the program.',
      },
    ],
    exceptions: [],
    cases: [
      { event: 'Global SKO 2026 — Marseille', when: '2026', similarity: 0.87, outcome: 'worked', patternIndex: 0, detail: 'Second choice + production upgrade. Scores up.', tags: ['keynote', 'envelope held'] },
      { event: 'Global SKO 2023 — Orlando', when: '2023', similarity: 0.8, outcome: 'failed', patternIndex: 1, detail: 'Envelope stretched 35%. Flat scores.', tags: ['keynote', 'envelope stretched'] },
    ],
    precedents: [],
  },
  whatsDifferent: [],
  risks: [],
  constraints: ['FY27 talent envelope: $85K.'],
  escalationPaths: [{ name: 'James Tan', role: 'VP Events', why: 'SKO exec sponsor — owns envelope exceptions.' }],
  resolution: null,
  escalation: {
    to: 'James Tan',
    reasoning: 'Outside my decision authority — the fee tops the envelope by 40% and sales leadership is pushing hard for this name.',
    requestedBy: 'Dana Ortiz',
    daysAgo: 2,
  },
};

// --- Assemble ----------------------------------------------------------------

const converted = INITIAL_DECISIONS.map(convert);
// Keep d1 first (top of Needs you); add quieter siblings and the escalated item after.
const decisions = [...converted, d17, d18, d19, d20];

const bundle = {
  seedVersion: 'seed-v1-hand-converted',
  decisions,
  siblings: { d1: ['d17'], d2: ['d18'], d3: ['d19'] },
};

const out = `// GENERATED by scripts/convert-prototype-seed.mjs — do not edit by hand.
// Hand-converted stopgap seed (issue #8); the slice-2 pipeline replaces it.
import type { SeedBundle } from '@ppi/domain';

export const SEED = ${JSON.stringify(bundle, null, 2)} satisfies SeedBundle;
`;

const target = join(dirname(fileURLToPath(import.meta.url)), '../packages/adapters/src/demo/seed.ts');
writeFileSync(target, out, 'utf8');
console.log(`Wrote ${target}: ${decisions.length} decisions, ${Object.keys(bundle.siblings).length} sibling pairs`);
