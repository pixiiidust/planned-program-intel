// The action-first Decision detail (#9) — the converged design from
// prototype/NOTES.md rounds 2, 4, 6: 3-point header on a shared label column,
// call panel on top, evidence folds below collapsed by default.
import type { Decision, Escalation, Resolution } from '@ppi/domain';
import { isSmallSample } from '@ppi/domain';
import type { ReactNode } from 'react';
import { agoLabel } from '../lib/format.js';
import { CaseExplorer } from './CaseExplorer.js';
import { Fold } from './Fold.js';
import { UrgencyTrigger } from './UrgencyRubric.js';

function HeaderRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  // Both columns sit on the same 20px line grid so the label's first line
  // aligns exactly with the body's first line.
  return (
    <div className="sm:grid sm:grid-cols-[110px_1fr] sm:gap-3">
      <dt className="mb-0.5 sm:mb-0 leading-5">
        {typeof label === 'string' ? (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 leading-5">{label}</span>
        ) : (
          label
        )}
      </dt>
      <dd className="text-sm text-slate-700 leading-5">{children}</dd>
    </div>
  );
}

function TrackRecordLine({ decision: d }: { decision: Decision }) {
  const track = d.recommendation.track;
  return (
    <div className="mt-2">
      <p className="text-sm text-slate-600">
        Worked in{' '}
        <span className="font-semibold text-slate-800">
          {track.worked} of {track.total}
        </span>{' '}
        similar cases <span className="text-slate-500">({track.basis})</span>
      </p>
      {isSmallSample(track) && <p className="text-xs text-amber-600 mt-0.5">Small sample — treat as an anecdote, not a pattern.</p>}
    </div>
  );
}

function ResolutionBanner({ res }: { res: Resolution }) {
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
    </div>
  );
}

function EscalationBanner({ esc }: { esc: Escalation }) {
  return (
    <div className="rounded-lg p-4 ring-1 bg-sky-50 ring-sky-300">
      <p className="text-sm font-semibold">Waiting on feedback from {esc.to}</p>
      <p className="text-xs text-slate-500 mt-0.5">
        requested by {esc.requestedBy} · {agoLabel(esc.daysAgo)}
      </p>
      <p className="text-sm text-slate-700 mt-1.5">“{esc.reasoning}”</p>
    </div>
  );
}

export function DetailPane({ decision: d, onBack }: { decision: Decision; onBack: () => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-5 pb-32">
      <button onClick={onBack} className="md:hidden mb-3 text-sm text-slate-500 hover:text-slate-800">
        ← Back to queue
      </button>

      {/* 3-point header: headline, then Problem / urgency+because / Action. */}
      <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 md:p-5 mb-3">
        <p className="text-xs uppercase tracking-wider text-slate-400 mb-1.5">
          {d.event.name} · {d.event.location} · {d.event.date}
        </p>
        <h2 className="text-lg md:text-xl font-semibold leading-snug mb-4">{d.title}</h2>
        <dl className="space-y-3">
          <HeaderRow label="Problem">
            <p>{d.problem}</p>
          </HeaderRow>
          <HeaderRow label={<UrgencyTrigger urgency={d.urgency} />}>
            <p>{d.urgency.because}</p>
          </HeaderRow>
          <HeaderRow label="Action">
            <p>{d.actionNeeded}</p>
          </HeaderRow>
        </dl>
      </div>

      {d.status === 'blocked' && d.blockedBy && (
        <div className="rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 mb-3 text-sm text-red-700">
          <span className="font-semibold">Blocked:</span> {d.blockedBy}
        </div>
      )}

      {/* THE CALL — first, not last (round-2 verdict). */}
      <section className="mb-3 rounded-xl ring-2 ring-indigo-300 bg-indigo-50 p-4 md:p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-2">Recommendation</h3>
        <p className="text-base font-medium leading-snug">{d.recommendation.action}</p>
        <p className="text-sm text-slate-600 mt-2">
          <span className="font-semibold text-slate-700">Why: </span>
          {d.recommendation.why}
        </p>
        <TrackRecordLine decision={d} />
        <div className="mt-4 space-y-3">
          {d.escalation && d.status === 'escalated' && <EscalationBanner esc={d.escalation} />}
          {d.resolution && <ResolutionBanner res={d.resolution} />}
        </div>
      </section>

      {/* Evidence — flat Case Explorer, collapsed by default. */}
      <Fold title={`What happened in similar events (${d.evidence.caseCount} case${d.evidence.caseCount === 1 ? '' : 's'})`}>
        <CaseExplorer decision={d} />
      </Fold>

      {d.whatsDifferent.length > 0 && (
        <Fold title={`What’s different this time (${d.whatsDifferent.length})`}>
          <ul className="space-y-3">
            {d.whatsDifferent.map((w, i) => (
              <li key={i} className="text-sm">
                <p className="flex gap-2 text-slate-800 font-medium">
                  <span className="text-amber-600 font-bold shrink-0">Δ</span> {w.change}
                </p>
                <p className="text-slate-500 mt-0.5 pl-5">
                  <span className="font-medium text-slate-600">Why it matters: </span>
                  {w.whyItMatters}
                </p>
              </li>
            ))}
          </ul>
        </Fold>
      )}

      {(d.risks.length > 0 || d.constraints.length > 0) && (
        <Fold title={`Risks & constraints (${d.risks.length + d.constraints.length})`}>
          {d.risks.map((r, i) => (
            <p key={i} className="flex gap-2 text-sm text-slate-700 mb-1.5">
              <span className="text-amber-500 font-bold shrink-0">⚠</span> {r}
            </p>
          ))}
          {d.constraints.map((c, i) => (
            <p key={i} className="flex gap-2 text-sm text-slate-500 mb-1">
              <span className="text-slate-400 shrink-0">§</span> {c}
            </p>
          ))}
        </Fold>
      )}

      <Fold title="Why this is yours">
        <p className="text-sm">
          <span className="font-medium">{d.owner.name}</span> · {d.owner.role}
        </p>
        <p className="text-sm text-slate-600 mt-1">{d.owner.whyRouted}</p>
      </Fold>
    </div>
  );
}
