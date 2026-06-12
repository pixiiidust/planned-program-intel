// The build-time intelligence pipeline CLI (ADR-0004). Stages so far:
//   generate - synthesize demo-only corpus proposal cases with deterministic facts
//   label    - extract outcomes from generated structured facts
//   promote  - promote labelled proposal cases into the pipeline case input
//   embed    - embed structured composites locally, write the two tables
//   cluster  - derive deterministic intelligence proposal counts/patterns/exceptions
//   name     - add model/canned narration to deterministic intelligence
//   emit     - join inputs + tables into the versioned SeedBundle (validates first)
//   validate - re-check the emitted bundle against the domain contracts (CI)
// Runs with no API key: embeddings come from a local open-source model.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { AiPort, Decision, SeedBundle } from '@ppi/domain';
import { validateSeedBundle } from '@ppi/domain';
import { createAnthropicAi, createCannedAi, createOllamaAi, createOpenRouterAi } from '@ppi/adapters';
import type { CorpusCase, GeneratedCorpusCase, LabelledCorpusCase } from './corpus.js';
import { createTransformersEmbedder, EMBEDDING_MODEL } from './embedder.js';
import { loadRepoEnv } from './env.js';
import {
  CASE_TABLE_PATH,
  CASES_PATH,
  DECISIONS_PATH,
  GENERATED_CASES_PATH,
  INTELLIGENCE_PROPOSAL_PATH,
  LABELLED_CASES_PATH,
  NARRATION_PROPOSAL_PATH,
  SEED_JSON_PATH,
  SEED_TS_PATH,
  SIBLING_TABLE_PATH,
} from './paths.js';
import { runEmbed } from './stages/embed.js';
import { assembleBundle, renderSeedTs } from './stages/emit.js';
import { FAMILIES, familyIdForCaseShape, type FamilyId } from './stages/families.js';
import { generateCases } from './stages/generate.js';
import { labelCases } from './stages/label.js';
import { buildIntelligence, INTELLIGENCE_PARAMS, type DecisionIntelligence } from './stages/cluster.js';
import { buildNarration, type DecisionNarration } from './stages/name.js';
import type { SimilarityTable } from './tables.js';

type AiEngine = 'canned' | 'openrouter' | 'ollama' | 'anthropic';

function readJson<T>(path: string, label = 'JSON input'): T {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') throw new Error(`Missing ${label}: ${path}`);
    throw error;
  }
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function generate(): void {
  const cases = generateCases();
  writeJson(GENERATED_CASES_PATH, cases);
  console.log(`Wrote ${GENERATED_CASES_PATH} (${cases.length} cases)`);
  printFamilyCounts(cases);
}

function label(): void {
  const cases = readJson<GeneratedCorpusCase[]>(GENERATED_CASES_PATH);
  const labelled = labelCases(cases);
  writeJson(LABELLED_CASES_PATH, labelled);
  const worked = labelled.filter((c) => c.outcome === 'worked').length;
  const failed = labelled.length - worked;
  console.log(`Wrote ${LABELLED_CASES_PATH} (${labelled.length} cases)`);
  printFamilyCounts(labelled);
  console.log(`Outcomes: ${worked} worked, ${failed} failed`);
}

function promote(): void {
  const text = readFileSync(LABELLED_CASES_PATH, 'utf8');
  const cases = JSON.parse(text) as LabelledCorpusCase[];
  mkdirSync(dirname(CASES_PATH), { recursive: true });
  writeFileSync(CASES_PATH, text, 'utf8');
  const worked = cases.filter((c) => c.outcome === 'worked').length;
  const failed = cases.length - worked;
  console.log(`Promoted ${cases.length} cases to ${CASES_PATH} (${worked} worked, ${failed} failed)`);
}

async function embed(): Promise<void> {
  const decisions = readJson<Decision[]>(DECISIONS_PATH);
  const cases = readJson<CorpusCase[]>(CASES_PATH);
  console.log(`Embedding ${decisions.length} decisions + ${cases.length} cases with ${EMBEDDING_MODEL}…`);
  const embedder = await createTransformersEmbedder();
  const { caseTable, siblingTable } = await runEmbed(decisions, cases, embedder, EMBEDDING_MODEL);
  writeJson(CASE_TABLE_PATH, caseTable);
  writeJson(SIBLING_TABLE_PATH, siblingTable);
  const siblingCount = Object.values(siblingTable.rows).filter((r) => r.length > 0).length;
  console.log(`Wrote ${CASE_TABLE_PATH}`);
  console.log(`Wrote ${SIBLING_TABLE_PATH} (${siblingCount} of ${decisions.length} decisions have siblings)`);
}

function cluster(): void {
  const decisions = readJson<Decision[]>(DECISIONS_PATH);
  const cases = readJson<CorpusCase[]>(CASES_PATH);
  const caseTable = readJson<SimilarityTable>(CASE_TABLE_PATH);
  const intelligence = buildIntelligence(decisions, cases, caseTable, INTELLIGENCE_PARAMS);
  writeJson(INTELLIGENCE_PROPOSAL_PATH, intelligence);
  console.log(`Wrote ${INTELLIGENCE_PROPOSAL_PATH} (${intelligence.length} decisions)`);
}

async function name(args: readonly string[]): Promise<void> {
  loadRepoEnv();
  const { engine, model } = parseNameOptions(args);
  const ai = createAi(engine, model);
  const decisions = readJson<Decision[]>(DECISIONS_PATH);
  const cases = readJson<CorpusCase[]>(CASES_PATH);
  const intelligence = readJson<DecisionIntelligence[]>(INTELLIGENCE_PROPOSAL_PATH);
  const narration = await buildNarration(decisions, cases, intelligence, ai);
  writeJson(NARRATION_PROPOSAL_PATH, narration);
  console.log(`Wrote ${NARRATION_PROPOSAL_PATH} (${narration.length} decisions, engine ${engine})`);
}

function emit(): void {
  const decisions = readJson<Decision[]>(DECISIONS_PATH);
  const cases = readJson<CorpusCase[]>(CASES_PATH);
  const caseTable = readJson<SimilarityTable>(CASE_TABLE_PATH);
  const siblingTable = readJson<SimilarityTable>(SIBLING_TABLE_PATH);
  const intelligence = readJson<DecisionIntelligence[]>(INTELLIGENCE_PROPOSAL_PATH, 'intelligence proposal');
  const narration = readJson<DecisionNarration[]>(NARRATION_PROPOSAL_PATH, 'narration proposal');
  const bundle = assembleBundle(decisions, cases, caseTable, siblingTable, intelligence, narration);
  writeJson(SEED_JSON_PATH, bundle);
  writeFileSync(SEED_TS_PATH, renderSeedTs(bundle), 'utf8');
  console.log(`Wrote ${SEED_JSON_PATH}`);
  console.log(`Wrote ${SEED_TS_PATH} (${bundle.seedVersion}: ${bundle.decisions.length} decisions, ${Object.keys(bundle.siblings).length} sibling entries)`);
}

function validate(): void {
  const bundle = readJson<SeedBundle>(SEED_JSON_PATH);
  const violations = validateSeedBundle(bundle);
  if (violations.length > 0) {
    console.error(`Seed bundle ${bundle.seedVersion} violates the domain contracts:`);
    for (const v of violations) console.error(`  - ${v}`);
    process.exit(1);
  }
  console.log(`Seed bundle ${bundle.seedVersion} honors the domain contracts (${bundle.decisions.length} decisions).`);
}

function printFamilyCounts(cases: readonly (GeneratedCorpusCase | LabelledCorpusCase)[]): void {
  const counts = familyCounts(cases);
  for (const family of FAMILIES) console.log(`  ${family.id}: ${counts[family.id]}`);
}

function familyCounts(cases: readonly (GeneratedCorpusCase | LabelledCorpusCase)[]): Record<FamilyId, number> {
  const counts = Object.fromEntries(FAMILIES.map((family) => [family.id, 0])) as Record<FamilyId, number>;
  for (const corpusCase of cases) {
    const familyId = familyIdForCaseShape(corpusCase);
    if (familyId) counts[familyId] += 1;
  }
  return counts;
}

function parseNameOptions(args: readonly string[]): { engine: AiEngine; model?: string } {
  let engine: AiEngine = 'canned';
  let model: string | undefined;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    switch (arg) {
      case '--engine': {
        const value = args[++i];
        if (!isAiEngine(value)) die(`Unknown AI engine "${value ?? ''}". Use canned, openrouter, ollama, or anthropic.`);
        engine = value;
        break;
      }
      case '--model': {
        const value = args[++i];
        if (!value) die('Missing value for --model.');
        model = value;
        break;
      }
      default:
        die(`Unknown option "${arg}". Usage: pipeline name [--engine canned|openrouter|ollama|anthropic] [--model <id>]`);
    }
  }
  return { engine, model };
}

function createAi(engine: AiEngine, model: string | undefined): AiPort {
  switch (engine) {
    case 'canned':
      return createCannedAi();
    case 'openrouter': {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) die('OPENROUTER_API_KEY is required for --engine openrouter; add it to repo-root .env or export it.');
      return createOpenRouterAi({ apiKey, ...(model ? { model } : {}) });
    }
    case 'ollama':
      return createOllamaAi({ ...(process.env.OLLAMA_ENDPOINT ? { endpoint: process.env.OLLAMA_ENDPOINT } : {}), ...(model ? { model } : {}) });
    case 'anthropic': {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) die('ANTHROPIC_API_KEY is required for --engine anthropic; add it to repo-root .env or export it.');
      return createAnthropicAi({ apiKey, ...(model ? { model } : {}) });
    }
  }
}

function isAiEngine(value: string | undefined): value is AiEngine {
  return value === 'canned' || value === 'openrouter' || value === 'ollama' || value === 'anthropic';
}

function die(message: string): never {
  console.error(message);
  process.exit(1);
}

const stage = process.argv[2];
switch (stage) {
  case 'generate':
    generate();
    break;
  case 'label':
    label();
    break;
  case 'promote':
    promote();
    break;
  case 'embed':
    await embed();
    break;
  case 'cluster':
    cluster();
    break;
  case 'name':
    await name(process.argv.slice(3));
    break;
  case 'emit':
    emit();
    break;
  case 'validate':
    validate();
    break;
  default:
    console.error('Usage: pipeline <generate|label|promote|embed|cluster|name|emit|validate>');
    process.exit(1);
}
