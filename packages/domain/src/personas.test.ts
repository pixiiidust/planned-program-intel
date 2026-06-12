import { describe, expect, it } from 'vitest';
import { makeDecision } from './testing.js';
import { needsYouCount, personasFrom, personaQueue, type Persona } from './personas.js';
import type { Decision, DecisionStatus, EscalationPath, Owner, Resolution } from './types.js';

const PRIYA: Owner = { name: 'Priya Nair', role: 'Procurement Lead', whyRouted: 'owns procurement calls' };
const MARCUS: Owner = { name: 'Marcus Webb', role: 'Program Manager, EMEA', whyRouted: 'owns EMEA program calls' };
const DANA: Owner = { name: 'Dana Ortiz', role: 'Event Lead', whyRouted: 'owns event calls' };

const JAMES: Persona = { name: 'James Tan', role: 'VP Events', group: 'escalation-path' };
const PRIYA_PERSONA: Persona = { name: PRIYA.name, role: PRIYA.role, group: 'decider' };

function path(name: string, role: string): EscalationPath {
  return { name, role, why: `${role} can weigh in` };
}

function decision(id: string, status: DecisionStatus, owner: Owner, overrides: Partial<Decision> = {}): Decision {
  const resolution: Resolution | null =
    status === 'resolved' ? { choice: 'accepted', reasoning: 'works here', decidedBy: owner.name, daysAgo: 1 } : null;
  return makeDecision({
    id,
    title: `Decision ${id}`,
    status,
    owner,
    resolution,
    escalation: null,
    ...overrides,
  });
}

describe('personasFrom', () => {
  it('groups deciders first and senior escalation paths by demo role order', () => {
    const decisions = [
      decision('d1', 'open', PRIYA, {
        escalationPaths: [path('James Tan', 'VP Events'), path('Mei Lin', 'Chief of Staff to VP Events'), path('Priya Nair', 'VP Events')],
      }),
      decision('d2', 'open', MARCUS, {
        escalationPaths: [path('Raj Mehta', 'Procurement Director'), path('James Tan', 'VP Events')],
      }),
      decision('d3', 'resolved', PRIYA, {
        escalationPaths: [path('Mei Lin', 'Chief of Staff to VP Events')],
      }),
      decision('d4', 'open', { name: 'Priya Nair', role: 'Procurement Manager', whyRouted: 'temporary coverage' }),
      decision('d5', 'open', DANA, {
        escalationPaths: [path('Tom Okafor', 'Finance Director')],
      }),
    ];

    expect(personasFrom(decisions, ['VP Events', 'Chief of Staff to VP Events', 'Procurement Director'])).toEqual([
      { name: 'Priya Nair', role: 'Procurement Lead', group: 'decider' },
      { name: 'Marcus Webb', role: 'Program Manager, EMEA', group: 'decider' },
      { name: 'Priya Nair', role: 'Procurement Manager', group: 'decider' },
      { name: 'Dana Ortiz', role: 'Event Lead', group: 'decider' },
      { name: 'James Tan', role: 'VP Events', group: 'escalation-path' },
      { name: 'Mei Lin', role: 'Chief of Staff to VP Events', group: 'escalation-path' },
      { name: 'Raj Mehta', role: 'Procurement Director', group: 'escalation-path' },
    ]);
  });
});

describe('personaQueue', () => {
  const decisions = [
    decision('open-priya', 'open', PRIYA),
    decision('blocked-priya', 'blocked', PRIYA),
    decision('escalated-priya', 'escalated', PRIYA, {
      escalation: { to: JAMES.name, reasoning: 'need authority', requestedBy: PRIYA.name, daysAgo: 2 },
    }),
    decision('resolved-priya', 'resolved', PRIYA),
    decision('open-marcus', 'open', MARCUS),
    decision('escalated-marcus', 'escalated', MARCUS, {
      escalation: { to: 'Tom Okafor', reasoning: 'need finance', requestedBy: MARCUS.name, daysAgo: 1 },
    }),
  ];

  it('keeps the whole-program queues identical to tab views', () => {
    expect(personaQueue(null, 'needs-you', decisions).map((d) => d.id)).toEqual(['open-priya', 'blocked-priya', 'open-marcus']);
    expect(personaQueue(null, 'waiting', decisions).map((d) => d.id)).toEqual(['escalated-priya', 'escalated-marcus']);
    expect(personaQueue(null, 'decided', decisions).map((d) => d.id)).toEqual(['resolved-priya']);
  });

  it('filters every tab to a decider owner', () => {
    expect(personaQueue(PRIYA_PERSONA, 'needs-you', decisions).map((d) => d.id)).toEqual(['open-priya', 'blocked-priya']);
    expect(personaQueue(PRIYA_PERSONA, 'waiting', decisions).map((d) => d.id)).toEqual(['escalated-priya']);
    expect(personaQueue(PRIYA_PERSONA, 'decided', decisions).map((d) => d.id)).toEqual(['resolved-priya']);
  });

  it('shows only addressed feedback requests for an escalation path', () => {
    expect(personaQueue(JAMES, 'needs-you', decisions).map((d) => d.id)).toEqual(['escalated-priya']);
    expect(personaQueue(JAMES, 'waiting', decisions)).toEqual([]);
    expect(personaQueue(JAMES, 'decided', decisions)).toEqual([]);
  });

  it("keeps an escalated Decision in the Owner's Waiting and the escalatee's Needs you", () => {
    expect(personaQueue(PRIYA_PERSONA, 'waiting', decisions).map((d) => d.id)).toContain('escalated-priya');
    expect(personaQueue(JAMES, 'needs-you', decisions).map((d) => d.id)).toContain('escalated-priya');
  });

  it('counts Needs you badges from the persona queue', () => {
    expect(needsYouCount(PRIYA_PERSONA, decisions)).toBe(2);
    expect(needsYouCount(JAMES, decisions)).toBe(1);
  });
});
