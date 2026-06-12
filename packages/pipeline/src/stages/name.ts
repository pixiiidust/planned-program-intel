import type { AiJsonRequest, AiPort, Decision } from '@ppi/domain';
import { createCannedAi } from '@ppi/adapters';
import type { CorpusCase } from '../corpus.js';
import type { DecisionIntelligence, ExceptionFinding, PatternCluster } from './cluster.js';

export interface DecisionNarration {
  decisionId: string;
  /** Track-record basis sentence (no numbers; code injects the figures around it). */
  basis: string;
  /** Parallel to intelligence patterns, same order. */
  patterns: { approach: string; title: string; takeaway: string }[];
  /** Parallel to intelligence exceptions, same order. */
  exceptions: { id: string; whyItMattersNow: string }[];
}

export interface NarrationLogger {
  warn(message: string): void;
}

type PatternNarration = { title: string; takeaway: string };
type ExceptionNarration = { whyItMattersNow: string };
type TrackBasis = { basis: string };

const DIGIT_RE = /[0-9]/;

const PATTERN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'takeaway'],
  properties: {
    title: { type: 'string' },
    takeaway: { type: 'string' },
  },
} satisfies Record<string, unknown>;

const EXCEPTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['whyItMattersNow'],
  properties: {
    whyItMattersNow: { type: 'string' },
  },
} satisfies Record<string, unknown>;

const BASIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['basis'],
  properties: {
    basis: { type: 'string' },
  },
} satisfies Record<string, unknown>;

const PATTERN_INSTRUCTION =
  'Name the approach as an imperative play of no more than nine words and write a one-sentence takeaway of when or why this play works or fails. Ground the text only in the structured input. Use no digits, numerals, or percentages.';

const EXCEPTION_INSTRUCTION =
  'Write one sentence on why this subgroup matters for this specific decision now. Use no digits or numerals.';

const BASIS_INSTRUCTION =
  'Write a noun phrase of no more than twelve words, starting lowercase, describing what the similar-case set consists of. Use no digits or numerals.';

export async function buildNarration(
  decisions: readonly Decision[],
  cases: readonly CorpusCase[],
  intelligence: readonly DecisionIntelligence[],
  ai: AiPort,
  logger: NarrationLogger = console,
): Promise<DecisionNarration[]> {
  const canned = createCannedAi();
  const caseById = new Map(cases.map((corpusCase) => [corpusCase.id, corpusCase]));
  const intelligenceByDecision = indexByDecisionId(intelligence, 'intelligence');
  const narration: DecisionNarration[] = [];

  for (const decision of decisions) {
    const proposal = intelligenceByDecision.get(decision.id);
    if (!proposal) throw new Error(`name stage missing intelligence for decision ${decision.id}`);

    const patterns: DecisionNarration['patterns'] = [];
    for (const cluster of proposal.patterns) {
      const exemplar = caseById.get(cluster.exemplarCaseId);
      if (!exemplar) throw new Error(`decision ${decision.id}: exemplar case ${cluster.exemplarCaseId} not in the corpus`);
      const request = patternRequest(decision, cluster, exemplar);
      const text = await generateOrCanned<PatternNarration>(ai, canned, request, ['title', 'takeaway'], decision.id, logger);
      patterns.push({ approach: cluster.approach, title: text.title, takeaway: text.takeaway });
    }

    const exceptions: DecisionNarration['exceptions'] = [];
    for (const finding of proposal.exceptions) {
      const request = exceptionRequest(decision, finding);
      const text = await generateOrCanned<ExceptionNarration>(ai, canned, request, ['whyItMattersNow'], decision.id, logger);
      exceptions.push({ id: finding.id, whyItMattersNow: text.whyItMattersNow });
    }

    const basisRequest = trackBasisRequest(decision, proposal.patterns);
    const { basis } = await generateOrCanned<TrackBasis>(ai, canned, basisRequest, ['basis'], decision.id, logger);
    narration.push({ decisionId: decision.id, basis, patterns, exceptions });
  }

  return narration;
}

function patternRequest(decision: Decision, cluster: PatternCluster, exemplar: CorpusCase): AiJsonRequest {
  return {
    task: 'pattern.narrate',
    instruction: PATTERN_INSTRUCTION,
    input: {
      approachId: cluster.approach,
      decisionType: decision.type,
      situationTitle: decision.title,
      situationProblem: decision.problem,
      clusterOutcome: cluster.outcome,
      exemplar: { event: exemplar.event, tags: exemplar.tags },
    },
    schema: PATTERN_SCHEMA,
  };
}

function exceptionRequest(decision: Decision, finding: ExceptionFinding): AiJsonRequest {
  const input = {
    label: finding.label,
    decisionType: decision.type,
    situationTitle: decision.title,
    situationProblem: decision.problem,
    whatsDifferent: decision.whatsDifferent.map((item) => item.change),
    ...(finding.metric
      ? {
          metric: {
            label: finding.metric.label,
            unit: finding.metric.unit,
            direction: metricDirection(finding.metric),
          },
        }
      : { direction: exceptionDirection(finding) }),
  };

  return {
    task: 'exception.narrate',
    instruction: EXCEPTION_INSTRUCTION,
    input,
    schema: EXCEPTION_SCHEMA,
  };
}

function trackBasisRequest(decision: Decision, patterns: readonly PatternCluster[]): AiJsonRequest {
  return {
    task: 'track.basis',
    instruction: BASIS_INSTRUCTION,
    input: {
      decisionType: decision.type,
      situationTitle: decision.title,
      signalType: decision.signalType,
      dominantApproaches: patterns.map((pattern) => pattern.approach),
    },
    schema: BASIS_SCHEMA,
  };
}

function exceptionDirection(finding: ExceptionFinding): 'underperforms' | 'outperforms' {
  const parentRate = finding.parentTotal === 0 ? 0 : finding.parentWorked / finding.parentTotal;
  const subgroupRate = finding.size === 0 ? 0 : finding.worked / finding.size;
  return subgroupRate < parentRate ? 'underperforms' : 'outperforms';
}

function metricDirection(metric: NonNullable<ExceptionFinding['metric']>): 'higher' | 'lower' {
  return metric.subgroupMean > metric.complementMean ? 'higher' : 'lower';
}

async function generateOrCanned<T extends Record<string, string>>(
  ai: AiPort,
  canned: AiPort,
  request: AiJsonRequest,
  requiredKeys: readonly (keyof T & string)[],
  decisionId: string,
  logger: NarrationLogger,
): Promise<T> {
  try {
    return validateTextObject<T>(await ai.generateJson(request), requiredKeys);
  } catch (error) {
    logger.warn(`name fallback for ${decisionId} ${request.task}: ${oneLine(error)}`);
    return validateTextObject<T>(await canned.generateJson(request), requiredKeys);
  }
}

function validateTextObject<T extends Record<string, string>>(value: unknown, requiredKeys: readonly (keyof T & string)[]): T {
  if (!isRecord(value)) throw new Error('response must be an object');
  const allowed = new Set(requiredKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`response has unexpected property "${key}"`);
  }

  const output: Partial<T> = {};
  for (const key of requiredKeys) {
    const text = value[key];
    if (typeof text !== 'string' || text.trim().length === 0) throw new Error(`response.${key} must be a non-empty string`);
    if (DIGIT_RE.test(text)) throw new Error(`response.${key} contains digits`);
    output[key as keyof T] = text.trim() as T[keyof T];
  }
  return output as T;
}

function indexByDecisionId<T extends { decisionId: string }>(items: readonly T[], label: string): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    if (map.has(item.decisionId)) throw new Error(`${label} contains duplicate decision ${item.decisionId}`);
    map.set(item.decisionId, item);
  }
  return map;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function oneLine(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\s+/g, ' ');
}
