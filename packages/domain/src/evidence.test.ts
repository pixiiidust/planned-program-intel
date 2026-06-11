import { describe, expect, it } from 'vitest';
import { evidenceCounts, isSmallSample } from './evidence.js';
import type { Evidence, Precedent } from './types.js';

const PRECEDENT: Precedent = {
  sourceDecisionId: 'd9',
  sourceTitle: 'A similar decision',
  choice: 'accepted',
  reasoning: 'r',
  decidedBy: 'Dana Ortiz',
  daysAgo: 0,
};

function evidence(precedents: Precedent[]): Evidence {
  return { caseCount: 48, workedCount: 41, patterns: [], exceptions: [], cases: [], precedents };
}

describe('Track Record counts Cases only', () => {
  it('derives worked/failed from Cases', () => {
    expect(evidenceCounts(evidence([]))).toEqual({ worked: 41, failed: 7, total: 48 });
  });

  it('Precedents never move the counts — outcome pending', () => {
    expect(evidenceCounts(evidence([PRECEDENT, PRECEDENT]))).toEqual(evidenceCounts(evidence([])));
  });
});

describe('small-sample caveat', () => {
  it('applies under n=5 and not at n=5', () => {
    expect(isSmallSample({ worked: 2, total: 2, basis: 'b' })).toBe(true);
    expect(isSmallSample({ worked: 4, total: 5, basis: 'b' })).toBe(false);
  });
});
