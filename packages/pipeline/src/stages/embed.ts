// Stage: embed & rank. Embeds the structured composites of decisions and
// corpus cases, then writes the two runtime tables. Pure ranking is in
// rank.ts; this stage is the IO shell around it.
import type { Decision } from '@ppi/domain';
import type { CorpusCase } from '../corpus.js';
import { caseComposite, decisionComposite, decisionSituationComposite } from '../composite.js';
import type { Embedder } from '../embedder.js';
import { topSimilar, type Embedded } from '../rank.js';
import { CASE_PARAMS, SIBLING_PARAMS, type SimilarityTable } from '../tables.js';

export interface EmbedResult {
  caseTable: SimilarityTable;
  siblingTable: SimilarityTable;
}

export async function runEmbed(
  decisions: Decision[],
  cases: CorpusCase[],
  embedder: Embedder,
  model: string,
): Promise<EmbedResult> {
  const texts = [...decisions.map(decisionComposite), ...decisions.map(decisionSituationComposite), ...cases.map(caseComposite)];
  const vectors = await embedder.embed(texts);

  const decisionVecs: Embedded[] = decisions.map((d, i) => ({ id: d.id, vector: vectors[i] ?? [] }));
  const situationOffset = decisions.length;
  const caseOffset = decisions.length * 2;
  const decisionSituationVecs: Embedded[] = decisions.map((d, i) => ({ id: d.id, vector: vectors[situationOffset + i] ?? [] }));
  const caseVecs: Embedded[] = cases.map((c, i) => ({ id: c.id, vector: vectors[caseOffset + i] ?? [] }));

  const caseRows: SimilarityTable['rows'] = {};
  const siblingRows: SimilarityTable['rows'] = {};
  for (let i = 0; i < decisionVecs.length; i += 1) {
    const d = decisionVecs[i]!;
    const situation = decisionSituationVecs[i]!;
    caseRows[d.id] = topSimilar(d.vector, caseVecs, { k: cases.length, floor: CASE_PARAMS.floor });
    siblingRows[d.id] = topSimilar(situation.vector, decisionSituationVecs, {
      k: SIBLING_PARAMS.cap,
      floor: SIBLING_PARAMS.floor,
      exclude: d.id,
    });
  }

  return {
    caseTable: { model, params: CASE_PARAMS, rows: caseRows },
    siblingTable: { model, params: SIBLING_PARAMS, rows: siblingRows },
  };
}
