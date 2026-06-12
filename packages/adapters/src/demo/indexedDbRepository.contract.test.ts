import 'fake-indexeddb/auto';

import { describeDecisionRepositoryContract, type RepositoryHarness } from '../persistence/decisionRepositoryContract.js';
import { IndexedDbDecisionRepository } from './indexedDbRepository.js';

const harness: RepositoryHarness = {
  async create(seed) {
    return new IndexedDbDecisionRepository(seed);
  },
  async wipe() {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('ppi-demo');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('IndexedDB delete failed'));
      request.onblocked = () => resolve();
    });
  },
};

describeDecisionRepositoryContract('IndexedDbDecisionRepository', harness);
