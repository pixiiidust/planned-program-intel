# Handoff: slice 3 complete (#16 + #17 live), slice-5 design settled — next: slice 4 or the slice-5 build

**Date:** 2026-06-12 (fourth session of the day)
**Repo:** `D:\planned-program-intel\planned-program-intel` → https://github.com/pixiiidust/planned-program-intel
**Live demo (THE job-application artifact — protect it):** https://pixiiidust.github.io/planned-program-intel/ — serving the slice-3 build (commit `8ac833e`, deploy run 27427679457 green). 26/26 e2e.
**Branch:** everything on `main`, working tree clean.
**Previous handoff (superseded):** `2026-06-12-slice-3-feed-live.md` — its working agreements still apply except where this doc updates them.

## What landed this session (do not redo)

1. **CI unblocked before the June 16 Node-20 retirement** (`c4dcaaa`): `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`. Deploy verified green on the new actions.
2. **The slice-5 design conversation Jamie wanted — held and converged** (`629a46c`). All conclusions are written down; read them, don't re-derive them:
   - **ADR-0002 amendments** (`docs/adr/0002-…`): Demo engine = Worker → **OpenRouter** routing Haiku (no Anthropic Console ever); degradation contract clarified (3s = fetch abort not animation window; one call per Resolution; no retry; data-level swap re-persisted; honest visibility via toast `✦` sparkle → `✦ distilled` chip; no indicator when canned served; escalations never distill).
   - **Issue comments with the full settled spec:** [#20](https://github.com/pixiiidust/planned-program-intel/issues/20#issuecomment-4692673976) (cap stack: max_tokens 160, 6/min/IP, ~300/day KV, 1,000-char clamp; manual wrangler deploy; workers.dev; CORS locked) and [#21](https://github.com/pixiiidust/planned-program-intel/issues/21#issuecomment-4692674109) (eval split: guard fixtures in CI / live eval as manual pre-ship script; ~8 fixtures incl. prompt-injection; prompt builder is shared code, not Worker-only).
   - **CONTEXT.md** gained the **Distillation** term.
   - **Remaining HITL for slice 5 (only Jamie can do, guided walkthrough promised):** free Cloudflare signup (no card) + `wrangler login` + one secret command + minting a **dedicated** OpenRouter key for the Worker (never the pipeline key). Jamie's account backstop: $10/month key limit, monitored, revocable.
3. **#16 persona switcher closed** (`b10775b` — read its message): derived personas (3 Deciders + 3 senior Escalation-path seats via `DEMO_SENIOR_ROLES`), whole-program default view (existing e2e untouched), badges, `personasFrom`/`personaQueue`/`needsYouCount` in domain, FEEDBACK REQUESTED treatment, verbs-belong-to-the-Owner rule. One review finding fixed (see gotchas).
4. **#17 escalation return leg closed** (`8ac833e` — read its message): `feedbackReturned` carries `EscalationFeedback`; routing fully derived (no flags); composer in the #16 banner; FEEDBACK RETURNED chip + owner banner with ActionPanel re-enabled; d19 round-trip + d20 seeded-escalation e2e.

Decisions made this session (don't relitigate): everything in the ADR-0002 amendments and the #20/#21 comments; whole-program-default persona design; `from` comes from `escalation.to` in data, never the UI; toast jumps are program-level and reset the persona filter; re-escalation replaces the escalation object (stale feedback can't linger).

## Mission for the next session

1. **Ask Jamie: slice 4 (#18/#19 portfolio view) or the slice-5 build (#20 → #21)?** Both unblocked. If he's away, default to slice 4, #18 first — it starts with a **mini variant round (2–3 sketches) before implementation**, Jamie's preferred iteration style (use `/prototype`).
2. Slice-5 build, when chosen: implement exactly the settled spec in the #20/#21 comments + amended ADR-0002. The `edge` workspace (`apps/edge` per ADR-0005) doesn't exist yet. Mid-build HITL: walk Jamie click-by-click through Cloudflare signup/key minting — he expects to be guided, not to research.
3. Never leave the live demo broken: deploys are gated on the e2e suite; stale beats broken.

## Working setup (unchanged — read memory `codex-execution-workflow.md`)

Fable plans/reviews/verifies/commits; Codex (gpt-5.5 xhigh) makes ALL production edits via the openai-codex plugin companion (v1.0.4; brief in a temp file, Bash `run_in_background`, fix-ups via `task --resume-last`). This session: two briefs (#16, #17), one one-line correction round total. Tell Codex to verify with `npm.cmd`; reviewer (Fable) runs e2e.

## Gotchas (new this session)

- **Playwright `getByRole` name matching is substring + case-insensitive.** The journey spec's `{ name: 'View' }` collided with the persona switcher's "Viewing as…" accessible name → strict-mode failure. Fixed by `aria-hidden` on the decorative prefix. Any new UI text whose accessible name contains "View" (or other words existing specs match on) will break the suite — check before adding.
- e2e that asserts counts must disable the simulated feed with `?feedDelay=0`. Load-time counts after slice 3: Needs you (12) / Waiting (1) / Decided (7); persona badges Priya 3, Marcus 3, Dana 6, James Tan 1, Mei Lin 0, Raj Mehta 0 (d19's e2e round-trip is test-local; the seed is untouched).
- Codex may leave a vite dev server running on 5173 — kill it before tidy-up (Playwright preview uses 4173, so no conflict, just hygiene).

## Environment notes (carried forward)

- Repo-root `.env` (gitignored) holds `OPENROUTER_API_KEY` — Jamie's key, low spend limit; never echo, never commit. Slice 5 needs a **separate** key minted for the Worker at deploy time.
- Codex must call `npm.cmd` (PowerShell execution policy); the Bash tool is unaffected.
- Pipeline regen order: `embed → cluster → name → emit → validate`; narration regens must merge around reviewed entries, never overwrite.

## Suggested skills

- **`/prototype`** — slice 4 (#18) explicitly opens with a UI variant round.
- **`/claude-api`** — REQUIRED before touching the Worker/distillation prompt or any LLM-stage code (repo rule).
- **`/grill-with-docs`** — only if slice-4 scope turns out to need design conversation; slice 5 is already settled.
- **`/handoff`** — at session end, into `docs/handoff/`, push.

## Authoritative companion docs

`CONTEXT.md` · `docs/adr/0001–0005` (0002 freshly amended) · `docs/prd/2026-06-11-real-build-six-slices.md` · the #20/#21 conclusion comments · commits `b10775b`, `8ac833e` · issues #18–#24 · memory `codex-execution-workflow.md`.
