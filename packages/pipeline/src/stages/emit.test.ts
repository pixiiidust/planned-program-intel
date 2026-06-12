import { describe, expect, it } from 'vitest';
import { makeDecision } from '@ppi/domain';
import type { CorpusCase } from '../corpus.js';
import type { SimilarityTable } from '../tables.js';
import { assembleBundle } from './emit.js';

const MODEL = 'fake-model';

function corpusCase(overrides: Partial<CorpusCase>): CorpusCase {
  return {
    id: 'c1',
    type: 'contract',
    title: 'A past contract situation',
    event: 'SKO 2025',
    when: '2025',
    outcome: 'worked',
    detail: 'what happened',
    tags: ['tag'],
    ...overrides,
  };
}

function table(rows: SimilarityTable['rows']): SimilarityTable {
  return { model: MODEL, params: {}, rows };
}

describe('assembleBundle', () => {
  const decisions = [
    makeDecision({ id: 'd1', evidence: { caseCount: 9, workedCount: 6, patterns: [], exceptions: [], cases: [], precedents: [] } }),
    makeDecision({ id: 'd2', evidence: { caseCount: 9, workedCount: 6, patterns: [], exceptions: [], cases: [], precedents: [] } }),
  ];

  it('joins ranked cases into evidence with the table score as similarity', () => {
    const cases = [corpusCase({ id: 'c1' }), corpusCase({ id: 'c2', event: 'Prague 2024', outcome: 'failed' })];
    const bundle = assembleBundle(
      decisions,
      cases,
      table({ d1: [{ id: 'c1', score: 0.91 }, { id: 'c2', score: 0.7 }], d2: [] }),
      table({}),
      'seed-test',
    );
    const d1 = bundle.decisions[0]!;
    expect(d1.evidence.cases.map((c) => [c.event, c.similarity, c.outcome])).toEqual([
      ['SKO 2025', 0.91, 'worked'],
      ['Prague 2024', 0.7, 'failed'],
    ]);
  });

  it('keeps patternIndex only for cases extracted from the same decision', () => {
    const decisionsWithPattern = [
      makeDecision({
        id: 'd1',
        evidence: {
          caseCount: 9,
          workedCount: 6,
          patterns: [{ outcome: 'worked', title: 'P', count: '1 of 6', example: { event: 'E', detail: 'x' }, takeaway: 't' }],
          exceptions: [],
          cases: [],
          precedents: [],
        },
      }),
      decisions[1]!,
    ];
    const cases = [
      corpusCase({ id: 'own', origin: { decisionId: 'd1', patternIndex: 0 } }),
      corpusCase({ id: 'foreign', event: 'Other 2024', origin: { decisionId: 'd2', patternIndex: 0 } }),
    ];
    const bundle = assembleBundle(
      decisionsWithPattern,
      cases,
      table({ d1: [{ id: 'own', score: 0.9 }, { id: 'foreign', score: 0.8 }], d2: [] }),
      table({}),
      'seed-test',
    );
    const [own, foreign] = bundle.decisions[0]!.evidence.cases;
    expect(own?.patternIndex).toBe(0);
    expect(foreign?.patternIndex).toBeUndefined();
  });

  it('maps the sibling table to an id list, dropping empty rows', () => {
    const bundle = assembleBundle(decisions, [], table({ d1: [], d2: [] }), table({ d1: [{ id: 'd2', score: 0.8 }], d2: [] }), 'seed-test');
    expect(bundle.siblings).toEqual({ d1: ['d2'] });
  });

  it('refuses to emit a bundle that violates the domain contracts', () => {
    const badTable = table({ d1: [{ id: 'c1', score: 0.5 }, { id: 'c2', score: 0.9 }], d2: [] });
    const cases = [corpusCase({ id: 'c1' }), corpusCase({ id: 'c2', event: 'Prague 2024' })];
    expect(() => assembleBundle(decisions, cases, badTable, table({}), 'seed-test')).toThrow(/violates the domain contracts/);
  });

  it('fails loudly when a ranked case is missing from the corpus', () => {
    expect(() => assembleBundle(decisions, [], table({ d1: [{ id: 'ghost', score: 0.9 }], d2: [] }), table({}), 'seed-test')).toThrow(
      /ranked case ghost not in the corpus/,
    );
  });
});
