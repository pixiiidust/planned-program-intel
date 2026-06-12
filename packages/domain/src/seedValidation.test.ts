import { describe, expect, it } from 'vitest';
import { validateSeedBundle } from './seedValidation.js';
import { makeDecision } from './testing.js';
import type { Case, SeedBundle } from './types.js';

function makeCase(overrides: Partial<Case> = {}): Case {
  return { event: 'SKO 2025', when: '2025', similarity: 0.9, outcome: 'worked', detail: 'd', tags: [], ...overrides };
}

function bundle(overrides: Partial<SeedBundle> = {}): SeedBundle {
  return { seedVersion: 'seed-test', decisions: [makeDecision()], siblings: {}, ...overrides };
}

describe('validateSeedBundle', () => {
  it('passes a sound bundle', () => {
    expect(validateSeedBundle(bundle())).toEqual([]);
  });

  it('rejects duplicate decision ids', () => {
    const b = bundle({ decisions: [makeDecision(), makeDecision()] });
    expect(validateSeedBundle(b)).toContain('d1: duplicate decision id');
  });

  it('urgency must carry its because', () => {
    const b = bundle({ decisions: [makeDecision({ urgency: { level: 'high', because: ' ' } })] });
    expect(validateSeedBundle(b)).toContain('d1: urgency must carry its because');
  });

  it('status and resolution must agree both ways', () => {
    const noResolution = bundle({ decisions: [makeDecision({ status: 'resolved' })] });
    expect(validateSeedBundle(noResolution)).toContain('d1: resolved status and resolution must agree');

    const danglingResolution = bundle({
      decisions: [makeDecision({ resolution: { choice: 'accepted', reasoning: 'r', decidedBy: 'x', daysAgo: 0 } })],
    });
    expect(validateSeedBundle(danglingResolution)).toContain('d1: resolved status and resolution must agree');
  });

  it('blocked decisions must name their blocker', () => {
    const b = bundle({ decisions: [makeDecision({ status: 'blocked' })] });
    expect(validateSeedBundle(b)).toContain('d1: blocked decisions must name their blocker');
  });

  it('track record can never claim more worked than total', () => {
    const b = bundle({
      decisions: [makeDecision({ recommendation: { action: 'a', why: 'w', track: { worked: 6, total: 5, basis: 'b' } } })],
    });
    expect(validateSeedBundle(b)).toContain('d1: track record must have 0 ≤ worked ≤ total');
  });

  it('evidence counts and ranking are checked', () => {
    const d = makeDecision();
    d.evidence = {
      caseCount: 5,
      workedCount: 4,
      patterns: [],
      exceptions: [],
      cases: [makeCase({ similarity: 0.8 }), makeCase({ similarity: 0.9 })],
      precedents: [],
    };
    expect(validateSeedBundle(bundle({ decisions: [d] }))).toContain(
      'd1: cases must be similarity-ranked (case 1 outranks its predecessor)',
    );
  });

  it('a patternIndex must point into the patterns array', () => {
    const d = makeDecision();
    d.evidence = { caseCount: 5, workedCount: 4, patterns: [], exceptions: [], cases: [makeCase({ patternIndex: 0 })], precedents: [] };
    expect(validateSeedBundle(bundle({ decisions: [d] }))).toContain('d1: case 0 patternIndex out of range');
  });

  it('exceptions must carry why-it-matters detail', () => {
    const d = makeDecision();
    d.evidence = { caseCount: 5, workedCount: 4, patterns: [], exceptions: [{ title: 'Gov venues', detail: '' }], cases: [], precedents: [] };
    expect(validateSeedBundle(bundle({ decisions: [d] }))).toContain('d1: exceptions must carry a title and why-it-matters detail');
  });

  it('the sibling map may only reference existing, other decisions', () => {
    const b = bundle({ siblings: { d1: ['d1', 'ghost'], ghost2: [] } });
    const v = validateSeedBundle(b);
    expect(v).toContain('siblings: d1 lists itself');
    expect(v).toContain('siblings: d1 → unknown decision "ghost"');
    expect(v).toContain('siblings: unknown decision "ghost2"');
  });
});
