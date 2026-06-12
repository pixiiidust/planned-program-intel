# Pipeline AI engines

The `name` stage asks an `AiPort` for names and narration only. Counts, rates, examples, case totals, and outcome figures are always composed by code from `data/proposals/intelligence.json`; model text is digit-guarded so the LLM cannot supply numbers.

| engine | key needed | cost | quality | deterministic | offline |
| --- | --- | --- | --- | --- | --- |
| `canned` (default) | no | none | generic product copy | yes | yes |
| `openrouter` | `OPENROUTER_API_KEY` | depends on routed model | good with `anthropic/claude-haiku-4.5`; free experiments such as `google/gemma-4-26b-a4b-it:free` are possible, but free routing logs prompts and smaller models trip the digit guard more often | no | no |
| `ollama` | no | none after local model setup | depends on local model | no | yes |
| `anthropic` | `ANTHROPIC_API_KEY` | paid API usage | direct `claude-haiku-4-5` | no | no |

Add keys to repo-root `.env` when needed:

```dotenv
OPENROUTER_API_KEY=...
ANTHROPIC_API_KEY=...
OLLAMA_ENDPOINT=http://localhost:11434
```

Run the stage with one of:

```bash
npm run -w @ppi/pipeline name
npm run -w @ppi/pipeline name -- --engine openrouter
npm run -w @ppi/pipeline name -- --engine openrouter --model google/gemma-4-26b-a4b-it:free
npm run -w @ppi/pipeline name -- --engine ollama --model llama3.2
npm run -w @ppi/pipeline name -- --engine anthropic
```

If a model returns malformed JSON, empty text, or any digit in a text value, that item falls back to the canned template and the pipeline continues.
