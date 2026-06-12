// The two emitted runtime tables (ADR-0004): decision→cases (evidence
// ranking) and decision→decisions (sibling map for Precedent routing).
// Checked in as diffable artifacts with the model and params that made them.
import type { Scored } from './rank.js';

export interface SimilarityTable {
  model: string;
  params: Record<string, number>;
  rows: Record<string, Scored[]>;
}

/** k is the display cap applied at emit; floor controls table membership. */
export const CASE_PARAMS = { k: 4, floor: 0.25 };

/**
 * Cap keeps the nudge meaningful; floor chosen so measured situation pairs
 * (weakest designed pair d3-d19 = 0.456) land while cross-situation noise
 * stays out.
 */
export const SIBLING_PARAMS = { cap: 3, floor: 0.45 };
