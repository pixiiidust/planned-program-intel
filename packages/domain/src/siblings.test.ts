import { describe, expect, it } from 'vitest';
import { openSiblingsOf } from './siblings.js';
import { makeDecision } from './testing.js';
import type { DecisionStatus } from './types.js';

function decision(id: string, status: DecisionStatus) {
  return makeDecision({ id, status });
}

describe('sibling routing', () => {
  const decisions = [decision('d1', 'open'), decision('s1', 'open'), decision('s2', 'resolved'), decision('s3', 'blocked')];
  const siblings = { d1: ['s1', 's2', 's3'] };

  it('returns unresolved siblings only — a Precedent lands where a call is still open', () => {
    expect(openSiblingsOf('d1', decisions, siblings).map((d) => d.id)).toEqual(['s1', 's3']);
  });

  it('returns nothing for decisions without sibling entries', () => {
    expect(openSiblingsOf('s1', decisions, siblings)).toEqual([]);
  });

  it('ignores dangling sibling ids', () => {
    expect(openSiblingsOf('d1', [decision('d1', 'open')], { d1: ['ghost'] })).toEqual([]);
  });
});
