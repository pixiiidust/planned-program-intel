# Handoff: slice 2 mid-flight — #12/#13 shipped, finish #14 → #15

**Date:** 2026-06-12
**Repo:** `D:\planned-program-intel\planned-program-intel` → https://github.com/pixiiidust/planned-program-intel (branch `main`, clean after this commit)
**Live demo (THE job-application artifact — protect it):** https://pixiiidust.github.io/planned-program-intel/ — currently serving `seed-v1.1-pipeline-tables`, verified by HTTP after deploy.
**Previous handoff (superseded):** `docs/handoff/2026-06-11-slice-2-pipeline.md` — its "Repo facts" and "Working agreements" sections still apply except where this doc says otherwise.

## Mission for the next session

Finish slice 2: **#14** (pattern clustering & naming + exception detection → seed v2 live, **lands via a real review PR**) then **#15** (simulated feed, straight to main). Read each issue body on GitHub first — they are the spec.

## THE NEW WORKING SETUP — Codex executor workflow (mandatory)

Jamie installed the openai-codex plugin mid-session and set a standing split: **Fable plans, reviews, verifies, commits; Codex (gpt-5.5 @ xhigh) makes ALL production file edits. Fable never writes the code; Codex never decides the design.** Read memory file `codex-execution-workflow.md` for the exact companion invocation, brief format (`<task>`/`<action_safety>`/`<completeness_contract>`/`<verification_loop>`/output contract blocks), and the fix-up loop (`task --resume-last`). Proven this session across #12 and #13 — including a real review→correction→re-verify round on PR #25.

- Auth is Jamie's ChatGPT login. If a run fails with "refresh token was revoked", ask Jamie to run `! codex logout` then `! codex login`.
- Long runs: launch via Bash `run_in_background`, write the brief to a temp file and pass with `"$(cat file)"`.
- Fable still does: design decisions, throwaway analysis experiments, running pipeline/tests, git, PR reviews, CI watching, docs/design notes, memory.

## What shipped this session (verify via git, don't re-derive)

1. **#12 closed** (commit `d12a990`): `packages/pipeline` skeleton — embed & emit over the v1 seed, local MiniLM embeddings, two emitted tables, `validateSeedBundle` in domain (vitest + emit refusal + explicit CI step). Key design call with measured rationale: sibling similarity uses a **situation-only composite** (see comment in `packages/pipeline/src/composite.ts`).
2. **#13 closed** (PR #25, merge `7379215`): generate (deterministic, seeded mulberry32, six families, approach-conditional fact distributions with baked-in exception subgroups) + label (pure extraction rules) stages; 300-case proposals in `packages/pipeline/data/proposals/`. Review-as-PR exercised for real: two grounded findings (em-dash convention, zero-margin wording), fix commit `71dcb17`, merged. Determinism verified by SHA256 across re-runs.
3. `.claude/settings.json` (permission allowlist) committed alongside this handoff.

## Decisions made since the ADRs were written (authoritative deltas)

- **ADR-0002 amended in this commit** (Jamie approved 2026-06-12): build-time pipeline engine is selectable, **canned is the default** (keyless, deterministic, CI-safe); OpenRouter/Ollama/Anthropic optional via `--engine` + `--model`, keys via env/`.env` (gitignored), never required. Anthropic is NOT the default — Jamie has no Anthropic key yet (#20 HITL pending). Slice-5 live-moment design untouched; **Jamie wants a detailed conversation before slice 5 — don't start it.**
- **/claude-api consult results for #14** (don't re-derive, but re-invoke `/claude-api` before writing any Anthropic adapter or LLM-stage code — repo rule): SDK `@anthropic-ai/sdk`; Haiku id `claude-haiku-4-5` ($1/$5 per MTok); structured output via `output_config: {format: {type: "json_schema", schema}}` (top-level `output_format` is deprecated); skip the Batches API (~30 small calls, sub-cent); OpenRouter adapter = OpenAI-compatible REST via plain `fetch`, no SDK dep.

## #14 design (settled by planner — implement, don't redesign)

- **promote**: `data/proposals/labelled-cases.json` → `data/cases.json`, replacing the v1 extraction corpus (and retiring `scripts/convert-prototype-seed.mjs`'s case-extraction role; decisions.json input stays).
- **embed** over the 300-case corpus. Per decision: similar set = cases ≥ floor → `caseCount`/`workedCount`/`track{worked,total}` **derived, true by construction**.
- **cluster** (pure, LLM-free): group the similar set by `approach` → Pattern membership/counts ("N of the M successes" strings built by code); exemplar case per pattern.
- **detect exceptions** (pure): fact subgroups (government venue, sole source, <30 daysOut) whose outcome rate diverges from the parent set; carries which-facts + rates.
- **name** (LLM via new `AiPort`): Pattern titles, takeaways, exception why-it-matters-now narration, track-record basis sentence — from structured inputs only; **never numbers** (ADR-0004 rule 1; numbers are injected by code around the LLM text).
- **AiPort** in `packages/domain/src/ports.ts` (`generateJson`-shaped); adapters in `packages/adapters/src/ai/`: canned (default), openrouter, ollama, anthropic. Same port serves slice 5 later.
- **emit** seed v2: bump `seedVersion`; e2e seed-fact assertions (`41 of 48`, `85% success across 48 cases`, `(48 cases)`, `Exceptions (1)`, journey nudge texts, no-sibling decision) must be updated from the emitted `data/seed.json` — they are the deploy gate. Keep `Decided (7)/(8)` semantics (statuses unchanged).
- **Landing**: seed v2 via review-as-PR (branch like `seed-v2`), same flow as PR #25. GitHub blocks request-changes on own PRs — post comment reviews instead.
- **The real naming run needs Jamie's OpenRouter key** — ask for it when you reach that step (suggest routing `anthropic/claude-haiku-4.5`); build/verify everything with canned first. `.env` is the key channel; ensure it's gitignored before writing it.

## #15 design (settled sketch)

Typed `Signal` discriminated union (payloads for all five SignalTypes) + `SignalFeed` port in domain; pure threshold Detection in `domain/src/detection.ts`; demo adapter fires one scripted `registration.pace_updated` Signal after a delay (default 20s, `?feedDelay=` ms URL param for e2e); fired-state derived from the detected decision's id already being in the store — so reset re-arms for free and revisits never re-fire; queue row + detail labeled "simulated feed". The scripted decision must NOT duplicate d5's EMEA-registration story — use the SKO event. Fable writes `docs/design/decision-detection.md` (planner artifact: threshold rules over structured Signals, LLM reserved for unstructured residue, human review before routing — grounded in ADR-0003). New e2e spec `e2e/feed.spec.ts`.

## Gotchas discovered this session (beyond prior handoff's list)

- Codex's PowerShell can't run `npm.ps1` (execution policy) — it knows to use `npm.cmd`; don't "fix" this.
- PS 5.1 native-arg passing mangles multiline `gh` args — write to a temp file and use `--body-file`.
- `gh run watch` needs an explicit run id non-interactively: `gh run list --commit <sha> --json databaseId -q '.[0].databaseId'`.
- Codex console output can show mojibake (`â€”`) for em-dashes while the file bytes are correct UTF-8 — verify bytes via a node one-liner, never trust console rendering.
- npm blocks new install scripts (allow-scripts): already approved for onnxruntime-node/esbuild/sharp/protobufjs in root `package.json` `allowScripts`. New native deps will need `npm approve-scripts <pkg>` + `npm rebuild <pkg>`.

## Suggested skills

- **`/claude-api`** — REQUIRED before writing the Anthropic adapter or any LLM-stage code (repo rule; also re-check model ids).
- **`/handoff`** — at session end, write the slice-3 handoff into `docs/handoff/` and push it.
- **`/tdd`** — optional for `detection.ts` and the cluster/exception pure logic; domain tests are the executable CONTEXT.md.

## Authoritative companion docs

`CONTEXT.md` · `docs/adr/0001–0005` (0002 as amended) · `docs/prd/2026-06-11-real-build-six-slices.md` · `prototype/NOTES.md` · issues #14/#15/#20 on GitHub · memory `codex-execution-workflow.md` · prior handoff `2026-06-11-slice-2-pipeline.md`.
