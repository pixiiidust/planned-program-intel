import { describe, expect, it } from 'vitest';
import { eventRollups, memoryStats, programTotals } from './portfolio.js';
import { makeDecision } from './testing.js';
import type { Decision, DecisionStatus, EventRef, Evidence, Pattern, Precedent } from './types.js';

const EVENT_A: EventRef = { id: 'a', name: 'Alpha Summit', location: 'Austin', date: 'Jan 2027' };
const EVENT_B: EventRef = { id: 'b', name: 'Beta Roadshow', location: 'Berlin', date: 'Feb 2027' };

function decision(id: string, status: DecisionStatus, event: EventRef = EVENT_A, overrides: Partial<Decision> = {}): Decision {
  return makeDecision({ id, title: `Decision ${id}`, status, event, ...overrides });
}

function evidence(overrides: Partial<Evidence> = {}): Evidence {
  return { caseCount: 0, workedCount: 0, patterns: [], exceptions: [], cases: [], precedents: [], ...overrides };
}

function pattern(title: string): Pattern {
  return {
    outcome: 'worked',
    title,
    count: '3 cases',
    example: { event: 'Past event', detail: 'detail' },
    takeaway: 'takeaway',
  };
}

function precedent(id: string): Precedent {
  return {
    sourceDecisionId: id,
    sourceTitle: `Source ${id}`,
    choice: 'accepted',
    reasoning: 'reason',
    decidedBy: 'Dana Ortiz',
    daysAgo: 1,
  };
}

describe('portfolio rollups', () => {
  it('counts lifecycle states into Portfolio buckets per event', () => {
    const rollups = eventRollups([
      decision('a1', 'open'),
      decision('a2', 'blocked'),
      decision('a3', 'escalated'),
      decision('a4', 'resolved'),
      decision('b1', 'open', EVENT_B),
    ]);

    expect(rollups.find((rollup) => rollup.event.id === 'a')).toMatchObject({ open: 1, blocked: 1, waiting: 1, decided: 1 });
    expect(rollups.find((rollup) => rollup.event.id === 'b')).toMatchObject({ open: 1, blocked: 0, waiting: 0, decided: 0 });
  });

  it('sets nextDue to the soonest Open or Blocked deadline and ignores nulls and Resolved due dates', () => {
    const rollup = eventRollups([
      decision('open-null', 'open', EVENT_A, { dueInDays: null }),
      decision('resolved-sooner', 'resolved', EVENT_A, { dueInDays: 1 }),
      decision('blocked-later', 'blocked', EVENT_A, { dueInDays: 7 }),
      decision('open-sooner', 'open', EVENT_A, { dueInDays: 3 }),
    ])[0];

    expect(rollup?.nextDue).toEqual({ days: 3, title: 'Decision open-sooner' });
    expect(eventRollups([decision('only-null', 'blocked', EVENT_B, { dueInDays: null })])[0]?.nextDue).toBeNull();
  });

  it('keeps the oldest escalation by daysAgo with the escalatee and decision title', () => {
    const rollup = eventRollups([
      decision('newer', 'escalated', EVENT_A, {
        escalation: { to: 'Mei Lin', reasoning: 'needs legal', requestedBy: 'Dana Ortiz', daysAgo: 1 },
      }),
      decision('older', 'escalated', EVENT_A, {
        escalation: { to: 'James Tan', reasoning: 'needs sales', requestedBy: 'Dana Ortiz', daysAgo: 4 },
      }),
    ])[0];

    expect(rollup?.oldestEscalation).toEqual({ to: 'James Tan', daysAgo: 4, title: 'Decision older' });
  });

  it('sorts by nextDue ascending, null nextDue last, then event name', () => {
    const alphaNull: EventRef = { id: 'alpha-null', name: 'Alpha Null', location: 'A', date: 'Jan 2027' };
    const zuluNull: EventRef = { id: 'zulu-null', name: 'Zulu Null', location: 'Z', date: 'Jan 2027' };
    const betaDue: EventRef = { id: 'beta-due', name: 'Beta Due', location: 'B', date: 'Jan 2027' };
    const alphaDue: EventRef = { id: 'alpha-due', name: 'Alpha Due', location: 'A', date: 'Jan 2027' };

    const rollups = eventRollups([
      decision('n2', 'resolved', zuluNull),
      decision('d2', 'open', betaDue, { dueInDays: 2 }),
      decision('n1', 'resolved', alphaNull),
      decision('d1', 'open', alphaDue, { dueInDays: 2 }),
      decision('d0', 'blocked', EVENT_B, { dueInDays: 1 }),
    ]);

    expect(rollups.map((rollup) => rollup.event.name)).toEqual(['Beta Roadshow', 'Alpha Due', 'Beta Due', 'Alpha Null', 'Zulu Null']);
  });

  it('returns Program Memory facts from structural data', () => {
    const stats = memoryStats([
      decision('r1', 'resolved', EVENT_A, {
        resolution: { choice: 'accepted', reasoning: 'r', decidedBy: 'Dana Ortiz', daysAgo: 3 },
        evidence: evidence({ patterns: [pattern('Early attrition'), pattern('Late approval')], precedents: [precedent('p1')] }),
      }),
      decision('r2', 'resolved', EVENT_B, {
        resolution: { choice: 'changed', reasoning: 'r', changedTo: 'do y', decidedBy: 'Priya Nair', daysAgo: 12 },
        evidence: evidence({ patterns: [pattern('Early attrition')], precedents: [precedent('p2'), precedent('p3')] }),
      }),
      decision('o1', 'open', EVENT_B, {
        evidence: evidence({ patterns: [pattern('Travel cap')], precedents: [precedent('p4')] }),
      }),
    ]);

    expect(stats).toEqual({ resolutionDaysAgo: [12, 3], patternCount: 3, precedentsPending: 4 });
  });

  it('sums rollups into whole-program totals', () => {
    const totals = programTotals([
      { event: EVENT_A, open: 2, blocked: 1, waiting: 0, decided: 3, nextDue: null, oldestEscalation: null },
      { event: EVENT_B, open: 0, blocked: 2, waiting: 1, decided: 4, nextDue: null, oldestEscalation: null },
    ]);

    expect(totals).toEqual({ events: 2, open: 2, blocked: 3, waiting: 1, decided: 7 });
  });
});
