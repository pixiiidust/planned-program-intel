import type { CaseOutcome, Decision } from '@ppi/domain';
import type { CorpusCase, CorpusRecord } from '../corpus.js';
import type { Scored } from '../rank.js';
import type { SimilarityTable } from '../tables.js';

export interface IntelligenceParams {
  memberFloor: number;
  minClusterSize: number;
  maxPatterns: number;
  exception: {
    minSize: number;
    minDivergence: number;
    metricRatioFloor: number;
    maxPerDecision: number;
  };
}

// Measured MiniLM cosine floors alone produced 0-39-member sets with heavy
// cross-family contamination (d1 top-10 = 4 same-family), so membership gates
// on structured type and uses the embedding score for ranking/noise guard.
// Exception rates measured 0.03-0.21 on real sets; government is a duration effect (legal-review ratio 2.10).
export const INTELLIGENCE_PARAMS = {
  memberFloor: 0.25,
  minClusterSize: 3,
  maxPatterns: 4,
  exception: { minSize: 3, minDivergence: 0.15, metricRatioFloor: 1.8, maxPerDecision: 2 },
} satisfies IntelligenceParams;

export interface DecisionIntelligence {
  decisionId: string;
  caseCount: number;
  workedCount: number;
  patterns: PatternCluster[];
  exceptions: ExceptionFinding[];
}

export interface PatternCluster {
  approach: string;
  outcome: CaseOutcome;
  size: number;
  worked: number;
  failed: number;
  exemplarCaseId: string;
}

export interface ExceptionFinding {
  id: string;
  label: string;
  size: number;
  worked: number;
  parentWorked: number;
  parentTotal: number;
  metric?: {
    key: string;
    label: string;
    unit: string;
    subgroupMean: number;
    complementMean: number;
  };
}

export interface SimilarMember {
  corpusCase: CorpusCase;
  score: number;
}

interface ExceptionCatalogEntry {
  id: string;
  label: string;
  predicate: (record: CorpusRecord) => boolean;
  /** Optional numeric fact whose subgroup-vs-complement mean ratio also signals an exception. */
  metric?: { key: string; label: string; unit: string };
}

interface MetricStats {
  finding: NonNullable<ExceptionFinding['metric']>;
  subgroupMean: number;
  complementMean: number;
}

const EXCEPTION_CATALOG = [
  {
    id: 'government-venue',
    label: 'Government-owned venues',
    predicate: (record) => record.venueOwnership === 'government',
    metric: { key: 'legalReviewDays', label: 'legal review', unit: 'days' },
  },
  {
    id: 'sole-source',
    label: 'Sole-source vendors',
    predicate: (record) => record.soleSource === true,
  },
  {
    id: 'inside-30-days',
    label: 'Inside 30 days out',
    predicate: (record) => typeof record.daysOut === 'number' && record.daysOut < 30,
  },
  {
    id: 'exclusivity-clause',
    label: 'Venue exclusivity clauses',
    predicate: (record) => record.vendorExclusivityClause === true,
  },
] satisfies readonly ExceptionCatalogEntry[];

export function buildIntelligence(
  decisions: readonly Decision[],
  cases: readonly CorpusCase[],
  caseTable: SimilarityTable,
  params: IntelligenceParams = INTELLIGENCE_PARAMS,
): DecisionIntelligence[] {
  const caseById = new Map(cases.map((corpusCase) => [corpusCase.id, corpusCase]));

  return decisions.map((decision) => {
    const members = similarMembers(decision, caseById, caseTable.rows[decision.id] ?? [], params);
    const workedCount = members.filter((member) => member.corpusCase.outcome === 'worked').length;

    return {
      decisionId: decision.id,
      caseCount: members.length,
      workedCount,
      patterns: buildPatterns(members, params),
      exceptions: buildExceptions(members, workedCount, params.exception),
    };
  });
}

export function similarMembers(
  decision: Pick<Decision, 'id' | 'type'>,
  caseById: ReadonlyMap<string, CorpusCase>,
  tableRow: readonly Scored[],
  params: Pick<IntelligenceParams, 'memberFloor'>,
): SimilarMember[] {
  return tableRow
    .filter((row) => row.score >= params.memberFloor)
    .map((row) => {
      const corpusCase = caseById.get(row.id);
      if (!corpusCase) throw new Error(`decision ${decision.id}: table case ${row.id} not in the corpus`);
      return { corpusCase, score: row.score };
    })
    .filter((member) => member.corpusCase.type === decision.type)
    .sort((a, b) => b.score - a.score || a.corpusCase.id.localeCompare(b.corpusCase.id));
}

function buildPatterns(members: readonly SimilarMember[], params: IntelligenceParams): PatternCluster[] {
  const byApproach = new Map<string, SimilarMember[]>();

  for (const member of members) {
    const { approach, record } = member.corpusCase;
    if (!approach || !record) continue;
    const group = byApproach.get(approach) ?? [];
    group.push(member);
    byApproach.set(approach, group);
  }

  return Array.from(byApproach.entries())
    .flatMap(([approach, group]): PatternCluster[] => {
      if (group.length < params.minClusterSize) return [];
      const worked = group.filter((member) => member.corpusCase.outcome === 'worked').length;
      const failed = group.length - worked;
      const outcome: CaseOutcome = worked / group.length >= 0.5 ? 'worked' : 'failed';
      const exemplar = group.find((member) => member.corpusCase.outcome === outcome) ?? group[0];
      if (!exemplar) return [];

      return [
        {
          approach,
          outcome,
          size: group.length,
          worked,
          failed,
          exemplarCaseId: exemplar.corpusCase.id,
        },
      ];
    })
    .sort((a, b) => {
      const outcomeDelta = outcomeRank(a.outcome) - outcomeRank(b.outcome);
      if (outcomeDelta !== 0) return outcomeDelta;
      const strengthDelta = a.outcome === 'worked' ? b.worked - a.worked : b.failed - a.failed;
      return strengthDelta || b.size - a.size || a.approach.localeCompare(b.approach);
    })
    .slice(0, params.maxPatterns);
}

function buildExceptions(
  members: readonly SimilarMember[],
  parentWorked: number,
  params: IntelligenceParams['exception'],
): ExceptionFinding[] {
  const parentTotal = members.length;
  if (parentTotal === 0) return [];

  const parentWorkedRate = parentWorked / parentTotal;
  const candidates = EXCEPTION_CATALOG.flatMap((entry, catalogIndex) => {
    const subgroup = members.filter((member) => {
      const { record } = member.corpusCase;
      return record ? entry.predicate(record) : false;
    });
    if (subgroup.length < params.minSize) return [];

    const complement = members.filter((member) => {
      const { record } = member.corpusCase;
      return record ? !entry.predicate(record) : true;
    });
    const worked = subgroup.filter((member) => member.corpusCase.outcome === 'worked').length;
    const divergence = Math.abs(worked / subgroup.length - parentWorkedRate);
    const metric = metricStats(entry.metric, subgroup, complement);
    const ratio = metric && metric.complementMean > 0 ? metric.subgroupMean / metric.complementMean : undefined;
    const metricFired =
      ratio !== undefined &&
      complement.length >= params.minSize &&
      (ratio >= params.metricRatioFloor || ratio <= 1 / params.metricRatioFloor);
    const rateFired = divergence >= params.minDivergence;
    if (!rateFired && !metricFired) return [];
    const ratioStrength = ratio !== undefined ? (ratio >= 1 ? ratio : 1 / ratio) - 1 : 0;
    // Cap ordering uses effective strength: outcome divergence, or ratio distance from parity when the metric fired.
    const strength = metricFired ? Math.max(divergence, ratioStrength) : divergence;

    return [
      {
        id: entry.id,
        label: entry.label,
        size: subgroup.length,
        worked,
        parentWorked,
        parentTotal,
        ...(metric ? { metric: metric.finding } : {}),
        strength,
        catalogIndex,
      },
    ];
  });

  return candidates
    .sort((a, b) => b.strength - a.strength || a.catalogIndex - b.catalogIndex)
    .slice(0, params.maxPerDecision)
    .map(({ strength: _strength, catalogIndex: _catalogIndex, ...finding }) => finding);
}

function outcomeRank(outcome: CaseOutcome): number {
  return outcome === 'worked' ? 0 : 1;
}

function metricStats(
  metric: ExceptionCatalogEntry['metric'] | undefined,
  subgroup: readonly SimilarMember[],
  complement: readonly SimilarMember[],
): MetricStats | undefined {
  if (!metric) return undefined;

  const subgroupMean = meanNumericFact(subgroup, metric.key);
  const complementMean = meanNumericFact(complement, metric.key);
  if (subgroupMean === undefined || complementMean === undefined) return undefined;

  return {
    finding: {
      key: metric.key,
      label: metric.label,
      unit: metric.unit,
      subgroupMean: round1(subgroupMean),
      complementMean: round1(complementMean),
    },
    subgroupMean,
    complementMean,
  };
}

function meanNumericFact(members: readonly SimilarMember[], key: string): number | undefined {
  const values = members.flatMap((member) => {
    const value = member.corpusCase.record?.[key];
    return typeof value === 'number' ? [value] : [];
  });
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
