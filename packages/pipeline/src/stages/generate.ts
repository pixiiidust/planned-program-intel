import type { GeneratedCorpusCase, CorpusRecord } from '../corpus.js';
import { mulberry32, type Rng } from '../random.js';
import {
  CITIES,
  EVENT_KINDS,
  FAMILIES,
  GOVERNMENT_VENUE_KINDS,
  VENUE_KINDS,
  YEARS,
  type ApproachDefinition,
  type FamilyDefinition,
  type FamilyId,
} from './families.js';

export const GENERATED_CASE_SEED = 13_004;

interface Slots {
  eventKind: string;
  city: string;
  region: string;
  venueKind: string;
  year: number;
}

interface Draft {
  record: CorpusRecord;
  detail: string;
}

const POLICY_IDS = ['POL-AV-12', 'POL-FB-07', 'POL-SEC-03', 'POL-TRV-18', 'POL-SRC-22'] as const;

export function generateCases(seed: number = GENERATED_CASE_SEED): GeneratedCorpusCase[] {
  const rng = mulberry32(seed);
  const cases: GeneratedCorpusCase[] = [];
  let serial = 1;

  for (const family of FAMILIES) {
    for (const approach of shuffledApproachPlan(family, rng)) {
      const draft = buildDraft(family.id, approach, rng);
      const slots = drawSlots(rng, draft.record);
      const title = fillTemplate(rng.pick(family.titleTemplates), slots);
      const problem = fillTemplate(rng.pick(family.problemTemplates), slots);
      cases.push({
        id: `gc-${String(serial).padStart(3, '0')}`,
        type: family.type,
        signalType: family.signalType,
        title,
        problem,
        event: `${displayEventKind(slots.eventKind)} ${slots.year} — ${slots.city}`,
        when: String(slots.year),
        detail: draft.detail,
        tags: tagsFor(family.id, slots, draft.record),
        approach: approach.id,
        record: draft.record,
      });
      serial += 1;
    }
  }

  return cases;
}

function shuffledApproachPlan(family: FamilyDefinition, rng: Rng): ApproachDefinition[] {
  const totalWeight = family.approaches.reduce((sum, a) => sum + a.weight, 0);
  let assigned = 0;
  const plan: ApproachDefinition[] = [];

  family.approaches.forEach((approach, index) => {
    const isLast = index === family.approaches.length - 1;
    const count = isLast ? family.count - assigned : Math.round((family.count * approach.weight) / totalWeight);
    assigned += count;
    for (let i = 0; i < count; i += 1) plan.push(approach);
  });

  for (let i = plan.length - 1; i > 0; i -= 1) {
    const j = rng.int(0, i);
    const current = plan[i]!;
    plan[i] = plan[j]!;
    plan[j] = current;
  }

  return plan;
}

function drawSlots(rng: Rng, record: CorpusRecord): Slots {
  const city = rng.pick(CITIES);
  const isGovernmentVenue = record['venueOwnership'] === 'government';
  return {
    eventKind: rng.pick(EVENT_KINDS),
    city: city.city,
    region: city.region,
    venueKind: isGovernmentVenue ? rng.pick(GOVERNMENT_VENUE_KINDS) : rng.pick(VENUE_KINDS),
    year: rng.pick(YEARS),
  };
}

function fillTemplate(template: string, slots: Slots): string {
  return template
    .replaceAll('{city}', slots.city)
    .replaceAll('{region}', slots.region)
    .replaceAll('{venueKind}', slots.venueKind)
    .replaceAll('{eventKind}', slots.eventKind)
    .replaceAll('{year}', String(slots.year));
}

function displayEventKind(eventKind: string): string {
  if (eventKind === 'SKO') return eventKind;
  return eventKind
    .split(' ')
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(' ');
}

function buildDraft(familyId: FamilyId, approach: ApproachDefinition, rng: Rng): Draft {
  switch (familyId) {
    case 'contract-addendum':
      return contractAddendum(approach, rng);
    case 'quote-variance':
      return quoteVariance(approach, rng);
    case 'approval-stall':
      return approvalStall(approach, rng);
    case 'registration-pace':
      return registrationPace(approach, rng);
    case 'policy-exception':
      return policyException(approach, rng);
    case 'vendor-swap':
      return vendorSwap(approach, rng);
  }
}

function contractAddendum(approach: ApproachDefinition, rng: Rng): Draft {
  const clauseRequested = approach.id !== 'sign-without-clause' || rng.chance(0.55);
  const tradedDepositTiming = approach.id === 'pair-with-deposit-trade';
  const venueOwnership = rng.chance(0.24) ? 'government' : 'private';
  let requestedDaysBeforeHold = daysBeforeHoldForContract(approach.id, rng);
  const privateReviewDays = rng.int(2, 5);
  let legalReviewDays = venueOwnership === 'government' ? privateReviewDays * rng.int(2, 4) : privateReviewDays;
  let favorableRate = approach.favorableRate;
  if (venueOwnership === 'government' && requestedDaysBeforeHold < 10) favorableRate -= 0.42;
  if (legalReviewDays > requestedDaysBeforeHold) favorableRate -= 0.28;
  if (!clauseRequested) favorableRate -= 0.25;

  const favorable = rng.chance(clamp(favorableRate, 0.05, 0.93));
  let addendumSigned: boolean;
  let signedWithinHold: boolean;
  if (favorable) {
    addendumSigned = true;
    if (legalReviewDays > requestedDaysBeforeHold) requestedDaysBeforeHold = legalReviewDays + rng.int(1, 5);
    signedWithinHold = true;
  } else if (!clauseRequested || rng.chance(0.45)) {
    addendumSigned = false;
    signedWithinHold = false;
  } else {
    addendumSigned = true;
    if (legalReviewDays <= requestedDaysBeforeHold) legalReviewDays = requestedDaysBeforeHold + rng.int(1, 5);
    signedWithinHold = false;
  }

  const exposureUsd = rng.int(30, 260) * 1000;
  const record = {
    clauseRequested,
    tradedDepositTiming,
    requestedDaysBeforeHold,
    venueOwnership,
    legalReviewDays,
    addendumSigned,
    signedWithinHold,
    exposureUsd,
  };

  return {
    record,
    detail: [
      `Clause ${clauseRequested ? 'requested' : 'not requested'} ${requestedDaysBeforeHold} days before the hold.`,
      `Venue ownership was ${venueOwnership}.`,
      `Legal review took ${legalReviewDays} days.`,
      `Exposure was ${usd(exposureUsd)}.`,
    ].join(' '),
  };
}

function daysBeforeHoldForContract(approach: string, rng: Rng): number {
  switch (approach) {
    case 'pair-with-deposit-trade':
      return rng.int(8, 24);
    case 'ask-early-no-trade':
      return rng.int(14, 35);
    case 'sign-then-amend':
      return rng.int(4, 18);
    case 'sign-without-clause':
      return rng.int(3, 14);
    default:
      return rng.int(4, 20);
  }
}

function quoteVariance(approach: ApproachDefinition, rng: Rng): Draft {
  const budgetLineUsd = rng.int(90, 420) * 1000;
  const quoteUsd = roundTo(budgetLineUsd * (1 + rng.int(8, 42) / 100), 1000);
  const vendorExclusivityClause = rng.chance(approach.id === 'leverage-reprice-inhouse' ? 0.62 : 0.3);
  const outsideAvFeeWaived = rng.chance(approach.id === 'requote-preferred-vendor' ? 0.72 : 0.34);
  let favorableRate = approach.favorableRate;
  if (vendorExclusivityClause && !outsideAvFeeWaived && approach.id === 'requote-preferred-vendor') favorableRate -= 0.24;

  const favorable = rng.chance(clamp(favorableRate, 0.08, 0.92));
  let finalCostUsd: number;
  let deliveredToSpec: boolean;
  let changeOrdersUsd: number;
  if (favorable) {
    finalCostUsd = roundTo(budgetLineUsd * rng.int(84, 100) / 100, 1000);
    deliveredToSpec = true;
    changeOrdersUsd = rng.int(0, 5) * 1000;
  } else {
    const costFailed = rng.chance(0.65);
    finalCostUsd = costFailed ? roundTo(budgetLineUsd * rng.int(104, 128) / 100, 1000) : roundTo(budgetLineUsd * rng.int(86, 99) / 100, 1000);
    deliveredToSpec = costFailed ? rng.chance(0.62) : false;
    changeOrdersUsd = deliveredToSpec ? rng.int(3, 14) * 1000 : rng.int(8, 35) * 1000;
  }

  const record = {
    quoteUsd,
    budgetLineUsd,
    vendorExclusivityClause,
    outsideAvFeeWaived,
    finalCostUsd,
    deliveredToSpec,
    changeOrdersUsd,
  };

  return {
    record,
    detail: [
      `Original quote was ${usd(quoteUsd)} against a ${usd(budgetLineUsd)} line.`,
      `Outside AV fee was ${outsideAvFeeWaived ? 'waived' : 'not waived'}.`,
      `Final cost was ${usd(finalCostUsd)}.`,
      `Change orders were ${usd(changeOrdersUsd)}.`,
    ].join(' '),
  };
}

function approvalStall(approach: ApproachDefinition, rng: Rng): Draft {
  const stalledDays = rng.int(2, 21);
  const windowDays = rng.int(2, 14);
  const costOfDelayStatedUsd = approach.id === 'quantified-cost-of-delay' ? rng.int(8, 90) * 1000 : 0;
  const favorable = rng.chance(clamp(approach.favorableRate + (costOfDelayStatedUsd > 0 ? 0.04 : 0), 0.08, 0.91));
  const approvalDays = favorable ? rng.int(1, windowDays) : windowDays + rng.int(1, 8);
  const holdLapsed = favorable ? false : rng.chance(0.78);
  const repriceUsd = favorable ? rng.int(0, 3) * 1000 : rng.int(6, 55) * 1000;
  const record = {
    stalledDays,
    windowDays,
    costOfDelayStatedUsd,
    approvalDays,
    holdLapsed,
    repriceUsd,
  };

  return {
    record,
    detail: [
      `Approval had stalled for ${stalledDays} days.`,
      `The hold window was ${windowDays} days.`,
      `Approval came in ${approvalDays} days.`,
      `Reprice exposure was ${usd(repriceUsd)}.`,
    ].join(' '),
  };
}

function registrationPace(approach: ApproachDefinition, rng: Rng): Draft {
  const paceVsTargetPct = rng.int(45, 88);
  const daysOut = daysOutForRegistration(approach.id, rng);
  const target = rng.int(180, 1100);
  const spendAddedUsd = spendForRegistration(approach.id, rng);
  let favorableRate = approach.favorableRate;
  if (daysOut < 30) favorableRate = Math.min(favorableRate, 0.24);
  if (daysOut > 55) favorableRate += 0.07;

  const favorable = rng.chance(clamp(favorableRate, 0.08, 0.9));
  const finalAttendance = favorable ? Math.ceil(target * rng.int(92, 108) / 100) : Math.floor(target * rng.int(62, 91) / 100);
  const record = {
    paceVsTargetPct,
    daysOut,
    target,
    finalAttendance,
    spendAddedUsd,
  };

  return {
    record,
    detail: [
      `Pace was ${paceVsTargetPct}% of target ${daysOut} days out.`,
      `Target attendance was ${target}.`,
      `Final attendance was ${finalAttendance}.`,
      `Added spend was ${usd(spendAddedUsd)}.`,
    ].join(' '),
  };
}

function daysOutForRegistration(approach: string, rng: Rng): number {
  switch (approach) {
    case 'extend-early-bird':
      return rng.int(24, 75);
    case 'targeted-outreach':
      return rng.int(18, 70);
    case 'rescope-venue':
      return rng.int(21, 90);
    case 'hold-course':
      return rng.int(12, 65);
    default:
      return rng.int(18, 75);
  }
}

function spendForRegistration(approach: string, rng: Rng): number {
  switch (approach) {
    case 'extend-early-bird':
      return rng.int(4, 18) * 1000;
    case 'targeted-outreach':
      return rng.int(6, 30) * 1000;
    case 'rescope-venue':
      return rng.int(0, 8) * 1000;
    default:
      return rng.int(0, 3) * 1000;
  }
}

function policyException(approach: ApproachDefinition, rng: Rng): Draft {
  const policyId = rng.pick(POLICY_IDS);
  const favorable = rng.chance(clamp(approach.favorableRate, 0.08, 0.92));
  let exceptionGranted: boolean;
  let incidentAfter: boolean;
  let alternativeFoundDays: number;

  if (approach.id === 'deny-find-alternative') {
    exceptionGranted = false;
    incidentAfter = false;
    alternativeFoundDays = favorable ? rng.int(1, 5) : rng.int(6, 18);
  } else if (favorable) {
    exceptionGranted = true;
    incidentAfter = false;
    alternativeFoundDays = 0;
  } else {
    exceptionGranted = true;
    incidentAfter = true;
    alternativeFoundDays = 0;
  }

  const record = {
    policyId,
    exceptionGranted,
    incidentAfter,
    alternativeFoundDays,
  };

  return {
    record,
    detail: [
      `Policy ${policyId} was checked.`,
      `Exception was ${exceptionGranted ? 'granted' : 'denied'}.`,
      `Incident after was ${incidentAfter ? 'true' : 'false'}.`,
      `Alternative was found in ${alternativeFoundDays} days.`,
    ].join(' '),
  };
}

function vendorSwap(approach: ApproachDefinition, rng: Rng): Draft {
  const incumbentQuoteUsd = rng.int(90, 360) * 1000;
  const newQuoteUsd = roundTo(incumbentQuoteUsd * quoteMultiplierForVendor(approach.id, rng), 1000);
  const soleSource = rng.chance(approach.id === 'keep-incumbent' ? 0.55 : 0.28);
  const favorable = rng.chance(clamp(approach.favorableRate - (soleSource ? 0.16 : 0), 0.08, 0.9));
  let deliveredToSpec: boolean;
  let changeOrdersUsd: number;

  if (favorable) {
    deliveredToSpec = true;
    const maxChangeOrderPct = soleSource ? 4.8 : 3.6;
    changeOrdersUsd = roundTo(newQuoteUsd * rng.int(0, Math.floor(maxChangeOrderPct * 10)) / 1000, 1000);
  } else {
    deliveredToSpec = rng.chance(0.45);
    const minPct = soleSource ? 7 : 5;
    const maxPct = soleSource ? 18 : 12;
    changeOrdersUsd = roundTo(newQuoteUsd * rng.int(minPct, maxPct) / 100, 1000);
  }

  const record = {
    incumbentQuoteUsd,
    newQuoteUsd,
    soleSource,
    deliveredToSpec,
    changeOrdersUsd,
  };

  return {
    record,
    detail: [
      `Incumbent quote was ${usd(incumbentQuoteUsd)}.`,
      `New quote was ${usd(newQuoteUsd)}.`,
      `Sole source was ${soleSource ? 'true' : 'false'}.`,
      `Change orders were ${usd(changeOrdersUsd)}.`,
    ].join(' '),
  };
}

function quoteMultiplierForVendor(approach: string, rng: Rng): number {
  switch (approach) {
    case 'swap-to-preferred':
      return rng.int(74, 94) / 100;
    case 'dual-source':
      return rng.int(80, 100) / 100;
    case 'keep-incumbent':
      return rng.int(94, 114) / 100;
    default:
      return rng.int(80, 100) / 100;
  }
}

function tagsFor(familyId: FamilyId, slots: Slots, record: CorpusRecord): string[] {
  const factTag = factTagFor(familyId, record);
  const tags = [slots.region, slots.venueKind, factTag].filter(Boolean);
  return [...new Set(tags)].slice(0, 3);
}

function factTagFor(familyId: FamilyId, record: CorpusRecord): string {
  switch (familyId) {
    case 'contract-addendum':
      return record['venueOwnership'] === 'government' ? 'government venue' : record['tradedDepositTiming'] ? 'deposit trade' : 'private venue';
    case 'quote-variance':
      return record['outsideAvFeeWaived'] === true ? 'fee waived' : record['vendorExclusivityClause'] === true ? 'exclusivity clause' : 'quote variance';
    case 'approval-stall':
      return record['costOfDelayStatedUsd'] !== 0 ? 'cost of delay quantified' : record['holdLapsed'] === true ? 'hold lapsed' : 'approval wait';
    case 'registration-pace':
      return typeof record['daysOut'] === 'number' && record['daysOut'] < 30 ? 'under 30 days out' : 'registration pace';
    case 'policy-exception':
      return record['exceptionGranted'] === true ? 'exception granted' : 'alternative found';
    case 'vendor-swap':
      return record['soleSource'] === true ? 'sole source' : 'vendor swap';
  }
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function usd(value: number): string {
  return `$${Math.round(value / 1000)}K`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
