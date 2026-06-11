// The four verbs (the resolution moment): Accept prefills the reasoning from
// the recommendation's why; Change prefills the action for editing; Override
// captures disagreement as future evidence; Escalate routes to
// system-suggested people with reason chips and their authority stated.
import { useState } from 'react';
import type { Decision, ResolutionChoice } from '@ppi/domain';

export const MEMORY_NOTE =
  'Saved to program memory — when a similar decision comes up in a future event, this reasoning will appear in its evidence.';

export type ResolveOutcome =
  | { choice: ResolutionChoice; reasoning: string; changedTo?: string }
  | { choice: 'escalated'; escalatedTo: string; reasoning: string };

type Mode = ResolutionChoice | 'escalated';

const CHANGE_CHIPS = ['Timing doesn’t fit this event', 'Budget reality differs from the model', 'Vendor context the system missed', 'Stakeholder preference'];
const OVERRIDE_CHIPS = ['Exec or client preference', 'Local context the system missed', 'Risk appetite differs here', 'Relationship outweighs the savings'];
const ESCALATE_CHIPS = [
  'The recommendation feels unsound but I can’t pinpoint why',
  'Needs domain expertise I don’t have',
  'Outside my decision authority',
  'Constraints conflict — need a second opinion',
];

const MODES: { key: Mode; label: string; sub: string; btn: string }[] = [
  { key: 'accepted', label: 'Accept', sub: 'proceed as recommended', btn: 'bg-emerald-600 hover:bg-emerald-700' },
  { key: 'changed', label: 'Change', sub: 'right direction, wrong details — adjust it', btn: 'bg-amber-500 hover:bg-amber-600' },
  { key: 'overridden', label: 'Override', sub: 'wrong call for this event — do something else', btn: 'bg-purple-600 hover:bg-purple-700' },
  { key: 'escalated', label: 'Escalate', sub: 'unsure? route it for feedback', btn: 'bg-sky-600 hover:bg-sky-700' },
];

export function ActionPanel({ decision: d, onResolve }: { decision: Decision; onResolve: (outcome: ResolveOutcome) => void }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [changedTo, setChangedTo] = useState('');
  const [escalateTo, setEscalateTo] = useState<string | null>(null);

  function enter(m: Mode) {
    setMode(m);
    setReasoning(m === 'accepted' ? d.recommendation.why : '');
    setChangedTo(m === 'changed' ? d.recommendation.action : '');
    setEscalateTo(d.escalationPaths[0]?.name ?? null);
  }

  function addChip(text: string) {
    setReasoning((r) => (r.trim() ? `${r.trim()} ${text}.` : `${text}.`));
  }

  const canSave =
    mode === 'accepted'
      ? true
      : mode === 'escalated'
        ? !!escalateTo && reasoning.trim().length > 0
        : reasoning.trim().length > 0 && changedTo.trim().length > 0;

  function submit() {
    if (!mode) return;
    if (mode === 'escalated') {
      if (!escalateTo) return;
      onResolve({ choice: 'escalated', escalatedTo: escalateTo, reasoning: reasoning.trim() });
    } else {
      onResolve({
        choice: mode,
        reasoning: reasoning.trim() || d.recommendation.why,
        ...(mode === 'changed' || mode === 'overridden' ? { changedTo: changedTo.trim() } : {}),
      });
    }
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
              aria-label="What will you do instead?"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          )}

          {mode === 'escalated' && (
            <div className="space-y-1.5">
              {d.escalationPaths.map((p) => (
                <label
                  key={p.name}
                  className={`flex items-start gap-2 rounded-md ring-1 px-3 py-2 cursor-pointer ${
                    escalateTo === p.name ? 'ring-sky-400 bg-sky-50' : 'ring-slate-200 hover:bg-slate-50'
                  }`}
                >
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
            aria-label="Your reasoning"
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
            {!canSave && (
              <span className="text-xs text-slate-400">{mode === 'escalated' ? 'pick a person and say what feels off' : 'fill in the fields above'}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
