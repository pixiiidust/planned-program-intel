# Decision detection consumes Planned-shaped Signals; demo ships a simulated feed

How Decisions get created from real event data was the biggest open unknown. Researching planned.com showed the platform already emits structured artifacts — contract summaries (cancellation/attrition/payment terms), quote comparison tables vs budget lines, approval-flow state, registration/rooming data, policy checks. We therefore model the ingestion port as a taxonomy of **Signals** shaped like Planned's own data surface (`quote.received`, `contract.summarized`, `approval.stalled`, `registration.pace_updated`, ...), and treat detection primarily as threshold/rule evaluation over Signals — not raw-document understanding, which Planned's platform already performs upstream. LLM extraction is reserved for unstructured residue and is out of scope for this build.

The deployed demo exercises the ingestion port with a **simulated feed** demo adapter: one scripted `registration.pace_updated` Signal auto-fires once on first visit, visibly detected into a new Decision in the inbox, labeled "simulated feed" in the UI. Real detection logic beyond the scripted scenario is documented in a design note (`docs/design/decision-detection.md`), not built.

## Considered Options

- **Pure seed data, no ingestion shown**: rejected — the inbox reads as a static fixture and dodges the question interviewers will ask first.
- **Real detection from synthetic documents in the pipeline**: rejected — attempts the hard unsolved problem for weeks of work nobody sees run; Planned's upstream extraction makes it the wrong seam anyway.

## Consequences

- The demo adapter and a future real Planned integration adapter implement the same Signal-typed port — the integration seam is demonstrated, not just documented.
- Seed Decisions should each reference the Signal type that would have produced them, keeping the taxonomy honest across the corpus.
