// Manual pre-ship eval of the distillation prompt against real Haiku via OpenRouter (the #14 narration-review pattern). Run before any prompt change ships. NEVER wired into CI — it spends real money and its value is the human read of the outputs.
import {
  acceptDistilledText,
  buildDistillationRequest,
  createOpenRouterAi,
  DISTILL_MAX_TOKENS,
  DISTILLATION_FIXTURES,
} from '@ppi/adapters';
import { loadRepoEnv } from './env.js';

type Verdict =
  | { ok: true; text: string }
  | { ok: false; reason: 'empty' | 'digits' | 'sentence count' | 'malformed shape' };

function die(message: string): never {
  console.error(message);
  process.exit(1);
}

function excerpt(text: string, max = 120): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  return compact.length > max ? `${compact.slice(0, max)}...` : compact;
}

function formatRaw(value: unknown): string {
  if (typeof value === 'string') return value;
  const json = JSON.stringify(value, null, 2);
  return json ?? String(value);
}

function verdictFor(raw: unknown): Verdict {
  const accepted = acceptDistilledText(raw);
  if (accepted) return { ok: true, text: accepted };

  if (!raw || typeof raw !== 'object') return { ok: false, reason: 'malformed shape' };
  const distilled = (raw as { distilled?: unknown }).distilled;
  if (typeof distilled !== 'string') return { ok: false, reason: 'malformed shape' };

  const trimmed = distilled.trim();
  if (!trimmed) return { ok: false, reason: 'empty' };
  if (/\d/.test(trimmed)) return { ok: false, reason: 'digits' };

  const sentenceCount = trimmed
    .split(/[.!?]+/)
    .map((segment) => segment.trim())
    .filter(Boolean).length;
  return sentenceCount > 2 ? { ok: false, reason: 'sentence count' } : { ok: false, reason: 'malformed shape' };
}

loadRepoEnv();
const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) die('OPENROUTER_API_KEY is required for eval:distill; add it to repo-root .env or export it.');

const summary: { fixture: string; passed: boolean }[] = [];

for (const { name, input } of DISTILLATION_FIXTURES) {
  console.log(`\n=== ${name} ===`);
  console.log(`Input reasoning: ${excerpt(input.reasoning)}`);

  try {
    const raw = await createOpenRouterAi({ apiKey, model: 'anthropic/claude-haiku-4.5', maxTokens: DISTILL_MAX_TOKENS }).generateJson(
      buildDistillationRequest(input),
    );
    console.log('RAW model text:');
    console.log(formatRaw(raw));

    const verdict = verdictFor(raw);
    if (verdict.ok) {
      console.log(`Verdict: ACCEPTED - ${verdict.text}`);
      summary.push({ fixture: name, passed: true });
    } else {
      console.log(`Verdict: REJECTED - ${verdict.reason}`);
      summary.push({ fixture: name, passed: false });
    }
  } catch (error) {
    console.log(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    summary.push({ fixture: name, passed: false });
  }
}

console.log('\nSummary');
console.table(summary.map((row) => ({ fixture: row.fixture, result: row.passed ? 'pass' : 'fail' })));
console.log('Prompt-injection behavior and condensation quality are judged by the human reading the outputs.');

process.exit(summary.some((row) => !row.passed) ? 1 : 0);
