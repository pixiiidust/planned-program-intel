// Deep imports keep the browser-only demo adapter (IndexedDB, DOM types) out of the Workers typecheck.
import { clampReasoning, DISTILL_MAX_TOKENS, distill } from '@ppi/adapters/src/ai/distillation';
import type { DistillationInput } from '@ppi/adapters/src/ai/distillation';
import { createOpenRouterAi } from '@ppi/adapters/src/ai/openrouter';
import type { ResolutionChoice } from '@ppi/domain';

interface Env {
  OPENROUTER_API_KEY: string;
  DISTILL_KV?: KVNamespace;
  RATE_LIMIT?: { limit(opts: { key: string }): Promise<{ success: boolean }> };
}

const ALLOWED_ORIGINS = new Set(['https://pixiiidust.github.io']);
const LOCALHOST_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const DAILY_LIMIT = 300;

const empty = (status: number, origin?: string) => new Response(null, { status, headers: origin ? corsHeaders(origin) : undefined });

function allowedOrigin(request: Request): string | null {
  const origin = request.headers.get('Origin');
  if (!origin) return null;
  if (ALLOWED_ORIGINS.has(origin) || LOCALHOST_ORIGIN.test(origin)) return origin;
  return null;
}

function corsHeaders(origin: string): HeadersInit {
  return { 'Access-Control-Allow-Origin': origin };
}

function preflight(origin: string): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'content-type',
    },
  });
}

function clampField(value: string): string {
  return value.trim().slice(0, 200);
}

function isResolutionChoice(value: string): value is ResolutionChoice {
  return value === 'accepted' || value === 'changed' || value === 'overridden';
}

function sanitizeBody(body: unknown): DistillationInput | null {
  if (!body || typeof body !== 'object') return null;
  const input = (body as { input?: unknown }).input;
  if (!input || typeof input !== 'object') return null;

  const candidate = input as Record<string, unknown>;
  const { decisionTitle, decisionType, eventName, choice, reasoning, changedTo } = candidate;
  if (
    typeof decisionTitle !== 'string' ||
    typeof decisionType !== 'string' ||
    typeof eventName !== 'string' ||
    typeof choice !== 'string' ||
    typeof reasoning !== 'string'
  ) {
    return null;
  }
  if (!isResolutionChoice(choice)) return null;
  if (changedTo !== undefined && typeof changedTo !== 'string') return null;

  return {
    decisionTitle: clampField(decisionTitle),
    decisionType: clampField(decisionType),
    eventName: clampField(eventName),
    choice,
    ...(changedTo ? { changedTo: clampField(changedTo) } : {}),
    reasoning: clampReasoning(reasoning),
  };
}

async function underDailyLimit(env: Env): Promise<boolean> {
  if (!env.DISTILL_KV) return true;

  const day = new Date().toISOString().slice(0, 10);
  const key = `count:${day}`;
  const count = Number.parseInt((await env.DISTILL_KV.get(key)) ?? '0', 10);
  if (count >= DAILY_LIMIT) return false;
  await env.DISTILL_KV.put(key, String(count + 1), { expirationTtl: 172800 });
  return true;
}

async function handle(request: Request, env: Env): Promise<Response> {
  const origin = allowedOrigin(request);
  if (!origin) return empty(403);
  if (request.method === 'OPTIONS') return preflight(origin);

  const url = new URL(request.url);
  if (url.pathname !== '/distill') return empty(404, origin);
  if (request.method !== 'POST') return empty(405, origin);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return empty(400, origin);
  }

  const input = sanitizeBody(body);
  if (!input) return empty(400, origin);

  const rateKey = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (env.RATE_LIMIT) {
    const limited = await env.RATE_LIMIT.limit({ key: rateKey });
    if (!limited.success) return empty(429, origin);
  }

  if (!(await underDailyLimit(env))) return empty(429, origin);
  if (!env.OPENROUTER_API_KEY) return empty(502, origin);

  const distilled = await distill(
    (fetchImpl) =>
      createOpenRouterAi({
        apiKey: env.OPENROUTER_API_KEY,
        model: 'anthropic/claude-haiku-4.5',
        maxTokens: DISTILL_MAX_TOKENS,
        fetchImpl,
      }),
    input,
    { timeoutMs: 2500 },
  );
  if (!distilled) return empty(502, origin);

  return new Response(JSON.stringify({ distilled }), {
    status: 200,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handle(request, env);
    } catch {
      const origin = allowedOrigin(request);
      return empty(502, origin ?? undefined);
    }
  },
};
