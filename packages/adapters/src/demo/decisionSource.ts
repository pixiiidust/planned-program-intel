import type { Decision, DecisionSource } from '@ppi/domain';

// Walking-skeleton seed: a single Decision. Issue #8 replaces this with the
// full hand-converted corpus as a versioned artifact.
export const DEMO_SEED: Decision[] = [
  {
    id: 'd1',
    title: 'Lisbon venue contract missing force majeure clause',
    problem: 'Under the current draft, any cancellation — ours, theirs, or weather — forfeits all committed spend.',
    actionNeeded: 'Get the clause added before signing. Trade deposit timing for it, and ask for more time.',
    eventName: 'Global Sales Kickoff 2027',
    urgency: {
      level: 'critical',
      because:
        'The date hold expires Friday — 2 days away. Sign as-is and we carry ~$310K of unrecoverable cancellation exposure. Miss the deadline and we lose the only week that fits the sales calendar.',
    },
    status: 'open',
    owner: { name: 'Priya Nair', role: 'Procurement Lead' },
    recommendation: {
      action:
        'Request a force majeure addendum before signing. Offer a 5% earlier deposit in exchange. Ask for a 1-week hold extension in the same message.',
      why: 'Removes the $310K exposure. Costs only deposit timing — cash-flow neutral. The hold extension covers this venue’s slower legal review.',
    },
  },
];

/** Demo adapter for the DecisionSource port: in-memory seeded Decisions. */
export class InMemoryDecisionSource implements DecisionSource {
  constructor(private readonly seed: Decision[] = DEMO_SEED) {}

  async listDecisions(): Promise<Decision[]> {
    return this.seed;
  }
}
