export { DEMO_SEED, InMemoryDecisionSource } from './demo/decisionSource.js';
export { IndexedDbDecisionRepository } from './demo/indexedDbRepository.js';
export { DEMO_SENIOR_ROLES } from './demo/personas.js';
export { DEMO_PROGRAM_THRESHOLDS, SCRIPTED_PACE_SIGNAL, ScriptedSignalFeed } from './demo/signalFeed.js';
export { SEED } from './demo/seed.js';
export {
  acceptDistilledText,
  buildDistillationRequest,
  clampReasoning,
  createAnthropicAi,
  createCannedAi,
  createDemoProxyAi,
  createOllamaAi,
  createOpenRouterAi,
  DISTILL_MAX_TOKENS,
  DISTILL_REASONING_MAX_CHARS,
  DISTILL_TASK,
  DISTILL_TIMEOUT_MS,
  DISTILLATION_FIXTURES,
  distill,
} from './ai/index.js';
export type { AnthropicAiOptions, DemoProxyAiOptions, DistillationInput, OllamaAiOptions, OpenRouterAiOptions } from './ai/index.js';
