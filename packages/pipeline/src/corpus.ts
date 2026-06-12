// Pipeline input shapes. Decisions enter as full domain Decisions with empty
// evidence.cases (the ranking is this pipeline's output); Cases enter as a
// standalone corpus the rankings draw from.
import type { CaseOutcome, SignalType } from '@ppi/domain';

export type CorpusRecord = Record<string, string | number | boolean>;

/**
 * A standalone corpus Case — a past decision whose outcome is known. The
 * slice-2.1 stopgap extraction derives these from the hand-converted seed
 * (provisional titles, no problem statement); the generated corpus (#13)
 * fills the full situation fields.
 */
export interface CorpusCase {
  id: string;
  /** Situation type, same vocabulary as Decision.type (contract, budget, approval, ...). */
  type: string;
  /** One-line situation summary — what was being decided, never how it went. */
  title: string;
  /** The situation's problem statement, when known. */
  problem?: string;
  event: string;
  when: string;
  /**
   * Generated corpus cases always carry this; optional here so the v1
   * extracted data/cases.json remains a valid pipeline input.
   */
  signalType?: SignalType;
  /** Structured approach, used as the clustering dimension in the next stage. */
  approach?: string;
  /** Structured facts extracted or synthesized before outcome labelling. */
  record?: CorpusRecord;
  outcome: CaseOutcome;
  /** Mechanical sentence naming the record facts that determined the outcome. */
  outcomeBasis?: string;
  /** What happened — display text only, never embedded (it carries the answer). */
  detail: string;
  tags: string[];
  /** Provenance: which seed decision's hand-authored evidence this was extracted from. */
  origin?: { decisionId: string; patternIndex?: number };
}

export type GeneratedCorpusCase = Omit<
  CorpusCase,
  'outcome' | 'outcomeBasis' | 'origin' | 'problem' | 'signalType' | 'approach' | 'record'
> & {
  problem: string;
  signalType: SignalType;
  approach: string;
  record: CorpusRecord;
  outcome?: never;
  outcomeBasis?: never;
};

export type LabelledCorpusCase = Omit<GeneratedCorpusCase, 'outcome' | 'outcomeBasis'> & {
  outcome: CaseOutcome;
  outcomeBasis: string;
};
