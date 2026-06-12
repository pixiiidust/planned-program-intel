import { describe, expect, it } from 'vitest';
import { agoLabel, appendEntry, markAllSeen, markDistilled, markSeen, unseenCount, type ActivityEntry } from './activity.js';

function entry(id: number, overrides: Partial<ActivityEntry> = {}): ActivityEntry {
  return {
    id,
    at: 1_000 + id,
    message: `Entry ${id}`,
    distilled: false,
    unseen: true,
    ...overrides,
  };
}

describe('activity', () => {
  it('prepends new entries and caps the session at 20', () => {
    const entries = Array.from({ length: 20 }, (_, index) => entry(20 - index));

    const next = appendEntry(entries, { message: 'Newest', at: 9_000 });

    expect(next).toHaveLength(20);
    expect(next[0]).toMatchObject({ id: 21, message: 'Newest', at: 9_000, distilled: false, unseen: true });
    expect(next.map((item) => item.id)).toEqual([21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  });

  it('marks one entry or all entries seen', () => {
    const entries = [entry(2), entry(1)];

    expect(markSeen(entries, 1)).toEqual([entry(2), entry(1, { unseen: false })]);
    expect(markAllSeen(entries)).toEqual([entry(2, { unseen: false }), entry(1, { unseen: false })]);
  });

  it('marks a landed distillation on the matching entry', () => {
    expect(markDistilled([entry(2), entry(1)], 2)).toEqual([entry(2, { distilled: true }), entry(1)]);
  });

  it('counts unseen entries', () => {
    expect(unseenCount([entry(3), entry(2, { unseen: false }), entry(1)])).toBe(2);
  });

  it('labels relative time boundaries', () => {
    const now = 3_600_000;

    expect(agoLabel(now - 59_000, now)).toBe('now');
    expect(agoLabel(now - 60_000, now)).toBe('1m');
    expect(agoLabel(now - 3_600_000, now)).toBe('1h');
  });
});
