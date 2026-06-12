// Portfolio (#19) is the winning #18 mix: Program ledger plus Program Memory,
// whole-program and read-only, kept one tab behind the inbox.
import type { Decision, EventRollup, MemoryStats } from '@ppi/domain';
import { eventRollups, memoryStats, programTotals } from '@ppi/domain';

interface PortfolioViewProps {
  decisions: readonly Decision[];
}

const NUMBER = new Intl.NumberFormat('en-US');

const SEGMENTS = [
  { key: 'open', label: 'open', className: 'bg-sky-500' },
  { key: 'blocked', label: 'blocked', className: 'bg-amber-500' },
  { key: 'waiting', label: 'waiting', className: 'bg-violet-500' },
  { key: 'decided', label: 'decided', className: 'bg-emerald-500' },
] as const;

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function needAttentionText(count: number): string {
  return count === 1 ? '1 needs attention' : `${count} need attention`;
}

function waitingText(count: number): string {
  return `${count} waiting on feedback`;
}

function decidedText(count: number): string {
  return `${count} decided`;
}

function dueText(days: number): string {
  if (days === 0) return 'today';
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

function dueClass(days: number): string {
  if (days <= 3) return 'text-red-600';
  if (days <= 7) return 'text-amber-600';
  return 'text-slate-700';
}

function eventFacts(event: EventRollup['event']): string | null {
  const facts = [event.budget, event.attendees ? `${NUMBER.format(event.attendees)} attendees` : null].filter(Boolean);
  return facts.length > 0 ? facts.join(' · ') : null;
}

function decisionLine(rollup: EventRollup): string {
  const counts = SEGMENTS.map((segment) => ({ label: segment.label, count: rollup[segment.key] })).filter((segment) => segment.count > 0);
  return counts.length > 0 ? counts.map((segment) => `${segment.count} ${segment.label}`).join(' · ') : 'No decisions';
}

function DecisionBar({ rollup }: { rollup: EventRollup }) {
  const total = rollup.open + rollup.blocked + rollup.waiting + rollup.decided;

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className="flex h-full">
        {SEGMENTS.map((segment) =>
          rollup[segment.key] > 0 && total > 0 ? (
            <div key={segment.key} className={segment.className} style={{ width: `${(rollup[segment.key] / total) * 100}%` }} />
          ) : null,
        )}
      </div>
    </div>
  );
}

function NextDeadline({ rollup }: { rollup: EventRollup }) {
  if (!rollup.nextDue) return <span className="text-slate-300">—</span>;

  return (
    <div className="min-w-0">
      <div className={`font-medium ${dueClass(rollup.nextDue.days)}`}>{dueText(rollup.nextDue.days)}</div>
      <div className="truncate text-xs text-slate-500">{rollup.nextDue.title}</div>
    </div>
  );
}

function Escalation({ rollup }: { rollup: EventRollup }) {
  if (!rollup.oldestEscalation) return <span className="text-slate-300">—</span>;

  return (
    <span className="inline-flex max-w-full items-center rounded-full bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-100">
      <span className="truncate">
        With {rollup.oldestEscalation.to} · {rollup.oldestEscalation.daysAgo}d
      </span>
    </span>
  );
}

function MemoryCell({ rollup }: { rollup: EventRollup }) {
  if (rollup.decided === 0) return <span className="text-slate-300">—</span>;
  return <span>{plural(rollup.decided, 'resolution')} written</span>;
}

function LedgerRow({ rollup }: { rollup: EventRollup }) {
  const facts = eventFacts(rollup.event);

  return (
    <div className="grid grid-cols-[minmax(220px,1.55fr)_minmax(210px,1.15fr)_minmax(160px,0.9fr)_minmax(150px,0.8fr)_minmax(130px,0.65fr)] items-center gap-5 border-t border-slate-100 px-4 py-4 text-sm">
      <div className="min-w-0">
        <div className="truncate font-medium text-slate-900">{rollup.event.name}</div>
        <div className="truncate text-xs text-slate-500">
          {rollup.event.location} · {rollup.event.date}
        </div>
        {facts && <div className="truncate text-xs text-slate-400">{facts}</div>}
      </div>
      <div className="min-w-0">
        <DecisionBar rollup={rollup} />
        <div className="mt-2 truncate text-xs text-slate-500">{decisionLine(rollup)}</div>
      </div>
      <NextDeadline rollup={rollup} />
      <Escalation rollup={rollup} />
      <div className="text-sm text-slate-600">
        <MemoryCell rollup={rollup} />
      </div>
    </div>
  );
}

function MobileLedgerCard({ rollup }: { rollup: EventRollup }) {
  const facts = eventFacts(rollup.event);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-medium text-slate-900">{rollup.event.name}</h3>
        <p className="truncate text-xs text-slate-500">
          {rollup.event.location} · {rollup.event.date}
        </p>
        {facts && <p className="truncate text-xs text-slate-400">{facts}</p>}
      </div>

      <div className="mt-4">
        <DecisionBar rollup={rollup} />
        <p className="mt-2 text-xs text-slate-500">{decisionLine(rollup)}</p>
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-start justify-between gap-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Next deadline</dt>
          <dd className="min-w-0 text-right">
            <NextDeadline rollup={rollup} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Escalation</dt>
          <dd className="min-w-0 text-right">
            <Escalation rollup={rollup} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Memory</dt>
          <dd className="text-right text-slate-600">
            <MemoryCell rollup={rollup} />
          </dd>
        </div>
      </dl>
    </article>
  );
}

function cumulativeBuckets(resolutionDaysAgo: readonly number[]): number[] {
  const buckets = Array.from({ length: 9 }, () => 0);

  for (const rawDaysAgo of resolutionDaysAgo) {
    const daysAgo = Math.max(0, Math.min(44, rawDaysAgo));
    const index = Math.min(8, Math.floor((44 - daysAgo) / 5));
    buckets[index] = (buckets[index] ?? 0) + 1;
  }

  let running = 0;
  return buckets.map((count) => {
    running += count;
    return running;
  });
}

function ProgramMemoryPanel({ stats, decided }: { stats: MemoryStats; decided: number }) {
  const bars = cumulativeBuckets(stats.resolutionDaysAgo);
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

      <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600 md:flex-row md:flex-wrap md:items-center md:gap-3">
        <span>
          <span className="font-medium text-slate-900">{stats.patternCount}</span> patterns named
        </span>
        <span className="hidden text-slate-300 md:inline">·</span>
        <span>
          <span className="font-medium text-slate-900">{stats.precedentsPending}</span> precedents pending outcome
        </span>
        <span className="hidden text-slate-300 md:inline">·</span>
        <span>
          <span className="font-medium text-slate-900">{decided}</span> {decided === 1 ? 'resolution' : 'resolutions'} written
        </span>
      </div>
      <p className="mt-4 text-xs text-slate-400">Every resolution writes into it; future similar decisions read from it as evidence.</p>
    </section>
  );
}

export function PortfolioView({ decisions }: PortfolioViewProps) {
  const rollups = eventRollups(decisions);
  const totals = programTotals(rollups);
  const stats = memoryStats(decisions);
  const needAttention = totals.open + totals.blocked;

  return (
    <section className="flex-1 overflow-y-auto bg-slate-50">
      <div className="min-h-full px-4 pb-24 pt-5 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Portfolio</h2>
              <p className="text-sm text-slate-500">Acme Corp event portfolio</p>
            </div>
            <div className="text-sm text-slate-600">
              {plural(totals.events, 'event')} · {needAttentionText(needAttention)} · {waitingText(totals.waiting)} · {decidedText(totals.decided)}
            </div>
          </div>

          <div className="mt-6 hidden items-center gap-4 text-xs text-slate-500 md:flex">
            {SEGMENTS.map((segment) => (
              <span key={segment.key} className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${segment.className}`} />
                {segment.label}
              </span>
            ))}
          </div>

          <div className="mt-2 hidden overflow-hidden rounded-lg border border-slate-200 bg-white md:block">
            <div className="grid grid-cols-[minmax(220px,1.55fr)_minmax(210px,1.15fr)_minmax(160px,0.9fr)_minmax(150px,0.8fr)_minmax(130px,0.65fr)] gap-5 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              <div>EVENT</div>
              <div>DECISIONS</div>
              <div>NEXT DEADLINE</div>
              <div>ESCALATION</div>
              <div>MEMORY</div>
            </div>
            {rollups.map((rollup) => (
              <LedgerRow key={rollup.event.id} rollup={rollup} />
            ))}
          </div>

          <div className="mt-4 space-y-3 md:hidden">
            {rollups.map((rollup) => (
              <MobileLedgerCard key={rollup.event.id} rollup={rollup} />
            ))}
          </div>

          <div className="mt-8">
            <ProgramMemoryPanel stats={stats} decided={totals.decided} />
          </div>
        </div>
      </div>
    </section>
  );
}
