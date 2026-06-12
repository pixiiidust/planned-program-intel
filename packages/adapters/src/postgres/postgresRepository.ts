// Postgres adapter for the persistence port (ADR-0001). Never hosted, never
// imported by the web app; schema is built by the migrations directory.
import type { Decision, DecisionRepository, LoadResult, SeedBundle } from '@ppi/domain';
import type { Pool, PoolClient } from 'pg';
import { inSeedOrder } from '../persistence/seedOrder.js';

export class PostgresDecisionRepository implements DecisionRepository {
  constructor(
    private readonly pool: Pool,
    private readonly seed: SeedBundle,
  ) {}

  async load(): Promise<LoadResult> {
    const client = await this.pool.connect();
    try {
      const meta = await client.query<{ value: string }>('select value from meta where key = $1', ['seedVersion']);
      const stored = meta.rows[0]?.value;

      if (stored === this.seed.seedVersion) {
        const rows = await client.query<{ body: Decision }>('select body from decisions');
        return { decisions: inSeedOrder(this.seed, rows.rows.map((row: { body: Decision }) => row.body)), reseeded: false };
      }

      await this.writeSeed(client);
      // First visit seeds silently; a version mismatch is a visible reseed.
      return { decisions: this.seed.decisions, reseeded: stored !== undefined };
    } finally {
      client.release();
    }
  }

  async save(decision: Decision): Promise<void> {
    await this.pool.query('insert into decisions (id, body) values ($1, $2::jsonb) on conflict (id) do update set body = excluded.body', [
      decision.id,
      JSON.stringify(decision),
    ]);
  }

  async reset(): Promise<Decision[]> {
    const client = await this.pool.connect();
    try {
      await this.writeSeed(client);
      return this.seed.decisions;
    } finally {
      client.release();
    }
  }

  private async writeSeed(client: PoolClient): Promise<void> {
    try {
      await client.query('begin');
      await client.query('delete from decisions');
      for (const decision of this.seed.decisions) {
        await client.query('insert into decisions (id, body) values ($1, $2::jsonb)', [decision.id, JSON.stringify(decision)]);
      }
      await client.query(
        'insert into meta (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value',
        ['seedVersion', this.seed.seedVersion],
      );
      await client.query('commit');
    } catch (error) {
      await client.query('rollback');
      throw error;
    }
  }
}
