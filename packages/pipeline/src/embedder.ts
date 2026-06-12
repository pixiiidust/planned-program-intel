// The embedding port. The real adapter runs a local open-source model —
// no API key, no spend (ADR-0004); tests inject a deterministic fake.
export interface Embedder {
  /** Returns one unit-length vector per input text. */
  embed(texts: string[]): Promise<number[][]>;
}

export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';

export async function createTransformersEmbedder(): Promise<Embedder> {
  const { pipeline } = await import('@huggingface/transformers');
  const extract = await pipeline('feature-extraction', EMBEDDING_MODEL, { dtype: 'fp32' });
  return {
    async embed(texts) {
      const output = await extract(texts, { pooling: 'mean', normalize: true });
      return output.tolist() as number[][];
    },
  };
}
