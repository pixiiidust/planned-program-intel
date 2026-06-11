# Planned Program Intel

An AI-native **decision layer** for enterprise event programs, built on [Planned](https://planned.com)'s business context. Not a chatbot — a decision-routing layer.

**Live demo:** https://pixiiidust.github.io/planned-program-intel/

Standalone-first: the app works as a functional demo with its own data, and is architected to later integrate into Planned's enterprise stack as a module.

## Context

Planned helps enterprise teams move events from brief to delivery: venue sourcing, quotes, contracts, budgets, approvals, payments, reporting. Its constraints are real enterprise constraints: human approvals, vendor availability, policy rules, budget limits, legal/procurement checks, stakeholder coordination.

## What it does

- Surfaces the next important decision across the event lifecycle
- Routes it to the best customer-side decision maker
- Packages the evidence: what worked, what failed, what's different now — and why it matters
- Lets planners accept, change, or override with reasoning — or escalate for feedback when something feels unsound
- Turns that reasoning into program memory, cited as evidence by future similar decisions

The goal: every event-program decision gets faster, better-contextualized, and reusable across the portfolio — without chatbot loops, manual research, or rereading past events.

## The decision moment

Every decision answers six questions:

1. What needs attention?
2. Who should decide?
3. What happened in similar past events?
4. What's different this time — and why does it matter?
5. What action is recommended?
6. Accept, change, override — or escalate — and why?

The dashboard comes second: mission control over the system of decisions (open, blocked, routed, decided, learned), not the starting point.

## Operating principles

- Human decision authority stays explicit; high-risk decisions are never executed autonomously
- Confidence is evidence: "worked in 95 of 106 similar cases" — never an unexplained score
- Urgency is justified, not asserted: the deadline, the cost of missing it, and how reversible the loss is
- Policy, budget, legal, and stakeholder constraints are part of the intelligence layer, not afterthoughts

## Prototype findings

A working prototype lives in [`prototype/`](prototype/) (`cd prototype && npm install && npm run dev`). Six rounds of side-by-side variants converged on:

- An **inbox shape** (queue + detail) over a mission-control board or a sequenced briefing flow
- An **action-first detail**: 3-point header (problem / justified urgency / action), recommendation on top, evidence folded below
- **Evidence as inspectable cases**: a flat, similarity-ranked case list with outcome filters and named exceptions
- A **four-verb workflow**: accept (reasoning prefilled) / change / override / escalate — every resolution becomes program memory

Full verdict trail, data-model strawman, and open questions: [`prototype/NOTES.md`](prototype/NOTES.md).

## AI posture

Retrieval, scoring, workflow intelligence, and human-in-the-loop decision support — not autonomous agents, not RL.

- **Prediction:** risk, bottlenecks, similarity to past events
- **Optimization:** next best action under policy and program constraints
- **Execution:** route the decision, show the evidence, capture the human reasoning
