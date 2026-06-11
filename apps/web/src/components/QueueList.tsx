// Status-aware queue rows with a right-aligned time column, plus sort and
// time-filter dropdowns per tab (round-5 verdict). Needs-you filters by the
// deadline ahead; Waiting/Decided filter by time elapsed with a custom range.
import { useState } from 'react';
import type { Decision, QueueTab, ResolutionChoice } from '@ppi/domain';
import { URGENCY_RANK } from '@ppi/domain';
import { agoLabel, dueLabel } from '../lib/format.js';
import { UrgencyChip } from './UrgencyChip.js';

const dueDays = (d: Decision) => d.dueInDays ?? Infinity;

function byUrgency(a: Decision, b: Decision): number {
  return URGENCY_RANK[a.urgency.level] - URGENCY_RANK[b.urgency.level] || dueDays(a) - dueDays(b);
}

export function defaultSort(tab: QueueTab, list: Decision[]): Decision[] {
  if (tab === 'decided') return [...list].sort((a, b) => (a.resolution?.daysAgo ?? 0) - (b.resolution?.daysAgo ?? 0));
  if (tab === 'waiting') return [...list].sort((a, b) => (a.escalation?.daysAgo ?? 0) - (b.escalation?.daysAgo ?? 0));
  return [...list].sort(byUrgency);
}

type SortOption = { key: string; label: string; fn: (a: Decision, b: Decision) => number };

const SORTS: Record<QueueTab, SortOption[]> = {
  'needs-you': [
    { key: 'urgency', label: 'Sort: urgency', fn: byUrgency },
    { key: 'due', label: 'Sort: due soonest', fn: (a, b) => dueDays(a) - dueDays(b) || byUrgency(a, b) },
    { key: 'event', label: 'Sort: event', fn: (a, b) => a.event.name.localeCompare(b.event.name) || byUrgency(a, b) },
  ],
  waiting: [
    { key: 'longest', label: 'Sort: longest waiting', fn: (a, b) => (b.escalation?.daysAgo ?? 0) - (a.escalation?.daysAgo ?? 0) },
    { key: 'newest', label: 'Sort: newest', fn: (a, b) => (a.escalation?.daysAgo ?? 0) - (b.escalation?.daysAgo ?? 0) },
    { key: 'event', label: 'Sort: event', fn: (a, b) => a.event.name.localeCompare(b.event.name) },
  ],
  decided: [
    { key: 'newest', label: 'Sort: newest first', fn: (a, b) => (a.resolution?.daysAgo ?? 0) - (b.resolution?.daysAgo ?? 0) },
    { key: 'oldest', label: 'Sort: oldest first', fn: (a, b) => (b.resolution?.daysAgo ?? 0) - (a.resolution?.daysAgo ?? 0) },
    { key: 'event', label: 'Sort: event', fn: (a, b) => a.event.name.localeCompare(b.event.name) },
  ],
};

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
  { key: 'custom', label: 'Custom range…', max: NaN },
];

const CHOICE_CHIP: Record<ResolutionChoice, string> = {
  accepted: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  changed: 'bg-amber-100 text-amber-700 ring-amber-200',
  overridden: 'bg-purple-100 text-purple-700 ring-purple-200',
};

const SELECT_CLS = 'text-xs rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-600';

function dateFor(daysAgo: number): Date {
  return new Date(Date.now() - daysAgo * 86400000);
}

interface QueueListProps {
  decisions: Decision[];
  tab: QueueTab;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function QueueList({ decisions, tab, selectedId, onSelect }: QueueListProps) {
  const sorts = SORTS[tab];
  const ranges = tab === 'needs-you' ? DUE_RANGES : PAST_RANGES;
  const [sortKey, setSortKey] = useState(sorts[0]!.key);
  const [range, setRange] = useState(ranges[0]!.key);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const ageOf = (d: Decision) => (tab === 'waiting' ? d.escalation?.daysAgo : d.resolution?.daysAgo) ?? 0;

  let list = [...decisions];
  if (tab === 'needs-you') {
    const max = ranges.find((r) => r.key === range)!.max;
    if (max !== Infinity) list = list.filter((d) => dueDays(d) <= max);
  } else if (range === 'custom') {
    list = list.filter((d) => {
      const when = dateFor(ageOf(d));
      if (from && when < new Date(from)) return false;
      if (to && when > new Date(`${to}T23:59:59`)) return false;
      return true;
    });
  } else {
    const max = ranges.find((r) => r.key === range)!.max;
    if (max !== Infinity) list = list.filter((d) => ageOf(d) < max);
  }
  list.sort(sorts.find((s) => s.key === sortKey)!.fn);

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
        {tab !== 'needs-you' && range === 'custom' && (
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
              aria-current={selectedId === d.id}
              className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${
                selectedId === d.id ? 'md:bg-indigo-50 md:border-l-4 md:border-l-indigo-500' : 'md:border-l-4 md:border-l-transparent'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="flex items-center gap-2 min-w-0">
                  {tab === 'needs-you' && <UrgencyChip urgency={d.urgency} />}
                  {tab === 'needs-you' && d.status === 'blocked' && (
                    <span className="text-[11px] font-semibold px-1.5 rounded ring-1 leading-5 bg-red-50 text-red-600 ring-red-200">BLOCKED</span>
                  )}
                  {tab === 'waiting' && (
                    <span className="text-[11px] font-semibold px-1.5 rounded ring-1 leading-5 bg-sky-50 text-sky-700 ring-sky-200">
                      AWAITING FEEDBACK
                    </span>
                  )}
                  {tab === 'decided' && d.resolution && (
                    <span className={`text-[11px] font-semibold px-1.5 rounded ring-1 leading-5 capitalize ${CHOICE_CHIP[d.resolution.choice]}`}>
                      {d.resolution.choice}
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-slate-500 whitespace-nowrap">
                  {tab === 'needs-you' && dueLabel(d.dueInDays)}
                  {tab === 'waiting' && d.escalation && agoLabel(d.escalation.daysAgo)}
                  {tab === 'decided' && d.resolution && agoLabel(d.resolution.daysAgo)}
                </span>
              </div>
              <p className="text-sm font-medium leading-snug">{d.title}</p>
              {tab === 'needs-you' && d.status === 'blocked' && d.blockedBy && (
                <p className="text-xs text-red-600 mt-0.5">Blocked: {d.blockedBy}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                {tab === 'needs-you' && `${d.owner.name} · ${d.event.name}`}
                {tab === 'waiting' && d.escalation && `With ${d.escalation.to} · escalated by ${d.owner.name} · ${d.event.name}`}
                {tab === 'decided' && d.resolution && `by ${d.resolution.decidedBy} · ${d.event.name}`}
              </p>
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="p-6 text-sm text-slate-400">No decisions in this range.</li>}
      </ul>
    </div>
  );
}
