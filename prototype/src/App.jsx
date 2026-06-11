// PROTOTYPE — converged single design after six variant rounds (see NOTES.md
// for the verdict trail). Decisions live in memory; accept/change/override
// produces program memory, escalate routes for feedback.
import React, { useState } from 'react';
import { INITIAL_DECISIONS } from './data.js';
import InboxShell from './InboxShell.jsx';

export default function App() {
  const [decisions, setDecisions] = useState(INITIAL_DECISIONS);

  // The one "mutation": a human resolves (or escalates) a decision.
  // Accept/change/override → decided + program memory. Escalate → waiting.
  function resolveDecision(id, outcome) {
    setDecisions((ds) =>
      ds.map((d) => {
        if (d.id !== id) return d;
        if (outcome.choice === 'escalated') {
          return {
            ...d,
            status: 'escalated',
            escalation: { to: outcome.escalatedTo, reasoning: outcome.reasoning, requestedBy: d.owner.name, daysAgo: 0 },
          };
        }
        return {
          ...d,
          status: 'decided',
          resolution: {
            choice: outcome.choice,
            reasoning: outcome.reasoning,
            changedTo: outcome.changedTo,
            decidedBy: d.owner.name,
            daysAgo: 0,
          },
        };
      })
    );
  }

  return <InboxShell decisions={decisions} resolveDecision={resolveDecision} />;
}
