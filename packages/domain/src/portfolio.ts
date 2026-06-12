import type { Decision, EventRef } from './types.js';

/** Per-event rollup of decision states for the Portfolio view. */
export interface EventRollup {
  event: EventRef;
  open: number;
  blocked: number;
  /** Escalated Decisions; Waiting is the queue view over this state. */
  waiting: number;
  /** Resolved Decisions; Decided is the queue view over this state. */
  decided: number;
  /** Soonest Open or Blocked deadline only. */
  nextDue: { days: number; title: string } | null;
  /** Oldest Escalated Decision still waiting for feedback. */
  oldestEscalation: { to: string; daysAgo: number; title: string } | null;
}

/** Program Memory growth facts. Counts are structural, never model-derived. */
export interface MemoryStats {
  /** One entry per Resolved Decision's resolution age, oldest first. */
  resolutionDaysAgo: number[];
  /** Distinct Pattern titles across all Evidence. */
  patternCount: number;
  /** Outcome-pending Precedents across all Evidence. */
  precedentsPending: number;
}

export interface ProgramTotals {
  events: number;
  open: number;
  blocked: number;
  waiting: number;
  decided: number;
}

function emptyRollup(event: EventRef): EventRollup {
  return {
    event,
    open: 0,
    blocked: 0,
    waiting: 0,
    decided: 0,
    nextDue: null,
    oldestEscalation: null,
  };
}

function captureNextDue(rollup: EventRollup, decision: Decision): void {
  if (decision.dueInDays === null) return;
  if (!rollup.nextDue || decision.dueInDays < rollup.nextDue.days) {
    rollup.nextDue = { days: decision.dueInDays, title: decision.title };
  }
}

/**
 * Portfolio is whole-program mission control: lifecycle states roll up by Event,
 * while tabs remain only views over those states.
 */
export function eventRollups(decisions: readonly Decision[]): EventRollup[] {
  const byEvent = new Map<string, EventRollup>();

  for (const decision of decisions) {
    let rollup = byEvent.get(decision.event.id);
    if (!rollup) {
      rollup = emptyRollup(decision.event);
      byEvent.set(decision.event.id, rollup);
    }

    switch (decision.status) {
      case 'open':
        rollup.open += 1;
        captureNextDue(rollup, decision);
        break;
      case 'blocked':
        rollup.blocked += 1;
        captureNextDue(rollup, decision);
        break;
      case 'escalated':
        rollup.waiting += 1;
        if (decision.escalation && (!rollup.oldestEscalation || decision.escalation.daysAgo > rollup.oldestEscalation.daysAgo)) {
          rollup.oldestEscalation = { to: decision.escalation.to, daysAgo: decision.escalation.daysAgo, title: decision.title };
        }
        break;
      case 'resolved':
        rollup.decided += 1;
        break;
    }
  }

  return [...byEvent.values()].sort((a, b) => {
    const aDue = a.nextDue?.days ?? Number.POSITIVE_INFINITY;
    const bDue = b.nextDue?.days ?? Number.POSITIVE_INFINITY;
    if (aDue !== bDue) return aDue - bDue;
    return a.event.name.localeCompare(b.event.name);
  });
}

/** Program Memory grows from Resolutions, Patterns, and outcome-pending Precedents. */
export function memoryStats(decisions: readonly Decision[]): MemoryStats {
  const patternTitles = new Set<string>();
  const resolutionDaysAgo: number[] = [];
  let precedentsPending = 0;

  for (const decision of decisions) {
    precedentsPending += decision.evidence.precedents.length;
    for (const pattern of decision.evidence.patterns) patternTitles.add(pattern.title);

    if (decision.status === 'resolved' && decision.resolution) {
      resolutionDaysAgo.push(decision.resolution.daysAgo);
    }
  }

  resolutionDaysAgo.sort((a, b) => b - a);
  return { resolutionDaysAgo, patternCount: patternTitles.size, precedentsPending };
}

/** Program totals are sums of Event rollups, not independent model output. */
export function programTotals(rollups: readonly EventRollup[]): ProgramTotals {
  return rollups.reduce<ProgramTotals>(
    (totals, rollup) => ({
      events: totals.events + 1,
      open: totals.open + rollup.open,
      blocked: totals.blocked + rollup.blocked,
      waiting: totals.waiting + rollup.waiting,
      decided: totals.decided + rollup.decided,
    }),
    { events: 0, open: 0, blocked: 0, waiting: 0, decided: 0 },
  );
}
