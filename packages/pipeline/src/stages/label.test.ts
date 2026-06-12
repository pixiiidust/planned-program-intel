import { describe, expect, it } from 'vitest';
import type { SignalType } from '@ppi/domain';
import type { GeneratedCorpusCase } from '../corpus.js';
import { labelCase } from './label.js';

interface Example {
  name: string;
  type: string;
  signalType: SignalType;
  workedRecord: GeneratedCorpusCase['record'];
  failedRecord: GeneratedCorpusCase['record'];
}

const examples: Example[] = [
  {
    name: 'contract-addendum',
    type: 'contract',
    signalType: 'contract.summarized',
    workedRecord: {
      clauseRequested: true,
      tradedDepositTiming: true,
      requestedDaysBeforeHold: 9,
      venueOwnership: 'private',
      legalReviewDays: 4,
      addendumSigned: true,
      signedWithinHold: true,
      exposureUsd: 90_000,
    },
    failedRecord: {
      clauseRequested: true,
      tradedDepositTiming: false,
      requestedDaysBeforeHold: 3,
      venueOwnership: 'government',
      legalReviewDays: 11,
      addendumSigned: true,
      signedWithinHold: false,
      exposureUsd: 140_000,
    },
  },
  {
    name: 'quote-variance',
    type: 'budget',
    signalType: 'quote.received',
    workedRecord: {
      quoteUsd: 410_000,
      budgetLineUsd: 385_000,
      vendorExclusivityClause: true,
      outsideAvFeeWaived: true,
      finalCostUsd: 372_000,
      deliveredToSpec: true,
      changeOrdersUsd: 2_000,
    },
    failedRecord: {
      quoteUsd: 410_000,
      budgetLineUsd: 385_000,
      vendorExclusivityClause: true,
      outsideAvFeeWaived: false,
      finalCostUsd: 412_000,
      deliveredToSpec: true,
      changeOrdersUsd: 4_000,
    },
  },
  {
    name: 'approval-stall',
    type: 'approval',
    signalType: 'approval.stalled',
    workedRecord: {
      stalledDays: 5,
      windowDays: 6,
      costOfDelayStatedUsd: 25_000,
      approvalDays: 3,
      holdLapsed: false,
      repriceUsd: 0,
    },
    failedRecord: {
      stalledDays: 8,
      windowDays: 4,
      costOfDelayStatedUsd: 0,
      approvalDays: 7,
      holdLapsed: true,
      repriceUsd: 18_000,
    },
  },
  {
    name: 'registration-pace',
    type: 'forecast',
    signalType: 'registration.pace_updated',
    workedRecord: {
      paceVsTargetPct: 76,
      daysOut: 45,
      target: 500,
      finalAttendance: 470,
      spendAddedUsd: 12_000,
    },
    failedRecord: {
      paceVsTargetPct: 58,
      daysOut: 22,
      target: 500,
      finalAttendance: 410,
      spendAddedUsd: 6_000,
    },
  },
  {
    name: 'policy-exception',
    type: 'policy',
    signalType: 'policy.checked',
    workedRecord: {
      policyId: 'POL-FB-07',
      exceptionGranted: true,
      incidentAfter: false,
      alternativeFoundDays: 0,
    },
    failedRecord: {
      policyId: 'POL-FB-07',
      exceptionGranted: false,
      incidentAfter: false,
      alternativeFoundDays: 8,
    },
  },
  {
    name: 'vendor-swap',
    type: 'vendor',
    signalType: 'quote.received',
    workedRecord: {
      incumbentQuoteUsd: 140_000,
      newQuoteUsd: 120_000,
      soleSource: false,
      deliveredToSpec: true,
      changeOrdersUsd: 4_000,
    },
    failedRecord: {
      incumbentQuoteUsd: 140_000,
      newQuoteUsd: 120_000,
      soleSource: true,
      deliveredToSpec: true,
      changeOrdersUsd: 9_000,
    },
  },
];

describe('labelCase', () => {
  it.each(examples)('labels worked records for $name', (example) => {
    const labelled = labelCase(corpusCase(example, example.workedRecord));

    expect(labelled.outcome).toBe('worked');
    expect(labelled.outcomeBasis).toBeTruthy();
  });

  it.each(examples)('labels failed records for $name', (example) => {
    const labelled = labelCase(corpusCase(example, example.failedRecord));

    expect(labelled.outcome).toBe('failed');
    expect(labelled.outcomeBasis).toBeTruthy();
  });

  it('names a contract addendum signed on the hold deadline without a zero-day margin', () => {
    const labelled = labelCase(
      corpusCase(examples[0]!, {
        clauseRequested: true,
        tradedDepositTiming: true,
        requestedDaysBeforeHold: 4,
        venueOwnership: 'private',
        legalReviewDays: 4,
        addendumSigned: true,
        signedWithinHold: true,
        exposureUsd: 90_000,
      }),
    );

    expect(labelled.outcome).toBe('worked');
    expect(labelled.outcomeBasis).toBe('addendum signed on the hold deadline');
  });

  it('throws with the case id for unknown families and missing facts', () => {
    expect(() => labelCase(corpusCase({ ...examples[0]!, type: 'logistics', signalType: 'quote.received' }, examples[0]!.workedRecord, 'bad-family'))).toThrow(
      /bad-family: unknown family/,
    );
    expect(() => labelCase(corpusCase(examples[0]!, { addendumSigned: true }, 'bad-facts'))).toThrow(/bad-facts: missing boolean fact "signedWithinHold"/);
  });
});

function corpusCase(example: Example, record: GeneratedCorpusCase['record'], id = `${example.name}-case`): GeneratedCorpusCase {
  return {
    id,
    type: example.type,
    signalType: example.signalType,
    title: 'Generated title',
    problem: 'Generated problem',
    event: 'Generated Event 2026 - Austin',
    when: '2026',
    detail: 'Generated detail.',
    tags: ['US Central', 'hotel'],
    approach: 'test-approach',
    record,
  };
}
