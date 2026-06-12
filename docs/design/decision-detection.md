# Decision Detection: how Decisions would really get created

> Design note for the real system (ADR-0003 companion). The deployed demo ships a simulated feed
> that exercises the same Signal-typed port; everything below is reasoned about, not faked.

## The seam

Planned's platform already performs the hard extraction upstream: contract summaries (cancellation,
attrition, payment terms), quote comparisons against budget lines, approval-flow state, registration
and rooming pace, policy checks. Detection therefore does not read documents — it consumes
**Signals**, the structured events that surface of the platform already emits:

`quote.received` · `contract.summarized` · `approval.stalled` · `registration.pace_updated` · `policy.checked`

The ingestion port is typed as exactly this taxonomy. The demo's simulated feed and a future
planned.com adapter implement the same port — the integration seam is demonstrated in code, not
just documented.

## Detection is threshold rules over Signals

A Decision is *a choice that needs a human resolution* — most Signals don't qualify. Detection is
the judgment layer between transport and inbox: a small set of declarative rules, each one a
predicate over a single Signal's structured payload plus program context, producing either nothing
or a Decision with its urgency-because and routing reason.

Worked examples of the rule shape (payload fields → rule → Decision fields):

| Signal | Rule (illustrative thresholds) | What the Decision carries |
| --- | --- | --- |
| `registration.pace_updated` | pace < 75% of target AND days-out < 60 | urgency from days-out band; recommendation seeded from the Pattern with the best track record for this situation type |
| `quote.received` | quote > 110% of budget line, or > 100% with no contingency left | the variance, the line, the vendor-swap alternatives |
| `contract.summarized` | a required protection (force majeure, cancellation cap) absent AND hold deadline < 21 days | the missing clause, exposure amount, hold deadline |
| `approval.stalled` | stalled-days > approval-window − escalation-lead-time | the blocker, the cost of delay if quantifiable |
| `policy.checked` | check failed AND no standing exception on file | the policy id, the exception path |

Three properties matter more than the specific thresholds:

1. **Rules are inspectable.** Every detected Decision can show "why now" as the rule and the payload
   values that tripped it — the same everything-justifies-itself principle the rest of the product
   follows. A learned/opaque detector would break that contract at the front door.
2. **Rules are tunable per program.** The thresholds above are program policy, not constants. The
   natural evolution is per-program overrides (this team escalates at 80% pace, that one at 70%) —
   configuration, not code.
3. **Deduplication and refresh are part of detection.** Signals repeat (pace updates arrive weekly);
   a rule that already produced an open Decision for the same event+subject updates that Decision's
   facts and urgency instead of filing a duplicate. Resolution closes the loop; a re-trip after
   resolution is a new Decision that cites the prior one as a Precedent.

## Where an LLM belongs (and where it doesn't)

Not in the rules. Thresholds over structured payloads are cheaper, deterministic, auditable, and
already sufficient because Planned's platform did the understanding upstream.

The LLM's seat is the **unstructured residue** — the inputs that arrive as prose, not payloads:
a venue email warning about construction, a sales thread implying the keynote speaker may slip, a
slack message about a vendor dispute. There the model does what rules cannot — reads text and
proposes a *candidate* Signal (typed, structured, source-linked) — and that candidate then flows
through the same rule layer as any platform Signal. The LLM extends the Signal supply; it never
gets its own shortcut into the inbox. (Out of scope for this build; the seam it would plug into is
the same typed port.)

## Human review before routing

Detection creates Decisions; it does not assign work silently. The review gradient:

- **Platform-Signal detections** (high precision, structured provenance) route directly to the
  Owner's *Needs you* — the Decision itself is the reviewable artifact: rule, payload, and routing
  reason are all on it, and an Owner can dismiss with a reason. Dismissals are detection's
  feedback loop (a rule whose detections keep getting dismissed is mis-thresholded).
- **LLM-extracted candidates** get a human confirmation step *before* routing — the candidate
  Signal shows its source text and proposed typing; confirm-or-discard is a program-coordinator
  action, mirroring how the build-time pipeline treats LLM output (proposals reviewed in a PR;
  merge is the approval).

The demo's simulated feed exercises the first path end-to-end: one scripted
`registration.pace_updated` Signal, detected by the pace rule into a routed Decision, honestly
labeled "simulated feed" in the queue and the detail.
