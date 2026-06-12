import { DEMO_SEED } from '@ppi/adapters';

export const FEED_DECISION_IDS: ReadonlySet<string> = new Set((DEMO_SEED.feedDecisions ?? []).map((d) => d.id));

export function feedDelayMs(search: string): number | null {
  const raw = new URLSearchParams(search).get('feedDelay');
  if (raw === null) return 20000;
  if (!/^\d+$/.test(raw)) return null;

  const delayMs = Number(raw);
  return Number.isSafeInteger(delayMs) && delayMs > 0 ? delayMs : null;
}
