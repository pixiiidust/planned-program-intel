# Hexagonal core; demo adapters deployed, exactly two real adapters

The deployed demo (GitHub Pages) must load instantly, never sleep, and cost $0 standing — it's a job-application artifact — while the repo must still demonstrate real backend architecture and leave integration seams open for planned.com. We chose a TypeScript domain core behind ports, with two adapter tiers: **demo adapters** are what the deployed app runs (IndexedDB persistence, seeded synthetic data, pre-computed embeddings); **real adapters** exist for exactly two ports — persistence (Postgres, via Docker locally and in CI, never hosted) and AI (Anthropic API, with an Ollama adapter as the free/offline alternative and a canned adapter for tests). All other ports (ingestion, notifications, auth) are typed interfaces with stub adapters only — documented planned.com integration seams, not built services.

## Considered Options

- **Full hosted stack** (Postgres + API server on free tiers): rejected — free-tier cold starts and DB pausing mean the demo link degrades exactly when unattended, which is when recruiters click it.
- **Client-only app, no ports**: rejected — no backend artifact at all; fails the "demonstrate backend architecture and SDLC" goal and leaves no integration seams.

## Consequences

- The persistence port is proven by one contract-test suite run against both the IndexedDB and Postgres adapters ("one suite, two adapters").
- Nothing hosted ever holds state or credentials except a single serverless function (see ADR on AI placement).
- The Postgres adapter is deliberately never deployed; a reviewer runs it via `docker compose` + the test suite.
