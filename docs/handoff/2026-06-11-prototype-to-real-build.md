# Handoff: Planned Program Intel — from prototype to real build

**Date:** 2026-06-11
**Repo:** `D:\planned-program-intel\planned-program-intel` → https://github.com/pixiiidust/planned-program-intel (branch `main`, latest commit `7228ccc`, clean tree)
**User:** Jamie Sim (jamiesimsg@gmail.com)

## Mission for this session

Design the architecture for the **real application** based on the converged prototype. Jamie wants to discuss, before any code:

1. **TypeScript architecture** — the prototype was deliberately plain JS (throwaway, schema changed 5x); the real build flips to TS with the data model as typed contracts from day one.
2. **How AI is used** — Jamie specifically flagged: data labelling will be needed (how do past event cases get labelled worked/failed, clustered into named patterns, tagged with exceptions?), so the backend must support that. Also: similarity retrieval, urgency scoring with justification, owner routing, memory write-back into future evidence.
3. **Module boundaries, APIs, backend configuration** — what services/modules exist, what the API contracts are, where the seams go.
4. **SDLC best practices** — Jamie asked for this explicitly: testing strategy, environments, CI, how to phase the build.

This is a **discussion/design session first** — produce architecture options and recommendations, stress-test them with Jamie, then write them down. Don't start scaffolding code until the architecture conversation lands.

## What exists (read these, don't re-derive)

- **`README.md`** (repo root) — product strategy, AI-native framing, constraints. Updated with prototype findings. The "Recommended AI posture" section matters: retrieval + scoring + workflow intelligence + human-in-the-loop, NOT autonomous agents, NOT RL.
- **`prototype/NOTES.md`** — THE key artifact. Contains: the six-round verdict trail (what UI/UX decisions are settled and why), the converged design spec, the data-model strawman, the **implied AI capabilities list**, and "What this prototype did NOT test" (= the open architecture questions).
- **`prototype/src/data.js`** — the data-model strawman in executable form. This becomes the starting point for TypeScript domain types.
- **`prototype/`** — working Vite+React+Tailwind-CDN prototype (`cd prototype; npm run dev` → localhost:5173). Single converged design, in-memory state. NOTES.md says: rewrite, don't copy.

## Settled decisions (do not relitigate)

- UI shape: inbox (3 tabs: Needs you / Waiting / Decided), action-first detail, 3-point header (Problem / urgency chip + because / Action), flat similarity-ranked case explorer for evidence, four-verb workflow (accept w/ prefilled reasoning, change, override, escalate to suggested people).
- Product principles now in README: confidence = "worked X of Y similar cases" (never bare scores); urgency always carries its "because" (deadline, cost, reversibility); differences always carry "why it matters"; escalation keeps ownership with the owner (shows who it's *with*).
- TypeScript for the real build (Jamie asked why JS was used in the prototype; the answer — throwaway vs contract — landed well and set up the TS expectation).

## Open architecture questions (from NOTES.md "not tested" + Jamie's ask)

- **Decision detection**: how do decisions get *created* from real event data (briefs, contracts, budgets, registration feeds)? Biggest unknown.
- **Data labelling pipeline**: who/what labels historical cases as worked/failed, names patterns with counts, flags exceptions? Human-labelled, LLM-assisted-with-review, or both? This drives backend design (Jamie's explicit hunch).
- **Multi-user**: routing/notifications, the escalatee's experience, feedback returning to the owner.
- **Closing the memory loop**: resolutions are captured but don't yet influence the next recommendation — how does reasoning re-enter evidence (it should "appear in the evidence of similar future decisions")?
- **Portfolio view**: deferred, not rejected (round 1 rejected dashboard-FIRST, not dashboards).

## How Jamie works (calibrate to this)

- Iterates via side-by-side variant rounds; picks a winner, narrows the axis, repeats. For architecture: present 2–3 genuinely different options per major decision with a recommendation, not one take-it-or-leave-it design.
- Touchstones: clean/minimal-clutter/high-taste; mobile + desktop; plain actionable language, short sentences; everything must justify itself (no unexplained scores/labels).
- **Explicitly welcomes pushback** — has said so. Disagree with reasons.
- There's a persistent memory file on this: `jamie-working-style` in the project memory directory.

## Suggested skills

- **`/grill-me`** or **`/grill-with-docs`** — after drafting the architecture, have Jamie stress-test it branch by branch; grill-with-docs can write ADRs as decisions crystallise (the repo has no `docs/adr/` yet — creating one fits the SDLC-best-practices ask).
- **`product-management:write-spec`** — turn the landed architecture discussion into a phased spec/PRD with goals, non-goals, and acceptance criteria.
- **`/to-issues`** — break the agreed plan into tracer-bullet vertical-slice issues once the spec exists.
- **`/tdd`** — Jamie asked for SDLC best practices; test-first fits when implementation starts.
- **`claude-api`** — consult before designing the LLM-touching pieces (labelling assist, similarity/embeddings, pattern naming) for current model/API guidance.
- Consider **EnterPlanMode** for the architecture design itself.

## Suggested opening move

Read `prototype/NOTES.md` and `prototype/src/data.js`, then frame the architecture conversation around the data lifecycle: ingest → detect decisions → retrieve/label evidence → recommend → human resolution → memory write-back. Each stage is a module boundary candidate, each arrow an API candidate, and the labelling pipeline is where Jamie already suspects the complexity lives.
