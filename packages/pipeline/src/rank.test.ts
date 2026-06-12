import { describe, expect, it } from 'vitest';
import { dedupeBy, topSimilar, type Embedded } from './rank.js';

const items: Embedded[] = [
  { id: 'a', vector: [1, 0] },
  { id: 'b', vector: [0.8, 0.6] },
  { id: 'c', vector: [0, 1] },
];

describe('topSimilar', () => {
  it('ranks by cosine similarity, best first', () => {
    expect(topSimilar([1, 0], items, { k: 3, floor: 0 }).map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });

  it('applies the floor and the cap', () => {
    expect(topSimilar([1, 0], items, { k: 3, floor: 0.5 }).map((s) => s.id)).toEqual(['a', 'b']);
    expect(topSimilar([1, 0], items, { k: 1, floor: 0 }).map((s) => s.id)).toEqual(['a']);
  });

  it('excludes the query item itself', () => {
    expect(topSimilar([1, 0], items, { k: 3, floor: 0, exclude: 'a' }).map((s) => s.id)).toEqual(['b', 'c']);
  });

  it('breaks score ties by id for deterministic, diffable tables', () => {
    const tied: Embedded[] = [
      { id: 'z', vector: [1, 0] },
      { id: 'y', vector: [1, 0] },
    ];
    expect(topSimilar([1, 0], tied, { k: 2, floor: 0 }).map((s) => s.id)).toEqual(['y', 'z']);
  });

  it('rounds scores to 4 decimals', () => {
    const [top] = topSimilar([1, 0], [{ id: 'a', vector: [0.123456, 0] }], { k: 1, floor: 0 });
    expect(top?.score).toBe(0.1235);
  });
});

describe('dedupeBy', () => {
  it('keeps the first (best) entry per key', () => {
    const scored = [
      { id: 'c1', score: 0.9 },
      { id: 'c2', score: 0.8 },
      { id: 'c3', score: 0.7 },
    ];
    const eventOf: Record<string, string> = { c1: 'Barcelona', c2: 'Barcelona', c3: 'Prague' };
    expect(dedupeBy(scored, (id) => eventOf[id] ?? id).map((s) => s.id)).toEqual(['c1', 'c3']);
  });
});
