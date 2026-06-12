import { describe, expect, it } from 'vitest';
import { makeDecision } from '@ppi/domain';
import { caseComposite, decisionComposite, decisionSituationComposite } from './composite.js';
import type { CorpusCase } from './corpus.js';

describe('decisionComposite', () => {
  const decision = makeDecision({
    title: 'Lisbon venue contract missing force majeure clause',
    problem: 'Any cancellation forfeits all committed spend.',
    type: 'contract',
    event: { id: 'sko', name: 'Global SKO 2027', location: 'Porto', date: 'Jan 2027', budget: '$1.4M', attendees: 850 },
    recommendation: {
      action: 'UNIQUE-ACTION-TOKEN request the addendum',
      why: 'UNIQUE-WHY-TOKEN removes the exposure',
      track: { worked: 41, total: 48, basis: 'UNIQUE-BASIS-TOKEN' },
    },
  });

  it('is built from type, title, problem, and event attributes', () => {
    const text = decisionComposite(decision);
    expect(text).toContain('type: contract');
    expect(text).toContain('Lisbon venue contract missing force majeure clause');
    expect(text).toContain('Any cancellation forfeits all committed spend.');
    expect(text).toContain('Global SKO 2027, Porto, Jan 2027, 850 attendees, $1.4M');
  });

  it('never leaks recommendation or evidence text into the similarity space (ADR-0004)', () => {
    const text = decisionComposite(decision);
    expect(text).not.toContain('UNIQUE-ACTION-TOKEN');
    expect(text).not.toContain('UNIQUE-WHY-TOKEN');
    expect(text).not.toContain('UNIQUE-BASIS-TOKEN');
  });

  it('decisionSituationComposite is built from type, title, and problem', () => {
    const text = decisionSituationComposite(decision);
    expect(text).toContain('type: contract');
    expect(text).toContain('Lisbon venue contract missing force majeure clause');
    expect(text).toContain('Any cancellation forfeits all committed spend.');
  });

  it('decisionSituationComposite excludes event and recommendation text', () => {
    const text = decisionSituationComposite(decision);
    expect(text).not.toContain('Global SKO 2027');
    expect(text).not.toContain('Porto');
    expect(text).not.toContain('850 attendees');
    expect(text).not.toContain('$1.4M');
    expect(text).not.toContain('UNIQUE-ACTION-TOKEN');
    expect(text).not.toContain('UNIQUE-WHY-TOKEN');
    expect(text).not.toContain('UNIQUE-BASIS-TOKEN');
  });
});

describe('caseComposite', () => {
  const corpusCase: CorpusCase = {
    id: 'c01',
    type: 'contract',
    title: 'Force majeure addendum on an international venue contract',
    event: 'Global SKO 2025 — Barcelona',
    when: '2025',
    outcome: 'worked',
    detail: 'UNIQUE-DETAIL-TOKEN addendum accepted for a 5% earlier deposit',
    tags: ['Iberia', 'convention center'],
  };

  it('is built from type, title, tags, and event attributes', () => {
    const text = caseComposite(corpusCase);
    expect(text).toContain('type: contract');
    expect(text).toContain('Force majeure addendum');
    expect(text).toContain('event: Global SKO 2025 — Barcelona, 2025');
    expect(text).toContain('tags: Iberia, convention center');
  });

  it('never embeds the what-happened detail — it carries the answer', () => {
    expect(caseComposite(corpusCase)).not.toContain('UNIQUE-DETAIL-TOKEN');
  });
});
