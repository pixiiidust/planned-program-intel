import type { AiPort } from '@ppi/domain';
import { excerpt, parseJsonText, systemInstruction } from './json.js';

interface OpenRouterResponse {
  choices?: { message?: { content?: unknown } }[];
}

export interface OpenRouterAiOptions {
  apiKey: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

export function createOpenRouterAi(opts: OpenRouterAiOptions): AiPort {
  const model = opts.model ?? 'anthropic/claude-haiku-4.5';
  const fetchImpl = opts.fetchImpl ?? fetch;

  return {
    async generateJson(request) {
      const response = await fetchImpl('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemInstruction(request.instruction) },
            { role: 'user', content: JSON.stringify({ input: request.input, schema: request.schema }) },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      const body = await response.text();
      if (!response.ok) throw new Error(`OpenRouter request failed (${response.status}): ${excerpt(body)}`);

      let payload: OpenRouterResponse;
      try {
        payload = JSON.parse(body) as OpenRouterResponse;
      } catch (error) {
        throw new Error(`OpenRouter response was not JSON: ${excerpt(body)}`, { cause: error });
      }

      const content = payload.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new Error(`OpenRouter response missing choices[0].message.content: ${excerpt(body)}`);
      return parseJsonText(content, 'OpenRouter');
    },
  };
}
