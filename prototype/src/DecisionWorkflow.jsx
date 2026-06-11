// PROTOTYPE — shared decision workflow (v3, after second feedback round).
// Fixed across all variants; only evidence presentation differs per variant.
//  - TrackRecord is text-only ("Worked in 95 of 106 similar cases (…)") —
//    dots don't scale past a handful of cases. Small samples get a caveat.
//  - UrgencyBadge has a tap-friendly popover with a rubric that ties each
//    level to a business outcome (money, dates, trust).
import React, { useState } from 'react';
import { agoLabel } from './data.js';

export const MEMORY_NOTE =
  'Saved to program memory — when a similar decision comes up in a future event, this reasoning will appear in its evidence.';

export const URGENCY_RUBRIC = {
  critical: 'Likely irreversible business loss within days if no one acts — committed money, locked dates, or stakeholder trust.',
  high: 'Material cost or risk that compounds quickly. Recoverable, but every day of delay is expensive.',
  medium: 'Real but bounded cost of delay. Decide inside the stated window and nothing is lost.',
  low: 'Minimal downside either way. Batch it with other calls.',
};

export const URGENCY_STYLE = {
  critical: 'bg-red-100 text-red-700 ring-red-200',
  high: 'bg-orange-100 text-orange-700 ring-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  low: 'bg-slate-100 text-slate-600 ring-slate-200',
};

// Wraps any urgency-label rendering with the rubric popover. The trigger's
// appearance is supplied by the variant; this only owns the open/close state
// and the panel. align-top keeps the trigger on the cell's first text line.
export function UrgencyTrigger({ urgency, className = '', children }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block shrink-0 align-top">
      <button onClick={() => setOpen((o) => !o)} className={`${className} cursor-help`} title="What do these levels mean?">
        {children}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 w-[19rem] max-w-[80vw] z-40 rounded-lg bg-slate-900 text-slate-100 p-3.5 shadow-xl text-left">
            <p className="text-xs font-semibold mb-2.5 text-slate-300">
              Urgency = size and reversibility of the business loss if nobody acts.
            </p>
            {Object.entries(URGENCY_RUBRIC).map(([k, v]) => (
              <p key={k} className={`text-xs mb-2 leading-snug ${k === urgency.level ? 'text-white' : 'text-slate-500'}`}>
                <span className={`font-bold uppercase ${k === urgency.level ? 'text-amber-300' : ''}`}>{k}</span> — {v}
              </p>
            ))}
          </div>
        </>
      )}
    </span>
  );
}

// Evidence-based confidence, text only — scales from 1 case to hundreds.
export function TrackRecord({ track }) {
  return (
    <div className="mt-2">
      <p className="text-sm text-slate-600">
        Worked in <span className="font-semibold text-slate-800">{track.worked} of {track.total}</span> similar cases{' '}
        <span className="text-slate-500">({track.basis})</span>
      </p>
      {track.total < 5 && (
        <p className="text-xs text-amber-600 mt-0.5">Small sample — treat as an anecdote, not a pattern.</p>
      )}
    </div>
  );
}

const CHANGE_CHIPS = ['Timing doesn’t fit this event', 'Budget reality differs from the model', 'Vendor context the system missed', 'Stakeholder preference'];
const OVERRIDE_CHIPS = ['Exec or client preference', 'Local context the system missed', 'Risk appetite differs here', 'Relationship outweighs the savings'];
const ESCALATE_CHIPS = ['The recommendation feels unsound but I can’t pinpoint why', 'Needs domain expertise I don’t have', 'Outside my decision authority', 'Constraints conflict — need a second opinion'];

const MODES = [
  { key: 'accepted', label: 'Accept', sub: 'proceed as recommended', btn: 'bg-emerald-600 hover:bg-emerald-700' },
  { key: 'changed', label: 'Change', sub: 'right direction, wrong details — adjust it', btn: 'bg-amber-500 hover:bg-amber-600' },
  { key: 'overridden', label: 'Override', sub: 'wrong call for this event — do something else', btn: 'bg-purple-600 hover:bg-purple-700' },
  { key: 'escalated', label: 'Escalate', sub: 'unsure? route it for feedback', btn: 'bg-sky-600 hover:bg-sky-700' },
];

export function ActionPanel({ decision: d, onResolve }) {
  const [mode, setMode] = useState(null);
  const [reasoning, setReasoning] = useState('');
  const [changedTo, setChangedTo] = useState('');
  const [escalateTo, setEscalateTo] = useState(null);

  function enter(m) {
    setMode(m);
    setReasoning(m === 'accepted' ? d.recommendation.why : '');
    setChangedTo(m === 'changed' ? d.recommendation.action : '');
    setEscalateTo(d.escalationPaths[0]?.name ?? null);
  }

  function addChip(text) {
    setReasoning((r) => (r.trim() ? `${r.trim()} ${text}.` : `${text}.`));
  }

  const canSave =
    mode === 'accepted'
      ? true
      : mode === 'escalated'
        ? !!escalateTo && reasoning.trim().length > 0
        : reasoning.trim().length > 0 && changedTo.trim().length > 0;

  function submit() {
    onResolve({
      choice: mode,
      reasoning: reasoning.trim() || d.recommendation.why,
      changedTo: mode === 'changed' || mode === 'overridden' ? changedTo.trim() : undefined,
      escalatedTo: mode === 'escalated' ? escalateTo : undefined,
    });
    setMode(null);
  }

  const chips = mode === 'changed' ? CHANGE_CHIPS : mode === 'overridden' ? OVERRIDE_CHIPS : mode === 'escalated' ? ESCALATE_CHIPS : [];

  return (
    <div className="rounded-lg bg-white ring-1 ring-slate-200 p-4">
      {!mode ? (
        <div>
          <p className="text-sm text-slate-500 mb-3">Your call:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MODES.filter((m) => m.key !== 'escalated' || d.escalationPaths.length > 0).map((m) => (
              <button key={m.key} onClick={() => enter(m.key)} className={`rounded-md text-white text-left px-4 py-2.5 ${m.btn}`}>
                <span className="block text-sm font-semibold">{m.label}</span>
                <span className="block text-xs opacity-85">{m.sub}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            {mode === 'accepted' && 'Accepting — the recommendation’s justification is prefilled below. Edit it or save as-is.'}
            {mode === 'changed' && 'Changing — edit the action below, then say why the original didn’t fit.'}
            {mode === 'overridden' && 'Overriding — what will you do instead, and why is the recommendation wrong for this event?'}
            {mode === 'escalated' && 'Escalating — who should weigh in, and what feels off?'}
          </p>

          {(mode === 'changed' || mode === 'overridden') && (
            <input
              value={changedTo}
              onChange={(e) => setChangedTo(e.target.value)}
              placeholder="What will you do instead?"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          )}

          {mode === 'escalated' && (
            <div className="space-y-1.5">
              {d.escalationPaths.map((p) => (
                <label key={p.name} className={`flex items-start gap-2 rounded-md ring-1 px-3 py-2 cursor-pointer ${escalateTo === p.name ? 'ring-sky-400 bg-sky-50' : 'ring-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" checked={escalateTo === p.name} onChange={() => setEscalateTo(p.name)} className="mt-1" />
                  <span className="text-sm">
                    <span className="font-medium">{p.name}</span> · {p.role}
                    <span className="block text-xs text-slate-500">{p.why}</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <button key={c} onClick={() => addChip(c)} className="text-xs rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1">
                  + {c}
                </button>
              ))}
            </div>
          )}

          <textarea
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            rows={3}
            placeholder={mode === 'accepted' ? 'Optional — edit the prefilled justification.' : 'Your reasoning (chips above help). Required.'}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-slate-400">{MEMORY_NOTE}</p>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={submit}
              disabled={!canSave}
              className={`px-4 py-2 rounded-md text-sm font-medium text-white ${canSave ? 'bg-slate-900 hover:bg-slate-700' : 'bg-slate-300 cursor-not-allowed'}`}
            >
              {mode === 'escalated' ? 'Send for feedback' : 'Save decision'}
            </button>
            <button onClick={() => setMode(null)} className="px-3 py-2 rounded-md text-sm text-slate-500 hover:bg-slate-100">
              Back
            </button>
            {!canSave && <span className="text-xs text-slate-400">{mode === 'escalated' ? 'pick a person and say what feels off' : 'fill in the fields above'}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export function ResolutionBanner({ res }) {
  const style = {
    accepted: 'bg-emerald-50 ring-emerald-300',
    changed: 'bg-amber-50 ring-amber-300',
    overridden: 'bg-purple-50 ring-purple-300',
  }[res.choice];
  return (
    <div className={`rounded-lg p-4 ring-1 ${style}`}>
      <p className="text-sm font-semibold capitalize">
        {res.choice} by {res.decidedBy} · {agoLabel(res.daysAgo)}
      </p>
      {res.changedTo && (
        <p className="text-sm mt-1">
          <span className="font-medium">Doing instead:</span> {res.changedTo}
        </p>
      )}
      <p className="text-sm text-slate-700 mt-1">“{res.reasoning}”</p>
      <p className="text-xs text-slate-500 mt-2">{MEMORY_NOTE}</p>
    </div>
  );
}

export function EscalationBanner({ esc }) {
  return (
    <div className="rounded-lg p-4 ring-1 bg-sky-50 ring-sky-300 mb-4">
      <p className="text-sm font-semibold">Waiting on feedback from {esc.to}</p>
      <p className="text-xs text-slate-500 mt-0.5">requested by {esc.requestedBy} · {agoLabel(esc.daysAgo)}</p>
      <p className="text-sm text-slate-700 mt-1.5">“{esc.reasoning}”</p>
      <p className="text-xs text-slate-500 mt-2">You can still make the call below once feedback arrives.</p>
    </div>
  );
}
