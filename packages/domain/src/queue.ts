import type { Decision } from './types.js';

/** Queue tabs are views over lifecycle states, never states themselves. */
export type QueueTab = 'needs-you' | 'waiting' | 'decided';

export function tabOf(decision: Decision): QueueTab {
  switch (decision.status) {
    case 'open':
    case 'blocked':
      return 'needs-you';
    case 'escalated':
      return 'waiting';
    case 'resolved':
      return 'decided';
  }
}

/** Needs you = Open + Blocked. A Blocked Decision's next move is breaking the block. */
export function needsYou(decisions: Decision[]): Decision[] {
  return decisions.filter((d) => tabOf(d) === 'needs-you');
}
