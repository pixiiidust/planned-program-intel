# Handoff: #27 closed (activity timeline live) — next: slice 6 (#22 → #23 → #24)

**Date:** 2026-06-12 (seventh session of the day, second handoff — supersedes `2026-06-12-slice-5-2-live.md` from earlier in the same session)
**Repo:** `D:\planned-program-intel\planned-program-intel` → https://github.com/pixiiidust/planned-program-intel
**Live demo (THE job-application artifact — protect it):** https://pixiiidust.github.io/planned-program-intel/ — serving the #27 build (commit `f404da2`, CI green, Pages deployed). **40/40 e2e, 141 vitest.**
**Branch:** everything on `main`, working tree clean. No dev servers running.
**Open issues:** only slice 6 remains — #22, #23, #24, all `ready-for-agent`.

## What landed this session (do not redo)

1. **Slice 5.2 (#21 closed, `609ecdb`):** engine picker in a settings drawer (Demo / BYO-key / Local-Ollama), reset moved into the drawer, `eval:distill` manual live eval (validated once: 8/8 against real Haiku, prompt-injection fixture cleanly neutralized), `.env` loading extracted to `packages/pipeline/src/env.ts`.
2. **#27 closed (`f404da2`, read its message):** session-scoped activity timeline fed by every toast. Design went through a live conversation + THREE prototype variant rounds with Jamie — all verdicts and the settled behavioral semantics are comments on #27. Key facts: `apps/web/src/lib/activity.ts` (pure entry domain, cap 20, unit-tested), `ActivityPanel.tsx` (Quiet-ledger panel, meta-line-above rows, unseen highlight `bg-sky-50/60` + `data-unseen`), header bell with neutral count badge (hides while open; close marks all seen; entry View marks seen + navigates via shared `jumpTo` + closes panel), toast restyled to the white Quiet-ledger language (ALL asserted strings/roles unchanged), reset clears the list, no persistence (Portfolio stays the durable ledger), ✦ appears on an entry only when distillation landed (failures wordless, ADR-0002). The dev-only prototype was deleted by the build.
3. **Handoff hygiene:** `2026-06-12-codex-brief-slice5b.md` and `2026-06-12-codex-brief-27-activity.md` are the two committed Codex briefs from this session — reference patterns for future briefs.

## Mission for the next session — slice 6 (hardening + product narrative), in order

1. **#22 Postgres adapter + one-suite-two-adapters contract tests.** The issue is the spec. Pure backend credibility artifact — the demo keeps IndexedDB; never gate the live demo on Postgres.
2. **#23 Daily live-link smoke cron.** Watches the deployed demo + Worker. Mind the cap stack (6 req/min/IP, ~300/day KV ceiling) — the cron must be a sip, not a drain, and must NOT call the Worker's paid path in a way that spends meaningfully (a preflight/403-origin probe is free; a daily real distill round-trip is acceptable spend per the issue — read it).
3. **#24 README as product story + design-notes polish.** Jamie's PM-portfolio framing outranks engineering detail (memory `jamie-pm-role-applications.md`): demo UX and product narrative first. The three #27 variant-round comments are good raw material for a "how this was designed" note.

## Working setup (unchanged — read memory `codex-execution-workflow.md`)

Fable plans/reviews/verifies/commits; Codex (gpt-5.5 xhigh, plugin cache 1.0.4) makes ALL production edits; fix-ups via `task --resume-last`; tell Codex to verify with `npm.cmd`; Fable runs Playwright. Prototypes/variant rounds are Fable's own throwaway work (this session's precedent: dev-only mount behind `import.meta.env.DEV`, e2e against the prod build proves no leak).

## Gotchas (new this session, on top of both prior 2026-06-12 handoffs)

- **Toast covers the bell for ~4s:** the toast (fixed top-4, white) overlaps the header bell after a resolve; Playwright clicks auto-wait out the auto-dismiss. Don't "fix" flakiness by force-clicking — wait or dismiss first.
- **`agoLabel` returns `'now' | 'Xm' | 'Xh'`** — render-side decides whether to append " ago" ('now' must not get the suffix).
- **e2e role-name collisions to watch:** 'View' exists on toast AND panel entries (scope through the dialog); drawer radio labels swallow description copy (scope field locators to `getByRole('textbox', ...)`).
- Codex patch-misses on lines containing `✦`/`—` glyphs — anchor briefs on ASCII context.
- `eval:distill` lives only in `packages/pipeline/package.json`; CI never references it.
- Load-time counts unchanged (Needs you 12 / Waiting 1 / Decided 7; `?feedDelay=0` for count-asserting e2e). Composite asserted strings stay single text nodes.

## Environment notes (carried forward)

- Repo-root `.env` (gitignored) holds the PIPELINE OpenRouter key — never echo, never commit, never use for the Worker. The Worker's dedicated key (`ppi-edge-worker`, $10 cap) lives only in Cloudflare's secret store. Worker deploys are manual `npx wrangler deploy` from `apps/edge` (never CI).
- e2e baseline: `e2e/fixtures.ts` aborts `**/distill`; new specs import `{ expect, test }` from `./fixtures`.
- Codex must call `npm.cmd`; `git commit -F` (not `-m`) for multiline; if Fable needs `npm install`, ask Jamie to type `! npm install` (the classifier denies it).
- Never leave the live demo broken: deploys are gated on e2e; stale beats broken. AI stays progressive enhancement.

## Suggested skills

- **`/claude-api`** — REQUIRED before touching the distillation prompt, `evalDistill.ts`, or any LLM-stage code (repo rule; #23's smoke cron qualifies if it touches the distill path).
- **`/handoff`** — at session end, into `docs/handoff/`, push.
- **`/grill-with-docs`** — only on a genuine spec contradiction; slice 6 issues are settled.

## Authoritative companion docs

`CONTEXT.md` · `docs/adr/0002` · issues #22/#23/#24 (the slice-6 specs) · closed #21/#27 (incl. the three variant-round verdict comments) · commits `609ecdb`, `f404da2` · the two committed Codex briefs · memories `codex-execution-workflow.md`, `jamie-pm-role-applications.md`.
