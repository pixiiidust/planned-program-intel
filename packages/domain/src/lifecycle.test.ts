import { describe, expect, it } from 'vitest';
import { applyAction, canApply, IllegalTransitionError } from './lifecycle.js';
import { makeDecision } from './testing.js';
import type { DecisionStatus, Escalation, EscalationFeedback, Resolution } from './types.js';

function decision(status: DecisionStatus) {
  return makeDecision({ status });
}

const RESOLUTION: Resolution = { choice: 'accepted', reasoning: 'r', decidedBy: 'Dana Ortiz', daysAgo: 0 };
const ESCALATION: Escalation = { to: 'Mei Lin', reasoning: 'outside my authority', requestedBy: 'Dana Ortiz', daysAgo: 0 };
const FEEDBACK: EscalationFeedback = { text: 'Take it to venue counsel directly.', from: 'Mei Lin', daysAgo: 0 };

describe('lifecycle state machine', () => {
  it('open ⇄ blocked', () => {
    const blocked = applyAction(decision('open'), { kind: 'block', blockedBy: 'VP sign-off pending' });
    expect(blocked.status).toBe('blocked');
    expect(blocked.blockedBy).toBe('VP sign-off pending');

    const reopened = applyAction(blocked, { kind: 'unblock' });
    expect(reopened.status).toBe('open');
    expect(reopened.blockedBy).toBeUndefined();
  });

  it('open → escalated → open (feedback returns; ownership retained)', () => {
    const escalated = applyAction(decision('open'), { kind: 'escalate', escalation: ESCALATION });
    expect(escalated.status).toBe('escalated');
    expect(escalated.escalation?.to).toBe('Mei Lin');
    expect(escalated.owner.name).toBe('Dana Ortiz');

    const back = applyAction(escalated, { kind: 'feedbackReturned', feedback: FEEDBACK });
    expect(back.status).toBe('open');
    expect(back.escalation).toEqual({ ...ESCALATION, feedback: FEEDBACK });
    expect(back.owner.name).toBe('Dana Ortiz');
  });

  it('open → resolved carries the Resolution', () => {
    const resolved = applyAction(decision('open'), { kind: 'resolve', resolution: RESOLUTION });
    expect(resolved.status).toBe('resolved');
    expect(resolved.resolution).toEqual(RESOLUTION);
  });

  it('blocked Decisions can still be escalated or resolved — never waited out', () => {
    expect(applyAction(decision('blocked'), { kind: 'escalate', escalation: ESCALATION }).status).toBe('escalated');
    expect(applyAction(decision('blocked'), { kind: 'resolve', resolution: RESOLUTION }).status).toBe('resolved');
  });

  it('escalated Decisions can still be resolved by the Owner', () => {
    expect(applyAction(decision('escalated'), { kind: 'resolve', resolution: RESOLUTION }).status).toBe('resolved');
  });

  it('resolved is terminal in the demo', () => {
    for (const kind of ['block', 'unblock', 'escalate', 'feedbackReturned', 'resolve'] as const) {
      expect(canApply('resolved', kind)).toBe(false);
    }
    expect(() => applyAction(decision('resolved'), { kind: 'resolve', resolution: RESOLUTION })).toThrow(
      IllegalTransitionError,
    );
  });

  it('rejects nonsense transitions', () => {
    expect(() => applyAction(decision('open'), { kind: 'unblock' })).toThrow(IllegalTransitionError);
    expect(() => applyAction(decision('open'), { kind: 'feedbackReturned', feedback: FEEDBACK })).toThrow(IllegalTransitionError);
    expect(() => applyAction(decision('blocked'), { kind: 'block', blockedBy: 'x' })).toThrow(IllegalTransitionError);
    expect(() => applyAction(decision('escalated'), { kind: 'escalate', escalation: ESCALATION })).toThrow(
      IllegalTransitionError,
    );
  });
});
