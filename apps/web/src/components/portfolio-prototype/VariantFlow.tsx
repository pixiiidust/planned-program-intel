// PROTOTYPE (#18) — throwaway variant sketch; dev-only, never ships. Winner gets rebuilt properly in #19.
import type { Decision } from '@ppi/domain';
import { eventRollups, memoryStats, programTotals, type EventRollup, type MemoryStats } from './rollup.js';

interface VariantProps {
  decisions: readonly Decision[];
}

type StateKey = 'open' | 'blocked' | 'waiting' | 'decided';

function dayCount(days: number): string {
  if (days === 0) return 'today';
  return `${days} day${days === 1 ? '' : 's'}`;
}

function stateCount(rollup: EventRollup, state: StateKey): number {
  return rollup[state];
}

function breakdownRows(rollups: readonly EventRollup[], state: StateKey): { event: string; count: number }[] {
  return rollups
    .map((rollup) => ({ event: rollup.event.name, count: stateCount(rollup, state) }))
    .filter((row) => row.count > 0);
}

function oldestEscalation(rollups: readonly EventRollup[]): EventRollup['oldestEscalation'] {
  return rollups.reduce<EventRollup['oldestEscalation']>((oldest, rollup) => {
    if (!rollup.oldestEscalation) return oldest;
    if (!oldest || rollup.oldestEscalation.daysAgo > oldest.daysAgo) return rollup.oldestEscalation;
    return oldest;
  }, null);
}

function blockerLine(decisions: readonly Decision[]): string {
  const blockers = Array.from(new Set(decisions.filter((decision) => decision.status === 'blocked' && decision.blockedBy).map((decision) => decision.blockedBy!)));
  if (blockers.length === 0) return 'no blockers';
  const shown = blockers.slice(0, 2).join(', ');
  return blockers.length > 2 ? `by ${shown} +${blockers.length - 2}` : `by ${shown}`;
}

function cumulativeBuckets(resolutions: MemoryStats['resolutions']): number[] {
  const buckets = Array.from({ length: 9 }, () => 0);

  for (const resolution of resolutions) {
    const daysAgo = Math.max(0, Math.min(44, resolution.daysAgo));
    const index = Math.min(8, Math.floor((44 - daysAgo) / 5));
    buckets[index] = (buckets[index] ?? 0) + 1;
  }

  let running = 0;
  return buckets.map((count) => {
    running += count;
    return running;
  });
}

function FlowColumn({
  count,
  title,
  accentClass,
  detail,
  rows,
}: {
  count: number;
  title: string;
  accentClass: string;
  detail: string;
  rows: { event: string; count: number }[];
}) {
  return (
    <article className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${accentClass}`}>
      <div className="text-3xl font-semibold text-slate-900">{count}</div>
      <h3 className="mt-1 text-sm font-medium text-slate-800">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
      <div className="mt-4 space-y-1.5">
        {rows.length === 0 && <p className="text-xs text-slate-300">no events</p>}
        {rows.map((row) => (
          <div key={row.event} className="flex items-center justify-between gap-3 text-xs text-slate-500">
            <span className="truncate">{row.event}</span>
            <span className="shrink-0 font-medium text-slate-700">{row.count}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function ProgramMemoryPanel({ stats }: { stats: MemoryStats }) {
  const bars = cumulativeBuckets(stats.resolutions);
  const max = Math.max(...bars, 1);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Program Memory</h3>
          <p className="text-xs text-slate-500">Resolution history accumulates into evidence.</p>
        </div>
        <p className="text-xs text-slate-400">45 days ago → today</p>
      </div>

      <div className="mt-5 flex h-28 items-end gap-2 border-b border-slate-200 pb-1" aria-label="Cumulative resolutions over the last 45 days">
        {bars.map((value, index) => {
          const height = value === 0 ? 2 : Math.max(8, Math.round((value / max) * 96));
          return (
            <div key={index} className="flex h-full flex-1 items-end">
              <div className="w-full rounded-t bg-emerald-500/70" style={{ height }} />
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
        <div>
          <span className="font-medium text-slate-900">{stats.patternCount}</span> patterns named
        </div>
        <div>
          corpus of <span className="font-medium text-slate-900">{stats.caseCorpus}</span> cases
        </div>
        <div>
          <span className="font-medium text-slate-900">{stats.precedentsPending}</span> precedents pending outcome
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-400">Every resolution writes into it; future similar decisions read from it as evidence.</p>
    </section>
  );
}

export function VariantFlow({ decisions }: VariantProps) {
  const rollups = eventRollups(decisions);
  const totals = programTotals(rollups);
  const stats = memoryStats(decisions);
  const oldest = oldestEscalation(rollups);

  return (
    <section className="min-h-full px-4 pb-24 pt-6 md:px-6">
      <div className="mx-auto max-w-6xl">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">The system of decisions</h2>
          <p className="text-sm text-slate-500">How decisions are moving across the program.</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <FlowColumn
            count={totals.open}
            title="Open"
            accentClass="border-t-4 border-t-sky-500"
            detail="ready for a human call"
            rows={breakdownRows(rollups, 'open')}
          />
          <FlowColumn
            count={totals.blocked}
            title="Blocked"
            accentClass="border-t-4 border-t-amber-500"
            detail={blockerLine(decisions)}
            rows={breakdownRows(rollups, 'blocked')}
          />
          <FlowColumn
            count={totals.waiting}
            title="Escalated"
            accentClass="border-t-4 border-t-violet-500"
            detail={oldest ? `oldest with ${oldest.to}, ${dayCount(oldest.daysAgo)}` : 'none waiting'}
            rows={breakdownRows(rollups, 'waiting')}
          />
          <FlowColumn
            count={totals.decided}
            title="Resolved"
            accentClass="border-t-4 border-t-emerald-500"
            detail={`→ ${stats.resolutions.length} precedents written`}
            rows={breakdownRows(rollups, 'decided')}
          />
        </div>

        <div className="mt-4 grid gap-2 text-xs text-slate-400 md:grid-cols-2">
          <p>open → blocked when a dependency stops action</p>
          <p>escalated → returns with feedback → open</p>
          <p>resolved → writes a precedent into program memory</p>
          <p>program memory → strengthens the next similar decision</p>
        </div>

        <div className="mt-8">
          <ProgramMemoryPanel stats={stats} />
        </div>
      </div>
    </section>
  );
}
