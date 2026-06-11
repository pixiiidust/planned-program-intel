# PROTOTYPE — Planned Program Intel (throwaway)

**Status: CONVERGED.** Six rounds of variant comparison produced a single design. The variant switcher and losing variants are deleted; what runs now is the answer.

Run it: `cd prototype && npm install && npm run dev` → http://localhost:5173
Works on mobile and desktop (list → detail with back button on small screens).

## The question this prototype answered

What shape should an AI-native decision layer for enterprise event programs take — the decision moment, the evidence, the human override loop, and the queue around them? ("Is this what you meant?")

## Verdict trail

| Round | Question | Winner |
|---|---|---|
| 1 | Overall shape: inbox triage vs mission-control board vs sequenced briefing | **Inbox** (queue + detail pane) |
| 2 | Detail hierarchy: read-then-decide vs portfolio-grouped vs action-first | **Action-first** (recommendation + call panel on top, evidence folds below, collapsed by default) |
| 3 | Evidence at scale (2 → 100+ cases): exemplars vs pattern digest vs case explorer | **Case Explorer** (inspectable cases) |
| 4 | Explorer structure: flat vs grouped-by-pattern vs compact drill-down | **Flat list**, similarity-ranked, outcome filter chips |
| 5 | Queue rows (person + status + time) & history organization | **Status-aware rows** + right-aligned time column (adopted from the compact-timeline variant); escalation keeps ownership ("With Mei Lin · escalated by Dana Ortiz") |
| 6 | Urgency label treatment: chip vs colored text vs dot+text | **Chip badge**, height-locked to the text line, outdented so its first letter aligns with the P of PROBLEM / A of ACTION |

## The converged design (what's in the code)

- **3-point header**: headline, then PROBLEM / urgency-chip+because / ACTION rows on a shared 110px label column. The urgency chip carries a tap-to-open rubric popover tying levels to business outcomes (irreversible money/dates/trust → critical; compounding recoverable cost → high; bounded cost-of-delay → medium; minimal → low).
- **Action-first call panel**: recommendation + "Why" + track record ("Worked in 95 of 106 similar cases (…)", small-sample caveat under n=5), then four actions: **Accept** (reasoning prefilled from the rec's why) / **Change** ("right direction, wrong details", action prefilled) / **Override** ("wrong call for this event") / **Escalate** (route to system-suggested people with reason chips).
- **Program memory loop**: every resolution saves reasoning; wording: "when a similar decision comes up in a future event, this reasoning will appear in its evidence."
- **Evidence**: flat Case Explorer — worked/failed proportion bar, outcome filters, similarity-ranked top-k case list, exceptions behind a filter chip.
- **Queue**: three tabs (Needs you / Waiting / Decided), each with **sort + time-filter dropdowns** (needs-you filters by deadline ahead; waiting/decided by elapsed time with a Custom range… reveal). Rows are status-aware with right-aligned time; decided rows show choice + decider, never a due date. Tab switch auto-selects the top item; resolving auto-advances with a jump-to toast.
- **Decision logic discipline**: urgency always carries a "because" (deadline + cost of missing); differences always carry "why it matters"; recommendations must use their own evidence patterns; plain language, one fact per sentence.

## Strawman data model (src/data.js) — the implied product architecture

`decision { title, problem, actionNeeded, event, type, urgency {level, because}, dueIn, status, owner {name, role, whyRouted}, recommendation {action, why, track {worked, total, basis}}, evidence {caseCount, workedCount, patterns[{outcome, title, count, example, takeaway}], exceptions[], cases[{event, similarity, outcome, patternIndex?, detail, tags}]}, whatsDifferent [{change, whyItMatters}], risks[], constraints[], escalationPaths[{name, role, why}], resolution {choice, reasoning, changedTo?, decidedBy, daysAgo}, escalation {to, reasoning, requestedBy, daysAgo} }`

Implied AI capabilities: decision detection, owner routing (policy-aware), case retrieval ranked by similarity, **case clustering into named patterns with counts**, exception detection, urgency scoring with business-outcome justification, and memory write-back into future evidence.

## What this prototype did NOT test (open for the real build)

- Real data ingestion (briefs, contracts, budgets) and how decisions get *detected*
- Multi-user: routing notifications, the escalatee's experience, feedback returning to the owner
- Memory actually influencing the next recommendation (the loop is captured, not closed)
- Portfolio/program-level view across events (deliberately deferred — round 1 rejected dashboard-first, not dashboards entirely)

## When promoting

Rewrite, don't copy — this code was written under prototype constraints (no tests, minimal error handling, Tailwind CDN, in-memory state). The thing worth keeping is this document plus `src/data.js` as the data-model strawman.
