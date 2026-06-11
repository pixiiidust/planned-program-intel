import type { Evidence, TrackRecord } from './types.js';

/**
 * The worked/failed figures shown anywhere (Track Record line, proportion bar)
 * derive from Cases only. Precedents — outcome pending — never enter these
 * counts, so the Track Record never lies.
 */
export function evidenceCounts(evidence: Evidence): { worked: number; failed: number; total: number } {
  return {
    worked: evidence.workedCount,
    failed: evidence.caseCount - evidence.workedCount,
    total: evidence.caseCount,
  };
}

/** Small samples get a caveat, never silent confidence. */
export function isSmallSample(track: TrackRecord): boolean {
  return track.total < 5;
}
