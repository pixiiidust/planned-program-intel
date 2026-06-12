// Domain language per CONTEXT.md — the glossary made into types.

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

export const URGENCY_RANK: Record<UrgencyLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/**
 * Lifecycle states. Tabs (Needs you / Waiting / Decided) are views, not states.
 * "Detected" is the event that creates a Decision, not a state it sits in.
 */
export type DecisionStatus = 'open' | 'blocked' | 'escalated' | 'resolved';

/**
 * Planned-shaped Signal taxonomy (ADR-0003): the structured platform events
 * Decisions are detected from. Every seed Decision references the Signal type
 * that would have produced it.
 */
export const SIGNAL_TYPES = [
  'quote.received',
  'contract.summarized',
  'approval.stalled',
  'registration.pace_updated',
  'policy.checked',
] as const;

export type SignalType = (typeof SIGNAL_TYPES)[number];

export type ResolutionChoice = 'accepted' | 'changed' | 'overridden';

/** Whether a Case worked or failed. Established after the fact — never at decision time. */
export type CaseOutcome = 'worked' | 'failed';

export interface EventRef {
  id: string;
  name: string;
  location: string;
  date: string;
  budget?: string;
  attendees?: number;
}

export interface Urgency {
  level: UrgencyLevel;
  /** Urgency always carries its because — deadline plus cost of missing it. */
  because: string;
}

export interface Owner {
  name: string;
  role: string;
  /** The stated routing reason — why this Decision is yours. */
  whyRouted: string;
}

/** "Worked X of Y similar cases." Counts Cases only — never Precedents, never a bare score. */
export interface TrackRecord {
  worked: number;
  total: number;
  basis: string;
}

export interface Recommendation {
  action: string;
  why: string;
  track: TrackRecord;
}

/** A named cluster of Cases with a shared approach, a count, and a takeaway. */
export interface Pattern {
  outcome: CaseOutcome;
  title: string;
  count: string;
  example: { event: string; detail: string };
  takeaway: string;
}

/** A named subgroup of Cases where the usual Pattern behaves differently — with why it matters now. */
export interface ExceptionNote {
  title: string;
  detail: string;
}

/** A past, similar decision from a previous event whose outcome is known. */
export interface Case {
  event: string;
  when: string;
  similarity: number;
  outcome: CaseOutcome;
  patternIndex?: number;
  detail: string;
  tags: string[];
}

/**
 * A recent Resolution surfaced in a similar open Decision's Evidence — decider,
 * reasoning, recency, but no outcome yet. Excluded from worked/failed counts.
 */
export interface Precedent {
  sourceDecisionId: string;
  sourceTitle: string;
  choice: ResolutionChoice;
  reasoning: string;
  decidedBy: string;
  daysAgo: number;
}

/** The inspectable backing for a recommendation: Cases + Exceptions + Precedents. */
export interface Evidence {
  /** Size of the full similar-case corpus the top-k cases were ranked from. */
  caseCount: number;
  workedCount: number;
  patterns: Pattern[];
  exceptions: ExceptionNote[];
  cases: Case[];
  precedents: Precedent[];
}

export interface WhatsDifferent {
  change: string;
  /** Differences always carry why-it-matters — novelty is never noise. */
  whyItMatters: string;
}

export interface EscalationPath {
  name: string;
  role: string;
  why: string;
}

/** The human's recorded answer: one of the four verbs plus their reasoning. */
export interface Resolution {
  choice: ResolutionChoice;
  reasoning: string;
  changedTo?: string;
  decidedBy: string;
  daysAgo: number;
}

/** Escalation keeps ownership with the Owner; the Decision is *with* the escalatee. */
export interface Escalation {
  to: string;
  reasoning: string;
  requestedBy: string;
  daysAgo: number;
}

/** A choice that needs a human resolution, attached to one event. */
export interface Decision {
  id: string;
  title: string;
  problem: string;
  actionNeeded: string;
  event: EventRef;
  type: string;
  signalType: SignalType;
  urgency: Urgency;
  dueInDays: number | null;
  status: DecisionStatus;
  /** Named external dependency preventing the recommended action (Blocked only). */
  blockedBy?: string;
  owner: Owner;
  recommendation: Recommendation;
  evidence: Evidence;
  whatsDifferent: WhatsDifferent[];
  risks: string[];
  constraints: string[];
  escalationPaths: EscalationPath[];
  resolution: Resolution | null;
  escalation: Escalation | null;
}

/** Versioned seed artifact the web app loads. Hand-converted stopgap until the slice-2 pipeline. */
export interface SeedBundle {
  seedVersion: string;
  decisions: Decision[];
  /**
   * Held-back, pipeline-derived Decisions the simulated feed releases on Detection (ADR-0003).
   * Evidence is true by construction like every seeded Decision.
   */
  feedDecisions?: Decision[];
  /** Sibling map for Precedent routing: decision id → similar open decision ids. */
  siblings: Record<string, string[]>;
}
