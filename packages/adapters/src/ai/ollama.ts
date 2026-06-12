import type { AiPort } from '@ppi/domain';
import { excerpt, parseJsonText, systemInstruction } from './json.js';

interface OllamaResponse {
  message?: { content?: unknown };
}

export interface OllamaAiOptions {
  endpoint?: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

export function createOllamaAi(opts: OllamaAiOptions = {}): AiPort {
  const endpoint = (opts.endpoint ?? 'http://localhost:11434').replace(/\/$/, '');
  const model = opts.model ?? 'llama3.2';
  const fetchImpl = opts.fetchImpl ?? fetch;

  return {
    async generateJson(request) {
      const response = await fetchImpl(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemInstruction(request.instruction) },
            { role: 'user', content: JSON.stringify({ input: request.input, schema: request.schema }) },
          ],
          stream: false,
          format: 'json',
        }),
      });

      const body = await response.text();
      if (!response.ok) throw new Error(`Ollama request failed (${response.status}): ${excerpt(body)}`);

      let payload: OllamaResponse;
      try {
        payload = JSON.parse(body) as OllamaResponse;
      } catch (error) {
        throw new Error(`Ollama response was not JSON: ${excerpt(body)}`, { cause: error });
      }

      const content = payload.message?.content;
      if (typeof content !== 'string') throw new Error(`Ollama response missing message.content: ${excerpt(body)}`);
      return parseJsonText(content, 'Ollama');
    },
  };
}
