// IndexedDB demo adapter for the persistence port. Resolutions survive
// reloads — the Decided tab is the proof. Schema evolution is deliberately
// nuke-and-reseed on a seed-version mismatch (no IndexedDB migrations);
// migration discipline is demonstrated in the Postgres adapter instead.
import type { Decision, DecisionRepository, LoadResult, SeedBundle } from '@ppi/domain';
import { SEED } from './seed.js';

const DB_NAME = 'ppi-demo';
const DB_VERSION = 1;
const DECISIONS = 'decisions';
const META = 'meta';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DECISIONS)) db.createObjectStore(DECISIONS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

export class IndexedDbDecisionRepository implements DecisionRepository {
  constructor(private readonly seed: SeedBundle = SEED) {}

  async load(): Promise<LoadResult> {
    const db = await openDb();
    try {
      const stored = await request<{ key: string; value: string } | undefined>(
        db.transaction(META).objectStore(META).get('seedVersion'),
      );
      if (stored?.value === this.seed.seedVersion) {
        const decisions = await request<Decision[]>(db.transaction(DECISIONS).objectStore(DECISIONS).getAll());
        return { decisions: this.inSeedOrder(decisions), reseeded: false };
      }
      await this.writeSeed(db);
      // First visit seeds silently; a version mismatch is a visible reseed.
      return { decisions: this.seed.decisions, reseeded: stored !== undefined };
    } finally {
      db.close();
    }
  }

  async save(decision: Decision): Promise<void> {
    const db = await openDb();
    try {
      const tx = db.transaction(DECISIONS, 'readwrite');
      tx.objectStore(DECISIONS).put(decision);
      await done(tx);
    } finally {
      db.close();
    }
  }

  async reset(): Promise<Decision[]> {
    const db = await openDb();
    try {
      await this.writeSeed(db);
      return this.seed.decisions;
    } finally {
      db.close();
    }
  }

  private async writeSeed(db: IDBDatabase): Promise<void> {
    const tx = db.transaction([DECISIONS, META], 'readwrite');
    tx.objectStore(DECISIONS).clear();
    for (const d of this.seed.decisions) tx.objectStore(DECISIONS).put(d);
    tx.objectStore(META).clear();
    tx.objectStore(META).put({ key: 'seedVersion', value: this.seed.seedVersion });
    await done(tx);
  }

  /** getAll returns key order; the queue expects seed order. */
  private inSeedOrder(decisions: Decision[]): Decision[] {
    const rank = new Map(this.seed.decisions.map((d, i) => [d.id, i]));
    return [...decisions].sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER));
  }
}
