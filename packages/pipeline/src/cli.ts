// The build-time intelligence pipeline CLI (ADR-0004). Stages so far:
//   generate - synthesize demo-only corpus proposal cases with deterministic facts
//   label    - extract outcomes from generated structured facts
//   embed    — embed structured composites locally, write the two tables
//   emit     — join inputs + tables into the versioned SeedBundle (validates first)
//   validate — re-check the emitted bundle against the domain contracts (CI)
// Runs with no API key: embeddings come from a local open-source model.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Decision, SeedBundle } from '@ppi/domain';
import { validateSeedBundle } from '@ppi/domain';
import type { CorpusCase, GeneratedCorpusCase, LabelledCorpusCase } from './corpus.js';
import { createTransformersEmbedder, EMBEDDING_MODEL } from './embedder.js';
import {
  CASE_TABLE_PATH,
  CASES_PATH,
  DATA_DIR,
  DECISIONS_PATH,
  SEED_JSON_PATH,
  SEED_TS_PATH,
  SIBLING_TABLE_PATH,
} from './paths.js';
import { runEmbed } from './stages/embed.js';
import { assembleBundle, renderSeedTs } from './stages/emit.js';
import { FAMILIES, familyIdForCaseShape, type FamilyId } from './stages/families.js';
import { generateCases } from './stages/generate.js';
import { labelCases } from './stages/label.js';
import type { SimilarityTable } from './tables.js';

const GENERATED_CASES_PATH = join(DATA_DIR, 'proposals/generated-cases.json');
const LABELLED_CASES_PATH = join(DATA_DIR, 'proposals/labelled-cases.json');

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
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

function emit(): void {
  const decisions = readJson<Decision[]>(DECISIONS_PATH);
  const cases = readJson<CorpusCase[]>(CASES_PATH);
  const caseTable = readJson<SimilarityTable>(CASE_TABLE_PATH);
  const siblingTable = readJson<SimilarityTable>(SIBLING_TABLE_PATH);
  const bundle = assembleBundle(decisions, cases, caseTable, siblingTable);
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

const stage = process.argv[2];
switch (stage) {
  case 'generate':
    generate();
    break;
  case 'label':
    label();
    break;
  case 'embed':
    await embed();
    break;
  case 'emit':
    emit();
    break;
  case 'validate':
    validate();
    break;
  default:
    console.error('Usage: pipeline <generate|label|embed|emit|validate>');
    process.exit(1);
}
