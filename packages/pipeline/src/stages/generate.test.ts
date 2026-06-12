import { describe, expect, it } from 'vitest';
import { SIGNAL_TYPES } from '@ppi/domain';
import { FAMILIES, familyIdForCaseShape } from './families.js';
import { generateCases } from './generate.js';

describe('generateCases', () => {
  it('is deterministic for the fixed seed', () => {
    expect(generateCases()).toEqual(generateCases());
  });

  it('writes the synthetic corpus shape without outcomes', () => {
    const cases = generateCases();

    expect(cases).toHaveLength(300);
    expect(cases[0]?.id).toBe('gc-001');
    expect(cases.at(-1)?.id).toBe('gc-300');
    expect(cases.some((c) => Object.hasOwn(c, 'outcome'))).toBe(false);
    expect(cases.every((c) => c.signalType && c.approach && c.record && c.problem)).toBe(true);
  });

  it('represents every family, approach, and Signal type', () => {
    const cases = generateCases();
    const signals = new Set(cases.map((c) => c.signalType));

    expect(signals).toEqual(new Set(SIGNAL_TYPES));
    for (const family of FAMILIES) {
      const familyCases = cases.filter((c) => familyIdForCaseShape(c) === family.id);
      expect(familyCases).toHaveLength(family.count);
      for (const approach of family.approaches) {
        expect(familyCases.some((c) => c.approach === approach.id)).toBe(true);
      }
    }
  });
});
