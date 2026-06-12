# Activity timeline: how it was designed

> Design note for the session activity timeline (#27, shipped `f404da2`). The point of
> recording it: the feature is small, the method is the artifact — a live design
> conversation, then three prototype variant rounds, each round settling one question
> before any production code was written.

## The problem

Every meaningful moment in the demo announces itself as a toast — a resolution landing,
a Precedent distilling, the feed detecting a new Decision — and then vanishes in four
seconds. Miss the toast, miss the moment. The original report: the ✦ distillation landing
was "too easy to miss," and there was no way to review what had happened this session.

## Conversation conclusions (before any pixels)

- **The record is a session-scoped "past toasts" timeline.** Every toast also appends an
  activity entry carrying exactly what the toast showed: message, relative time, jump
  link, and the live ✦ state.
- **No persistence — deliberately.** In-memory state, gone on reload. The Portfolio is
  the durable ledger; this is the recent narration stream, not a second Portfolio.
  Reset clears it.
- **Failures stay wordless in history too.** An entry gains `✦ distilled` only if
  distillation actually landed, and simply never gains it on failure — the same honest
  visibility the toast follows (ADR-0002).
- Capped at 20 entries, newest first.

## Variant-round verdicts

| Round | Question | Winner | Rejected |
| --- | --- | --- | --- |
| 1 | Panel form | **Quiet ledger** — white panel in the SettingsDrawer visual language, provenance-chip echo for ✦ | Timeline-spine; toast-replay |
| 2 | Trigger affordance | **Bell + neutral slate count badge** in the header flex | Text link; tab-style count; blue-dot indicator (rejected outright) |
| 3 | Row anatomy | **Meta-line-above** — tiny `2m ago · ✦ distilled` header line, message wraps full-width, View at the message end | Time-gutter (forced ugly wrapping); meta-below |

The live toast was restyled to the same white Quiet-ledger language during rounds 2–3,
with every e2e-asserted string and behavior unchanged.

## Behavioral semantics (settled in round 3)

- The badge increments the moment an entry is appended; it hides while the panel is open.
- Closing the panel marks all entries seen; an entry's **View** marks it seen immediately
  and navigates exactly like the toast's View — entries are not vanity.
- Unseen entries get a subtle highlight; reset clears the list.

## Where to look

- `apps/web/src/lib/activity.ts` — the pure entry domain (cap, seen-marking, unit-tested)
- `apps/web/src/components/ActivityPanel.tsx` — the Quiet-ledger panel
- Issue #27 — the full conversation and all three verdict comments
- The variant rounds themselves were dev-only throwaway code, mounted behind
  `import.meta.env.DEV` and deleted by the production build — the prototype discipline
  from `prototype/NOTES.md` applied to a single feature.
