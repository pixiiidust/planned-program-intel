// Pure similarity ranking over unit-length vectors (cosine = dot product).
export interface Scored {
  id: string;
  score: number;
}

export interface Embedded {
  id: string;
  vector: number[];
}

export function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] ?? 0) * (b[i] ?? 0);
  return sum;
}

const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

/** Items scoring at or above the floor, best first (id breaks ties), capped at k. */
export function topSimilar(query: number[], items: Embedded[], opts: { k: number; floor: number; exclude?: string }): Scored[] {
  return items
    .filter((item) => item.id !== opts.exclude)
    .map((item) => ({ id: item.id, score: round4(dot(query, item.vector)) }))
    .filter((scored) => scored.score >= opts.floor)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, opts.k);
}

/** Keeps the best-scoring entry per key — used to avoid listing one event twice in a ranking. */
export function dedupeBy(scored: Scored[], keyOf: (id: string) => string): Scored[] {
  const seen = new Set<string>();
  return scored.filter((s) => {
    const key = keyOf(s.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
