import { describe, expect, it } from 'vitest';
import { evidenceCounts } from './evidence.js';
import { landPrecedent, precedentFrom } from './precedents.js';
import { makeDecision } from './testing.js';
import type { Resolution } from './types.js';

const RESOLUTION: Resolution = {
  choice: 'accepted',
  reasoning: 'Storm season is the exact scenario the clause covers.',
  decidedBy: 'Priya Nair',
  daysAgo: 0,
};

describe('Precedent spawning', () => {
  it('a Resolution becomes a Precedent carrying decider, reasoning, recency — no outcome', () => {
    const source = makeDecision({ id: 'd1', title: 'Lisbon contract' });
    const p = precedentFrom(source, RESOLUTION);
    expect(p).toEqual({
      sourceDecisionId: 'd1',
      sourceTitle: 'Lisbon contract',
      choice: 'accepted',
      reasoning: RESOLUTION.reasoning,
      decidedBy: 'Priya Nair',
      daysAgo: 0,
    });
    expect(p).not.toHaveProperty('outcome');
  });

  it('lands at the top of the sibling Evidence', () => {
    const sibling = makeDecision({ id: 'd17' });
    const updated = landPrecedent(sibling, precedentFrom(makeDecision({ id: 'd1' }), RESOLUTION));
    expect(updated.evidence.precedents[0]?.sourceDecisionId).toBe('d1');
    expect(sibling.evidence.precedents).toHaveLength(0); // pure
  });

  it('re-landing from the same source replaces, never duplicates', () => {
    const sibling = makeDecision({ id: 'd17' });
    const once = landPrecedent(sibling, precedentFrom(makeDecision({ id: 'd1' }), RESOLUTION));
    const twice = landPrecedent(once, precedentFrom(makeDecision({ id: 'd1' }), { ...RESOLUTION, choice: 'changed' }));
    expect(twice.evidence.precedents).toHaveLength(1);
    expect(twice.evidence.precedents[0]?.choice).toBe('changed');
  });

  it('never moves the Track Record counts — the Track Record never lies', () => {
    const sibling = makeDecision({ id: 'd17' });
    const before = evidenceCounts(sibling.evidence);
    const after = evidenceCounts(landPrecedent(sibling, precedentFrom(makeDecision({ id: 'd1' }), RESOLUTION)).evidence);
    expect(after).toEqual(before);
  });
});
