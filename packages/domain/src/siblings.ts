import type { Decision, SeedBundle } from './types.js';

/**
 * Sibling routing: when a Decision is resolved, its Precedent lands in the
 * Evidence of similar, still-unresolved Decisions. The sibling map is seed
 * data (hand-authored stopgap; the slice-2 pipeline emits it).
 */
export function openSiblingsOf(
  decisionId: string,
  decisions: Decision[],
  siblings: SeedBundle['siblings'],
): Decision[] {
  const ids = siblings[decisionId] ?? [];
  return ids
    .map((id) => decisions.find((d) => d.id === id))
    .filter((d): d is Decision => d !== undefined && d.status !== 'resolved');
}
