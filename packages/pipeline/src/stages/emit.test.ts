import { describe, expect, it } from 'vitest';
import { makeDecision, type Decision } from '@ppi/domain';
import type { CorpusCase } from '../corpus.js';
import type { SimilarityTable } from '../tables.js';
import type { DecisionIntelligence } from './cluster.js';
import { assembleBundle } from './emit.js';
import type { DecisionNarration } from './name.js';

const MODEL = 'fake-model';

function corpusCase(overrides: Partial<CorpusCase> & { id: string }): CorpusCase {
  const { id, ...rest } = overrides;
  return {
    id,
    type: 'contract',
    title: 'A past contract situation',
    event: 'SKO 2025',
    when: '2025',
    signalType: 'contract.summarized',
    approach: 'default-approach',
    outcome: 'worked',
    detail: 'what happened',
    tags: ['tag'],
    ...rest,
  };
}

function table(rows: SimilarityTable['rows']): SimilarityTable {
  return { model: MODEL, params: {}, rows };
}

function decision(id: string, overrides: Partial<Decision> = {}): Decision {
  return makeDecision({ id, evidence: { caseCount: 99, workedCount: 1, patterns: [], exceptions: [], cases: [], precedents: [] }, ...overrides });
}

function minimalIntelligence(decisions: readonly Decision[], caseCount = 0, workedCount = 0): DecisionIntelligence[] {
  return decisions.map((d) => ({ decisionId: d.id, caseCount, workedCount, patterns: [], exceptions: [] }));
}

function minimalNarration(decisions: readonly Decision[], basis = 'similar contract decisions drawn from past event programs'): DecisionNarration[] {
  return decisions.map((d) => ({ decisionId: d.id, basis, patterns: [], exceptions: [] }));
}

function assemble(
  decisions: Decision[],
  cases: CorpusCase[],
  caseTable: SimilarityTable,
  siblingTable: SimilarityTable,
  intelligence = minimalIntelligence(decisions),
  narration = minimalNarration(decisions),
) {
  return assembleBundle(decisions, cases, caseTable, siblingTable, intelligence, narration, 'seed-test');
}

describe('assembleBundle', () => {
  const decisions = [decision('d1'), decision('d2')];

  it('derives evidence figures, patterns, exceptions, and track from intelligence plus narration', () => {
    const cases = [
      corpusCase({ id: 'success', event: 'SKO 2025', approach: 'pair-with-deposit-trade', detail: 'deposit traded' }),
      corpusCase({ id: 'failure', event: 'Summit 2025', approach: 'sign-without-clause', outcome: 'failed', detail: 'clause skipped' }),
      corpusCase({ id: 'other', event: 'Expo 2025', approach: 'unmatched', detail: 'other detail' }),
    ];
    const intelligence: DecisionIntelligence[] = [
      {
        decisionId: 'd1',
        caseCount: 4,
        workedCount: 3,
        patterns: [
          { approach: 'pair-with-deposit-trade', outcome: 'worked', size: 3, worked: 2, failed: 1, exemplarCaseId: 'success' },
          { approach: 'sign-without-clause', outcome: 'failed', size: 1, worked: 0, failed: 1, exemplarCaseId: 'failure' },
        ],
        exceptions: [{ id: 'government-venue', label: 'Government-owned venues', size: 2, worked: 1, parentWorked: 3, parentTotal: 4 }],
      },
      { decisionId: 'd2', caseCount: 0, workedCount: 0, patterns: [], exceptions: [] },
    ];
    const narration: DecisionNarration[] = [
      {
        decisionId: 'd1',
        basis: 'similar contract decisions drawn from past event programs',
        patterns: [
          { approach: 'pair-with-deposit-trade', title: 'Pair with deposit trade', takeaway: 'Use the trade when leverage is clear.' },
          { approach: 'sign-without-clause', title: 'Avoid signing without clause', takeaway: 'This tends to fail when exposure stays open.' },
        ],
        exceptions: [{ id: 'government-venue', whyItMattersNow: 'Check whether the venue review path applies now.' }],
      },
      { decisionId: 'd2', basis: 'similar contract decisions drawn from past event programs', patterns: [], exceptions: [] },
    ];

    const bundle = assemble(
      decisions,
      cases,
      table({ d1: [{ id: 'success', score: 0.91 }, { id: 'failure', score: 0.8 }, { id: 'other', score: 0.7 }], d2: [] }),
      table({}),
      intelligence,
      narration,
    );

    const d1 = bundle.decisions[0]!;
    expect(d1.evidence.caseCount).toBe(4);
    expect(d1.evidence.workedCount).toBe(3);
    expect(d1.recommendation.track).toEqual({ worked: 3, total: 4, basis: 'similar contract decisions drawn from past event programs' });
    expect(d1.evidence.patterns).toEqual([
      {
        outcome: 'worked',
        title: 'Pair with deposit trade',
        count: '2 of the 3 successes',
        example: { event: 'SKO 2025', detail: 'deposit traded' },
        takeaway: 'Use the trade when leverage is clear.',
      },
      {
        outcome: 'failed',
        title: 'Avoid signing without clause',
        count: '1 of the 1 failures',
        example: { event: 'Summit 2025', detail: 'clause skipped' },
        takeaway: 'This tends to fail when exposure stays open.',
      },
    ]);
    expect(d1.evidence.exceptions).toEqual([
      {
        title: 'Government-owned venues (2 cases)',
        detail: 'Worked 1 of 2 vs 75% across the similar set. Check whether the venue review path applies now.',
      },
    ]);
    expect(d1.evidence.cases.map((c) => [c.event, c.patternIndex])).toEqual([
      ['SKO 2025', 0],
      ['Summit 2025', 1],
      ['Expo 2025', undefined],
    ]);
    expect(d1.evidence.precedents).toEqual([]);
  });

  it('does not display a high-scoring case outside the decision type', () => {
    const cases = [
      corpusCase({ id: 'budget-case', type: 'budget', event: 'Budget Case' }),
      corpusCase({ id: 'contract-case', type: 'contract', event: 'Contract Case' }),
    ];
    const bundle = assemble(
      decisions,
      cases,
      table({
        d1: [
          { id: 'budget-case', score: 0.99 },
          { id: 'contract-case', score: 0.8 },
        ],
        d2: [],
      }),
      table({}),
      minimalIntelligence(decisions, 1, 1),
    );

    expect(bundle.decisions[0]!.evidence.cases.map((c) => c.event)).toEqual(['Contract Case']);
  });

  it('renders metric-fired exceptions as a metric story with clean mean formatting', () => {
    const intelligence: DecisionIntelligence[] = [
      {
        decisionId: 'd1',
        caseCount: 6,
        workedCount: 4,
        patterns: [],
        exceptions: [
          {
            id: 'government-venue',
            label: 'Government-owned venues',
            size: 3,
            worked: 2,
            parentWorked: 4,
            parentTotal: 6,
            metric: {
              key: 'legalReviewDays',
              label: 'legal review',
              unit: 'days',
              subgroupMean: 11.7,
              complementMean: 6,
            },
          },
        ],
      },
      { decisionId: 'd2', caseCount: 0, workedCount: 0, patterns: [], exceptions: [] },
    ];
    const narration: DecisionNarration[] = [
      {
        decisionId: 'd1',
        basis: 'similar contract decisions drawn from past event programs',
        patterns: [],
        exceptions: [{ id: 'government-venue', whyItMattersNow: 'Check whether the venue review path applies now.' }],
      },
      { decisionId: 'd2', basis: 'similar contract decisions drawn from past event programs', patterns: [], exceptions: [] },
    ];

    const bundle = assemble(decisions, [], table({ d1: [], d2: [] }), table({}), intelligence, narration);

    expect(bundle.decisions[0]!.evidence.exceptions).toEqual([
      {
        title: 'Government-owned venues (3 cases)',
        detail:
          'Legal review averaged 11.7 days vs 6 across the rest of the similar set. Check whether the venue review path applies now.',
      },
    ]);
  });

  it('sets patternIndex by emitted pattern approach, ignoring origin metadata', () => {
    const decisionsWithPattern = [decision('d1'), decision('d2')];
    const cases = [
      corpusCase({ id: 'matched', approach: 'matched-approach', origin: { decisionId: 'd2', patternIndex: 99 } }),
      corpusCase({ id: 'unmatched', event: 'Other 2024', approach: 'other-approach', origin: { decisionId: 'd1', patternIndex: 0 } }),
    ];
    const intelligence: DecisionIntelligence[] = [
      {
        decisionId: 'd1',
        caseCount: 2,
        workedCount: 2,
        patterns: [{ approach: 'matched-approach', outcome: 'worked', size: 2, worked: 2, failed: 0, exemplarCaseId: 'matched' }],
        exceptions: [],
      },
      { decisionId: 'd2', caseCount: 0, workedCount: 0, patterns: [], exceptions: [] },
    ];
    const narration: DecisionNarration[] = [
      {
        decisionId: 'd1',
        basis: 'similar contract decisions drawn from past event programs',
        patterns: [{ approach: 'matched-approach', title: 'Matched approach', takeaway: 'Use the matched approach.' }],
        exceptions: [],
      },
      { decisionId: 'd2', basis: 'similar contract decisions drawn from past event programs', patterns: [], exceptions: [] },
    ];

    const bundle = assemble(
      decisionsWithPattern,
      cases,
      table({ d1: [{ id: 'matched', score: 0.9 }, { id: 'unmatched', score: 0.8 }], d2: [] }),
      table({}),
      intelligence,
      narration,
    );
    const [matched, unmatched] = bundle.decisions[0]!.evidence.cases;
    expect(matched?.patternIndex).toBe(0);
    expect(unmatched?.patternIndex).toBeUndefined();
  });

  it('dedupes displayed cases by event and applies the display cap', () => {
    const cases = [
      corpusCase({ id: 'c1', event: 'Shared event' }),
      corpusCase({ id: 'c2', event: 'Shared event', detail: 'duplicate event' }),
      corpusCase({ id: 'c3', event: 'Event 3' }),
      corpusCase({ id: 'c4', event: 'Event 4' }),
      corpusCase({ id: 'c5', event: 'Event 5' }),
      corpusCase({ id: 'c6', event: 'Event 6' }),
    ];
    const bundle = assemble(
      decisions,
      cases,
      table({
        d1: [
          { id: 'c1', score: 0.95 },
          { id: 'c2', score: 0.94 },
          { id: 'c3', score: 0.93 },
          { id: 'c4', score: 0.92 },
          { id: 'c5', score: 0.91 },
          { id: 'c6', score: 0.9 },
        ],
        d2: [],
      }),
      table({}),
      minimalIntelligence(decisions, 6, 4),
    );

    expect(bundle.decisions[0]!.evidence.cases.map((c) => c.event)).toEqual(['Shared event', 'Event 3', 'Event 4', 'Event 5']);
  });

  it('maps the sibling table to an id list, dropping empty rows', () => {
    const bundle = assemble(decisions, [], table({ d1: [], d2: [] }), table({ d1: [{ id: 'd2', score: 0.8 }], d2: [] }));
    expect(bundle.siblings).toEqual({ d1: ['d2'] });
  });

  it('emits valid empty evidence for decisions with an empty similar set', () => {
    const emptyDecision = decision('empty');
    const bundle = assemble([emptyDecision], [], table({ empty: [] }), table({}), minimalIntelligence([emptyDecision]), [
      { decisionId: 'empty', basis: 'similar contract decisions drawn from past event programs', patterns: [], exceptions: [] },
    ]);

    expect(bundle.decisions[0]!.recommendation.track).toEqual({
      worked: 0,
      total: 0,
      basis: 'similar contract decisions drawn from past event programs',
    });
    expect(bundle.decisions[0]!.evidence).toMatchObject({ caseCount: 0, workedCount: 0, patterns: [], exceptions: [], cases: [] });
  });

  it('refuses to emit a bundle that violates the domain contracts', () => {
    const badTable = table({ d1: [{ id: 'c1', score: 1.2 }], d2: [] });
    const cases = [corpusCase({ id: 'c1' })];
    expect(() => assemble(decisions, cases, badTable, table({}), minimalIntelligence(decisions, 1, 1))).toThrow(
      /violates the domain contracts/,
    );
  });

  it('fails loudly when a ranked case is missing from the corpus', () => {
    expect(() =>
      assemble(decisions, [], table({ d1: [{ id: 'ghost', score: 0.9 }], d2: [] }), table({}), minimalIntelligence(decisions, 1, 1)),
    ).toThrow(/table case ghost not in the corpus/);
  });

  it('fails clearly when intelligence or narration does not cover decisions', () => {
    expect(() => assembleBundle(decisions, [], table({ d1: [], d2: [] }), table({}), minimalIntelligence([decisions[0]!]), minimalNarration(decisions))).toThrow(
      /intelligence proposal does not cover decision d2/,
    );
    expect(() =>
      assembleBundle(decisions, [], table({ d1: [], d2: [] }), table({}), minimalIntelligence(decisions), minimalNarration([decisions[0]!])),
    ).toThrow(/narration proposal does not cover decision d2/);
  });
});
