# Handoff: seed v2 built & verified on branch — land it, then #15

**Date:** 2026-06-12 (late)
**Repo:** `D:\planned-program-intel\planned-program-intel` → https://github.com/pixiiidust/planned-program-intel
**Live demo (THE job-application artifact — protect it):** https://pixiiidust.github.io/planned-program-intel/ — still serving `seed-v1.1-pipeline-tables`; nothing has touched `main`'s deployable code this session, so it is safe. Verify it again after the seed-v2 merge deploys.
**Branches:** `main` = handoff + design note only. **`seed-v2` (pushed)** holds ALL of issue #14's work, verified green locally (typecheck, 90 unit tests, 17/17 e2e). Two commits; read the big commit message — it is the accurate summary of what was built and why.
**Previous handoff (superseded):** `docs/handoff/2026-06-12-slice-2-finish.md` — its Codex-workflow section, gotchas, and working agreements still apply except where this doc says otherwise.

## Mission for the next session

1. **Finish #14:** real naming run via OpenRouter (ask Jamie for his key — see below), re-emit, land `seed-v2` via a real review PR, merge closes #14, watch CI green, verify the deployed URL serves seed v2.
2. **#15** (simulated feed), straight to main with `Closes #15`.
3. `/handoff` the slice-3 handoff at the end.
4. **Do NOT start slice 5** — Jamie wants a detailed conversation first.

## State of #14 (everything below is DONE, on `seed-v2`, do not redo)

Five-stage pipeline complete and run on real data: `promote → embed → cluster → name(canned) → emit → validate`. Seed `seed-v2-corpus-intelligence` is emitted, contract-valid, and the e2e suite asserts its real figures (d1 "Worked in 40 of 60", "67% success across 60 cases", Lisbon display set, "Exceptions (1)" with the legal-review metric sentence, `Decided (7)/(8)` preserved, d1→d17 sibling + d4-no-sibling intact). Web app gained a Patterns digest above the flat explorer (round-4 verdict respected), `Pattern N` chips on case rows, and honest zero-case states (d10/d15/d16 have empty similar sets — by design). `docs/pipeline-engines.md` documents the engine tradeoffs.

Decisions made this session by measurement (documented in code comments; don't relitigate):
- **Similar set = same `type` gate + embedding rank, floor 0.25** (flat cosine floors gave 0–39-member cross-family sets; d1's top-10 had only 4 same-family).
- **Exceptions fire on outcome-rate divergence ≥ 0.15 OR a numeric-fact metric ratio ≥ 1.8** (government-venue = 2.1× legalReviewDays; rates barely diverge there). Metric-fired exceptions render the metric sentence, not the rate sentence.
- **Worked clusters rank by successes desc** (strongest play first).
- **e2e asserts only code-composed strings** (counts, figures, count-strings); LLM text is asserted structurally (regex / testid) — so swapping the naming engine cannot break the deploy gate.

## Step 1 of the mission: the real naming run (needs Jamie)

1. Ask Jamie for his **OpenRouter API key** (AskUserQuestion; he expects this). Write it to repo-root `.env` as `OPENROUTER_API_KEY=...` — `.env` is gitignored (verify before writing anyway).
2. On `seed-v2`: `npm run -w @ppi/pipeline name -- --engine openrouter` (default model is already `anthropic/claude-haiku-4.5`). Watch the log: digit-guard fallbacks print one-line warnings — a few are fine, many means the model misbehaved.
3. `npm run -w @ppi/pipeline emit && npm run -w @ppi/pipeline validate`, then `npm test && npm run e2e` (should stay green — only narration texts changed). READ the narration diff (`packages/pipeline/data/proposals/narration.json`) for quality — pattern titles, takeaways, exception why-it-matters-now, track basis; this diff is the review artifact the PR exists to show.
4. Optional zero-cost experiment Jamie approved: re-run with `--model google/gemma-4-26b-a4b-it:free` and diff against Haiku — interesting PR comment material, but ship Haiku's output.
5. Commit on `seed-v2`.

## Step 2: the review PR

Same flow as PR #25 (see merged history): PR from `seed-v2` → `main`, body ends `Closes #14`. GitHub blocks request-changes on your own PR — post comment reviews instead, with real findings; review-as-PR is the feature being demonstrated (ADR-0004 rule 2). PR body should surface: the measured membership/exception decisions above, the narration diff as the human-review artifact, and the engines doc. Merge → `gh run watch` the deploy (run id via `gh run list --commit <sha> --json databaseId -q '.[0].databaseId'`) → HTTP-verify the live URL serves seed v2 (e.g. fetch the page JS and grep `seed-v2-corpus-intelligence`). Stale beats broken: a red run keeps v1.1 live.

## Step 3: #15 (after #14 is merged, work on main)

Spec = issue #15 body + previous handoff's sketch. The design note deliverable already exists: **`docs/design/decision-detection.md` is committed on main** (Fable-authored this session). Settled sketch: typed `Signal` discriminated union (payloads for all five SignalTypes) + `SignalFeed` port in domain; pure threshold detection in `domain/src/detection.ts`; demo adapter fires one scripted `registration.pace_updated` Signal ~20s after first visit (`?feedDelay=` ms URL param for e2e); fired-state derived from the detected decision's id already being in the store (reset re-arms free, revisits never re-fire); row + detail labeled "simulated feed"; **use the SKO event, not d5's EMEA-registration story**; new `e2e/feed.spec.ts`.

One open design choice (lean yes, decide before briefing Codex): have the pipeline emit the scripted feed decision **with real derived evidence** as a held-back seed artifact (e.g. optional `SeedBundle.feedDecisions`), so even the detected Decision's counts are true by construction; the adapter just releases it when the Signal fires. Keeps ADR-0004 honest end-to-end. Requires touching seedValidation + emit; keep it small.

## Working setup (unchanged — read memory `codex-execution-workflow.md`)

Fable plans/reviews/verifies/commits; Codex (gpt-5.5 xhigh) makes ALL file edits via
`node "C:\Users\Jamie Sim\.claude\plugins\cache\openai-codex\codex\1.0.4\scripts\codex-companion.mjs" task --write --model gpt-5.5 --effort xhigh "$(cat brief.md)"` (Bash, `run_in_background`, brief in a temp file); fix-ups via `task --resume-last`. This session ran 3 brief rounds + 3 correction rounds, all clean.

## New gotchas from this session

- **Codex has no network**: it cannot `npm install`. If a brief adds a dependency, Fable must run `npm install` afterward to resolve the lockfile, or CI's `npm ci` fails.
- The Bash tool runs bash, not PowerShell: multiline commit messages via `git commit -F <tempfile>`, never PS here-strings.
- Playwright can drop a Chromium `debug.log` in the repo root — it's gitignored now.
- `npm run e2e` can hang after "17 passed" if a stray preview server holds the port; re-run cleanly.
- The Anthropic adapter loads `@anthropic-ai/sdk` via dynamic import with a non-literal specifier ON PURPOSE (keeps it out of the web bundle/static graph) — don't "fix" it.
- Pipeline regen order matters after cluster-stage changes: `cluster → name → emit` (name reads intelligence.json; emit asserts narration parallels it and refuses on mismatch).

## Suggested skills

- **`/claude-api`** — REQUIRED before touching the Anthropic adapter or any LLM-stage code again (repo rule). Already consulted this session for the current code.
- **`/handoff`** — at session end, slice-3 handoff into `docs/handoff/`, push.
- **`/code-review`** — optional on the seed-v2 PR before merging (cheap second pass; the PR review itself is the demonstrated feature).

## Authoritative companion docs

`CONTEXT.md` · `docs/adr/0001–0005` (0002 as amended, incl. this session's engines note) · `docs/prd/2026-06-11-real-build-six-slices.md` · `docs/pipeline-engines.md` (on seed-v2) · `docs/design/decision-detection.md` (main) · issues #14/#15/#20/#21 (engine-plan comments posted 2026-06-12) · memory `codex-execution-workflow.md` · prior handoff `2026-06-12-slice-2-finish.md`.
