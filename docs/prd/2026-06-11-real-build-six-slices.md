# PRD: Planned Program Intel — real build (six tracer-bullet slices)

> Source of record for the build, dated 2026-06-11. Companion docs: `CONTEXT.md` (glossary), `docs/adr/0001`-`0005` (architecture decisions), `prototype/NOTES.md` (UI verdict trail).

## Problem Statement

Enterprise event teams make hundreds of consequential decisions per program — contract terms, budget variances, stalled approvals, supplier exceptions, registration forecasts — with the relevant institutional memory scattered across past events, inboxes, and people's heads. Decisions are slow, weakly contextualized, and the reasoning behind them evaporates after each event.

A six-round prototype converged the product shape (inbox queue + action-first decision detail + inspectable evidence + four-verb resolution). It now needs to become a real, deployed application. Critically, **the deployed demo is a job-application artifact for PM roles**: it must load instantly, require no signup, never be down, cost ~$0 standing, and feel genuinely functional to a product-minded interviewer inside a 90-second visit — while the repo demonstrates real product and architecture judgment underneath.

## Solution

A standalone TypeScript application — **Planned Program Intel** — that surfaces detected Decisions in a three-tab inbox (Needs you / Waiting / Decided), routes each to an Owner with the routing reason, packages Evidence (similarity-ranked Cases, named Patterns with counts, Exceptions, Precedents), and lets the Owner accept / change / override / escalate with reasoning. Every Resolution writes into Program Memory: the reasoning is distilled into a **Precedent** that visibly appears in the Evidence of similar open Decisions — the memory loop closes live, in front of the user, in under a minute.

The deployed demo (GitHub Pages) runs entirely client-side on demo adapters over seeded synthetic data produced by a build-time intelligence pipeline. A hexagonal core keeps every integration seam (ingestion of Planned-shaped Signals, persistence, AI, notifications) open for later integration into planned.com's stack. One live AI moment (Precedent distillation, via a capped serverless proxy with a user-selectable engine) makes the app AI-native without ever blocking, slowing, or breaking the demo.

## User Stories

### Inbox & decision moment
1. As an event program Owner, I want a three-tab inbox (Needs you / Waiting / Decided) of Decisions routed to me, so that I always know what needs my judgment next.
2. As an Owner, I want each Decision to open action-first — headline, PROBLEM / urgency chip + because / ACTION on a shared label column, recommendation and call panel on top — so that I can decide without reading a dossier.
3. As an Owner, I want urgency to always carry its "because" (deadline, cost of missing it, reversibility), so that I never have to trust an unexplained label.
4. As an Owner, I want a tap-to-open urgency rubric tying levels to business outcomes, so that I can calibrate what "critical" means here.
5. As an Owner, I want the recommendation to carry a Track Record ("worked 41 of 48 similar cases" with its basis), so that confidence is evidence, never a bare score.
6. As an Owner, I want a small-sample caveat when the Track Record basis is thin, so that the system never overstates its certainty.
7. As an Owner, I want queue rows that are status-aware with a right-aligned time column, and sort + time-filter dropdowns per tab, so that I can triage by deadline or staleness.
8. As an Owner, I want resolving a Decision to auto-advance to the next item with a jump-back toast, so that working the queue feels fast.
9. As an Owner, I want Blocked Decisions to appear in **Needs you** with the blocker named, so that my next move is breaking the block — never waiting it out.

### Evidence & program memory
10. As an Owner, I want a flat, similarity-ranked Case explorer with worked/failed proportion bar and outcome filter chips, so that I can inspect the evidence rather than trust a summary.
11. As an Owner, I want named Patterns with counts and a takeaway (e.g. "Pair the addendum request with a deposit-timing trade — 29 of 41 successes"), so that the corpus reads as strategy, not history.
12. As an Owner, I want Exceptions surfaced with why they matter now ("government-owned venues took 2–4× longer — this venue is government-owned"), so that differences always carry consequences.
13. As an Owner, I want every "what's different" entry to carry "why it matters", so that novelty is never noise.
14. As an Owner, I want my Resolution reasoning saved as a **Precedent** that appears in the Evidence of similar open Decisions, so that my judgment compounds across the program.
15. As an Owner, I want a nudge after resolving ("your reasoning now appears in 1 similar open decision → view"), so that I see the memory loop close.
16. As an Owner, I want Precedents visually distinct from Cases ("decided just now by Dana — outcome pending") and excluded from worked/failed counts, so that the Track Record never lies.
17. As an Owner, I want Case rows to carry their tags, so that every similarity ranking is inspectable.

### Resolution verbs
18. As an Owner, I want **Accept** with reasoning prefilled from the recommendation's why, so that agreeing is one edit away from documented.
19. As an Owner, I want **Change** ("right direction, wrong details") with the action prefilled for editing, so that adjustments keep the recommendation's context.
20. As an Owner, I want **Override** ("wrong call for this event") with free-text reasoning, so that disagreement is captured as future evidence, not lost.
21. As an Owner, I want **Escalate** to system-suggested people with reason chips and their authority stated ("holds delegated approval under A-22"), so that I route to the right person for the right reason.

### Escalation & multi-user (personas)
22. As an Owner, I want escalation to keep ownership with me — the row reads "With Mei Lin · escalated by Dana" — so that delegation never becomes abdication.
23. As a demo visitor, I want a persona switcher (no auth) grouping Deciders and Escalation paths with per-persona badge counts, so that I can experience every seat of the product.
24. As an escalatee (manager persona), I want escalations addressed to me in my own **Needs you** as feedback requests with full decision context, so that I can respond from the same detail view.
25. As an escalatee, I want a feedback composer in place of the call panel, so that responding requires no second UI to learn.
26. As an Owner, I want returned feedback to bring the Decision back to Open in my queue with the feedback attached, so that the escalation loop visibly round-trips.

### Detection & the simulated feed
27. As a demo visitor, I want one scripted `registration.pace_updated` Signal to auto-fire once (~20s after first visit, labeled "simulated feed"), so that I see a Decision get detected and routed — the inbox is alive, not a fixture.
28. As a technical interviewer, I want the ingestion port typed as a taxonomy of Planned-shaped Signals (`quote.received`, `contract.summarized`, `approval.stalled`, `registration.pace_updated`), so that the demo adapter and a future real planned.com adapter speak the same language.
29. As a reader of the repo, I want a design note on real Decision Detection (threshold rules over structured Signals, LLM only for unstructured residue, human review before routing), so that the hard problem is reasoned about, not faked.

### Portfolio view
30. As a program manager, I want a Portfolio tab rolling up the system of decisions — open/blocked/waiting/decided per event, escalation aging ("oldest with Mei Lin, 6 days"), Program Memory growth — so that I get mission control over the program.
31. As a program manager, I want program-wide escalation oversight to live in the Portfolio view (not a global admin inbox), so that oversight reads as intelligence, not surveillance.
32. As a demo visitor, I want the app to always open in the inbox with the Portfolio one tab away, so that the decision moment stays first (dashboard-second, by design).

### Live AI moment & engine picker
33. As an Owner, I want my free-text resolution reasoning distilled by a model into the one-to-two-sentence Precedent entry, so that my messy words come back as evidence-grade memory.
34. As a demo visitor, I want the Precedent to render immediately with my verbatim reasoning and quietly upgrade to the distilled version when it arrives (≤3s), so that AI never blocks or slows anything.
35. As a demo visitor, I want all AI failures (timeout, rate limit, proxy down) to be silent with the verbatim fallback, so that the demo never shows an AI error.
36. As a technical reviewer, I want an engine picker (Demo proxy / bring-your-own OpenRouter key / local Ollama URL) in a settings drawer, so that the AI port's adapters are a clickable feature, not just repo structure.
37. As a BYO-key user, I want my key kept in sessionStorage and sent only directly from my browser to the provider, so that it never touches the app's infrastructure.
38. As an Owner, I want AI-distilled text subtly marked as distilled, so that provenance is always visible.

### Demo state & first-run
39. As a returning visitor, I want my resolutions persisted (IndexedDB) across visits, so that the app feels real, with my Decided tab as proof.
40. As a demo visitor, I want a "Reset demo data" affordance in the settings drawer that restores pristine seed and re-arms the simulated feed, so that I can replay the full experience.
41. As a demo visitor, I want a stale seed (after a redeploy) to be version-stamp-detected and reseeded with a one-line toast, so that I never see a broken state.
42. As a recruiter with 90 seconds, I want to land directly in the inbox with the top Decision selected and no tour, so that the product explains itself.
43. As a recruiter on a phone, I want the full experience to work mobile (list → detail with back button), so that the link works wherever I open it.

### Repo as portfolio artifact
44. As a hiring manager, I want the README to read as the product story (problem, principles, verdict trail, live link), so that the repo demonstrates product judgment before code.
45. As a technical interviewer, I want CONTEXT.md and ADRs recording the language and the trade-offs, so that decisions are legible after the fact.
46. As a reviewer who clones the repo, I want the pipeline runnable without any API key (Ollama or canned adapter), so that nothing about the project gates on paid access.
47. As a reviewer, I want the Postgres adapter runnable via docker compose with the same contract suite as IndexedDB, so that the hexagonal claim is checkable, not asserted.

## Implementation Decisions

All decisions below were grilled and recorded; ADRs 0001–0005 and CONTEXT.md in the repo are authoritative.

- **Topology (ADR-0001):** Hexagonal TS core behind ports. Demo adapters (IndexedDB persistence, seeded data, pre-computed embeddings) are what GitHub Pages serves. Exactly two real adapters: persistence (Postgres, Docker/CI only, never hosted) and AI (Anthropic Haiku primary; Ollama free alternative; canned for CI). Ingestion, notifications, auth remain typed interfaces + stubs — documented planned.com seams.
- **Monorepo (ADR-0005):** npm workspaces — `packages/domain` (types + pure logic + ports; imports nothing), `packages/adapters`, `packages/pipeline`, `apps/web`, `apps/edge`. Dependency arrows point inward, enforced by package boundaries. Seed data is pipeline output checked in as versioned artifacts.
- **Domain language (CONTEXT.md):** Decision, Resolution, Owner, Signal, Detection, Open/Blocked/Escalated/Resolved lifecycle, Evidence = Cases + Exceptions + Precedents, Track Record counts Cases only, Pattern, Exception, Program Memory. Tabs are views: Needs you = Open + Blocked; Waiting = Escalated; Decided = Resolved.
- **Lifecycle state machine** (from the grill; prototype's three statuses were insufficient):

  ```
  detected → open ⇄ blocked
                ↘ escalated → open   (feedback returns; ownership retained)
             open → resolved          (spawns Precedent)
  [later, outside the demo: outcome known → Precedent becomes Case]
  ```

- **Memory loop mechanics:** seed includes deliberate sibling pairs — every headline Decision has ≥1 unresolved high-similarity sibling (quieter, non-headline) so the Precedent has a visible landing place. Precedent always written to Program Memory; the nudge appears only when a sibling exists.
- **Detection (ADR-0003):** ingestion port = taxonomy of Planned-shaped Signals (grounded in planned.com's actual surface: contract summaries, quote comparison tables, approval flows, registration data). Detection = threshold rules over Signals. Demo ships one scripted simulated-feed Signal, auto-fired once, honestly labeled.
- **Intelligence pipeline (ADR-0004):** five stages — generate (demo-only) → label outcomes → cluster & name Patterns → detect Exceptions → embed & emit. Two hard rules: (1) counts and outcomes never come from the LLM (clustering counts, extraction labels; LLM only names and narrates); (2) human review = PR review on diffable proposal files; CI validates the seed bundle against domain contracts, build fails on violation. Embeddings via a local open-source model; embedded text is the structured composite (type/title/problem/tags/event attributes), never recommendation or evidence text. No runtime embeddings anywhere; similarity at runtime is a table lookup over two emitted tables (decision→cases, decision→decisions).
- **Live AI (ADR-0002):** exactly one live moment — Precedent distillation. Engine picker: Demo (capped Cloudflare Worker proxy → Haiku; key in Worker secret; structured payload only; prompt built server-side; max_tokens capped; per-IP rate limit; Anthropic workspace spend cap as backstop), BYO OpenRouter key (browser-direct, sessionStorage), Local Ollama URL, canned fallback. Degradation contract: render verbatim immediately, swap in distilled ≤3s, all failures silent. AI is progressive enhancement, never a dependency.
- **Demo state:** IndexedDB persists across visits; "Reset demo data" affordance; seed version stamp with nuke-and-reseed on mismatch (no IndexedDB migrations — schema-evolution discipline is demonstrated in the Postgres adapter's migration files instead); no onboarding tour.
- **Multi-user:** persona switching (view filter, no auth); personas carry roles; senior personas (Chief of Staff, VP, Procurement Director) receive escalations in their own queues; escalatee view = same decision detail with feedback composer; notifications are in-app badges only (delivery is a planned.com seam). No global admin visibility — program-wide escalation oversight lives in the Portfolio view.
- **Portfolio view:** in scope, slice 4, opened with a mini variant round (2–3 sketches) before implementation. App always opens in the inbox.

## Testing Decisions

Tests protect external behavior, never implementation details; the single most protected artifact is the deployed demo link.

- **Recruiter-journey e2e (Playwright)** — the crown jewel: load → inbox renders, top Decision selected → resolve with typed reasoning → Precedent appears in sibling → persona-switch → answer escalation → feedback returns → Portfolio renders. Runs headless in CI on the built app with demo adapters. **Pages deploys are gated on it** — a stale demo beats a broken one.
- **Domain unit tests (Vitest)** on the rules that must never lie: lifecycle transitions, Track-Record-counts-Cases-only, Evidence composition, sibling routing. These are the executable form of CONTEXT.md.
- **Contract tests** — one suite, two persistence adapters (IndexedDB + Postgres-in-Docker, CI only). This is ADR-0001's proof.
- **Pipeline checks** — seed bundle validation against domain contracts (build-failing) + a small eval fixture set for the distillation prompt.
- **Daily live-link smoke test** — scheduled GitHub Action runs Playwright against the deployed URL (loads, decision resolvable), alerts on failure.
- **Deliberately not doing:** coverage targets, React component unit tests, visual-regression tooling, per-PR preview deploys.

Prior art: none in repo (prototype was deliberately test-free); these establish the patterns.

## Phasing (tracer-bullet slices — each ends with the live demo upgraded)

1. **Contracts + core loop** — domain package, inbox + action-first detail in TS, four verbs, IndexedDB, Precedent-lands-in-sibling, hand-converted prototype seed as stopgap; e2e + gated Pages deploy stand up day one.
2. **Pipeline + real corpus** — five stages, ~300 cases, Patterns/Exceptions/embeddings/sibling map, seed v2, review-as-PR exercised; simulated feed ships here.
3. **Personas + escalation return leg** — switcher, role-grouped seats, feedback composer, round-trip.
4. **Portfolio view** — mini variant round, then build.
5. **Live AI** — edge Worker, engine picker, distillation with swap-in degradation.
6. **Hardening + product narrative** — Postgres adapter + contract suite, daily smoke cron, README as product story, design notes polished.

## Out of Scope

- Real decision detection from raw documents (design note only; Planned's platform performs upstream extraction).
- Hosted backend of any kind beyond the single edge Worker; no hosted database, no auth/SSO, no real planned.com integration (seams only).
- Notification delivery (email/Slack) — in-app badges only.
- In-browser embeddings / semantic search (designated approach noted if a search feature ever lands).
- Hardware-scan / local-model-serving cookbook (Odysseus-style) — the engine picker captures the kernel.
- Global admin role with cross-program visibility outside the Portfolio view.
- IndexedDB migrations; outcome-becomes-known live in the demo (seed history only); portfolio-view-first entry.

## Further Notes

- Primary audience is **PM-role interviewers**: when scope pressure hits, protect the UI surface and the recruiter journey first; Postgres/contract work is deliberately last.
- Authoritative companion docs in repo: `CONTEXT.md` (glossary), `docs/adr/0001`–`0005`, prototype verdict trail in `prototype/NOTES.md`, handoff in `docs/handoff/`.
- Budget envelope confirmed: $0 standing (Pages + Workers free tier), <$1 one-time pipeline runs (Haiku, Batches optional), live-moment spend capped ≤$5/month via workspace cap.
