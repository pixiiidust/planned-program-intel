import type { Decision } from './types.js';

/** Where Decisions come from. Demo adapter seeds them; a real adapter would read planned.com. */
export interface DecisionSource {
  listDecisions(): Promise<Decision[]>;
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
