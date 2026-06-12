import type { AiPort } from '@ppi/domain';
import { parseJsonText } from './json.js';

export interface AnthropicAiOptions {
  apiKey: string;
  model?: string;
}

type AnthropicClient = { messages: { create: (request: unknown) => Promise<unknown> } };

export function createAnthropicAi(opts: AnthropicAiOptions): AiPort {
  const model = opts.model ?? 'claude-haiku-4-5';
  let client: AnthropicClient | undefined;

  return {
    async generateJson(request) {
      if (!client) {
        const packageName = '@anthropic-ai/sdk' as string;
        const { default: Anthropic } = (await import(packageName)) as { default: new (opts: { apiKey: string }) => AnthropicClient };
        client = new Anthropic({ apiKey: opts.apiKey });
      }

      const response = await client.messages.create({
        model,
        max_tokens: 1024,
        system: request.instruction,
        messages: [{ role: 'user', content: JSON.stringify(request.input) }],
        output_config: { format: { type: 'json_schema', schema: request.schema } },
      });

      const text = firstTextBlock(response);
      return parseJsonText(text, 'Anthropic');
    },
  };
}

function firstTextBlock(response: unknown): string {
  const content = (response as { content?: unknown }).content;
  if (!Array.isArray(content)) throw new Error('Anthropic response missing content blocks');
  const textBlock = content.find((block) => {
    const candidate = block as { type?: unknown; text?: unknown };
    return candidate.type === 'text' && typeof candidate.text === 'string';
  }) as { text: string } | undefined;
  if (!textBlock) throw new Error('Anthropic response missing first text block');
  return textBlock.text;
}
