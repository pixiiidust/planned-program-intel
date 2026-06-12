import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';

const MIGRATIONS_DIR = fileURLToPath(new URL('../../migrations/', import.meta.url));

export async function runMigrations(pool: Pool): Promise<string[]> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith('.sql')).sort();
  const appliedThisRun: string[] = [];
  const client = await pool.connect();
  let locked = false;

  try {
    await client.query('select pg_advisory_lock(819472)');
    locked = true;
    await client.query(
      'create table if not exists schema_migrations (version text primary key, applied_at timestamptz not null default now())',
    );
    const applied = await client.query<{ version: string }>('select version from schema_migrations');
    const appliedVersions = new Set(applied.rows.map((row: { version: string }) => row.version));

    for (const file of files) {
      if (appliedVersions.has(file)) continue;

      const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
      try {
        await client.query('begin');
        await client.query(sql);
        await client.query('insert into schema_migrations (version) values ($1)', [file]);
        await client.query('commit');
        appliedThisRun.push(file);
      } catch (error) {
        await client.query('rollback');
        throw error;
      }
    }
  } finally {
    try {
      if (locked) await client.query('select pg_advisory_unlock(819472)');
    } finally {
      client.release();
    }
  }

  return appliedThisRun;
}
