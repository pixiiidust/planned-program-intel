import { describe, expect, it } from 'vitest';
import { makeDecision, type Decision } from '@ppi/domain';
import type { CorpusCase, CorpusRecord } from '../corpus.js';
import type { SimilarityTable } from '../tables.js';
import { buildIntelligence, INTELLIGENCE_PARAMS, type IntelligenceParams } from './cluster.js';

function params(
  overrides: Partial<Omit<IntelligenceParams, 'exception'>> & { exception?: Partial<IntelligenceParams['exception']> } = {},
): IntelligenceParams {
  return {
    ...INTELLIGENCE_PARAMS,
    ...overrides,
    exception: { ...INTELLIGENCE_PARAMS.exception, ...overrides.exception },
  };
}

function decision(id: string): Decision {
  return makeDecision({ id });
}

function corpusCase(overrides: Partial<CorpusCase> & { id: string }): CorpusCase {
  const { id, ...rest } = overrides;
  return {
    id,
    type: 'contract',
    title: `Case ${id}`,
    problem: `Problem ${id}`,
    event: `Event ${id}`,
    when: '2025',
    signalType: 'contract.summarized',
    approach: 'default-approach',
    record: {},
    outcome: 'worked',
    outcomeBasis: 'fixture basis',
    detail: 'fixture detail',
    tags: [],
    ...rest,
  };
}

function table(rows: SimilarityTable['rows']): SimilarityTable {
  return { model: 'fixture-model', params: {}, rows };
}

function rowsFor(cases: readonly CorpusCase[]): SimilarityTable['rows'][string] {
  return cases.map((c, index) => ({ id: c.id, score: 0.99 - index * 0.01 }));
}

describe('buildIntelligence', () => {
  it('filters membership by type gate and memberFloor, then derives caseCount/workedCount', () => {
    const cases = [
      corpusCase({ id: 'c1', outcome: 'worked' }),
      corpusCase({ id: 'c2', outcome: 'failed' }),
      corpusCase({ id: 'c3', outcome: 'worked' }),
      corpusCase({ id: 'c4', type: 'budget', outcome: 'worked' }),
    ];

    const [result] = buildIntelligence(
      [decision('d1')],
      cases,
      table({
        d1: [
          { id: 'c1', score: 0.6 },
          { id: 'c2', score: 0.25 },
          { id: 'c3', score: 0.249 },
          { id: 'c4', score: 0.99 },
        ],
      }),
      params({ minClusterSize: 3 }),
    );

    expect(result).toMatchObject({ decisionId: 'd1', caseCount: 2, workedCount: 1, patterns: [], exceptions: [] });
  });

  it('groups patterns by approach with min size, ordering, cap, and matching exemplars', () => {
    const cases = [
      corpusCase({ id: 'a1', approach: 'alpha', outcome: 'failed' }),
      corpusCase({ id: 'a2', approach: 'alpha', outcome: 'worked' }),
      corpusCase({ id: 'a3', approach: 'alpha', outcome: 'worked' }),
      corpusCase({ id: 'b1', approach: 'beta', outcome: 'worked' }),
      corpusCase({ id: 'b2', approach: 'beta', outcome: 'worked' }),
      corpusCase({ id: 'b3', approach: 'beta', outcome: 'worked' }),
      corpusCase({ id: 'b4', approach: 'beta', outcome: 'worked' }),
      corpusCase({ id: 'd1', approach: 'delta', outcome: 'worked' }),
      corpusCase({ id: 'd2', approach: 'delta', outcome: 'worked' }),
      corpusCase({ id: 'd3', approach: 'delta', outcome: 'worked' }),
      corpusCase({ id: 'd4', approach: 'delta', outcome: 'failed' }),
      corpusCase({ id: 'd5', approach: 'delta', outcome: 'failed' }),
      corpusCase({ id: 'g1', approach: 'gamma', outcome: 'worked' }),
      corpusCase({ id: 'g2', approach: 'gamma', outcome: 'failed' }),
      corpusCase({ id: 'g3', approach: 'gamma', outcome: 'failed' }),
      corpusCase({ id: 'g4', approach: 'gamma', outcome: 'failed' }),
      corpusCase({ id: 'g5', approach: 'gamma', outcome: 'worked' }),
      corpusCase({ id: 'o1', approach: 'omega', outcome: 'failed' }),
      corpusCase({ id: 'o2', approach: 'omega', outcome: 'failed' }),
      corpusCase({ id: 'o3', approach: 'omega', outcome: 'failed' }),
      corpusCase({ id: 'o4', approach: 'omega', outcome: 'failed' }),
      corpusCase({ id: 'tiny1', approach: 'tiny', outcome: 'worked' }),
      corpusCase({ id: 'tiny2', approach: 'tiny', outcome: 'worked' }),
    ];

    const [result] = buildIntelligence([decision('d1')], cases, table({ d1: rowsFor(cases) }), params({ maxPatterns: 5 }));

    expect(result?.patterns).toEqual([
      { approach: 'beta', outcome: 'worked', size: 4, worked: 4, failed: 0, exemplarCaseId: 'b1' },
      { approach: 'delta', outcome: 'worked', size: 5, worked: 3, failed: 2, exemplarCaseId: 'd1' },
      { approach: 'alpha', outcome: 'worked', size: 3, worked: 2, failed: 1, exemplarCaseId: 'a2' },
      { approach: 'omega', outcome: 'failed', size: 4, worked: 0, failed: 4, exemplarCaseId: 'o1' },
      { approach: 'gamma', outcome: 'failed', size: 5, worked: 2, failed: 3, exemplarCaseId: 'g2' },
    ]);
  });

  it('falls back to the highest-similarity member when no member matches the derived outcome', () => {
    const cases = [
      corpusCase({ id: 'f1', approach: 'fallback', outcome: 'unknown' as CorpusCase['outcome'] }),
      corpusCase({ id: 'f2', approach: 'fallback', outcome: 'unknown' as CorpusCase['outcome'] }),
      corpusCase({ id: 'f3', approach: 'fallback', outcome: 'unknown' as CorpusCase['outcome'] }),
    ];

    const [result] = buildIntelligence([decision('d1')], cases, table({ d1: rowsFor(cases) }), params());

    expect(result?.patterns).toEqual([
      { approach: 'fallback', outcome: 'failed', size: 3, worked: 0, failed: 3, exemplarCaseId: 'f1' },
    ]);
  });

  it('emits exceptions only when size and divergence thresholds pass, then orders and caps them', () => {
    const cases = [
      exceptionCase('c1', 'worked', { venueOwnership: 'government' }),
      exceptionCase('c2', 'worked', { venueOwnership: 'government' }),
      exceptionCase('c3', 'worked', { venueOwnership: 'government' }),
      exceptionCase('c4', 'worked', { vendorExclusivityClause: true }),
      exceptionCase('c5', 'failed', { soleSource: true }),
      exceptionCase('c6', 'failed', { soleSource: true, daysOut: 20 }),
      exceptionCase('c7', 'failed', { soleSource: true, daysOut: 20 }),
      exceptionCase('c8', 'failed', { soleSource: true, daysOut: 20 }),
      exceptionCase('c9', 'failed', { soleSource: true, vendorExclusivityClause: true }),
      exceptionCase('c10', 'failed', { vendorExclusivityClause: true }),
    ];
    const inputTable = table({ d1: rowsFor(cases) });

    const [uncapped] = buildIntelligence(
      [decision('d1')],
      cases,
      inputTable,
      params({ exception: { maxPerDecision: 4 } }),
    );
    expect(uncapped?.exceptions).toEqual([
      { id: 'government-venue', label: 'Government-owned venues', size: 3, worked: 3, parentWorked: 4, parentTotal: 10 },
      { id: 'sole-source', label: 'Sole-source vendors', size: 5, worked: 0, parentWorked: 4, parentTotal: 10 },
      { id: 'inside-30-days', label: 'Inside 30 days out', size: 3, worked: 0, parentWorked: 4, parentTotal: 10 },
    ]);

    const [capped] = buildIntelligence([decision('d1')], cases, inputTable, params());
    expect(capped?.exceptions.map((finding) => finding.id)).toEqual(['government-venue', 'sole-source']);
  });

  it('emits a metric-fired exception with rounded metric means when outcome divergence is low', () => {
    const cases = [
      exceptionCase('g1', 'worked', { venueOwnership: 'government', legalReviewDays: 12.2 }),
      exceptionCase('g2', 'failed', { venueOwnership: 'government', legalReviewDays: 12.4 }),
      exceptionCase('g3', 'worked', { venueOwnership: 'government', legalReviewDays: 12.3 }),
      exceptionCase('p1', 'worked', { venueOwnership: 'private', legalReviewDays: 6.0 }),
      exceptionCase('p2', 'failed', { venueOwnership: 'private', legalReviewDays: 6.2 }),
      exceptionCase('p3', 'worked', { venueOwnership: 'private', legalReviewDays: 6.1 }),
    ];

    const [result] = buildIntelligence([decision('d1')], cases, table({ d1: rowsFor(cases) }), params());

    expect(result?.exceptions).toEqual([
      {
        id: 'government-venue',
        label: 'Government-owned venues',
        size: 3,
        worked: 2,
        parentWorked: 4,
        parentTotal: 6,
        metric: { key: 'legalReviewDays', label: 'legal review', unit: 'days', subgroupMean: 12.3, complementMean: 6.1 },
      },
    ]);
  });

  it('does not emit an exception below both rate and metric thresholds', () => {
    const cases = [
      exceptionCase('g1', 'worked', { venueOwnership: 'government', legalReviewDays: 9 }),
      exceptionCase('g2', 'failed', { venueOwnership: 'government', legalReviewDays: 9 }),
      exceptionCase('g3', 'worked', { venueOwnership: 'government', legalReviewDays: 9 }),
      exceptionCase('p1', 'worked', { venueOwnership: 'private', legalReviewDays: 6 }),
      exceptionCase('p2', 'failed', { venueOwnership: 'private', legalReviewDays: 6 }),
      exceptionCase('p3', 'worked', { venueOwnership: 'private', legalReviewDays: 6 }),
    ];

    const [result] = buildIntelligence([decision('d1')], cases, table({ d1: rowsFor(cases) }), params());

    expect(result?.exceptions).toEqual([]);
  });

  it('ranks metric-fired strength against rate-fired strength for caps', () => {
    const cases = [
      exceptionCase('g1', 'worked', { venueOwnership: 'government', legalReviewDays: 12 }),
      exceptionCase('g2', 'failed', { venueOwnership: 'government', legalReviewDays: 12 }),
      exceptionCase('g3', 'worked', { venueOwnership: 'government', legalReviewDays: 12 }),
      exceptionCase('s1', 'failed', { venueOwnership: 'private', legalReviewDays: 4, soleSource: true }),
      exceptionCase('s2', 'failed', { venueOwnership: 'private', legalReviewDays: 4, soleSource: true }),
      exceptionCase('s3', 'failed', { venueOwnership: 'private', legalReviewDays: 4, soleSource: true }),
      exceptionCase('p1', 'worked', { venueOwnership: 'private', legalReviewDays: 4 }),
      exceptionCase('p2', 'worked', { venueOwnership: 'private', legalReviewDays: 4 }),
      exceptionCase('p3', 'worked', { venueOwnership: 'private', legalReviewDays: 4 }),
      exceptionCase('p4', 'worked', { venueOwnership: 'private', legalReviewDays: 4 }),
    ];

    const [result] = buildIntelligence([decision('d1')], cases, table({ d1: rowsFor(cases) }), params({ exception: { maxPerDecision: 2 } }));

    expect(result?.exceptions.map((finding) => finding.id)).toEqual(['government-venue', 'sole-source']);
  });

  it('is deterministic for the same inputs and preserves decision order', () => {
    const cases = [
      corpusCase({ id: 'c1', outcome: 'worked' }),
      corpusCase({ id: 'c2', outcome: 'failed' }),
      corpusCase({ id: 'c3', outcome: 'worked' }),
    ];
    const decisions = [decision('d2'), decision('d1')];
    const inputTable = table({
      d1: [
        { id: 'c1', score: 0.7 },
        { id: 'c2', score: 0.6 },
      ],
      d2: [{ id: 'c3', score: 0.8 }],
    });

    const first = buildIntelligence(decisions, cases, inputTable, params({ minClusterSize: 1 }));
    const second = buildIntelligence(decisions, cases, inputTable, params({ minClusterSize: 1 }));

    expect(first).toEqual(second);
    expect(first.map((item) => item.decisionId)).toEqual(['d2', 'd1']);
  });
});

function exceptionCase(id: string, outcome: CorpusCase['outcome'], record: CorpusRecord): CorpusCase {
  return corpusCase({ id, outcome, record, approach: 'exception-fixture' });
}
