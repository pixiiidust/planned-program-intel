export interface Rng {
  next(): number;
  pick<T>(arr: readonly T[]): T;
  int(min: number, max: number): number;
  chance(p: number): boolean;
}

export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };

  return {
    next,
    pick<T>(arr: readonly T[]): T {
      if (arr.length === 0) throw new Error('cannot pick from an empty array');
      return arr[Math.floor(next() * arr.length)]!;
    },
    int(min: number, max: number): number {
      if (!Number.isInteger(min) || !Number.isInteger(max)) throw new Error('rng int bounds must be integers');
      if (max < min) throw new Error(`rng int max ${max} is below min ${min}`);
      return Math.floor(next() * (max - min + 1)) + min;
    },
    chance(p: number): boolean {
      if (p < 0 || p > 1) throw new Error(`rng chance probability ${p} is outside [0, 1]`);
      return next() < p;
    },
  };
}
