# All corpus intelligence is computed at build time by a reviewable pipeline; no runtime embeddings

Every Decision and Case in the demo is known at build time (the user resolves Decisions but never authors them), so similarity ranking, Pattern clustering, Exception detection, and outcome labels are all precomputed by a pipeline and shipped as typed seed data. Runtime similarity work is a table lookup. We rejected in-browser embeddings (transformers.js, ~25MB model) because the converged design has no runtime text that needs *matching* — it would tax the instant-load constraint to recompute a static ranking. If a semantic search-the-memory feature is ever added, lazy-loaded in-browser embeddings are the designated approach.

Pipeline stages: **generate (demo-only) → label outcomes → cluster & name Patterns → detect Exceptions → embed & emit**. Corpus generation is demo-only scaffolding and kept strictly separate from the labelling stages, which are the production-shaped artifact.

Two rules govern the pipeline:

1. **Counts and outcomes never come from the LLM.** Clustering determines Pattern counts; extraction over structured data determines outcomes; the LLM only names Patterns and writes takeaway / why-it-matters narration. "Worked 29 of 41" is true by construction.
2. **Human review is PR review.** The pipeline emits diffable proposal files; a human edits or approves them in a pull request; merge is the approval, commit history is the audit trail, and CI re-validates the seed bundle against the domain contracts (build fails on violation). No review UI is built.

## Consequences

- Embeddings use a local open-source model inside the pipeline (no API dependency for retrieval); the LLM stages use the AI port (Anthropic primary, Ollama alternative, canned in CI — see ADR-0002).
- Embedded text is the structured composite (type, title, problem, tags, event attributes) — never recommendation or evidence text, which would leak answers into the similarity space.
- Two emitted tables: decision→cases (evidence ranking) and decision→decisions (sibling map for Precedent routing).
