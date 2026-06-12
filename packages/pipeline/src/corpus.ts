// Pipeline input shapes. Decisions enter as full domain Decisions with empty
// evidence.cases (the ranking is this pipeline's output); Cases enter as a
// standalone corpus the rankings draw from.
import type { CaseOutcome } from '@ppi/domain';

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
  outcome: CaseOutcome;
  /** What happened — display text only, never embedded (it carries the answer). */
  detail: string;
  tags: string[];
  /** Provenance: which seed decision's hand-authored evidence this was extracted from. */
  origin?: { decisionId: string; patternIndex?: number };
}
