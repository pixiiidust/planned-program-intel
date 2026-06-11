# Planned Program Intel

Planned Program Intel is a product-strategy prototype for a customer-facing decision layer inside enterprise event programs.

## Background Context of Planned.com

Planned helps enterprise teams move events from brief to delivery: sourcing venues, collecting quotes, managing contracts, tracking budgets, approvals, payments, and reporting.

Its goal is to help teams plan compliant, cost-controlled events faster. Its constraints are real enterprise constraints: human approvals, vendor availability, policy rules, budget limits, legal/procurement checks, and stakeholder coordination.

## Product intent

Planned Program Intel should:

- Surface the next important decision across the event lifecycle.
- Route it to the best customer-side decision maker.
- Package the evidence needed to act: what worked, what failed, what changed, and what to do next.
- Let planners accept, change, or override the recommendation with reasoning.
- Turn that reasoning into program memory so future decisions get smarter.

The goal is to help planners act without chatbot loops, manual research, or guesswork.

## AI-native framing

An AI-native application perceives its environment and takes actions that maximize its chance of achieving its goals.

For this project, the AI-native system is not a chatbot. It is a decision-routing layer for event-program work.

**Environment**

- Current event state: brief, budget, timeline, audience, region, vendors, contracts, approvals, and delivery status
- Program context: policies, preferred suppliers, historical outcomes, similar events, prior decisions, and override reasoning
- User context: which customer-side owner is best positioned to act next

**Actions**

- Detect the next decision that needs attention
- Route the decision to the right decision maker
- Retrieve similar past events and relevant policy context
- Explain what worked, what failed, and what is different now
- Recommend the next best action
- Capture accept, change, or override reasoning
- Feed that reasoning back into future recommendations

**Goal**

Make every event-program decision faster, better-contextualized, and more reusable across the customer’s event portfolio.

**Constraints**

- Human decision authority stays explicit
- Recommendations must be inspectable and evidence-backed
- High-risk decisions are not autonomously executed
- Policy, budget, legal, procurement, and stakeholder constraints are part of the intelligence layer
- The product should avoid chatbot loops and avoid forcing planners to manually reread past events

## Product approach

The product starts from the decision moment, not from a passive dashboard.

Planned Program Intel should first answer:

1. What decision needs attention?
2. Who should make it?
3. What happened in similar past events?
4. What is different this time?
5. What action is recommended?
6. Do we accept, change, or override — and why?

The dashboard then becomes mission control for the system of decisions: a place to see which decisions are open, blocked, routed, accepted, changed, overridden, and learned from over time.

The closed loop matters: every accepted recommendation, change, or override becomes structured program memory that can improve the next decision.

## Recommended AI posture

This is best framed as retrieval, scoring, workflow intelligence, and human-in-the-loop decision support — not fully autonomous agents and not RL.

The useful intelligence is modular:

- **Prediction:** identify risk, likely bottlenecks, missing context, and similarity to past events
- **Optimization:** recommend the next best decision or escalation path under policy and program constraints
- **Execution:** route the decision, show the evidence, and capture human reasoning

