import { describe, expect, it } from 'vitest';
import { evidenceCounts } from './evidence.js';
import { distillPrecedentText, landPrecedent, precedentFrom } from './precedents.js';
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

  it('swaps distilled text into the matching Precedent', () => {
    const source = precedentFrom(makeDecision({ id: 'd1' }), RESOLUTION);
    const sibling = landPrecedent(makeDecision({ id: 'd17' }), source);

    const updated = distillPrecedentText(sibling, 'd1', 'Accepted the clause because storm exposure outweighed deposit timing.', 'Demo proxy · haiku');

    expect(updated).not.toBe(sibling);
    expect(updated.evidence.precedents[0]).toMatchObject({
      sourceDecisionId: 'd1',
      reasoning: 'Accepted the clause because storm exposure outweighed deposit timing.',
      distilledBy: 'Demo proxy · haiku',
    });
  });

  it('returns the sibling unchanged when no matching Precedent exists', () => {
    const sibling = landPrecedent(makeDecision({ id: 'd17' }), precedentFrom(makeDecision({ id: 'd1' }), RESOLUTION));

    const updated = distillPrecedentText(sibling, 'missing', 'No match.', 'Demo proxy · haiku');

    expect(updated).toBe(sibling);
  });

  it('leaves other Precedents untouched', () => {
    const first = precedentFrom(makeDecision({ id: 'd1' }), RESOLUTION);
    const second = precedentFrom(makeDecision({ id: 'd2' }), { ...RESOLUTION, reasoning: 'AV variance needs sales funding.' });
    const sibling = landPrecedent(landPrecedent(makeDecision({ id: 'd17' }), first), second);
    const other = sibling.evidence.precedents.find((p) => p.sourceDecisionId === 'd2')!;

    const updated = distillPrecedentText(sibling, 'd1', 'Accepted because the weather clause covered the exposure.', 'Demo proxy · haiku');

    expect(updated.evidence.precedents.find((p) => p.sourceDecisionId === 'd2')).toBe(other);
    expect(updated.evidence.precedents.find((p) => p.sourceDecisionId === 'd1')?.reasoning).toBe(
      'Accepted because the weather clause covered the exposure.',
    );
  });
});
