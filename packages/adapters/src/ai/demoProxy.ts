import type { AiPort } from '@ppi/domain';
import { excerpt } from './json.js';

export interface DemoProxyAiOptions {
  url: string;
  fetchImpl?: typeof fetch;
}

export function createDemoProxyAi(opts: DemoProxyAiOptions): AiPort {
  const fetchImpl = opts.fetchImpl ?? fetch;

  return {
    async generateJson(request) {
      const response = await fetchImpl(opts.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: request.input }),
      });

      const body = await response.text();
      if (!response.ok) throw new Error(`Demo proxy request failed (${response.status}): ${excerpt(body)}`);

      try {
        return JSON.parse(body) as unknown;
      } catch (error) {
        throw new Error(`Demo proxy response was not JSON: ${excerpt(body)}`, { cause: error });
      }
    },
  };
}
