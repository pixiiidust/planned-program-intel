// PROTOTYPE — the converged design after six variant rounds.
// Inbox shape · action-first detail · 3-point header (Problem / urgency
// chip / Action) · flat Case Explorer evidence · status-aware queue rows
// with right-aligned time · sort + time filter on every tab · chip-badge
// urgency label, height-locked and optically aligned in the label slot.
import React, { useEffect, useState } from 'react';
import { agoLabel, getEvent, URGENCY_RANK } from './data.js';
import { ActionPanel, ResolutionBanner, EscalationBanner, TrackRecord, URGENCY_STYLE, UrgencyTrigger } from './DecisionWorkflow.jsx';
import CaseExplorer from './CaseExplorer.jsx';

// Winning urgency treatment (round 6): colored chip, height-locked to the
// 20px text line. In the header label slot it outdents by its own padding so
// the first letter aligns with the P of PROBLEM and the A of ACTION.
function UrgencyLabel({ urgency, interactive }) {
  const cls = `inline-flex items-center h-5 px-1.5 rounded ring-1 text-[11px] font-semibold ${URGENCY_STYLE[urgency.level]}`;
  if (!interactive) return <span className={`${cls} align-top`}>{urgency.level.toUpperCase()}</span>;
  return (
    <UrgencyTrigger urgency={urgency} className={`${cls} -ml-1.5`}>
      {urgency.level.toUpperCase()}
      <span className="opacity-60 ml-1">ⓘ</span>
    </UrgencyTrigger>
  );
}

const TABS = [
  { key: 'needs_you', label: 'Needs you', match: (d) => d.status === 'needs_decision' || d.status === 'blocked' },
  { key: 'waiting', label: 'Waiting', match: (d) => d.status === 'escalated' },
  { key: 'decided', label: 'Decided', match: (d) => d.status === 'decided' },
];

const EMPTY_STATE = {
  needs_you: 'Nothing needs you right now. New decisions appear here as the system detects them.',
  waiting: 'Nothing is waiting on others. Decisions you escalate for feedback sit here until it arrives.',
  decided: 'No calls made yet. Decided items land here, with their reasoning saved to program memory.',
};

const CHOICE_CHIP = {
  accepted: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  changed: 'bg-amber-100 text-amber-700 ring-amber-200',
  overridden: 'bg-purple-100 text-purple-700 ring-purple-200',
};

function dueDays(d) {
  return d.dueIn ? parseInt(d.dueIn, 10) : Infinity;
}

function byUrgency(a, b) {
  return URGENCY_RANK[a.urgency.level] - URGENCY_RANK[b.urgency.level] || dueDays(a) - dueDays(b);
}

function dateFor(daysAgo) {
  return new Date(Date.now() - daysAgo * 86400000);
}

function defaultSort(key, list) {
  if (key === 'decided') return [...list].sort((a, b) => (a.resolution?.daysAgo ?? 0) - (b.resolution?.daysAgo ?? 0));
  if (key === 'waiting') return [...list].sort((a, b) => (a.escalation?.daysAgo ?? 0) - (b.escalation?.daysAgo ?? 0));
  return [...list].sort(byUrgency);
}

export default function InboxShell({ decisions, resolveDecision }) {
  const [filter, setFilter] = useState('needs_you');
  const [selectedId, setSelectedId] = useState(decisions.find((d) => TABS[0].match(d))?.id ?? null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const tab = TABS.find((t) => t.key === filter);
  const filtered = defaultSort(filter, decisions.filter(tab.match));
  const selected = decisions.find((d) => d.id === selectedId);
  const counts = Object.fromEntries(TABS.map((t) => [t.key, decisions.filter(t.match).length]));

  function handleResolve(id, outcome) {
    const movedTo = outcome.choice === 'escalated' ? 'waiting' : 'decided';
    const next = filtered.filter((x) => x.id !== id)[0];
    resolveDecision(id, outcome);
    setToast({ id, tab: movedTo, label: movedTo === 'waiting' ? 'Waiting' : 'Decided' });
    if (filter !== movedTo) {
      setSelectedId(next?.id ?? null);
      if (!next) setMobileDetail(false);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="px-4 md:px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="text-lg font-semibold whitespace-nowrap">Program Intel</h1>
          <span className="text-sm text-slate-500 truncate">Acme Corp event portfolio</span>
        </div>
        <div className="hidden sm:block text-sm text-slate-500 whitespace-nowrap">
          {counts.needs_you} need you · {counts.waiting} waiting · {counts.decided} decided
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <aside className={`${mobileDetail ? 'hidden' : 'flex'} md:flex w-full md:w-[380px] md:border-r border-slate-200 bg-white flex-col`}>
          <nav className="flex gap-1 p-2 border-b border-slate-100">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setFilter(t.key);
                  setSelectedId(defaultSort(t.key, decisions.filter(t.match))[0]?.id ?? null);
                }}
                className={`px-3 py-1.5 rounded-md text-sm ${filter === t.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {t.label} ({counts[t.key]})
              </button>
            ))}
          </nav>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-6 text-sm text-slate-400 leading-relaxed">{EMPTY_STATE[filter]}</p>
            ) : (
              <QueueList
                key={filter}
                decisions={filtered}
                tab={filter}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id);
                  setMobileDetail(true);
                }}
              />
            )}
          </div>
        </aside>

        <main className={`${mobileDetail ? 'block' : 'hidden'} md:block flex-1 overflow-y-auto`}>
          {selected ? (
            <Detail
              decision={selected}
              onBack={() => setMobileDetail(false)}
              onResolve={(outcome) => handleResolve(selected.id, outcome)}
            />
          ) : (
            <div className="hidden md:flex h-full items-center justify-center p-10">
              <p className="text-sm text-slate-400 max-w-xs text-center leading-relaxed">{EMPTY_STATE[filter]}</p>
            </div>
          )}
        </main>
      </div>

      {toast && (
        <div className="fixed top-4 left-4 right-4 md:left-auto z-50 flex items-center justify-between md:justify-start gap-3 rounded-lg bg-slate-900 text-white px-4 py-3 shadow-xl">
          <span className="text-sm">✓ Moved to {toast.label}</span>
          <button
            onClick={() => {
              setFilter(toast.tab);
              setSelectedId(toast.id);
              setMobileDetail(true);
              setToast(null);
            }}
            className="text-sm underline underline-offset-2 text-sky-300 hover:text-sky-200"
          >
            View
          </button>
        </div>
      )}
    </div>
  );
}

// Sort options per tab. Past-time tabs (waiting/decided) rank by recency;
// needs-you ranks by urgency or deadline.
const SORTS = {
  needs_you: [
    { key: 'urgency', label: 'Sort: urgency', fn: byUrgency },
    { key: 'due', label: 'Sort: due soonest', fn: (a, b) => dueDays(a) - dueDays(b) || byUrgency(a, b) },
    { key: 'event', label: 'Sort: event', fn: (a, b) => getEvent(a).name.localeCompare(getEvent(b).name) || byUrgency(a, b) },
  ],
  waiting: [
    { key: 'longest', label: 'Sort: longest waiting', fn: (a, b) => (b.escalation?.daysAgo ?? 0) - (a.escalation?.daysAgo ?? 0) },
    { key: 'newest', label: 'Sort: newest', fn: (a, b) => (a.escalation?.daysAgo ?? 0) - (b.escalation?.daysAgo ?? 0) },
    { key: 'event', label: 'Sort: event', fn: (a, b) => getEvent(a).name.localeCompare(getEvent(b).name) },
  ],
  decided: [
    { key: 'newest', label: 'Sort: newest first', fn: (a, b) => (a.resolution?.daysAgo ?? 0) - (b.resolution?.daysAgo ?? 0) },
    { key: 'oldest', label: 'Sort: oldest first', fn: (a, b) => (b.resolution?.daysAgo ?? 0) - (a.resolution?.daysAgo ?? 0) },
    { key: 'event', label: 'Sort: event', fn: (a, b) => getEvent(a).name.localeCompare(getEvent(b).name) },
  ],
};

// Time filters: needs-you filters on the deadline ahead; waiting/decided
// filter on time elapsed, with a custom date range behind the dropdown.
const DUE_RANGES = [
  { key: 'any', label: 'Any deadline', max: Infinity },
  { key: '3', label: 'Due ≤ 3 days', max: 3 },
  { key: '7', label: 'Due ≤ 7 days', max: 7 },
  { key: '14', label: 'Due ≤ 14 days', max: 14 },
  { key: '30', label: 'Due ≤ 30 days', max: 30 },
];

const PAST_RANGES = [
  { key: 'all', label: 'All time', max: Infinity },
  { key: 'week', label: 'Past week', max: 7 },
  { key: 'month', label: 'Past month', max: 30 },
  { key: 'quarter', label: 'Past quarter', max: 90 },
  { key: 'custom', label: 'Custom range…' },
];

const SELECT_CLS = 'text-xs rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-600';

function QueueList({ decisions, tab, selectedId, onSelect }) {
  const sorts = SORTS[tab];
  const ranges = tab === 'needs_you' ? DUE_RANGES : PAST_RANGES;
  const [sortKey, setSortKey] = useState(sorts[0].key);
  const [range, setRange] = useState(ranges[0].key);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const ageOf = (d) => (tab === 'waiting' ? d.escalation?.daysAgo : d.resolution?.daysAgo) ?? 0;

  let list = [...decisions];
  if (tab === 'needs_you') {
    const max = ranges.find((r) => r.key === range).max;
    if (max !== Infinity) list = list.filter((d) => dueDays(d) <= max);
  } else if (range === 'custom') {
    list = list.filter((d) => {
      const when = dateFor(ageOf(d));
      if (from && when < new Date(from)) return false;
      if (to && when > new Date(`${to}T23:59:59`)) return false;
      return true;
    });
  } else {
    const max = ranges.find((r) => r.key === range).max;
    if (max !== Infinity) list = list.filter((d) => ageOf(d) < max);
  }
  list.sort(sorts.find((s) => s.key === sortKey).fn);

  return (
    <div>
      <div className="px-3 py-2 border-b border-slate-100">
        <div className="flex justify-end gap-2">
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className={SELECT_CLS} aria-label="Sort decisions">
            {sorts.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <select value={range} onChange={(e) => setRange(e.target.value)} className={SELECT_CLS} aria-label="Filter by time">
            {ranges.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        {tab !== 'needs_you' && range === 'custom' && (
          <div className="flex items-center gap-2 mt-2">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${SELECT_CLS} flex-1`} aria-label="From date" />
            <span className="text-xs text-slate-400">to</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${SELECT_CLS} flex-1`} aria-label="To date" />
          </div>
        )}
      </div>

      <ul>
        {list.map((d) => (
          <li key={d.id}>
            <button
              onClick={() => onSelect(d.id)}
              className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${
                selectedId === d.id ? 'md:bg-indigo-50 md:border-l-4 md:border-l-indigo-500' : 'md:border-l-4 md:border-l-transparent'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="flex items-center gap-2 min-w-0">
                  {tab === 'needs_you' && <UrgencyLabel urgency={d.urgency} />}
                  {tab === 'needs_you' && d.status === 'blocked' && (
                    <span className="text-[11px] font-semibold px-1.5 rounded ring-1 leading-5 bg-red-50 text-red-600 ring-red-200">BLOCKED</span>
                  )}
                  {tab === 'waiting' && (
                    <span className="text-[11px] font-semibold px-1.5 rounded ring-1 leading-5 bg-sky-50 text-sky-700 ring-sky-200">AWAITING FEEDBACK</span>
                  )}
                  {tab === 'decided' && (
                    <span className={`text-[11px] font-semibold px-1.5 rounded ring-1 leading-5 capitalize ${CHOICE_CHIP[d.resolution.choice]}`}>
                      {d.resolution.choice}
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-slate-500 whitespace-nowrap">
                  {tab === 'needs_you' && (d.dueIn ? `due in ${d.dueIn}` : 'no deadline')}
                  {tab === 'waiting' && agoLabel(d.escalation.daysAgo)}
                  {tab === 'decided' && agoLabel(d.resolution.daysAgo)}
                </span>
              </div>
              <p className="text-sm font-medium leading-snug">{d.title}</p>
              <p className="text-xs text-slate-400 mt-1">
                {tab === 'needs_you' && `${d.owner.name} · ${getEvent(d).name}`}
                {tab === 'waiting' && `With ${d.escalation.to} · escalated by ${d.owner.name} · ${getEvent(d).name}`}
                {tab === 'decided' && `by ${d.resolution.decidedBy} · ${getEvent(d).name}`}
              </p>
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="p-6 text-sm text-slate-400">No decisions in this range.</li>}
      </ul>
    </div>
  );
}

function Detail({ decision: d, onBack, onResolve }) {
  const ev = getEvent(d);
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-5 pb-32">
      <button onClick={onBack} className="md:hidden mb-3 text-sm text-slate-500 hover:text-slate-800">
        ← Back to queue
      </button>

      {/* Header container: headline + scannable Problem / Why / Action rows.
          The urgency label (variant-styled) occupies the why-row's label slot. */}
      <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 md:p-5 mb-3">
        <p className="text-xs uppercase tracking-wider text-slate-400 mb-1.5">
          {ev.name} · {ev.location} · {ev.date}
        </p>
        <h2 className="text-lg md:text-xl font-semibold leading-snug mb-4">{d.title}</h2>
        <dl className="space-y-3">
          <HeaderRow label="Problem">
            <p>{d.problem}</p>
          </HeaderRow>
          <HeaderRow label={<UrgencyLabel urgency={d.urgency} interactive />}>
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

      {/* THE CALL — first, not last */}
      <section className="mb-3 rounded-xl ring-2 ring-indigo-300 bg-indigo-50 p-4 md:p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-2">Recommendation</h3>
        <p className="text-base font-medium leading-snug">{d.recommendation.action}</p>
        <p className="text-sm text-slate-600 mt-2">
          <span className="font-semibold text-slate-700">Why: </span>
          {d.recommendation.why}
        </p>
        <TrackRecord track={d.recommendation.track} />
        <div className="mt-4">
          {d.status === 'escalated' && d.escalation && <EscalationBanner esc={d.escalation} />}
          {d.resolution ? <ResolutionBanner res={d.resolution} /> : <ActionPanel decision={d} onResolve={onResolve} />}
        </div>
      </section>

      {/* Evidence — flat Case Explorer, fixed since round 4 */}
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

function HeaderRow({ label, children }) {
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

function Fold({ title, defaultOpen, children }) {
  return (
    <details className="mb-3 rounded-xl bg-white ring-1 ring-slate-200 px-4 py-3 group" open={defaultOpen}>
      <summary className="text-sm font-medium text-slate-700 cursor-pointer select-none list-none flex items-center justify-between">
        {title}
        <span className="text-slate-400 group-open:rotate-90 transition-transform">▸</span>
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}
