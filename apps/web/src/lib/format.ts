// Relative-time labels from daysAgo / dueInDays numbers. The seed speaks in
// relative days deliberately — the demo never goes stale on the calendar.

export function agoLabel(daysAgo: number): string {
  if (daysAgo === 0) return 'just now';
  if (daysAgo === 1) return 'yesterday';
  if (daysAgo < 7) return `${daysAgo} days ago`;
  if (daysAgo < 30) {
    const weeks = Math.round(daysAgo / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }
  const months = Math.round(daysAgo / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

export function dueLabel(dueInDays: number | null): string {
  if (dueInDays === null) return 'no deadline';
  return `due in ${dueInDays} day${dueInDays === 1 ? '' : 's'}`;
}
