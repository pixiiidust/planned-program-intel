// ADR-0001's "one suite, two adapters" made literal for the persistence port.
import { makeDecision, type Decision, type DecisionRepository, type SeedBundle } from '@ppi/domain';
import { beforeEach, describe, expect, it } from 'vitest';

export interface RepositoryHarness {
  /** Open a repository over the CURRENT storage state - create() must not wipe. */
  create(seed: SeedBundle): Promise<DecisionRepository>;
  /** Drop all underlying storage; runs before each test. */
  wipe(): Promise<void>;
}

export function describeDecisionRepositoryContract(adapter: string, harness: RepositoryHarness): void {
  describe(`${adapter} satisfies the DecisionRepository contract`, () => {
    beforeEach(async () => {
      await harness.wipe();
    });

    it('first load seeds silently', async () => {
      const seed = bundle('v1', baseDecisions());
      const repo = await harness.create(seed);

      const loaded = await repo.load();

      expect(loaded.decisions).toEqual(seed.decisions);
      expect(loaded.reseeded).toBe(false);
    });

    it('saves survive a new repository over the same storage', async () => {
      const seed = bundle('v1', baseDecisions());
      const repo = await harness.create(seed);
      await repo.load();

      const resolved = resolvedCopy(seed.decisions[1]!);
      await repo.save(resolved);

      const freshRepo = await harness.create(seed);
      const loaded = await freshRepo.load();

      expect(loaded.decisions.map((d) => d.id)).toEqual(['d1', 'd2', 'd3']);
      expect(loaded.decisions[1]).toEqual(resolved);
      expect(loaded.reseeded).toBe(false);
    });

    it('the full document round-trips', async () => {
      const original = maximalDecision();
      const seed = bundle('v1', [original]);
      const repo = await harness.create(seed);
      const loaded = await repo.load();

      await repo.save(loaded.decisions[0]!);

      const freshRepo = await harness.create(seed);
      const reloaded = await freshRepo.load();

      expect(reloaded.decisions[0]).toEqual(original);
      expect(reloaded.reseeded).toBe(false);
    });

    it('a seed-version mismatch nukes and reseeds', async () => {
      const v1 = bundle('v1', baseDecisions());
      const repo = await harness.create(v1);
      await repo.load();
      await repo.save(resolvedCopy(v1.decisions[1]!));

      const v2 = bundle('v2', [
        makeDecision({ id: 'n1', title: 'New decision 1', status: 'open' }),
        makeDecision({ id: 'n2', title: 'New decision 2', status: 'blocked', blockedBy: 'Outside approval' }),
      ]);
      const upgraded = await harness.create(v2);
      const reseeded = await upgraded.load();

      expect(reseeded.decisions).toEqual(v2.decisions);
      expect(reseeded.reseeded).toBe(true);

      const stable = await upgraded.load();
      expect(stable.decisions).toEqual(v2.decisions);
      expect(stable.reseeded).toBe(false);
    });

    it('reset restores the pristine seed', async () => {
      const seed = bundle('v1', baseDecisions());
      const repo = await harness.create(seed);
      await repo.load();
      await repo.save(resolvedCopy(seed.decisions[1]!));

      const reset = await repo.reset();
      const loaded = await repo.load();

      expect(reset).toEqual(seed.decisions);
      expect(loaded.decisions).toEqual(seed.decisions);
      expect(loaded.reseeded).toBe(false);
    });
  });
}

function bundle(seedVersion: string, decisions: Decision[]): SeedBundle {
  return { seedVersion, decisions, siblings: {} };
}

function baseDecisions(): Decision[] {
  return [
    makeDecision({ id: 'd1', title: 'Decision d1', status: 'open' }),
    makeDecision({ id: 'd2', title: 'Decision d2', status: 'blocked', blockedBy: 'Supplier reply' }),
    makeDecision({ id: 'd3', title: 'Decision d3', status: 'escalated' }),
  ];
}

function resolvedCopy(decision: Decision): Decision {
  return {
    ...decision,
    status: 'resolved',
    resolution: {
      choice: 'accepted',
      reasoning: 'The recommended path kept the event inside policy.',
      decidedBy: 'Dana Ortiz',
      daysAgo: 0,
    },
  };
}

function maximalDecision(): Decision {
  return makeDecision({
    id: 'maximal',
    title: 'Maximal persistence decision',
    problem: 'The current plan carries a contract, budget, and approval risk.',
    actionNeeded: 'Change the plan and record the reasoning.',
    event: {
      id: 'event-max',
      name: 'Global Field Summit',
      location: 'Toronto',
      date: 'Apr 14-16, 2027',
      budget: '$500K',
      attendees: 750,
    },
    type: 'contract',
    signalType: 'contract.summarized',
    urgency: { level: 'critical', because: 'The hold expires in 24 hours and exposes committed spend.' },
    dueInDays: 1,
    status: 'resolved',
    blockedBy: 'Legal addendum pending',
    owner: { name: 'Priya Nair', role: 'Procurement Lead', whyRouted: 'Owns contract exceptions over threshold.' },
    recommendation: {
      action: 'Sign only after the revised addendum lands.',
      why: 'The addendum removes the exposure without moving the event date.',
      track: { worked: 8, total: 11, basis: 'late-stage venue contract addendums' },
    },
    evidence: {
      caseCount: 11,
      workedCount: 8,
      patterns: [
        {
          outcome: 'worked',
          title: 'Trade deposit timing for contract protection',
          count: '5 of the 8 successes',
          example: { event: 'Partner Summit 2026', detail: 'Legal landed the addendum before signature.' },
          takeaway: 'A cash-neutral trade can buy the missing protection.',
        },
      ],
      exceptions: [{ title: 'Government venues', detail: 'Board approval adds review time when holds are short.' }],
      cases: [
        {
          event: 'Partner Summit 2026',
          when: '2026',
          similarity: 0.91,
          outcome: 'worked',
          patternIndex: 0,
          detail: 'Deposit timing moved and the clause was accepted.',
          tags: ['venue', 'contract', 'deposit'],
        },
      ],
      precedents: [
        {
          sourceDecisionId: 'd-prev',
          sourceTitle: 'Lisbon addendum decision',
          choice: 'changed',
          reasoning: 'Changed terms before signing.',
          distilledBy: 'openrouter:gpt-4.1',
          decidedBy: 'Marcus Webb',
          daysAgo: 3,
        },
      ],
    },
    whatsDifferent: [{ change: 'The venue board meets weekly.', whyItMatters: 'The request must land before the agenda closes.' }],
    risks: ['Signing today locks in unrecoverable cancellation spend.'],
    constraints: ['Policy P-114 requires legal sign-off.'],
    escalationPaths: [{ name: 'Sofia Reyes', role: 'Legal Counsel', why: 'Owns cancellation exposure sign-off.' }],
    escalation: {
      to: 'Sofia Reyes',
      reasoning: 'Need legal review before the hold expires.',
      requestedBy: 'Priya Nair',
      daysAgo: 1,
      feedback: { text: 'I can review the revision this afternoon.', from: 'Sofia Reyes', daysAgo: 0 },
    },
    resolution: {
      choice: 'changed',
      reasoning: 'Accepted the date after changing the cancellation language.',
      changedTo: 'Signed with the addendum attached.',
      decidedBy: 'Priya Nair',
      daysAgo: 0,
    },
  });
}
