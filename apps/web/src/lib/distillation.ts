import type { Decision, Resolution } from '@ppi/domain';
import {
  createDemoProxyAi,
  createOllamaAi,
  createOpenRouterAi,
  DISTILL_MAX_TOKENS,
  distill,
} from '@ppi/adapters';
import type { DistillationInput } from '@ppi/adapters';

// Placeholder until the Worker is deployed; treated as app config. E2E intercepts
// `**/distill`, so the value never matters in tests; unreachable host = silent verbatim.
export const DEMO_DISTILL_URL = 'https://ppi-distill.workers.dev/distill';

export type EngineChoice = 'demo' | 'byok' | 'ollama';

export interface EngineSettings {
  engine: EngineChoice;
  byokModel: string;
  ollamaEndpoint: string;
  ollamaModel: string;
}

const DEFAULT_BYOK_MODEL = 'anthropic/claude-haiku-4.5';
const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'llama3.2';

function storageValue(storage: Storage | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function browserLocalStorage(): Storage | undefined {
  return typeof localStorage === 'undefined' ? undefined : localStorage;
}

function browserSessionStorage(): Storage | undefined {
  return typeof sessionStorage === 'undefined' ? undefined : sessionStorage;
}

function engineChoice(value: string | null): EngineChoice {
  return value === 'byok' || value === 'ollama' ? value : 'demo';
}

export function loadEngineSettings(): EngineSettings {
  const storage = browserLocalStorage();
  return {
    engine: engineChoice(storageValue(storage, 'ppi-engine')),
    byokModel: storageValue(storage, 'ppi-byok-model') || DEFAULT_BYOK_MODEL,
    ollamaEndpoint: storageValue(storage, 'ppi-ollama-endpoint') || DEFAULT_OLLAMA_ENDPOINT,
    ollamaModel: storageValue(storage, 'ppi-ollama-model') || DEFAULT_OLLAMA_MODEL,
  };
}

export function loadByokKey(): string | null {
  const key = storageValue(browserSessionStorage(), 'ppi-byok-key')?.trim();
  return key || null;
}

export function engineLabel(settings: EngineSettings): string {
  if (settings.engine === 'byok') return `Your key · ${settings.byokModel}`;
  if (settings.engine === 'ollama') return `Ollama · ${settings.ollamaModel}`;
  return `Demo proxy · ${DEFAULT_BYOK_MODEL}`;
}

function inputFromResolution(decision: Decision, resolution: Resolution): DistillationInput {
  return {
    decisionTitle: decision.title,
    decisionType: decision.type,
    eventName: decision.event.name,
    choice: resolution.choice,
    ...(resolution.changedTo ? { changedTo: resolution.changedTo } : {}),
    reasoning: resolution.reasoning,
  };
}

export async function distillResolution(decision: Decision, resolution: Resolution): Promise<{ text: string; engine: string } | null> {
  try {
    const settings = loadEngineSettings();
    const input = inputFromResolution(decision, resolution);
    let text: string | null = null;

    if (settings.engine === 'demo') {
      text = await distill((fetchImpl) => createDemoProxyAi({ url: DEMO_DISTILL_URL, fetchImpl }), input);
    } else if (settings.engine === 'byok') {
      const apiKey = loadByokKey();
      if (!apiKey) return null;
      text = await distill(
        (fetchImpl) => createOpenRouterAi({ apiKey, model: settings.byokModel, maxTokens: DISTILL_MAX_TOKENS, fetchImpl }),
        input,
      );
    } else {
      text = await distill((fetchImpl) => createOllamaAi({ endpoint: settings.ollamaEndpoint, model: settings.ollamaModel, fetchImpl }), input);
    }

    return text ? { text, engine: engineLabel(settings) } : null;
  } catch {
    return null;
  }
}
