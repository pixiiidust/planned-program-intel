// Reviewer's path to a built schema. CI and the contract suite run the same
// function programmatically.
import pg from 'pg';
import { runMigrations } from './runMigrations.js';

const { Pool } = pg;
const DEFAULT_URL = 'postgres://ppi:ppi@localhost:5499/ppi';
const url = process.env.PPI_PG_URL;

if (!url) {
  console.error(`Set PPI_PG_URL (docker-compose default: ${DEFAULT_URL})`);
  process.exit(1);
}

const pool = new Pool({ connectionString: url });

try {
  const applied = await runMigrations(pool);
  console.log(applied.length > 0 ? `applied migrations: ${applied.join(', ')}` : 'schema already current');
} finally {
  await pool.end();
}
