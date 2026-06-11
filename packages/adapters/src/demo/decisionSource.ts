import type { Decision, DecisionSource, SeedBundle } from '@ppi/domain';
import { SEED } from './seed.js';

/** The versioned seed artifact the demo runs on (hand-converted stopgap, #8). */
export const DEMO_SEED: SeedBundle = SEED;

/** Demo adapter for the DecisionSource port: in-memory seeded Decisions. */
export class InMemoryDecisionSource implements DecisionSource {
  constructor(private readonly seed: Decision[] = DEMO_SEED.decisions) {}

  async listDecisions(): Promise<Decision[]> {
    return this.seed;
  }
}
