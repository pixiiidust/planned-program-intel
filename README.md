# Planned Program Intel

**Live demo: https://pixiiidust.github.io/planned-program-intel/** — no login, no cold start, safe to break (Settings → Reset demo data).

An AI-native **decision layer** for enterprise event programs, built on [Planned](https://planned.com)'s business context. Not a chatbot — an inbox of decisions, each carrying its own justification and the evidence of past events, with a memory loop that turns every human resolution into the evidence future decisions cite.

Standalone demo today; architected to slot into Planned's enterprise stack as a module — the ports are the integration seams.

## Sixty seconds in the demo

1. The Lisbon contract decision is already open. Read the header: the problem, the urgency *with its because*, the action needed.
2. Click **Accept** — the reasoning is prefilled from the recommendation's why. Edit it, save.
3. The resolution lands instantly; a beat later **✦ distilled** marks that a model condensed your reasoning into a Precedent. Click **View**: it now appears in a similar open decision's evidence, with a provenance chip naming the engine.
4. The bell in the header replays everything that happened this session. The **Decided** tab survives a reload — persistence is real.
5. Twenty seconds in, the simulated feed detects a new decision from a registration-pace Signal — honestly labeled as simulated.

If the model call ever fails, nothing breaks and nothing apologizes: your verbatim reasoning is the baseline, distillation is the enhancement ([ADR-0002](docs/adr/0002-single-live-ai-moment-with-selectable-engines.md)).

## The problem

Enterprise event programs are streams of consequential decisions — a missing force-majeure clause on a venue hold, an AV quote 22% over benchmark, registration pacing behind plan. Today each one is re-researched from scratch, decided in a thread, and forgotten. The decision *and the reasoning behind it* evaporate, so the next event repeats the work and the mistakes.

This project is the layer that catches those decisions: surfaces them with justified urgency, routes them to the right owner, packages what worked and failed in similar past events, and writes the human's reasoning back into program memory.

Every decision answers six questions: what needs attention · who should decide · what happened in similar past events · what's different this time and why it matters · what action is recommended · accept, change, override — or escalate — and why.

## Principles

- **Everything justifies itself.** Urgency always carries its because (the deadline and the cost of missing it). Routing carries why-you. Differences carry why-they-matter. Nothing in the inbox is an unexplained score.
- **The Track Record never lies.** "Worked in 8 of 11 similar cases" counts only Cases with known outcomes. Fresh Precedents — recent resolutions whose outcomes aren't known yet — are shown as evidence but never counted.
- **AI is progressive enhancement.** Exactly one live model moment (Precedent distillation), capped and degradable; everything else AI-flavored is computed at build time by a reviewable pipeline. The demo works keyless, offline-built, and model-down.
- **Human authority is explicit.** Four verbs — accept, change, override, escalate — and every one records reasoning. Nothing executes autonomously.

The product language behind these — Decision, Resolution, Case, Precedent, Pattern, Track Record — is a maintained glossary: [`CONTEXT.md`](CONTEXT.md).

## How it was designed

The shape was settled by **six rounds of side-by-side prototype variants**, each round answering one question (inbox vs. dashboard, action-first vs. read-then-decide, evidence as inspectable cases, the four-verb workflow). The full verdict trail and data-model strawman: [`prototype/NOTES.md`](prototype/NOTES.md).

The same method carried into the real build: the activity timeline went through a design conversation and three variant rounds before a line of production code — [`docs/design/activity-timeline.md`](docs/design/activity-timeline.md). How decisions would really get detected from Planned-shaped Signals is reasoned through in [`docs/design/decision-detection.md`](docs/design/decision-detection.md).

The build plan itself is public: [PRD](docs/prd/2026-06-11-real-build-six-slices.md) → issues → six vertical slices, each shipped behind a CI-gated deploy.

## Verify the architecture claims

The deployed demo is a static page with seeded data — deliberately ([ADR-0001](docs/adr/0001-hexagonal-core-with-demo-and-real-adapters.md)): it must load instantly, never sleep, and cost $0 standing. The backend claims are proven in the repo instead:

**One suite, two adapters.** The persistence port has an IndexedDB demo adapter and a real Postgres adapter (migrations, advisory-locked runner, JSONB documents). One contract suite runs against both — the hexagonal claim made checkable:

```sh
docker compose up -d --wait
npm run test:contract:pg
docker compose down -v
```

**Keyless pipeline.** All corpus intelligence (similarity, patterns, exceptions, narration) is precomputed by a build-time pipeline ([ADR-0004](docs/adr/0004-build-time-intelligence-pipeline.md)) whose every stage runs without an API key on the canned engine; real engines are pluggable per run ([docs/pipeline-engines.md](docs/pipeline-engines.md)):

```sh
npm install
npm run -w @ppi/pipeline validate   # domain contracts over the shipped seed
```

**Selectable live engines.** The one live AI moment routes through your choice in Settings: the capped demo proxy (a single Cloudflare Worker, the only hosted state), your own OpenRouter key (browser-direct, sessionStorage-only), or local Ollama.

**A protected demo link.** Deploys are gated on the full Playwright journey (40 tests); a daily smoke drives the deployed site itself — load, resolve, Worker probe — and files an issue on failure. Stale beats broken.

## Repo map

| Workspace | What it is |
| --- | --- |
| `packages/domain` | Types, pure logic, ports — imports nothing ([ADR-0005](docs/adr/0005-npm-workspaces-monorepo.md)) |
| `packages/adapters` | Every port implementation, demo tier and real tier ([README](packages/adapters/README.md)) |
| `packages/pipeline` | Build-time intelligence CLI; seed data is its reviewed output |
| `apps/web` | The deployed demo |
| `apps/edge` | The single Cloudflare Worker (capped distillation proxy) |
| `prototype/` | The throwaway prototype that settled the design — kept as a record |

Decisions are written down as they're made: [`docs/adr/`](docs/adr/) (five ADRs), [`docs/design/`](docs/design/), and the issue trail.
