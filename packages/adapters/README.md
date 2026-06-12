# @ppi/adapters

Adapters are the outside edge of the domain ports.

The demo tier is deliberately local: IndexedDB persistence, seeded Decisions,
personas, and the scripted feed keep the deployed app self-contained. The real
tier holds the backend credibility artifacts: Postgres persistence and AI
adapters that speak the same domain ports.

## Persistence Contract

ADR-0001 calls for one suite against two adapters. The shared contract proves
that IndexedDB and Postgres both implement `DecisionRepository`:

- first load seeds without showing a reseed
- saved Decisions survive a fresh repository over the same storage
- whole Decision JSON documents round-trip
- seed-version mismatches nuke and reseed visibly
- reset restores the pristine seed

Run the Postgres leg locally:

```sh
docker compose up -d --wait
npm run test:contract:pg
docker compose down -v
```

Build or update the schema directly:

```sh
PPI_PG_URL=postgres://ppi:ppi@localhost:5499/ppi npm run -w @ppi/adapters db:migrate
```

PowerShell:

```powershell
$env:PPI_PG_URL='postgres://ppi:ppi@localhost:5499/ppi'; npm run -w @ppi/adapters db:migrate
```

Postgres is never hosted and never imported by the web bundle; the deployed
demo keeps IndexedDB by design. See
[ADR-0001](../../docs/adr/0001-hexagonal-core-with-demo-and-real-adapters.md).
