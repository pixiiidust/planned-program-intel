import type { EventRef } from './types.js';

export interface QuoteReceivedSignal {
  id: string;
  type: 'quote.received';
  event: EventRef;
  payload: {
    quotedAmount: number;
    budgetLineAmount: number;
    contingencyRemaining: number;
  };
}

export interface ContractSummarizedSignal {
  id: string;
  type: 'contract.summarized';
  event: EventRef;
  payload: {
    missingProtections: string[];
    holdDeadlineDays: number;
  };
}

export interface ApprovalStalledSignal {
  id: string;
  type: 'approval.stalled';
  event: EventRef;
  payload: {
    stalledDays: number;
    approvalWindowDays: number;
    escalationLeadDays: number;
  };
}

export interface RegistrationPaceSignal {
  id: string;
  type: 'registration.pace_updated';
  event: EventRef;
  payload: {
    registered: number;
    target: number;
    daysOut: number;
  };
}

export interface PolicyCheckedSignal {
  id: string;
  type: 'policy.checked';
  event: EventRef;
  payload: {
    policyId: string;
    passed: boolean;
    standingException: boolean;
  };
}

export type Signal =
  | QuoteReceivedSignal
  | ContractSummarizedSignal
  | ApprovalStalledSignal
  | RegistrationPaceSignal
  | PolicyCheckedSignal;
