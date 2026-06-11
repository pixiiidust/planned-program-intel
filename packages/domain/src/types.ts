// Domain language per CONTEXT.md. Minimal walking-skeleton shape — issue #8
// grows this into the full contracts (Evidence, Track Record, lifecycle).

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

/** Lifecycle states. Tabs (Needs you / Waiting / Decided) are views, not states. */
export type DecisionStatus = 'open' | 'blocked' | 'escalated' | 'resolved';

export interface Urgency {
  level: UrgencyLevel;
  /** Urgency always carries its because — deadline plus cost of missing it. */
  because: string;
}

export interface Owner {
  name: string;
  role: string;
}

export interface Recommendation {
  action: string;
  why: string;
}

/** A choice that needs a human resolution, attached to one event. */
export interface Decision {
  id: string;
  title: string;
  problem: string;
  actionNeeded: string;
  eventName: string;
  urgency: Urgency;
  status: DecisionStatus;
  owner: Owner;
  recommendation: Recommendation;
}
