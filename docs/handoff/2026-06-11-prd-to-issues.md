# Handoff: Planned Program Intel — architecture landed, PRD published, next: /to-issues

**Date:** 2026-06-11
**Repo:** `D:\planned-program-intel\planned-program-intel` → https://github.com/pixiiidust/planned-program-intel (branch `main`)
**Previous handoff (context, superseded for next steps):** `docs/handoff/2026-06-11-prototype-to-real-build.md`

## Mission for the next session

Run **`/to-issues`** against the PRD to break the plan into tracer-bullet issues, starting with **slice 1** (contracts + core loop). The PRD defines six slices; Jamie works slice-at-a-time, so issue slice 1 fully and don't flood the tracker with all six slices unless asked.

**PRD (authoritative spec):** https://github.com/pixiiidust/planned-program-intel/issues/1 — labeled `ready-for-agent`. Contains problem, solution, 47 user stories, implementation decisions, testing decisions, phasing, out-of-scope.

## What happened this session

A full `/grill-with-docs` session (12 questions, all resolved with Jamie approving recommendations) turned the prototype into a committed architecture, then `/to-prd` published it. Don't re-derive any of it — read these artifacts:

- **`CONTEXT.md`** (repo root, NEW) — the domain glossary. Decision, Resolution, Signal, Detection, lifecycle states (Open/Blocked/Escalated/Resolved), Evidence = Cases + Exceptions + **Precedents** (new concept: outcome-pending resolution surfaced in similar open Decisions; excluded from Track Record counts).
- **`docs/adr/0001`–`0005`** (NEW) — hexagonal core + two real adapters; single live AI moment with engine picker; Planned-shaped Signals ingestion; build-time intelligence pipeline (no runtime embeddings, LLM never produces counts, review-as-PR); npm-workspaces monorepo (`packages/domain|adapters|pipeline`, `apps/web|edge`).
- **Issue #1** — everything else (slices, testing, demo-state rules, persona switching, portfolio view in scope as slice 4).

## Repo state

`CONTEXT.md`, `docs/adr/0001`–`0005`, and this handoff are committed and pushed (`51c2d11`). Tree is clean — start directly on the mission.

## Key context not fully captured in the artifacts

- **Jamie is applying for PM roles** (saved to memory: `jamie-pm-role-applications.md`). The deployed demo IS the application; interviewers are product people. When scoping/cutting: protect the UI surface and the recruiter's 90-second journey first. Engineering hygiene stays but Postgres/contract work is deliberately slice 6.
- **Demo link constraint** drives everything: instant load, no signup, never down, $0 standing cost. Current live link (https://pixiiidust.github.io/planned-program-intel/) still serves the *prototype*; slice 1 replaces it with the real build behind a gated deploy.
- **Slice 1 scope** (what /to-issues should decompose): domain package grown from `prototype/src/data.js` (rewrite, don't copy — per prototype/NOTES.md), inbox + action-first detail in TS, four-verb resolution, IndexedDB demo adapter, Precedent-lands-in-sibling loop with hand-converted prototype seed (pipeline comes in slice 2), recruiter-journey Playwright e2e, CI gating Pages deploys (a red e2e keeps the old demo live).
- **Settled, do not relitigate:** all six prototype UI verdicts (prototype/NOTES.md), the 12 grill decisions, dashboard-second entry, no tour, no auth, no runtime embeddings, blocked-Decisions-live-in-Needs-you.
- Jamie approves recommendations quickly but reads carefully — present options with a clear rec, explain trade-offs simply when asked, and expect scope instincts worth refining rather than rejecting (e.g. the "admin seat" became manager-personas + portfolio-view oversight).

## Suggested skills

- **`/to-issues`** — the main task: decompose PRD issue #1 into slice-1 tracer-bullet issues (each issue should end with something deployable/observable; the first issue is likely monorepo scaffold + domain types + CI skeleton).
- **`/tdd`** — when implementation starts: domain unit tests are "the executable form of CONTEXT.md" (lifecycle transitions, Track-Record-counts-Cases-only, sibling routing).
- **`/claude-api`** — before writing the edge Worker or pipeline LLM stages (slice 2/5); model choices recorded in ADR-0002 (Haiku for live + pipeline, Ollama alternative, canned in CI).
- **`/prototype`** — slice 4's portfolio view must open with a mini variant round (2–3 sketches) per Jamie's method before any implementation.

## Costs/keys posture (for whoever builds slice 5)

Key only ever lives as a Cloudflare Worker secret; client sends structured payloads, never prompts; per-IP rate limit; Anthropic workspace spend cap ≤$5/month as backstop; BYO-key engine goes browser-direct with sessionStorage. Nothing sensitive is in the repo today.
