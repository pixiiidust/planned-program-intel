import type { QueueTab } from '@ppi/domain';

export interface ActivityJump {
  tab: QueueTab;
  id: string;
}

export interface ActivityEntry {
  id: number;
  at: number;
  message: string;
  jump?: ActivityJump;
  distilled: boolean;
  unseen: boolean;
}

export function appendEntry(
  entries: ActivityEntry[],
  entry: Omit<ActivityEntry, 'id' | 'at' | 'distilled' | 'unseen'> & { at?: number },
): ActivityEntry[] {
  const id = Math.max(0, ...entries.map((existing) => existing.id)) + 1;
  return [
    {
      id,
      at: entry.at ?? Date.now(),
      message: entry.message,
      ...(entry.jump ? { jump: entry.jump } : {}),
      distilled: false,
      unseen: true,
    },
    ...entries,
  ].slice(0, 20);
}

export function markAllSeen(entries: ActivityEntry[]): ActivityEntry[] {
  return entries.map((entry) => ({ ...entry, unseen: false }));
}

export function markSeen(entries: ActivityEntry[], id: number): ActivityEntry[] {
  return entries.map((entry) => (entry.id === id ? { ...entry, unseen: false } : entry));
}

export function markDistilled(entries: ActivityEntry[], id: number): ActivityEntry[] {
  return entries.map((entry) => (entry.id === id ? { ...entry, distilled: true } : entry));
}

export function unseenCount(entries: ActivityEntry[]): number {
  return entries.filter((entry) => entry.unseen).length;
}

export function agoLabel(at: number, now = Date.now()): string {
  const elapsed = Math.max(0, now - at);
  if (elapsed < 60_000) return 'now';
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m`;
  return `${Math.floor(elapsed / 3_600_000)}h`;
}
