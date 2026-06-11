# One live AI moment (Precedent distillation), user-selectable engines, AI as progressive enhancement

The deployed demo must feel AI-native without ever being slowed, broken, or made expensive by a model call. We chose exactly **one** live LLM moment: **Precedent distillation** — on resolution, the user's free-text reasoning plus decision context is condensed by a model into the one-to-two-sentence Precedent entry that appears in a similar open Decision's evidence. Everything else AI-flavored in the demo (similarity ranking, patterns, urgency, recommendations) is pre-computed by the build-time pipeline.

The demo exposes an **engine picker** for this moment, making the AI port's adapters user-visible:

- **Demo** (default): capped serverless proxy (Cloudflare Worker) → Anthropic Haiku. Key lives only as a Worker secret; client sends structured data (never prompts); prompt built server-side; `max_tokens` capped; per-IP rate limit; Anthropic workspace spend cap as absolute backstop.
- **Bring your own key**: direct browser → OpenRouter call; key in sessionStorage, never sent to our infrastructure.
- **Local**: user-supplied Ollama endpoint URL.
- **Canned** (not in the menu): the universal fallback.

**Degradation contract:** resolution always completes deterministically; the Precedent renders immediately with verbatim reasoning and swaps in the distilled version if it arrives within 3 seconds. Any failure (timeout, 429, proxy down) is silent — the AI call is progressive enhancement, never a dependency.

## Considered Options

- **Zero live calls** (fully pre-computed): viable and $0, rejected because one real model call materially strengthens the AI-native claim, and the degradation contract makes its risk ~zero.
- **More live moments** (urgency scoring, recommendation generation): rejected — live generation risks violating the "everything justifies itself" principle and multiplies cost/abuse surface for no extra demo value.
- **Hardware-scan/local-model cookbook** (Odysseus-style): rejected as out of scope — the portfolio-worthy kernel is easy engine selection, which the picker delivers; model serving is a different product.

## Consequences

- The build-time pipeline uses the same AI port: Anthropic (Haiku) adapter as primary, Ollama adapter as the free/offline alternative, canned adapter in CI (no key, no spend).
- The distillation prompt gets a small eval fixture set run in CI.
- Demo seed data must give every headline decision at least one unresolved high-similarity sibling (quieter, non-headline) so the distilled Precedent has a visible landing place.
