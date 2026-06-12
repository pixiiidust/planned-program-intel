# One live AI moment (Precedent distillation), user-selectable engines, AI as progressive enhancement

The deployed demo must feel AI-native without ever being slowed, broken, or made expensive by a model call. We chose exactly **one** live LLM moment: **Precedent distillation** — on resolution, the user's free-text reasoning plus decision context is condensed by a model into the one-to-two-sentence Precedent entry that appears in a similar open Decision's evidence. Everything else AI-flavored in the demo (similarity ranking, patterns, urgency, recommendations) is pre-computed by the build-time pipeline.

The demo exposes an **engine picker** for this moment, making the AI port's adapters user-visible:

- **Demo** (default): capped serverless proxy (Cloudflare Worker) → Haiku. Key lives only as a Worker secret; client sends structured data (never prompts); prompt built server-side; `max_tokens` capped; per-IP rate limit; a provider-side spend cap as absolute backstop. *(Amended 2026-06-12:)* the Worker proxies to **OpenRouter routing `anthropic/claude-haiku-4.5`** rather than Anthropic direct. Same model, but no new account provisioning (the project's existing OpenRouter key becomes the Worker secret), and the backstop becomes OpenRouter's **prepaid credit balance + per-key limit** — a hard wall that cannot be exceeded, versus a monthly cap that shouldn't be. This also sharpens the picker story: Demo and BYO-key are the same engine with different key custody — ours behind a capped proxy vs. yours browser-direct. The unused Anthropic-direct adapter remains the pipeline's `--engine anthropic` option.
- **Bring your own key**: direct browser → OpenRouter call; key in sessionStorage, never sent to our infrastructure.
- **Local**: user-supplied Ollama endpoint URL.
- **Canned** (not in the menu): the universal fallback.

**Degradation contract:** resolution always completes deterministically; the Precedent renders immediately with verbatim reasoning and swaps in the distilled version if it arrives within 3 seconds. Any failure (timeout, 429, proxy down) is silent — the AI call is progressive enhancement, never a dependency.

*(Clarified 2026-06-12, slice-5 design conversation:)* the **3 seconds is a fetch timeout, not an animation window** — the Worker call gets one shot with a 3s abort at resolution time (one call per Resolution, shared by all sibling landings; no retry on later loads). On success the distilled text replaces the verbatim **in the data** and is re-persisted; whoever views that evidence next sees the final text. If the user leaves before it lands, the verbatim reasoning stays forever — program memory prefers the human's words when the machine is slow. Visibility is honest, never staged: the resolve toast announces the moment (an animated `✦` while distilling, settling to `✦ distilled` on success, fading wordlessly on failure — no AI error is ever rendered), distilled text permanently carries a small `✦ distilled` provenance chip whose tooltip names the engine, and an on-screen sibling crossfades live if the swap happens in view. No indicator ever appears when the canned fallback served the text — we never imply AI ran when it didn't.

## Considered Options

- **Zero live calls** (fully pre-computed): viable and $0, rejected because one real model call materially strengthens the AI-native claim, and the degradation contract makes its risk ~zero.
- **More live moments** (urgency scoring, recommendation generation): rejected — live generation risks violating the "everything justifies itself" principle and multiplies cost/abuse surface for no extra demo value.
- **Hardware-scan/local-model cookbook** (Odysseus-style): rejected as out of scope — the portfolio-worthy kernel is easy engine selection, which the picker delivers; model serving is a different product.

## Consequences

- The build-time pipeline uses the same AI port, engine-selectable per run (`--engine canned|openrouter|ollama|anthropic`, `--model` passthrough; keys via env/`.env`, never required). *(Amended 2026-06-12:)* the default is **canned** — keyless, deterministic, CI-safe — so the pipeline's happy path never errors or spends for anyone who clones the repo; real narration runs are an explicit choice (e.g. OpenRouter routing to Haiku). Engine setup and tradeoffs (key, cost, quality, determinism, offline) are documented in a repo "Pipeline engines" doc section — the user-facing tradeoff surface remains the slice-5 engine picker. Free hosted models (e.g. OpenRouter's `:free` tier) route through the OpenRouter adapter as experiments; they don't replace the Ollama adapter as the offline/keyless seam. The live-moment design above is unchanged.
- The distillation prompt gets a small eval fixture set run in CI.
- Demo seed data must give every headline decision at least one unresolved high-similarity sibling (quieter, non-headline) so the distilled Precedent has a visible landing place.
