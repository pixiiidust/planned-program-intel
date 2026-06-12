import { describe, expect, it, vi } from 'vitest';
import type { AiPort } from '@ppi/domain';
import {
  acceptDistilledText,
  buildDistillationRequest,
  DISTILL_REASONING_MAX_CHARS,
  DISTILL_TASK,
  DISTILL_TIMEOUT_MS,
  distill,
} from './distillation.js';
import { DISTILLATION_FIXTURES } from './distillationFixtures.js';

const fixture = (name: string) => DISTILLATION_FIXTURES.find((item) => item.name === name)!.input;

function fakeEngine(result: unknown): AiPort {
  return { generateJson: async () => result };
}

describe('precedent distillation', () => {
  it('builds the prompt request from structured fields', () => {
    const input = fixture('verb-change');
    const request = buildDistillationRequest(input);
    const serializedInput = JSON.stringify(request.input);

    expect(request.task).toBe(DISTILL_TASK);
    expect(request.instruction.length).toBeGreaterThan(0);
    expect(serializedInput).toContain(input.decisionTitle);
    expect(serializedInput).toContain(input.decisionType);
    expect(serializedInput).toContain(input.eventName);
    expect(serializedInput).toContain(input.choice);
    expect(serializedInput).toContain(input.changedTo);
    expect(serializedInput).toContain(input.reasoning);
  });

  it('clamps long reasoning in the built request', () => {
    const request = buildDistillationRequest(fixture('long-rambling'));
    const input = request.input as { reasoning: string };

    expect(input.reasoning.length).toBeLessThanOrEqual(DISTILL_REASONING_MAX_CHARS);
  });

  it('rejects distilled text containing digits', () => {
    expect(acceptDistilledText({ distilled: 'Saved $40k across 3 vendors.' })).toBeNull();
  });

  it('enforces the two-sentence limit', () => {
    expect(acceptDistilledText({ distilled: 'Accepted the clause. It covered storm risk. Future renewals should use it.' })).toBeNull();
    expect(acceptDistilledText({ distilled: 'Accepted the clause. It covered storm risk.' })).toBe('Accepted the clause. It covered storm risk.');
  });

  it('rejects empty and malformed model output', () => {
    expect(acceptDistilledText({ distilled: '  ' })).toBeNull();
    expect(acceptDistilledText(null)).toBeNull();
    expect(acceptDistilledText({})).toBeNull();
  });

  it('falls back on thrown or malformed model output', async () => {
    await expect(
      distill(
        () => ({
          generateJson: async () => {
            throw new Error('bad model');
          },
        }),
        fixture('clean-short'),
      ),
    ).resolves.toBeNull();

    await expect(distill(() => fakeEngine({ nope: true }), fixture('clean-short'))).resolves.toBeNull();
  });

  it('aborts at the timeout', async () => {
    vi.useFakeTimers();
    try {
      const fetchImpl = vi.fn<typeof fetch>(
        (_url, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })));
          }),
      );

      const pending = distill(
        (wrappedFetch) => ({
          generateJson: async () => {
            await wrappedFetch('https://example.test', {});
            return { distilled: 'Never returned.' };
          },
        }),
        fixture('clean-short'),
        { fetchImpl, timeoutMs: DISTILL_TIMEOUT_MS },
      );

      await vi.advanceTimersByTimeAsync(3000);
      await expect(pending).resolves.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it.each(DISTILLATION_FIXTURES)('accepts happy path output for $name', async ({ input }) => {
    await expect(distill(() => fakeEngine({ distilled: 'Two clean sentences. No numerals here.' }), input)).resolves.toBe(
      'Two clean sentences. No numerals here.',
    );
  });
});
