import { describe, expect, it } from 'vitest';
import { createCannedAi } from './canned.js';

const request = {
  task: 'pattern.narrate',
  instruction: 'Name the play.',
  input: {
    approachId: 'pair-with-deposit-trade',
    decisionType: 'contract',
    clusterOutcome: 'worked',
  },
  schema: {},
};

describe('createCannedAi', () => {
  it('is deterministic for the same task input', async () => {
    const ai = createCannedAi();

    await expect(ai.generateJson(request)).resolves.toEqual({
      title: 'Pair with deposit trade',
      takeaway: 'In similar contract decisions, "Pair with deposit trade" is the play that has repeatedly worked.',
    });
    await expect(ai.generateJson(request)).resolves.toEqual(await ai.generateJson(request));
  });

  it('fails clearly for an unknown task', async () => {
    const ai = createCannedAi();
    await expect(ai.generateJson({ ...request, task: 'unknown.task' })).rejects.toThrow(
      'Canned AI has no template for task "unknown.task"',
    );
  });

  it('uses metric narration when an exception input carries a metric', async () => {
    const ai = createCannedAi();

    await expect(
      ai.generateJson({
        task: 'exception.narrate',
        instruction: 'Explain the exception.',
        input: {
          label: 'Government-owned venues',
          metric: { label: 'legal review', unit: 'days', direction: 'higher' },
        },
        schema: {},
      }),
    ).resolves.toEqual({
      whyItMattersNow:
        'Government-owned venues have run notably longer on legal review than the rest of the similar set — check whether it applies to this decision.',
    });
  });
});
