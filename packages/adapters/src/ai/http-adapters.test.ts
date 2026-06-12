import { describe, expect, it, vi } from 'vitest';
import { createOllamaAi } from './ollama.js';
import { createOpenRouterAi } from './openrouter.js';

const request = {
  task: 'pattern.narrate',
  instruction: 'Return a title and takeaway.',
  input: { approachId: 'ask-early-no-trade' },
  schema: { type: 'object' },
};

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), { status: 200, ...init, headers: { 'Content-Type': 'application/json' } });
}

describe('createOpenRouterAi', () => {
  it('parses JSON from choices[0].message.content and strips code fences', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      jsonResponse({
        choices: [{ message: { content: '```json\n{"title":"Ask early","takeaway":"Use it when the path is clear."}\n```' } }],
      }),
    );
    const ai = createOpenRouterAi({ apiKey: 'test-key', fetchImpl });

    await expect(ai.generateJson(request)).resolves.toEqual({ title: 'Ask early', takeaway: 'Use it when the path is clear.' });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('includes response body excerpts on failed requests', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response('model unavailable', { status: 503 }));
    const ai = createOpenRouterAi({ apiKey: 'test-key', fetchImpl });

    await expect(ai.generateJson(request)).rejects.toThrow(/OpenRouter request failed \(503\): model unavailable/);
  });
});

describe('createOllamaAi', () => {
  it('parses JSON from message.content and strips code fences', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      jsonResponse({ message: { content: '```\n{"whyItMattersNow":"Check whether this subgroup applies now."}\n```' } }),
    );
    const ai = createOllamaAi({ endpoint: 'http://localhost:11434/', model: 'local-model', fetchImpl });

    await expect(ai.generateJson(request)).resolves.toEqual({ whyItMattersNow: 'Check whether this subgroup applies now.' });
    const [, init] = fetchImpl.mock.calls[0]!;
    expect(fetchImpl.mock.calls[0]![0]).toBe('http://localhost:11434/api/chat');
    expect(JSON.parse(String(init?.body))).toMatchObject({ model: 'local-model', stream: false, format: 'json' });
  });
});
