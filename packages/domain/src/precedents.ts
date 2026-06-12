// The Program Memory write path: a Resolution spawns a Precedent, which
// surfaces in the Evidence of similar open Decisions (the sibling map).
// A Precedent carries decider, reasoning, recency — but no outcome, so it
// never enters worked/failed counts (see evidence.ts).
import type { Decision, Precedent, Resolution } from './types.js';

export function precedentFrom(decision: Decision, resolution: Resolution): Precedent {
  return {
    sourceDecisionId: decision.id,
    sourceTitle: decision.title,
    choice: resolution.choice,
    reasoning: resolution.reasoning,
    decidedBy: resolution.decidedBy,
    daysAgo: resolution.daysAgo,
  };
}

/** Lands a Precedent at the top of a sibling's Evidence. Pure — returns the updated sibling. */
export function landPrecedent(sibling: Decision, precedent: Precedent): Decision {
  return {
    ...sibling,
    evidence: {
      ...sibling.evidence,
      precedents: [precedent, ...sibling.evidence.precedents.filter((p) => p.sourceDecisionId !== precedent.sourceDecisionId)],
    },
  };
}

/** Swaps the distilled text into a sibling's matching Precedent. Pure — returns the updated sibling, or the sibling unchanged if no matching Precedent. */
export function distillPrecedentText(sibling: Decision, sourceDecisionId: string, distilled: string, engine: string): Decision {
  let found = false;
  const precedents = sibling.evidence.precedents.map((precedent) => {
    if (precedent.sourceDecisionId !== sourceDecisionId) return precedent;
    found = true;
    return { ...precedent, reasoning: distilled, distilledBy: engine };
  });

  if (!found) return sibling;
  return { ...sibling, evidence: { ...sibling.evidence, precedents } };
}
