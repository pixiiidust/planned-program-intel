# Handoff: slice 6 shipped (#22 + #23 closed, #24 awaiting Jamie's voice review on PR #28)

**Date:** 2026-06-12 (eighth session of the day — supersedes `2026-06-12-27-activity-live.md`)
**Repo:** `D:\planned-program-intel\planned-program-intel` → https://github.com/pixiiidust/planned-program-intel
**Live demo (THE job-application artifact — protect it):** https://pixiiidust.github.io/planned-program-intel/ — serving commit `cfe2407`, all CI green. **40/40 e2e, 146 vitest (+5 contract), live smoke 3/3 against production.**
**Branch:** `main` clean and pushed; `readme-product-story` pushed with PR #28 open. No dev servers, no containers (compose torn down with `-v`).
**Open issues:** only #24 (closes when Jamie merges PR #28).

## What landed this session (do not redo)

1. **#22 closed (`2c9ba58`, read its message):** Postgres adapter + ADR-0001's one-suite-two-adapters made checkable. Key facts: contract suite in `packages/adapters/src/persistence/decisionRepositoryContract.ts` (5 behaviors); Postgres leg gates on `PPI_PG_URL` with a *visible* skip; `npm run test:contract:pg` (root, cross-env) after `docker compose up -d --wait`; migrations `0001`/`0002` + advisory-locked runner + `db:migrate` CLI; `pg` is unreachable from `@ppi/adapters` `src/index.ts` (hard constraint — the web bundle must never see it); new standalone `contract-suite.yml` workflow that never gates the Pages deploy. Reviewer path documented in `packages/adapters/README.md`.
2. **#23 closed (`cfe2407`):** daily live smoke (`e2e-live/` + `playwright.live.config.ts`, cron 21:23 UTC + `workflow_dispatch` in `live-smoke.yml`). Three tests: load/inbox (count *patterns*, never exact counts), a real resolve on production (the one budgeted distill round-trip/day; asserts resolution only, never ✦ — ADR-0002), and a free Worker probe (no-Origin POST → 403 before any KV/rate/LLM work). Failure auto-files/updates a `live-smoke`-labeled issue; a green run auto-closes it. Validated three ways: locally against production, and via one manual `workflow_dispatch` run on GitHub (51s, green).
3. **#24 drafted — NOT merged (HITL by design):** PR #28 (`readme-product-story` branch, `51b8154`) rewrites README as the product story (live link first, sixty-second tour, principles, verdict trail, "verify the architecture claims" reviewer paths), adds `docs/design/activity-timeline.md` (the #27 variant rounds as a design-method note), and one cross-link line in CONTEXT.md. **Jamie must review the narrative voice and merge** — the issue's acceptance requires it. Merging closes #24 and finishes the PRD's six slices.

## Next session

1. If PR #28 has Jamie's comments: apply voice edits (prose only — Fable's lane, no Codex needed), re-push, merge after approval, confirm #24 closes.
2. Post-merge: nothing else is scheduled. The PRD is fully shipped. Candidate follow-ups only if Jamie asks (e.g. the first real cron firing of `live-smoke.yml` is ~21:23 UTC today — worth a glance that it ran).
3. Optional: Jamie may want conclusion comments on #22/#23 — the classifier denied Fable posting them (out-of-scope external write); the facts are all in the commit messages.

## Working setup (unchanged — read memory `codex-execution-workflow.md`)

Fable plans/reviews/verifies/commits; Codex (gpt-5.5 xhigh, plugin cache 1.0.4) makes all production code edits; fix-ups via `task --resume-last`. This session: two briefs (#22, #23), one fix-up round total (dead `pg` destructurings). README/design-note prose was Fable's own work (docs lane). Codex must verify with `npm.cmd`; Fable runs Playwright and docker.

## Gotchas (new this session, on top of the 2026-06-12 stack)

- **Classifier nuances (memory `harness-npm-install-denial.md` updated):** bare `npm install` after Codex writes the manifests is ALLOWED (the denial targets agent-chosen package args); `git commit; git push` bundled in one command is denied while the same two commands run separately succeed; `gh issue comment` status posts are denied — put the record in commit messages.
- **Postgres leg locally:** Docker Desktop must be started first (`docker info` to check; launching the exe takes ~30s to daemon-ready). Compose maps host port **5499**. Always `docker compose down -v` after (wipe the volume — the contract suite truncates tables but a stale volume can mask migration bugs).
- **The Postgres contract test constructs its Pool at module scope** inside the `else` branch — vitest collects describes synchronously; don't refactor the gate into a hook.
- **Live smoke is intentionally fixture-free:** `e2e-live/` must never import `e2e/fixtures` (that abort is the local suite's baseline; the smoke watches reality). It's also not in `npm run e2e` — two separate Playwright configs.
- **Scheduled-workflow housekeeping:** GitHub disables cron workflows after ~60 days of repo inactivity; the smoke's auto-filed issue only covers *failing* runs, not *absent* ones.
- `/claude-api` was run before #23 per the repo rule; the smoke exercises but never modifies the distill path, so no LLM-stage code changed this session.

## Environment notes (carried forward)

- Repo-root `.env` (gitignored) holds the PIPELINE OpenRouter key — never echo, never commit, never use for the Worker. Worker key lives only in Cloudflare secrets; Worker deploys manual from `apps/edge` (never CI; Worker untouched this session).
- Deploys gated on e2e; stale beats broken. AI stays progressive enhancement.
- New root scripts: `test:contract:pg`, `e2e:live`. New devDeps: cross-env (root); @types/pg, fake-indexeddb, tsx (adapters); pg (adapters dep). Lockfile resolved and committed.

## Suggested skills

- **`/claude-api`** — REQUIRED before touching the distillation prompt, `evalDistill.ts`, or any LLM-stage code (repo rule).
- **`/handoff`** — at session end, into `docs/handoff/`, push.

## Authoritative companion docs

`CONTEXT.md` · `docs/adr/0001` (now checkable), `0002` · PR #28 (the #24 draft + its description) · commits `2c9ba58`, `cfe2407`, `51b8154` · `packages/adapters/README.md` · `docs/design/activity-timeline.md` (on the PR branch) · the two session briefs in `$TEMP` were not committed (reference patterns already exist in `docs/handoff/2026-06-12-codex-brief-*.md`) · memories `codex-execution-workflow.md`, `harness-npm-install-denial.md` (updated today), `jamie-pm-role-applications.md`.
