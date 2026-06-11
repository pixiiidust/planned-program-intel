import type { Decision } from './types.js';

/** Where Decisions come from. Demo adapter seeds them; a real adapter would read planned.com. */
export interface DecisionSource {
  listDecisions(): Promise<Decision[]>;
}
