import type { SignalType } from '@ppi/domain';

export type FamilyId =
  | 'contract-addendum'
  | 'quote-variance'
  | 'approval-stall'
  | 'registration-pace'
  | 'policy-exception'
  | 'vendor-swap';

export interface ApproachDefinition {
  id: string;
  weight: number;
  favorableRate: number;
}

export interface FamilyDefinition {
  id: FamilyId;
  type: string;
  signalType: SignalType;
  count: number;
  approaches: readonly ApproachDefinition[];
  titleTemplates: readonly string[];
  problemTemplates: readonly string[];
}

export interface CitySlot {
  city: string;
  region: string;
}

export const EVENT_KINDS = [
  'SKO',
  'partner summit',
  'customer roadshow',
  'leadership offsite',
  'field kickoff',
  'user conference',
  'executive forum',
  'sales club',
] as const;

export const CITIES: readonly CitySlot[] = [
  { city: 'Austin', region: 'US Central' },
  { city: 'Barcelona', region: 'Iberia' },
  { city: 'Berlin', region: 'DACH' },
  { city: 'Boston', region: 'US East' },
  { city: 'Chicago', region: 'US Midwest' },
  { city: 'Denver', region: 'US Mountain' },
  { city: 'Lisbon', region: 'Iberia' },
  { city: 'London', region: 'UK' },
  { city: 'Madrid', region: 'Iberia' },
  { city: 'Marseille', region: 'France' },
  { city: 'New York', region: 'US East' },
  { city: 'Paris', region: 'France' },
  { city: 'Prague', region: 'Central Europe' },
  { city: 'Rome', region: 'Italy' },
  { city: 'San Francisco', region: 'US West' },
  { city: 'Seoul', region: 'APAC' },
  { city: 'Singapore', region: 'APAC' },
  { city: 'Stockholm', region: 'Nordics' },
] as const;

export const VENUE_KINDS = [
  'arena',
  'conference center',
  'convention center',
  'hotel',
  'resort',
  'university venue',
] as const;

export const GOVERNMENT_VENUE_KINDS = ['civic center', 'municipal hall', 'public auditorium'] as const;

export const YEARS = [2022, 2023, 2024, 2025, 2026] as const;

export const FAMILIES: readonly FamilyDefinition[] = [
  {
    id: 'contract-addendum',
    type: 'contract',
    signalType: 'contract.summarized',
    count: 60,
    approaches: [
      { id: 'pair-with-deposit-trade', weight: 0.3, favorableRate: 0.86 },
      { id: 'ask-early-no-trade', weight: 0.25, favorableRate: 0.85 },
      { id: 'sign-then-amend', weight: 0.25, favorableRate: 0.56 },
      { id: 'sign-without-clause', weight: 0.2, favorableRate: 0.34 },
    ],
    titleTemplates: [
      '{city} {venueKind} contract needed an addendum before {eventKind}',
      '{eventKind} addendum risk at the {city} {venueKind}',
      '{city} hold depended on a contract addendum for {eventKind}',
    ],
    problemTemplates: [
      'The {year} {eventKind} hold needed a clause decision before the {city} {venueKind} released dates.',
      'The {city} {venueKind} contract left the {year} {eventKind} team exposed unless an addendum cleared in time.',
    ],
  },
  {
    id: 'quote-variance',
    type: 'budget',
    signalType: 'quote.received',
    count: 70,
    approaches: [
      { id: 'requote-preferred-vendor', weight: 0.3, favorableRate: 0.84 },
      { id: 'leverage-reprice-inhouse', weight: 0.3, favorableRate: 0.76 },
      { id: 'accept-variance', weight: 0.25, favorableRate: 0.2 },
      { id: 'descope', weight: 0.15, favorableRate: 0.68 },
    ],
    titleTemplates: [
      '{city} AV quote above the line for {eventKind}',
      '{eventKind} production quote variance at the {city} {venueKind}',
      '{city} {venueKind} quote needed a budget decision',
    ],
    problemTemplates: [
      'The {year} {eventKind} quote from the {city} {venueKind} came in above the approved production line.',
      'The {city} {venueKind} team needed a cost path before locking production for the {year} {eventKind}.',
    ],
  },
  {
    id: 'approval-stall',
    type: 'approval',
    signalType: 'approval.stalled',
    count: 50,
    approaches: [
      { id: 'quantified-cost-of-delay', weight: 0.4, favorableRate: 0.84 },
      { id: 'exec-nudge', weight: 0.3, favorableRate: 0.71 },
      { id: 'wait-it-out', weight: 0.3, favorableRate: 0.29 },
    ],
    titleTemplates: [
      '{city} {venueKind} approval stalled before {eventKind}',
      '{eventKind} hold waiting on approval in {city}',
      '{city} sign-off delay put the {eventKind} hold at risk',
    ],
    problemTemplates: [
      'The {year} {eventKind} hold at the {city} {venueKind} was waiting on approval inside a narrow window.',
      'The {city} {venueKind} could not hold dates for the {year} {eventKind} without a faster approval path.',
    ],
  },
  {
    id: 'registration-pace',
    type: 'forecast',
    signalType: 'registration.pace_updated',
    count: 50,
    approaches: [
      { id: 'extend-early-bird', weight: 0.28, favorableRate: 0.68 },
      { id: 'targeted-outreach', weight: 0.28, favorableRate: 0.72 },
      { id: 'rescope-venue', weight: 0.24, favorableRate: 0.76 },
      { id: 'hold-course', weight: 0.2, favorableRate: 0.18 },
    ],
    titleTemplates: [
      '{eventKind} registration pace below target in {city}',
      '{city} {eventKind} pickup lagged before venue commitments',
      '{city} attendance forecast needed a decision for {eventKind}',
    ],
    problemTemplates: [
      'The {year} {eventKind} pace in {city} was below target before the {venueKind} commitment hardened.',
      'The {city} team needed a forecast decision while {year} {eventKind} registration was still recoverable.',
    ],
  },
  {
    id: 'policy-exception',
    type: 'policy',
    signalType: 'policy.checked',
    count: 40,
    approaches: [
      { id: 'document-and-approve', weight: 0.4, favorableRate: 0.84 },
      { id: 'escalate-for-waiver', weight: 0.35, favorableRate: 0.67 },
      { id: 'deny-find-alternative', weight: 0.25, favorableRate: 0.73 },
    ],
    titleTemplates: [
      '{city} {eventKind} needed a policy exception',
      '{eventKind} policy check flagged the {city} {venueKind}',
      '{city} exception request before {eventKind}',
    ],
    problemTemplates: [
      'The {year} {eventKind} plan in {city} needed a policy decision before the {venueKind} commitment.',
      'The {city} team had to resolve a policy exception before confirming the {year} {eventKind}.',
    ],
  },
  {
    id: 'vendor-swap',
    type: 'vendor',
    signalType: 'quote.received',
    count: 30,
    approaches: [
      { id: 'swap-to-preferred', weight: 0.4, favorableRate: 0.79 },
      { id: 'dual-source', weight: 0.3, favorableRate: 0.72 },
      { id: 'keep-incumbent', weight: 0.3, favorableRate: 0.43 },
    ],
    titleTemplates: [
      '{city} vendor swap proposed for {eventKind}',
      '{eventKind} vendor decision at the {city} {venueKind}',
      '{city} quote opened a vendor swap for {eventKind}',
    ],
    problemTemplates: [
      'The {year} {eventKind} team had to decide whether a new vendor quote was worth the delivery risk.',
      'The {city} {venueKind} plan needed a vendor decision before the {year} {eventKind} production lock.',
    ],
  },
] as const;

export function familyIdForCaseShape(caseLike: { type: string; signalType?: SignalType }): FamilyId | undefined {
  switch (caseLike.type) {
    case 'contract':
      return caseLike.signalType === 'contract.summarized' ? 'contract-addendum' : undefined;
    case 'budget':
      return caseLike.signalType === 'quote.received' ? 'quote-variance' : undefined;
    case 'approval':
      return caseLike.signalType === 'approval.stalled' ? 'approval-stall' : undefined;
    case 'forecast':
      return caseLike.signalType === 'registration.pace_updated' ? 'registration-pace' : undefined;
    case 'policy':
      return caseLike.signalType === 'policy.checked' ? 'policy-exception' : undefined;
    case 'vendor':
      return caseLike.signalType === 'quote.received' ? 'vendor-swap' : undefined;
    default:
      return undefined;
  }
}
