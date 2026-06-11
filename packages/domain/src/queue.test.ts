import { describe, expect, it } from 'vitest';
import { needsYou, tabOf } from './queue.js';
import type { Decision, DecisionStatus } from './types.js';

function decision(id: string, status: DecisionStatus): Decision {
  return {
    id,
    title: `Decision ${id}`,
    problem: 'p',
    actionNeeded: 'a',
    eventName: 'Event',
    urgency: { level: 'high', because: 'deadline and cost' },
    status,
    owner: { name: 'Dana Ortiz', role: 'Event Lead' },
    recommendation: { action: 'do x', why: 'because y' },
  };
}

describe('queue tabs are views over lifecycle states', () => {
  it('maps open and blocked to needs-you', () => {
    expect(tabOf(decision('d1', 'open'))).toBe('needs-you');
    expect(tabOf(decision('d2', 'blocked'))).toBe('needs-you');
  });

  it('maps escalated to waiting and resolved to decided', () => {
    expect(tabOf(decision('d3', 'escalated'))).toBe('waiting');
    expect(tabOf(decision('d4', 'resolved'))).toBe('decided');
  });

  it('needsYou includes blocked Decisions — the next move is breaking the block', () => {
    const ds = [decision('d1', 'open'), decision('d2', 'blocked'), decision('d3', 'escalated'), decision('d4', 'resolved')];
    expect(needsYou(ds).map((d) => d.id)).toEqual(['d1', 'd2']);
  });
});
