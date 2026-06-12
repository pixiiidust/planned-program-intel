import { expect, it } from 'vitest';
import { validateSeedBundle } from '@ppi/domain';
import { SEED } from './seed.js';

// ADR-0004: the checked-in seed artifact is pipeline output; CI fails the
// build if it ever violates the domain contracts.
it('the emitted seed bundle honors the domain contracts', () => {
  expect(validateSeedBundle(SEED)).toEqual([]);
});
