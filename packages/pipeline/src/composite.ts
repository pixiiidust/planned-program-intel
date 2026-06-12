// ADR-0004: embedded text is the structured composite — type, title, problem,
// tags, event attributes. Recommendation and evidence text never enter the
// similarity space; they would leak answers into retrieval.
import type { Decision } from '@ppi/domain';
import type { CorpusCase } from './corpus.js';

export function decisionComposite(d: Decision): string {
  const event = [
    d.event.name,
    d.event.location,
    d.event.date,
    d.event.attendees !== undefined ? `${d.event.attendees} attendees` : '',
    d.event.budget ?? '',
  ]
    .filter(Boolean)
    .join(', ');
  return [`type: ${d.type}`, d.title, d.problem, `event: ${event}`].join('\n');
}

// Sibling similarity must reflect the situation, not the event it belongs to:
// including event attrs made same-event/different-type pairs outrank designed
// situation pairs (measured: d1-d18 0.69 vs d1-d17 0.60 with event attrs; 0.32
// vs 0.57 without).
export function decisionSituationComposite(d: Decision): string {
  return [`type: ${d.type}`, d.title, d.problem].join('\n');
}

export function caseComposite(c: CorpusCase): string {
  return [
    `type: ${c.type}`,
    c.title,
    c.problem ?? '',
    `event: ${c.event}, ${c.when}`,
    c.tags.length > 0 ? `tags: ${c.tags.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
