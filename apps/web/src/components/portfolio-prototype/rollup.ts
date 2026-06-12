// PROTOTYPE (#18) — throwaway variant sketch; dev-only, never ships. Winner gets rebuilt properly in #19.
import type { Decision, EventRef, ResolutionChoice } from '@ppi/domain';

export interface EventRollup {
  event: EventRef;
  open: number;
  blocked: number;
  waiting: number;
  decided: number;
  criticalOpen: number;
  nextDue: { days: number; title: string } | null;
  oldestEscalation: { to: string; daysAgo: number; title: string } | null;
  resolutionsWritten: number;
}

export interface MemoryStats {
  resolutions: { decidedBy: string; choice: ResolutionChoice; daysAgo: number; title: string; event: string }[];
  patternCount: number;
  caseCorpus: number;
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
    criticalOpen: 0,
    nextDue: null,
    oldestEscalation: null,
    resolutionsWritten: 0,
  };
}

function captureNextDue(rollup: EventRollup, decision: Decision): void {
  if (decision.dueInDays === null) return;
  if (!rollup.nextDue || decision.dueInDays < rollup.nextDue.days) {
    rollup.nextDue = { days: decision.dueInDays, title: decision.title };
  }
}

export function eventRollups(decisions: readonly Decision[]): EventRollup[] {
  const byEvent = new Map<string, EventRollup>();

  for (const decision of decisions) {
    let rollup = byEvent.get(decision.event.id);
    if (!rollup) {
      rollup = emptyRollup(decision.event);
      byEvent.set(decision.event.id, rollup);
    }

    if (decision.status === 'open') {
      rollup.open += 1;
      if (decision.urgency.level === 'critical') rollup.criticalOpen += 1;
      captureNextDue(rollup, decision);
    } else if (decision.status === 'blocked') {
      rollup.blocked += 1;
      if (decision.urgency.level === 'critical') rollup.criticalOpen += 1;
      captureNextDue(rollup, decision);
    } else if (decision.status === 'escalated') {
      rollup.waiting += 1;
      if (decision.escalation && (!rollup.oldestEscalation || decision.escalation.daysAgo > rollup.oldestEscalation.daysAgo)) {
        rollup.oldestEscalation = { to: decision.escalation.to, daysAgo: decision.escalation.daysAgo, title: decision.title };
      }
    } else {
      rollup.decided += 1;
      rollup.resolutionsWritten += 1;
    }
  }

  return [...byEvent.values()].sort((a, b) => {
    const aDue = a.nextDue?.days ?? Number.POSITIVE_INFINITY;
    const bDue = b.nextDue?.days ?? Number.POSITIVE_INFINITY;
    if (aDue !== bDue) return aDue - bDue;
    return a.event.name.localeCompare(b.event.name);
  });
}

export function memoryStats(decisions: readonly Decision[]): MemoryStats {
  const patternTitles = new Set<string>();
  const resolutions: MemoryStats['resolutions'] = [];
  let caseCorpus = 0;
  let precedentsPending = 0;

  for (const decision of decisions) {
    caseCorpus = Math.max(caseCorpus, decision.evidence.caseCount);
    precedentsPending += decision.evidence.precedents.length;
    for (const pattern of decision.evidence.patterns) patternTitles.add(pattern.title);

    if (decision.status === 'resolved' && decision.resolution) {
      resolutions.push({
        decidedBy: decision.resolution.decidedBy,
        choice: decision.resolution.choice,
        daysAgo: decision.resolution.daysAgo,
        title: decision.title,
        event: decision.event.name,
      });
    }
  }

  resolutions.sort((a, b) => b.daysAgo - a.daysAgo || a.title.localeCompare(b.title));
  return { resolutions, patternCount: patternTitles.size, caseCorpus, precedentsPending };
}

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
