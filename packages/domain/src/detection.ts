import type { Signal } from './signals.js';
import type { Decision } from './types.js';

export interface DetectionThresholds {
  'registration.pace_updated': {
    paceRatio: number;
    maxDaysOut: number;
  };
  'quote.received': {
    overBudgetRatio: number;
  };
  'contract.summarized': {
    minHoldDays: number;
  };
  'approval.stalled': Record<string, never>;
  'policy.checked': Record<string, never>;
}

export const DEFAULT_DETECTION_THRESHOLDS: DetectionThresholds = {
  'registration.pace_updated': { paceRatio: 0.75, maxDaysOut: 60 },
  'quote.received': { overBudgetRatio: 1.1 },
  'contract.summarized': { minHoldDays: 21 },
  'approval.stalled': {},
  'policy.checked': {},
};

export function signalTrips(signal: Signal, thresholds: DetectionThresholds = DEFAULT_DETECTION_THRESHOLDS): boolean {
  switch (signal.type) {
    case 'registration.pace_updated': {
      const t = thresholds['registration.pace_updated'];
      return signal.payload.registered < t.paceRatio * signal.payload.target && signal.payload.daysOut < t.maxDaysOut;
    }
    case 'quote.received': {
      const t = thresholds['quote.received'];
      const overBudget = signal.payload.quotedAmount > signal.payload.budgetLineAmount;
      return signal.payload.quotedAmount > t.overBudgetRatio * signal.payload.budgetLineAmount || (overBudget && signal.payload.contingencyRemaining <= 0);
    }
    case 'contract.summarized': {
      const t = thresholds['contract.summarized'];
      return signal.payload.missingProtections.length > 0 && signal.payload.holdDeadlineDays < t.minHoldDays;
    }
    case 'approval.stalled':
      return signal.payload.stalledDays > signal.payload.approvalWindowDays - signal.payload.escalationLeadDays;
    case 'policy.checked':
      return !signal.payload.passed && !signal.payload.standingException;
    default:
      return exhaustive(signal);
  }
}

export function detectFromFeed(
  signal: Signal,
  feedDecisions: readonly Decision[],
  thresholds: DetectionThresholds = DEFAULT_DETECTION_THRESHOLDS,
): Decision | null {
  if (!signalTrips(signal, thresholds)) return null;
  return feedDecisions.find((d) => d.signalType === signal.type && d.event.id === signal.event.id) ?? null;
}

function exhaustive(signal: never): never {
  throw new Error(`unknown Signal type ${(signal as Signal).type}`);
}
