import type { Decision } from './types.js';
import type { Signal } from './signals.js';

/** Where Decisions come from. Demo adapter seeds them; a real adapter would read planned.com. */
export interface DecisionSource {
  listDecisions(): Promise<Decision[]>;
}

/** Ingestion port (ADR-0003): the demo's scripted feed and a real planned.com adapter speak the same Signal taxonomy. */
export interface SignalFeed {
  /** Begin delivering Signals; returns an unsubscribe that also cancels pending delivery. */
  subscribe(onSignal: (signal: Signal) => void): () => void;
}

/** A JSON-generation request to the AI port. Inputs are structured; outputs must satisfy the schema. */
export interface AiJsonRequest {
  /** Stable task id (e.g. "pattern.narrate") - canned adapters key their templates on it. */
  task: string;
  /** The instruction for the model. */
  instruction: string;
  /** Structured input the text must be grounded in. */
  input: unknown;
  /** JSON Schema (draft-07-ish subset) the response must satisfy. */
  schema: Record<string, unknown>;
}

/** AI port (ADR-0002). Build-time pipeline narration now; live Precedent distillation in slice 5. */
export interface AiPort {
  generateJson(request: AiJsonRequest): Promise<unknown>;
}

export interface LoadResult {
  decisions: Decision[];
  /** True when a stale seed (version-stamp mismatch after a redeploy) was nuked and reseeded. */
  reseeded: boolean;
}

/**
 * Persistence port. The demo runs the IndexedDB adapter; the Postgres adapter
 * (slice 6) proves the port with the same contract suite. No migrations on
 * the demo side — a seed-version mismatch nukes and reseeds by design.
 */
export interface DecisionRepository {
  load(): Promise<LoadResult>;
  save(decision: Decision): Promise<void>;
  /** Drop all persisted state and restore the pristine seed. */
  reset(): Promise<Decision[]>;
}
