import type { Decision, SeedBundle } from '@ppi/domain';

/** Adapters return storage order; the queue expects seed order. */
export function inSeedOrder(seed: SeedBundle, decisions: Decision[]): Decision[] {
  const rank = new Map(seed.decisions.map((d, i) => [d.id, i]));
  return [...decisions].sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER));
}
