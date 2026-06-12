// Stage: emit. Joins decisions, the case corpus, similarity tables, and the
// deterministic intelligence/narration proposals into the versioned SeedBundle
// the web app loads. Refuses to emit a bundle that violates the domain contracts.
import type { Case, Decision, ExceptionNote, Pattern, SeedBundle } from '@ppi/domain';
import { validateSeedBundle } from '@ppi/domain';
import type { CorpusCase } from '../corpus.js';
import { dedupeBy } from '../rank.js';
import { CASE_PARAMS, type SimilarityTable } from '../tables.js';
import { INTELLIGENCE_PARAMS, similarMembers, type DecisionIntelligence, type ExceptionFinding, type PatternCluster } from './cluster.js';
import type { DecisionNarration } from './name.js';

/** Bumped whenever emitted content changes shape or meaning - the IndexedDB adapter reseeds on mismatch. */
export const SEED_VERSION = 'seed-v2.1-simulated-feed';
export const FEED_DECISION_IDS: readonly string[] = ['d21'];

export function assembleBundle(
  decisions: Decision[],
  cases: CorpusCase[],
  caseTable: SimilarityTable,
  siblingTable: SimilarityTable,
  intelligence: DecisionIntelligence[],
  narration: DecisionNarration[],
  seedVersion: string = SEED_VERSION,
  feedIds: readonly string[] = FEED_DECISION_IDS,
): SeedBundle {
  const caseById = new Map(cases.map((c) => [c.id, c]));
  const intelligenceByDecision = indexByDecisionId(intelligence, 'intelligence proposal');
  const narrationByDecision = indexByDecisionId(narration, 'narration proposal');

  const withEvidence = decisions.map((d): Decision => {
    const proposal = requireDecision(intelligenceByDecision, d.id, 'intelligence proposal');
    const narrationItem = requireDecision(narrationByDecision, d.id, 'narration proposal');
    assertParallelNarration(d.id, proposal, narrationItem);

    const patternApproaches = proposal.patterns.map((pattern) => pattern.approach);
    const memberRows = similarMembers(d, caseById, caseTable.rows[d.id] ?? [], INTELLIGENCE_PARAMS).map(({ corpusCase, score }) => ({
      id: corpusCase.id,
      score,
    }));
    const ranked = dedupeBy(memberRows, (id) => caseById.get(id)?.event ?? id).slice(0, CASE_PARAMS.k);
    const evidenceCases = ranked.map(({ id, score }): Case => {
      const c = caseById.get(id);
      if (!c) throw new Error(`decision ${d.id}: ranked case ${id} not in the corpus`);
      const patternIndex = c.approach ? patternApproaches.indexOf(c.approach) : -1;
      return {
        event: c.event,
        when: c.when,
        similarity: score,
        outcome: c.outcome,
        ...(patternIndex >= 0 ? { patternIndex } : {}),
        detail: c.detail,
        tags: c.tags,
      };
    });

    return {
      ...d,
      recommendation: {
        ...d.recommendation,
        track: { worked: proposal.workedCount, total: proposal.caseCount, basis: narrationItem.basis },
      },
      evidence: {
        ...d.evidence,
        caseCount: proposal.caseCount,
        workedCount: proposal.workedCount,
        patterns: proposal.patterns.map((pattern, index) =>
          emitPattern(d.id, pattern, narrationItem.patterns[index]!, proposal, caseById),
        ),
        exceptions: proposal.exceptions.map((finding, index) => emitException(finding, narrationItem.exceptions[index]!)),
        cases: evidenceCases,
        precedents: [],
      },
    };
  });

  const siblings: SeedBundle['siblings'] = {};
  for (const [id, scored] of Object.entries(siblingTable.rows)) {
    if (scored.length > 0) siblings[id] = scored.map((s) => s.id);
  }

  const feedIdSet = new Set(feedIds);
  const feedDecisions = withEvidence.filter((d) => feedIdSet.has(d.id));
  const decisionsWithoutFeed = withEvidence.filter((d) => !feedIdSet.has(d.id));

  const bundle: SeedBundle = {
    seedVersion,
    decisions: decisionsWithoutFeed,
    ...(feedDecisions.length > 0 ? { feedDecisions } : {}),
    siblings,
  };
  const violations = validateSeedBundle(bundle);
  if (violations.length > 0) {
    throw new Error(`refusing to emit a seed bundle that violates the domain contracts:\n${violations.join('\n')}`);
  }
  return bundle;
}

function emitPattern(
  decisionId: string,
  cluster: PatternCluster,
  narration: DecisionNarration['patterns'][number],
  proposal: DecisionIntelligence,
  caseById: ReadonlyMap<string, CorpusCase>,
): Pattern {
  const exemplar = caseById.get(cluster.exemplarCaseId);
  if (!exemplar) throw new Error(`decision ${decisionId}: exemplar case ${cluster.exemplarCaseId} not in the corpus`);
  const failures = proposal.caseCount - proposal.workedCount;
  return {
    outcome: cluster.outcome,
    title: narration.title,
    count:
      cluster.outcome === 'worked'
        ? `${cluster.worked} of the ${proposal.workedCount} successes`
        : `${cluster.failed} of the ${failures} failures`,
    example: { event: exemplar.event, detail: exemplar.detail },
    takeaway: narration.takeaway,
  };
}

function emitException(finding: ExceptionFinding, narration: DecisionNarration['exceptions'][number]): ExceptionNote {
  const parentRate = finding.parentTotal === 0 ? 0 : finding.parentWorked / finding.parentTotal;
  const lead = finding.metric
    ? `${capitalizeFirst(finding.metric.label)} averaged ${formatMean(finding.metric.subgroupMean)} ${finding.metric.unit} vs ${formatMean(
        finding.metric.complementMean,
      )} across the rest of the similar set.`
    : `Worked ${finding.worked} of ${finding.size} vs ${Math.round(parentRate * 100)}% across the similar set.`;
  return {
    title: `${finding.label} (${finding.size} cases)`,
    detail: `${lead} ${narration.whyItMattersNow}`,
  };
}

function capitalizeFirst(value: string): string {
  return value.length === 0 ? value : value[0]!.toUpperCase() + value.slice(1);
}

function formatMean(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function assertParallelNarration(decisionId: string, intelligence: DecisionIntelligence, narration: DecisionNarration): void {
  if (intelligence.patterns.length !== narration.patterns.length) {
    throw new Error(`decision ${decisionId}: narration patterns do not cover intelligence patterns`);
  }
  intelligence.patterns.forEach((pattern, index) => {
    const text = narration.patterns[index];
    if (!text || text.approach !== pattern.approach) {
      throw new Error(`decision ${decisionId}: narration pattern ${index} does not match intelligence approach ${pattern.approach}`);
    }
  });

  if (intelligence.exceptions.length !== narration.exceptions.length) {
    throw new Error(`decision ${decisionId}: narration exceptions do not cover intelligence exceptions`);
  }
  intelligence.exceptions.forEach((finding, index) => {
    const text = narration.exceptions[index];
    if (!text || text.id !== finding.id) {
      throw new Error(`decision ${decisionId}: narration exception ${index} does not match intelligence exception ${finding.id}`);
    }
  });
}

function indexByDecisionId<T extends { decisionId: string }>(items: readonly T[], label: string): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    if (map.has(item.decisionId)) throw new Error(`${label} contains duplicate decision ${item.decisionId}`);
    map.set(item.decisionId, item);
  }
  return map;
}

function requireDecision<T>(items: ReadonlyMap<string, T>, decisionId: string, label: string): T {
  const item = items.get(decisionId);
  if (!item) throw new Error(`${label} does not cover decision ${decisionId}`);
  return item;
}

export function renderSeedTs(bundle: SeedBundle): string {
  return `// GENERATED by @ppi/pipeline (emit stage) - do not edit by hand.
// Inputs and tables live in packages/pipeline/data/; regenerate with
// \`npm run -w @ppi/pipeline embed && npm run -w @ppi/pipeline cluster && npm run -w @ppi/pipeline name && npm run -w @ppi/pipeline emit\`.
import type { SeedBundle } from '@ppi/domain';

export const SEED = ${JSON.stringify(bundle, null, 2)} satisfies SeedBundle;
`;
}
