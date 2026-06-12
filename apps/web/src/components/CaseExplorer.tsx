// The flat Case Explorer (round-4 verdict): proportion bar, outcome filter
// chips, similarity-ranked case list with inspectable tags, Exceptions behind
// a filter chip. Counts come from the domain's evidenceCounts — Cases only.
import { useState } from 'react';
import type { Decision } from '@ppi/domain';
import { evidenceCounts } from '@ppi/domain';
import { agoLabel } from '../lib/format.js';

type Filter = 'all' | 'worked' | 'failed' | 'exceptions';

export function CaseExplorer({ decision: d }: { decision: Decision }) {
  const ev = d.evidence;
  const [filter, setFilter] = useState<Filter>('all');
  const { worked, failed, total } = evidenceCounts(ev);
  const pct = total === 0 ? 0 : Math.round((worked / total) * 100);

  const shown = filter === 'all' ? ev.cases : filter === 'exceptions' ? [] : ev.cases.filter((c) => c.outcome === filter);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: `Most similar (${ev.cases.length})` },
    { key: 'worked', label: 'Worked' },
    { key: 'failed', label: 'Didn’t work' },
    ...(ev.exceptions.length > 0 ? [{ key: 'exceptions' as const, label: `Exceptions (${ev.exceptions.length})` }] : []),
  ];

  if (total === 0 && ev.precedents.length === 0) {
    return (
      <div>
        <p className="text-sm text-slate-500">No similar cases yet — Program Memory grows as decisions resolve.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Precedents: recent similar Resolutions, outcome pending — visually
          distinct from Cases and never part of the worked/failed counts. */}
      {ev.precedents.length > 0 && (
        <div className="mb-3" data-testid="precedents">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-700 mb-1.5">
            Precedents · outcome pending, not in the counts
          </p>
          <ul className="space-y-2">
            {ev.precedents.map((p) => (
              <li key={p.sourceDecisionId} className="rounded-lg bg-sky-50 ring-1 ring-sky-200 p-3.5 text-sm">
                <p className="text-slate-800">
                  <span className="font-medium capitalize">{p.choice}</span> {agoLabel(p.daysAgo)} by{' '}
                  <span className="font-medium">{p.decidedBy}</span>
                  <span className="text-sky-700"> — outcome pending</span>
                </p>
                <p className="text-slate-600 mt-1">“{p.reasoning}”</p>
                <p className="text-xs text-slate-400 mt-1">from: {p.sourceTitle}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-1.5 flex justify-between text-xs text-slate-500">
        <span>
          <span className="font-semibold text-emerald-700">{worked} worked</span>
          {failed > 0 && (
            <>
              {' '}
              · <span className="font-semibold text-rose-600">{failed} didn’t</span>
            </>
          )}
        </span>
        <span>
          {pct}% success across {total} case{total === 1 ? '' : 's'}
        </span>
      </div>
      <div className="h-2 rounded-full bg-rose-200 overflow-hidden mb-3">
        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>

      {ev.patterns.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Patterns</p>
          <ul className="space-y-2" data-testid="patterns">
            {ev.patterns.map((pattern, i) => (
              <li key={`${pattern.title}-${i}`} className="rounded-lg bg-white ring-1 ring-slate-200 p-3 text-sm">
                <p className="text-slate-800">
                  <span className={`font-bold ${pattern.outcome === 'worked' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {pattern.outcome === 'worked' ? '✓' : '✗'}
                  </span>{' '}
                  <span className="font-medium">{pattern.title}</span>
                  <span className="text-slate-500"> — {pattern.count}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">{pattern.takeaway}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {filters.map((f) => (
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
                    {c.patternIndex !== undefined && (
                      <span className="text-[10px] rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 px-2 py-0.5">
                        Pattern {c.patternIndex + 1}
                      </span>
                    )}
                  </span>
                </span>
              </li>
            ))}
            {shown.length === 0 && <li className="px-3.5 py-3 text-sm text-slate-400">No cases match this filter.</li>}
          </ul>
          {total > ev.cases.length && (
            <p className="text-xs text-slate-400 mt-2">
              Showing the {ev.cases.length} most similar of {total} cases, ranked by similarity to this decision.
            </p>
          )}
        </>
      )}
    </div>
  );
}
