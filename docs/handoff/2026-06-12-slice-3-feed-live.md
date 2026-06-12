# Handoff: #14 + #15 landed and live — next: the slice-5 conversation, then slices 3/4

**Date:** 2026-06-12 (third session of the day)
**Repo:** `D:\planned-program-intel\planned-program-intel` → https://github.com/pixiiidust/planned-program-intel
**Live demo (THE job-application artifact — protect it):** https://pixiiidust.github.io/planned-program-intel/ — HTTP-verified serving `seed-v2.1-simulated-feed` (bundle greps confirm d21 + feed strings). Deploy run 27422100786 green.
**Branch:** everything is on `main` (seed-v2 branch deleted after merge). Working tree clean.
**Previous handoffs (superseded):** `2026-06-12-seed-v2-landing.md` — its working agreements and gotchas still apply except where this doc updates them.

## What landed this session (do not redo)

1. **#14 closed via PR #26** (https://github.com/pixiiidust/planned-program-intel/pull/26): real Haiku narration via OpenRouter over all 20 decisions (zero digit-guard fallbacks), four inline review findings on the narration artifact, human edits addressing them on the branch, merge, deploy, live verification. The PR thread is the review-as-PR demonstration artifact — read it before claiming anything about the narration workflow. Bonus finding documented there: OpenRouter `:free` models (Gemma) are unusable without a naming-stage throttle (16 req/min limit; every request fell back to canned).
2. **#15 closed on main** (commit `a69e731` — read its message; it is the accurate summary): Signal taxonomy + pure threshold Detection in domain, `ScriptedSignalFeed` demo adapter, held-back `SeedBundle.feedDecisions` artifact (d21, SKO registration pace, 27-of-50 true by construction, sibling edge to d5), "simulated feed" row chip + Source header row, `e2e/feed.spec.ts` (3 specs). 20/20 e2e green.

Decisions made this session (don't relitigate):
- **Held-back seed artifact = yes** (the open choice in the previous handoff): the pipeline derives d21's evidence like any decision; Detection releases it, never composes facts.
- **Per-program thresholds, not fudged payloads**: SKO is ~147 days out, so the design-note default pace rule (<60 days) honestly does NOT trip; the demo program tunes `maxDaysOut` to 180 (`DEMO_PROGRAM_THRESHOLDS` in `packages/adapters/src/demo/signalFeed.ts`), and a unit test asserts both behaviors. This demonstrates the design note's "rules are tunable per program" property.
- **Narration regen merges, never overwrites**: reviewed narration is an approved artifact. After any `name` re-run, restore HEAD entries for already-reviewed decisions and keep only the new ones (this session's merge script pattern; it lived in temp, rewrite if needed: `git show HEAD:…/narration.json` + splice by decisionId).
- **Fired-state is derived** (feed decision id present in the store): reset re-arms free, revisits never re-fire, no flags in storage.

## Mission for the next session

1. **Start with the slice-5 conversation Jamie wants** — he explicitly does NOT want slice 5 (#20 edge Worker proxy + Precedent distillation, #21 engine picker) built before a detailed discussion. Open questions to bring: Worker deployment/account specifics, spend caps and rate limits, the degradation-contract UX, eval fixture scope, whether engine-plan comments on #20/#21 (posted 2026-06-12) still hold. Consider `/grill-with-docs` to stress-test against ADR-0002 before writing code.
2. Slices 3 (#16 persona switcher, #17 escalatee round-trip) and 4 (#18/#19 portfolio view, which starts with a mini variant round — Jamie's preferred iteration style) are open and unblocked; ask Jamie whether the slice-5 conversation or slice 3 comes first.
3. Never leave the live demo broken: deploys are gated on the e2e suite; stale beats broken.

## Working setup (unchanged — read memory `codex-execution-workflow.md`)

Fable plans/reviews/verifies/commits; Codex (gpt-5.5 xhigh) makes ALL production file edits via the openai-codex plugin companion (`…\plugins\cache\openai-codex\codex\1.0.4\scripts\codex-companion.mjs`, brief in a temp file, Bash `run_in_background`; fix-ups via `task --resume-last`). This session: one big brief + one 3-point correction round, both clean. Reviewer edits to *data proposals* (narration.json) are Fable's job — that's the human-review role, not code.

## Environment notes

- Repo-root `.env` (gitignored, verified) holds `OPENROUTER_API_KEY` — Jamie's key, low spend limit. Do not echo it, do not commit it; it stays out of every artifact. Default naming model is `anthropic/claude-haiku-4.5`.
- Codex on this machine must call `npm.cmd` (PowerShell execution policy blocks `npm.ps1`); the Bash tool is unaffected.
- Pipeline regen order after corpus/decision changes: `embed → cluster → name → emit → validate`; then the narration merge (above) before emit if reviewed decisions exist.
- e2e count-string assertions (`Decided (7)/(8)`) and the d1→d17 / d4-no-sibling fixtures survived the d21 regen — the regen was verified purely additive. Check this again after any future decisions.json change.
- GitHub Actions warns Node 20 actions (`configure-pages@v5`, `upload-artifact@v4`) are deprecated June 16, 2026 — four days away; bump them in `deploy-pages.yml` next session before they break the deploy gate.

## Suggested skills

- **`/claude-api`** — REQUIRED before touching the Anthropic adapter or any LLM-stage code (repo rule), and definitely before slice-5 work (Worker proxy + distillation prompt).
- **`/grill-with-docs`** — for the slice-5 design conversation against ADR-0002.
- **`/prototype`** — slice 4 (#18) explicitly calls for a UI variant round.
- **`/handoff`** — at session end, into `docs/handoff/`, push.

## Authoritative companion docs

`CONTEXT.md` · `docs/adr/0001–0005` · `docs/prd/2026-06-11-real-build-six-slices.md` · `docs/design/decision-detection.md` · `docs/pipeline-engines.md` · PR #26 thread · commit `a69e731` · issues #16–#24 · memory `codex-execution-workflow.md`.
