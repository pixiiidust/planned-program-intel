import type { Decision } from './types.js';

/** Test factory: a minimal valid Decision, override what the test cares about. */
export function makeDecision(overrides: Partial<Decision> = {}): Decision {
  return {
    id: 'd1',
    title: 'Decision d1',
    problem: 'p',
    actionNeeded: 'a',
    event: { id: 'e', name: 'Event', location: 'X', date: 'Jan 2027' },
    type: 'contract',
    signalType: 'contract.summarized',
    urgency: { level: 'high', because: 'deadline and cost' },
    dueInDays: 2,
    status: 'open',
    owner: { name: 'Dana Ortiz', role: 'Event Lead', whyRouted: 'routing reason' },
    recommendation: { action: 'do x', why: 'because y', track: { worked: 4, total: 5, basis: 'b' } },
    evidence: { caseCount: 5, workedCount: 4, patterns: [], exceptions: [], cases: [], precedents: [] },
    whatsDifferent: [],
    risks: [],
    constraints: [],
    escalationPaths: [],
    resolution: null,
    escalation: null,
    ...overrides,
  };
}
