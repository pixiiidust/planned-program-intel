# Planned Program Intel

An AI-native decision layer for enterprise event programs: surfaces decisions, routes them to owners, packages evidence from past events, and turns human resolutions into program memory.

This file is the product glossary. Decisions about the build itself are recorded in [docs/adr/](docs/adr/) and [docs/design/](docs/design/); the product story is the [README](README.md).

## Language

### The decision moment

**Decision**:
A choice that needs a human resolution, attached to one event — with a problem, justified urgency, a recommendation, and evidence.
_Avoid_: Task, ticket, item

**Resolution**:
The human's recorded answer to a Decision — one of the four verbs (accept / change / override / escalate) plus their reasoning.
_Avoid_: Outcome (reserved for Cases), answer

**Owner**:
The person a Decision is routed to, with the stated routing reason. Escalation keeps ownership with the Owner; the Decision is *with* the escalatee.

### Lifecycle

**Open**:
A Decision that is with its Owner and actionable now.
_Avoid_: Pending, needs_decision

**Blocked**:
An Open-adjacent state where a named external dependency prevents the recommended action. Blocked Decisions still appear in *Needs you* — the Owner's next move is breaking the block, never waiting it out.

**Escalated**:
The Decision has been sent to a suggested person for feedback, by the Owner's choice. Ownership stays with the Owner; the Decision is *with* the escalatee and returns to Open when feedback arrives. Not terminal.

**Resolved**:
The Decision carries a Resolution. Spawns a Precedent. Later, when the Resolution's Outcome becomes known, that Precedent becomes a Case.

**Needs you / Waiting / Decided**:
Queue tabs — views over states, not states. Needs you = Open + Blocked. Waiting = Escalated. Decided = Resolved.

### Evidence

**Evidence**:
The inspectable backing for a recommendation: Cases (outcome known) + Exceptions + Precedents (outcome pending). Only Cases count toward the Track Record.

**Case**:
A past, similar decision from a previous event whose outcome is known (worked or failed). Similarity-ranked within Evidence.
_Avoid_: Example, record, history item

**Precedent**:
A recent Resolution surfaced in a similar open Decision's Evidence — carries the decider, reasoning, and recency, but no outcome yet. Excluded from worked/failed counts until its outcome is known, at which point it becomes a Case.
_Avoid_: Pending case, recent case

**Outcome**:
Whether a Case worked or failed. A Resolution has no Outcome at decision time; the Outcome is established later.

**Track Record**:
The "worked X of Y similar cases" figure attached to a recommendation. Counts Cases only — never Precedents, never a bare score.
_Avoid_: Confidence score, accuracy

**Pattern**:
A named cluster of Cases with a shared approach and a count (e.g. "Pair the addendum request with a deposit-timing trade — 29 of 41 successes"), plus a takeaway.

**Exception**:
A named subgroup of Cases where the usual Pattern behaves differently, with why it matters now (e.g. "Government-owned venues took 2–4× longer").

### Ingestion

**Signal**:
A structured platform event about an event program (a quote received, an approval stalled, a registration-pace update, a contract summarized) from which Decisions are detected.
_Avoid_: Event (collides with the corporate event itself), trigger, webhook

**Detection**:
The evaluation of Signals against thresholds and rules that creates a Decision and routes it to an Owner.
_Avoid_: Ingestion (that's the transport, not the judgment)

### Memory

**Distillation**:
The condensation of a Resolution's free-text reasoning into the one-to-two-sentence form a Precedent carries. Progressive enhancement: verbatim reasoning is always the baseline, and distilled text is always marked as distilled.
_Avoid_: Summarization (loses the "essence for a future decider" intent), AI rewrite

**Program Memory**:
The accumulated body of Cases, Patterns, Exceptions, and Precedents across all events. Every Resolution writes into it; future similar Decisions read from it as Evidence.
_Avoid_: Knowledge base, history
