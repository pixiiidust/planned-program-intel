import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = join(here, '../data');
export const DECISIONS_PATH = join(DATA_DIR, 'decisions.json');
export const CASES_PATH = join(DATA_DIR, 'cases.json');
export const CASE_TABLE_PATH = join(DATA_DIR, 'tables/decision-cases.json');
export const SIBLING_TABLE_PATH = join(DATA_DIR, 'tables/siblings.json');
export const SEED_JSON_PATH = join(DATA_DIR, 'seed.json');
/** The generated TS artifact the web app statically imports. */
export const SEED_TS_PATH = join(here, '../../adapters/src/demo/seed.ts');
