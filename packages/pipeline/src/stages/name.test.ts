import { describe, expect, it } from 'vitest';
import { createCannedAi } from '@ppi/adapters';
import { makeDecision } from '@ppi/domain';
import type { AiJsonRequest, AiPort } from '@ppi/domain';
import type { CorpusCase } from '../corpus.js';
import type { DecisionIntelligence } from './cluster.js';
import { buildNarration } from './name.js';

function corpusCase(overrides: Partial<CorpusCase> & { id: string }): CorpusCase {
  const { id, ...rest } = overrides;
  return {
    id,
    type: 'contract',
    title: `Case ${id}`,
    problem: `Problem ${id}`,
    event: `Event ${id}`,
    when: '2025',
    signalType: 'contract.summarized',
    approach: 'default-approach',
    record: {},
    outcome: 'worked',
    outcomeBasis: 'fixture basis',
    detail: 'fixture detail',
    tags: [],
    ...rest,
  };
}

describe('buildNarration', () => {
  it('builds deterministic canned narration in decision order with pattern and exception ordering preserved', async () => {
    const decisions = [
      makeDecision({ id: 'd2', type: 'budget', title: 'Budget overrun', signalType: 'quote.received' }),
      makeDecision({ id: 'd1', type: 'contract', title: 'Contract addendum' }),
    ];
    const cases = [
      corpusCase({ id: 'c1', event: 'SKO', tags: ['deposit'] }),
      corpusCase({ id: 'c2', event: 'Summit', tags: ['requote'] }),
    ];
    const intelligence: DecisionIntelligence[] = [
      {
        decisionId: 'd1',
        caseCount: 4,
        workedCount: 3,
        patterns: [
          { approach: 'pair-with-deposit-trade', outcome: 'worked', size: 3, worked: 3, failed: 0, exemplarCaseId: 'c1' },
        ],
        exceptions: [
          { id: 'inside-30-days', label: 'Inside 30 days out', size: 1, worked: 0, parentWorked: 3, parentTotal: 4 },
        ],
      },
      {
        decisionId: 'd2',
        caseCount: 5,
        workedCount: 2,
        patterns: [
          { approach: 'requote-preferred-vendor', outcome: 'failed', size: 3, worked: 1, failed: 2, exemplarCaseId: 'c2' },
        ],
        exceptions: [],
      },
    ];

    await expect(buildNarration(decisions, cases, intelligence, createCannedAi(), { warn: () => undefined })).resolves.toEqual([
      {
        decisionId: 'd2',
        basis: 'similar budget decisions drawn from past event programs',
        patterns: [
          {
            approach: 'requote-preferred-vendor',
            title: 'Requote preferred vendor',
            takeaway: 'In similar budget decisions, "Requote preferred vendor" is the play that has repeatedly failed.',
          },
        ],
        exceptions: [],
      },
      {
        decisionId: 'd1',
        basis: 'similar contract decisions drawn from past event programs',
        patterns: [
          {
            approach: 'pair-with-deposit-trade',
            title: 'Pair with deposit trade',
            takeaway: 'In similar contract decisions, "Pair with deposit trade" is the play that has repeatedly worked.',
          },
        ],
        exceptions: [
          {
            id: 'inside-30-days',
            whyItMattersNow:
              'Inside thirty days out have worked notably less often than the rest of the similar set — check whether it applies to this decision.',
          },
        ],
      },
    ]);
  });

  it('falls back item-by-item when responses contain digits, are malformed, or throw', async () => {
    const decision = makeDecision({ id: 'd1', type: 'contract' });
    const cases = [corpusCase({ id: 'c1' })];
    const intelligence: DecisionIntelligence[] = [
      {
        decisionId: 'd1',
        caseCount: 4,
        workedCount: 3,
        patterns: [{ approach: 'ask-early-no-trade', outcome: 'worked', size: 3, worked: 3, failed: 0, exemplarCaseId: 'c1' }],
        exceptions: [{ id: 'sole-source', label: 'Sole-source vendors', size: 1, worked: 1, parentWorked: 3, parentTotal: 4 }],
      },
    ];
    const badAi: AiPort = {
      async generateJson(request) {
        if (request.task === 'pattern.narrate') return { title: 'Plan 2', takeaway: 'Use this play.' };
        if (request.task === 'exception.narrate') return { why: 'wrong shape' };
        throw new Error('model broke');
      },
    };
    const warnings: string[] = [];

    const result = await buildNarration([decision], cases, intelligence, badAi, { warn: (message) => warnings.push(message) });

    expect(result).toEqual([
      {
        decisionId: 'd1',
        basis: 'similar contract decisions drawn from past event programs',
        patterns: [
          {
            approach: 'ask-early-no-trade',
            title: 'Ask early no trade',
            takeaway: 'In similar contract decisions, "Ask early no trade" is the play that has repeatedly worked.',
          },
        ],
        exceptions: [
          {
            id: 'sole-source',
            whyItMattersNow:
              'Sole-source vendors have worked notably more often than the rest of the similar set — check whether it applies to this decision.',
          },
        ],
      },
    ]);
    expect(warnings).toEqual([
      'name fallback for d1 pattern.narrate: response.title contains digits',
      'name fallback for d1 exception.narrate: response has unexpected property "why"',
      'name fallback for d1 track.basis: model broke',
    ]);
  });

  it('sends metric exception inputs instead of rate direction for metric-fired findings', async () => {
    const decision = makeDecision({
      id: 'd1',
      type: 'contract',
      whatsDifferent: [{ change: 'This venue is government-owned.', whyItMatters: 'Legal review may take longer.' }],
    });
    const intelligence: DecisionIntelligence[] = [
      {
        decisionId: 'd1',
        caseCount: 6,
        workedCount: 4,
        patterns: [],
        exceptions: [
          {
            id: 'government-venue',
            label: 'Government-owned venues',
            size: 3,
            worked: 2,
            parentWorked: 4,
            parentTotal: 6,
            metric: {
              key: 'legalReviewDays',
              label: 'legal review',
              unit: 'days',
              subgroupMean: 12.3,
              complementMean: 6.1,
            },
          },
        ],
      },
    ];
    const requests: AiJsonRequest[] = [];
    const ai: AiPort = {
      async generateJson(request) {
        requests.push(request);
        if (request.task === 'exception.narrate') return { whyItMattersNow: 'Check whether longer legal review applies now.' };
        return { basis: 'similar contract decisions drawn from past event programs' };
      },
    };

    await buildNarration([decision], [], intelligence, ai, { warn: () => undefined });

    const exceptionRequest = requests.find((request) => request.task === 'exception.narrate');
    expect(exceptionRequest?.input).toMatchObject({
      label: 'Government-owned venues',
      decisionType: 'contract',
      metric: { label: 'legal review', unit: 'days', direction: 'higher' },
      whatsDifferent: ['This venue is government-owned.'],
    });
    expect(exceptionRequest?.input).not.toHaveProperty('direction');
  });
});
