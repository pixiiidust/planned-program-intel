# Handoff: slice 4 complete (#18 + #19 live) — next: the slice-5 build (#20 → #21)

**Date:** 2026-06-12 (fifth session of the day)
**Repo:** `D:\planned-program-intel\planned-program-intel` → https://github.com/pixiiidust/planned-program-intel
**Live demo (THE job-application artifact — protect it):** https://pixiiidust.github.io/planned-program-intel/ — serving the slice-4 build (commit `1270be2`, deploy run 27430656738 green). 31/31 e2e.
**Branch:** everything on `main`, working tree clean.
**Previous handoff (superseded):** `2026-06-12-slice-3-complete.md` — its working agreements still apply except where this doc updates them.

## What landed this session (do not redo)

1. **#18 closed — Portfolio mini variant round** (`f9a38d1`): three dev-only sketches (A "Program ledger", B "Attention briefing", C "Decision flow") behind a `?variant=` switcher. **Verdict (Jamie's pick, recorded on the issue):** a mix — A's per-event ledger as the core + C's Program Memory panel beneath. Why and what each piece contributes: https://github.com/pixiiidust/planned-program-intel/issues/18#issuecomment-4693319267. The prototype folder is deleted; do not resurrect it.
2. **#19 closed — the real Portfolio tab** (`1270be2`, read its message): `PortfolioView.tsx` (ledger + memory panel), rollup logic promoted to `packages/domain/src/portfolio.ts` (`eventRollups` / `memoryStats` / `programTotals`) with unit tests (118 vitest total), `e2e/portfolio.spec.ts` (5 specs → 31 total). Inbox-first entry is e2e-enforced; Portfolio is whole-program and read-only.
3. **App-shell decisions made with #19 (don't relitigate):** the `Inbox | Portfolio` header toggle is the navigation; the PersonaSwitcher hides while Portfolio is active (a "Viewing as Priya" over a whole-program view would lie); toast jumps and "Reset demo data" return to the inbox; on mobile the reset button renders "Reset" but keeps accessible name `Reset demo data` via `aria-label` (the reset e2e depends on it).
4. **Deliberately dropped from the prototype when promoting** (reasoned, not accidental): `criticalOpen` (only variant B used it), `resolutionsWritten` (duplicates `decided`), `caseCorpus` ("corpus of N cases" from max `caseCount` read as misleading). Memory facts row is now: patterns named · precedents pending outcome · resolutions written.

## Mission for the next session

1. **The slice-5 build (#20 → #21)** — the only remaining unbuilt slice before hardening. Implement EXACTLY the settled spec: amended ADR-0002 + the conclusion comments on [#20](https://github.com/pixiiidust/planned-program-intel/issues/20#issuecomment-4692673976) and [#21](https://github.com/pixiiidust/planned-program-intel/issues/21#issuecomment-4692674109). Do not re-derive any of it. The `apps/edge` workspace (ADR-0005) does not exist yet.
2. **Mid-build HITL:** walk Jamie click-by-click through free Cloudflare signup (no card) + `wrangler login` + one secret command + minting a **dedicated** OpenRouter key for the Worker (never the pipeline key; $10/month key limit, monitored, revocable). He expects to be guided, not to research.
3. Then slice 6 (hardening + product narrative): Postgres adapter + contract suite, daily smoke cron, README as product story.
4. Never leave the live demo broken: deploys are gated on the e2e suite; stale beats broken.

## Working setup (unchanged — read memory `codex-execution-workflow.md`)

Fable plans/reviews/verifies/commits; Codex (gpt-5.5 xhigh) makes ALL production edits via the openai-codex plugin companion (v1.0.4; brief in a temp file, Bash `run_in_background`, fix-ups via `task --resume-last`). This session: two briefs (#18 sketches, #19 build), one one-line fix-up round total. Tell Codex to verify with `npm.cmd`; reviewer (Fable) runs the e2e.

## Gotchas (new this session)

- **Composite UI strings must be single text nodes if e2e asserts them.** The escalation chip rendered "With James Tan" and "· 2d" as sibling spans with a margin → DOM text "With James Tan· 2d" → `getByText('With James Tan · 2d')` found nothing. Fix the component (one text node), not the spec.
- **PowerShell 5.1 mangles `git commit -m @'…'@` here-strings** when the message contains quotes — write the message to a file and `git commit -F` instead.
- **Node ESM scripts resolve imports from the script's own path, not cwd** — a throwaway script in the OS temp dir can't import `@playwright/test` from the repo; copy it into the repo root as `*.tmp.mjs`, run, delete.
- Load-time counts are unchanged from slice 3 (Needs you 12 / Waiting 1 / Decided 7; `?feedDelay=0` for count-asserting e2e). Portfolio totals strip at load: `4 events · 12 need attention · 1 waiting on feedback · 7 decided`.

## Environment notes (carried forward)

- Repo-root `.env` (gitignored) holds the OpenRouter API key — Jamie's key, low spend limit; never echo, never commit. Slice 5 needs a **separate** key minted for the Worker at deploy time.
- Codex must call `npm.cmd` (PowerShell execution policy); the Bash tool is unaffected.
- Pipeline regen order: `embed → cluster → name → emit → validate`; narration regens must merge around reviewed entries, never overwrite.
- No dev servers left running (the session's 5199 instance was stopped).

## Suggested skills

- **`/claude-api`** — REQUIRED before touching the Worker/distillation prompt or any LLM-stage code (repo rule; slice 5 is exactly that).
- **`/grill-with-docs`** — should NOT be needed: slice 5 is fully settled; reach for it only if implementation uncovers a genuine contradiction in the spec.
- **`/handoff`** — at session end, into `docs/handoff/`, push.

## Authoritative companion docs

`CONTEXT.md` · `docs/adr/0001–0005` (0002 carries the slice-5 amendments) · `docs/prd/2026-06-11-real-build-six-slices.md` · the #20/#21 conclusion comments · commits `f9a38d1`, `1270be2` · issues #20–#24 · memory `codex-execution-workflow.md`.
