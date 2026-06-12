import type { CaseOutcome } from '@ppi/domain';
import type { GeneratedCorpusCase, LabelledCorpusCase } from '../corpus.js';
import { familyIdForCaseShape } from './families.js';

interface LabelResult {
  outcome: CaseOutcome;
  outcomeBasis: string;
}

export function labelCases(cases: readonly GeneratedCorpusCase[]): LabelledCorpusCase[] {
  return cases.map(labelCase);
}

export function labelCase(corpusCase: GeneratedCorpusCase): LabelledCorpusCase {
  const familyId = familyIdForCaseShape(corpusCase);
  if (!familyId) throw new Error(`${corpusCase.id}: unknown family for type "${corpusCase.type}" and signal "${corpusCase.signalType}"`);

  const labelled = labelByFamily(familyId, corpusCase);
  return {
    ...corpusCase,
    outcome: labelled.outcome,
    outcomeBasis: labelled.outcomeBasis,
  };
}

function labelByFamily(familyId: string, corpusCase: GeneratedCorpusCase): LabelResult {
  switch (familyId) {
    case 'contract-addendum':
      return labelContractAddendum(corpusCase);
    case 'quote-variance':
      return labelQuoteVariance(corpusCase);
    case 'approval-stall':
      return labelApprovalStall(corpusCase);
    case 'registration-pace':
      return labelRegistrationPace(corpusCase);
    case 'policy-exception':
      return labelPolicyException(corpusCase);
    case 'vendor-swap':
      return labelVendorSwap(corpusCase);
    default:
      throw new Error(`${corpusCase.id}: unknown family "${familyId}"`);
  }
}

function labelContractAddendum(corpusCase: GeneratedCorpusCase): LabelResult {
  const addendumSigned = booleanFact(corpusCase, 'addendumSigned');
  const signedWithinHold = booleanFact(corpusCase, 'signedWithinHold');
  const requestedDaysBeforeHold = numberFact(corpusCase, 'requestedDaysBeforeHold');
  const legalReviewDays = numberFact(corpusCase, 'legalReviewDays');
  const exposureUsd = numberFact(corpusCase, 'exposureUsd');
  const worked = addendumSigned && signedWithinHold;

  if (worked) {
    return { outcome: 'worked', outcomeBasis: `addendum signed ${requestedDaysBeforeHold - legalReviewDays} days inside the hold` };
  }
  if (!addendumSigned) {
    return { outcome: 'failed', outcomeBasis: `addendum not signed before ${usd(exposureUsd)} stayed exposed` };
  }
  return { outcome: 'failed', outcomeBasis: `legal review took ${legalReviewDays} days against a ${requestedDaysBeforeHold}-day hold` };
}

function labelQuoteVariance(corpusCase: GeneratedCorpusCase): LabelResult {
  const finalCostUsd = numberFact(corpusCase, 'finalCostUsd');
  const budgetLineUsd = numberFact(corpusCase, 'budgetLineUsd');
  const deliveredToSpec = booleanFact(corpusCase, 'deliveredToSpec');
  const changeOrdersUsd = numberFact(corpusCase, 'changeOrdersUsd');
  const worked = finalCostUsd <= budgetLineUsd && deliveredToSpec;

  if (worked) {
    return { outcome: 'worked', outcomeBasis: `final cost ${usd(finalCostUsd)} against the ${usd(budgetLineUsd)} line and delivered to spec` };
  }
  if (finalCostUsd > budgetLineUsd) {
    return { outcome: 'failed', outcomeBasis: `final cost ${usd(finalCostUsd)} over the ${usd(budgetLineUsd)} line` };
  }
  return { outcome: 'failed', outcomeBasis: `delivery missed spec with ${usd(changeOrdersUsd)} in change orders` };
}

function labelApprovalStall(corpusCase: GeneratedCorpusCase): LabelResult {
  const approvalDays = numberFact(corpusCase, 'approvalDays');
  const windowDays = numberFact(corpusCase, 'windowDays');
  const holdLapsed = booleanFact(corpusCase, 'holdLapsed');
  const repriceUsd = numberFact(corpusCase, 'repriceUsd');
  const worked = approvalDays <= windowDays && !holdLapsed;

  if (worked) {
    return { outcome: 'worked', outcomeBasis: `approval cleared in ${approvalDays} days inside the ${windowDays}-day window` };
  }
  if (holdLapsed) {
    return { outcome: 'failed', outcomeBasis: `approval took ${approvalDays} days against a ${windowDays}-day window and the hold lapsed` };
  }
  return { outcome: 'failed', outcomeBasis: `approval took ${approvalDays} days against a ${windowDays}-day window with ${usd(repriceUsd)} repriced` };
}

function labelRegistrationPace(corpusCase: GeneratedCorpusCase): LabelResult {
  const finalAttendance = numberFact(corpusCase, 'finalAttendance');
  const target = numberFact(corpusCase, 'target');
  const threshold = Math.ceil(target * 0.92);
  const worked = finalAttendance >= target * 0.92;

  if (worked) {
    return { outcome: 'worked', outcomeBasis: `final attendance ${finalAttendance} reached the ${threshold} threshold on a ${target} target` };
  }
  return { outcome: 'failed', outcomeBasis: `final attendance ${finalAttendance} missed the ${threshold} threshold on a ${target} target` };
}

function labelPolicyException(corpusCase: GeneratedCorpusCase): LabelResult {
  const policyId = stringFact(corpusCase, 'policyId');
  const exceptionGranted = booleanFact(corpusCase, 'exceptionGranted');
  const incidentAfter = booleanFact(corpusCase, 'incidentAfter');
  const alternativeFoundDays = numberFact(corpusCase, 'alternativeFoundDays');
  const worked = (exceptionGranted && !incidentAfter) || (!exceptionGranted && alternativeFoundDays <= 5);

  if (worked && exceptionGranted) {
    return { outcome: 'worked', outcomeBasis: `exception ${policyId} granted with no incident after` };
  }
  if (worked) {
    return { outcome: 'worked', outcomeBasis: `exception ${policyId} denied and alternative found in ${alternativeFoundDays} days` };
  }
  if (exceptionGranted) {
    return { outcome: 'failed', outcomeBasis: `exception ${policyId} granted and an incident followed` };
  }
  return { outcome: 'failed', outcomeBasis: `exception ${policyId} denied and alternative took ${alternativeFoundDays} days` };
}

function labelVendorSwap(corpusCase: GeneratedCorpusCase): LabelResult {
  const deliveredToSpec = booleanFact(corpusCase, 'deliveredToSpec');
  const changeOrdersUsd = numberFact(corpusCase, 'changeOrdersUsd');
  const newQuoteUsd = numberFact(corpusCase, 'newQuoteUsd');
  const worked = deliveredToSpec && changeOrdersUsd <= newQuoteUsd * 0.05;

  if (worked) {
    return { outcome: 'worked', outcomeBasis: `delivered to spec with ${usd(changeOrdersUsd)} change orders against a ${usd(newQuoteUsd)} quote` };
  }
  if (!deliveredToSpec) {
    return { outcome: 'failed', outcomeBasis: `delivery missed spec with ${usd(changeOrdersUsd)} change orders` };
  }
  return { outcome: 'failed', outcomeBasis: `change orders ${usd(changeOrdersUsd)} exceeded 5% of the ${usd(newQuoteUsd)} quote` };
}

function numberFact(corpusCase: GeneratedCorpusCase, key: string): number {
  const value = corpusCase.record[key];
  if (typeof value !== 'number') throw new Error(`${corpusCase.id}: missing numeric fact "${key}"`);
  return value;
}

function stringFact(corpusCase: GeneratedCorpusCase, key: string): string {
  const value = corpusCase.record[key];
  if (typeof value !== 'string') throw new Error(`${corpusCase.id}: missing string fact "${key}"`);
  return value;
}

function booleanFact(corpusCase: GeneratedCorpusCase, key: string): boolean {
  const value = corpusCase.record[key];
  if (typeof value !== 'boolean') throw new Error(`${corpusCase.id}: missing boolean fact "${key}"`);
  return value;
}

function usd(value: number): string {
  return `$${Math.round(value / 1000)}K`;
}
