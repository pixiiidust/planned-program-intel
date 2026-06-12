import { afterAll, beforeAll, describe, it } from 'vitest';
import pg from 'pg';
import { describeDecisionRepositoryContract, type RepositoryHarness } from '../persistence/decisionRepositoryContract.js';
import { PostgresDecisionRepository } from './postgresRepository.js';
import { runMigrations } from './runMigrations.js';

const { Pool } = pg;
const url = process.env.PPI_PG_URL;

if (!url) {
  describe.skip('PostgresDecisionRepository satisfies the DecisionRepository contract (set PPI_PG_URL - see docker-compose.yml)', () => {
    it('skipped without a database', () => {});
  });
} else {
  const pool = new Pool({ connectionString: url });

  beforeAll(async () => {
    await runMigrations(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  const harness: RepositoryHarness = {
    async create(seed) {
      return new PostgresDecisionRepository(pool, seed);
    },
    async wipe() {
      await pool.query('truncate decisions, meta');
    },
  };

  describeDecisionRepositoryContract('PostgresDecisionRepository', harness);
}
