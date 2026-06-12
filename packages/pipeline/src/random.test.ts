import { describe, expect, it } from 'vitest';
import { mulberry32 } from './random.js';

describe('mulberry32', () => {
  it('returns the same first five values for the same seed', () => {
    const a = mulberry32(13);
    const b = mulberry32(13);

    const values = Array.from({ length: 5 }, () => a.next());
    expect(values).toEqual(Array.from({ length: 5 }, () => b.next()));
    expect(values).toEqual([
      0.5663226493634284,
      0.36011716164648533,
      0.0705908453091979,
      0.04816685197874904,
      0.03677086811512709,
    ]);
  });

  it('helpers respect bounds', () => {
    const rng = mulberry32(99);
    const options = ['a', 'b', 'c'] as const;

    for (let i = 0; i < 100; i += 1) {
      expect(options).toContain(rng.pick(options));
      expect(rng.int(4, 8)).toBeGreaterThanOrEqual(4);
      expect(rng.int(4, 8)).toBeLessThanOrEqual(8);
    }

    expect(mulberry32(1).chance(0)).toBe(false);
    expect(mulberry32(1).chance(1)).toBe(true);
  });
});
