import { describe, expect, it } from 'vitest';
import { DEFAULT_DETECTION_THRESHOLDS, detectFromFeed, signalTrips, type DetectionThresholds } from './detection.js';
import type { Signal } from './signals.js';
import { makeDecision } from './testing.js';
import type { EventRef } from './types.js';

const EVENT: EventRef = { id: 'sko', name: 'Global Sales Kickoff 2027', location: 'Lisbon', date: 'Jan 12-15, 2027' };

describe('signalTrips', () => {
  it('trips registration pace below threshold inside the active window', () => {
    expect(signalTrips({ id: 'sig-pace', type: 'registration.pace_updated', event: EVENT, payload: { registered: 70, target: 100, daysOut: 30 } })).toBe(true);
    expect(signalTrips({ id: 'sig-pace-ok', type: 'registration.pace_updated', event: EVENT, payload: { registered: 80, target: 100, daysOut: 30 } })).toBe(false);
  });

  it('trips quote variance when the quote is materially over budget or contingency is gone', () => {
    expect(signalTrips({ id: 'sig-quote', type: 'quote.received', event: EVENT, payload: { quotedAmount: 111, budgetLineAmount: 100, contingencyRemaining: 10 } })).toBe(
      true,
    );
    expect(signalTrips({ id: 'sig-quote-ok', type: 'quote.received', event: EVENT, payload: { quotedAmount: 101, budgetLineAmount: 100, contingencyRemaining: 10 } })).toBe(
      false,
    );
    expect(signalTrips({ id: 'sig-quote-contingency', type: 'quote.received', event: EVENT, payload: { quotedAmount: 101, budgetLineAmount: 100, contingencyRemaining: 0 } })).toBe(
      true,
    );
  });

  it('trips contract summaries with missing protections before the hold threshold', () => {
    expect(
      signalTrips({ id: 'sig-contract', type: 'contract.summarized', event: EVENT, payload: { missingProtections: ['force majeure'], holdDeadlineDays: 20 } }),
    ).toBe(true);
    expect(
      signalTrips({ id: 'sig-contract-ok', type: 'contract.summarized', event: EVENT, payload: { missingProtections: ['force majeure'], holdDeadlineDays: 21 } }),
    ).toBe(false);
  });

  it('trips approvals that have passed the escalation lead window', () => {
    expect(
      signalTrips({ id: 'sig-approval', type: 'approval.stalled', event: EVENT, payload: { stalledDays: 8, approvalWindowDays: 10, escalationLeadDays: 3 } }),
    ).toBe(true);
    expect(
      signalTrips({ id: 'sig-approval-ok', type: 'approval.stalled', event: EVENT, payload: { stalledDays: 7, approvalWindowDays: 10, escalationLeadDays: 3 } }),
    ).toBe(false);
  });

  it('trips failed policy checks with no standing exception', () => {
    expect(signalTrips({ id: 'sig-policy', type: 'policy.checked', event: EVENT, payload: { policyId: 'P-201', passed: false, standingException: false } })).toBe(true);
    expect(signalTrips({ id: 'sig-policy-ok', type: 'policy.checked', event: EVENT, payload: { policyId: 'P-201', passed: false, standingException: true } })).toBe(false);
  });

  it('supports long-lead program tuning for registration pace', () => {
    const skoSignal: Signal = {
      id: 'sig-sko-pace-1',
      type: 'registration.pace_updated',
      event: EVENT,
      payload: { registered: 480, target: 650, daysOut: 147 },
    };
    const longLeadThresholds: DetectionThresholds = {
      ...DEFAULT_DETECTION_THRESHOLDS,
      'registration.pace_updated': { ...DEFAULT_DETECTION_THRESHOLDS['registration.pace_updated'], maxDaysOut: 180 },
    };

    expect(signalTrips(skoSignal)).toBe(false);
    expect(signalTrips(skoSignal, longLeadThresholds)).toBe(true);
  });
});

describe('detectFromFeed', () => {
  const tripSignal: Signal = {
    id: 'sig-sko-pace-1',
    type: 'registration.pace_updated',
    event: EVENT,
    payload: { registered: 70, target: 100, daysOut: 30 },
  };

  it('returns the matching feed decision when the Signal trips', () => {
    const decision = makeDecision({ id: 'd21', signalType: 'registration.pace_updated', event: EVENT });
    expect(detectFromFeed(tripSignal, [decision])).toBe(decision);
  });

  it('returns null when the Signal does not trip', () => {
    const noTrip: Signal = {
      id: 'sig-sko-pace-ok',
      type: 'registration.pace_updated',
      event: EVENT,
      payload: { registered: 80, target: 100, daysOut: 30 },
    };
    const decision = makeDecision({ id: 'd21', signalType: 'registration.pace_updated', event: EVENT });
    expect(detectFromFeed(noTrip, [decision])).toBeNull();
  });

  it('returns null when no feed decision matches the Signal type and event', () => {
    const decision = makeDecision({ id: 'd21', signalType: 'quote.received', event: EVENT });
    expect(detectFromFeed(tripSignal, [decision])).toBeNull();
  });
});
