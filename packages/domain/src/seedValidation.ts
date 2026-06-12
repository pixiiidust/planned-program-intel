// The seed bundle is pipeline output (ADR-0004); these checks are the domain
// contracts it must honor, run build-failing in CI. Each violation is a
// human-readable sentence — an empty result means the bundle is sound.
import type { SeedBundle } from './types.js';
import { SIGNAL_TYPES } from './types.js';

export function validateSeedBundle(bundle: SeedBundle): string[] {
  const violations: string[] = [];
  if (!bundle.seedVersion.trim()) violations.push('seedVersion must be non-empty');

  const ids = new Set<string>();
  for (const d of bundle.decisions) {
    const at = (msg: string) => violations.push(`${d.id || '<no id>'}: ${msg}`);
    if (!d.id.trim()) at('id must be non-empty');
    if (ids.has(d.id)) at('duplicate decision id');
    ids.add(d.id);

    if (!d.title.trim()) at('title must be non-empty');
    if (!d.problem.trim()) at('problem must be non-empty');
    if (!d.actionNeeded.trim()) at('actionNeeded must be non-empty');
    if (!(SIGNAL_TYPES as readonly string[]).includes(d.signalType)) at(`unknown signalType "${d.signalType}"`);
    if (!d.urgency.because.trim()) at('urgency must carry its because');
    if (!d.owner.whyRouted.trim()) at('owner must carry the routing reason');

    if ((d.status === 'resolved') !== (d.resolution !== null)) at('resolved status and resolution must agree');
    if ((d.status === 'escalated') !== (d.escalation !== null)) at('escalated status and escalation must agree');
    if (d.status === 'blocked' && !d.blockedBy?.trim()) at('blocked decisions must name their blocker');
    if (d.blockedBy !== undefined && d.status !== 'blocked') at('only blocked decisions may carry blockedBy');

    const track = d.recommendation.track;
    if (!(track.worked >= 0 && track.worked <= track.total)) at('track record must have 0 ≤ worked ≤ total');
    if (!track.basis.trim()) at('track record must state its basis');

    const e = d.evidence;
    if (!(e.workedCount >= 0 && e.workedCount <= e.caseCount)) at('evidence must have 0 ≤ workedCount ≤ caseCount');
    if (e.cases.length > e.caseCount) at('listed cases exceed the corpus caseCount');
    e.cases.forEach((c, i) => {
      if (!(c.similarity > 0 && c.similarity <= 1)) at(`case ${i} similarity must be in (0, 1]`);
      if (c.patternIndex !== undefined && (c.patternIndex < 0 || c.patternIndex >= e.patterns.length))
        at(`case ${i} patternIndex out of range`);
      const prev = e.cases[i - 1];
      if (prev && c.similarity > prev.similarity) at(`cases must be similarity-ranked (case ${i} outranks its predecessor)`);
    });
    for (const x of e.exceptions) if (!x.title.trim() || !x.detail.trim()) at('exceptions must carry a title and why-it-matters detail');
    for (const w of d.whatsDifferent) if (!w.change.trim() || !w.whyItMatters.trim()) at("what's-different entries must carry why-it-matters");
  }

  for (const [from, tos] of Object.entries(bundle.siblings)) {
    if (!ids.has(from)) violations.push(`siblings: unknown decision "${from}"`);
    for (const to of tos) {
      if (!ids.has(to)) violations.push(`siblings: ${from} → unknown decision "${to}"`);
      if (to === from) violations.push(`siblings: ${from} lists itself`);
    }
  }

  return violations;
}
