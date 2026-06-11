// PROTOTYPE — the Flat Case Explorer, winner of round 4. Now the fixed
// evidence module used by all variants: proportion bar, outcome filters,
// similarity-ranked case list.
import React, { useState } from 'react';

export default function CaseExplorer({ decision: d }) {
  const ev = d.evidence;
  const [filter, setFilter] = useState('all');
  const failedCount = ev.caseCount - ev.workedCount;
  const pct = Math.round((ev.workedCount / ev.caseCount) * 100);

  const shown =
    filter === 'all' ? ev.cases : filter === 'exceptions' ? [] : ev.cases.filter((c) => c.outcome === filter);

  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs text-slate-500">
        <span>
          <span className="font-semibold text-emerald-700">{ev.workedCount} worked</span>
          {failedCount > 0 && (
            <>
              {' '}· <span className="font-semibold text-rose-600">{failedCount} didn’t</span>
            </>
          )}
        </span>
        <span>{pct}% success across {ev.caseCount} case{ev.caseCount === 1 ? '' : 's'}</span>
      </div>
      <div className="h-2 rounded-full bg-rose-200 overflow-hidden mb-3">
        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {[
          { key: 'all', label: `Most similar (${ev.cases.length})` },
          { key: 'worked', label: 'Worked' },
          { key: 'failed', label: 'Didn’t work' },
          ...(ev.exceptions.length > 0 ? [{ key: 'exceptions', label: `Exceptions (${ev.exceptions.length})` }] : []),
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs rounded-full px-3 py-1.5 ${filter === f.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === 'exceptions' ? (
        <ul className="space-y-2">
          {ev.exceptions.map((x, i) => (
            <li key={i} className="rounded-lg bg-amber-50 ring-1 ring-amber-200 p-3.5 text-sm text-slate-700">
              <span className="font-medium">{x.title}:</span> {x.detail}
            </li>
          ))}
        </ul>
      ) : (
        <>
          <ul className="divide-y divide-slate-100 rounded-lg ring-1 ring-slate-200 bg-white overflow-hidden">
            {shown.map((c, i) => (
              <li key={i} className="px-3.5 py-2.5 flex items-start gap-3">
                <span className={`mt-0.5 font-bold ${c.outcome === 'worked' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {c.outcome === 'worked' ? '✓' : '✗'}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-slate-800 truncate">{c.event}</span>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{Math.round(c.similarity * 100)}% similar</span>
                  </span>
                  <span className="block text-slate-600 mt-0.5">{c.detail}</span>
                  <span className="flex flex-wrap gap-1 mt-1.5">
                    {c.tags.map((t) => (
                      <span key={t} className="text-[10px] rounded-full bg-slate-100 text-slate-500 px-2 py-0.5">
                        {t}
                      </span>
                    ))}
                  </span>
                </span>
              </li>
            ))}
            {shown.length === 0 && <li className="px-3.5 py-3 text-sm text-slate-400">No cases match this filter.</li>}
          </ul>
          {ev.caseCount > ev.cases.length && (
            <p className="text-xs text-slate-400 mt-2">
              Showing the {ev.cases.length} most similar of {ev.caseCount} cases, ranked by similarity to this decision.
            </p>
          )}
        </>
      )}
    </div>
  );
}
