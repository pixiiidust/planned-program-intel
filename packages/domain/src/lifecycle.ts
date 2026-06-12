// The lifecycle state machine, settled in the grill session (PRD):
//
//   detected → open ⇄ blocked
//                 ↘ escalated → open   (feedback returns; ownership retained)
//              open → resolved          (spawns Precedent)
//   [later, outside the demo: outcome known → Precedent becomes Case]
//
// Blocked is open-adjacent: the Owner can still escalate or resolve — the one
// thing they never do is wait it out. Escalated Decisions can still be
// resolved by the Owner once feedback (or conviction) arrives.

import type { Decision, DecisionStatus, Escalation, EscalationFeedback, Resolution } from './types.js';

export type DecisionAction =
  | { kind: 'block'; blockedBy: string }
  | { kind: 'unblock' }
  | { kind: 'escalate'; escalation: Escalation }
  | { kind: 'feedbackReturned'; feedback: EscalationFeedback }
  | { kind: 'resolve'; resolution: Resolution };

const ALLOWED: Record<DecisionStatus, ReadonlyArray<DecisionAction['kind']>> = {
  open: ['block', 'escalate', 'resolve'],
  blocked: ['unblock', 'escalate', 'resolve'],
  escalated: ['feedbackReturned', 'resolve'],
  resolved: [],
};

export class IllegalTransitionError extends Error {
  constructor(status: DecisionStatus, action: DecisionAction['kind']) {
    super(`Cannot ${action} a ${status} Decision`);
    this.name = 'IllegalTransitionError';
  }
}

export function canApply(status: DecisionStatus, action: DecisionAction['kind']): boolean {
  return ALLOWED[status].includes(action);
}

/** Pure transition: validates against the state machine and returns the next Decision. */
export function applyAction(decision: Decision, action: DecisionAction): Decision {
  if (!canApply(decision.status, action.kind)) {
    throw new IllegalTransitionError(decision.status, action.kind);
  }
  switch (action.kind) {
    case 'block':
      return { ...decision, status: 'blocked', blockedBy: action.blockedBy };
    case 'unblock': {
      const { blockedBy: _dropped, ...rest } = decision;
      return { ...rest, status: 'open' };
    }
    case 'escalate':
      return { ...decision, status: 'escalated', escalation: action.escalation };
    case 'feedbackReturned':
      return { ...decision, status: 'open', escalation: { ...decision.escalation!, feedback: action.feedback } };
    case 'resolve':
      return { ...decision, status: 'resolved', resolution: action.resolution };
  }
}
