# PROTOTYPE (#18) — Portfolio view mini variant round (throwaway)

**Question:** What shape should the program-level Portfolio view take — the rollup of
open/blocked/waiting/decided per event, escalation aging, and Program Memory growth?

Run it: `npm run dev -w @ppi/web` → click **Portfolio** in the header (dev-only toggle;
production builds never mount any of this). Switch variants with the floating bar,
`←`/`→` keys, or `?variant=A|B|C`.

## The variants

| Key | Name | Organizing idea |
|---|---|---|
| A | **Program ledger** | The portfolio as a balance sheet — one uniform row per event (state bar, next deadline, escalation chip, memory written); anomalies pop because rows are comparable. |
| B | **Attention briefing** | The triage is already done — ranked cards of what ages worst (escalations → blocked → deadline-critical), healthy events demoted to one quiet line, "the program is learning" footer. Intelligence, not surveillance. |
| C | **Decision flow** | The program as a system made visible — lifecycle states as left-to-right flow columns with per-event breakdowns, condensing into a Program Memory panel with a cumulative-resolutions chart. |

All three compute every number live from the real seed (`eventRollups` / `memoryStats`
in `rollup.ts`, prototype-local on purpose — nothing added to `@ppi/domain`).

## Verdict

_Pending — Jamie picks a winner or a mix. Record what won and why here, then build it
properly in #19 and delete this folder._
