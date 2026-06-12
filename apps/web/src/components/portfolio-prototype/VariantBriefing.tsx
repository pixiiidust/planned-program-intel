// PROTOTYPE (#18) — throwaway variant sketch; dev-only, never ships. Winner gets rebuilt properly in #19.
import type { Decision } from '@ppi/domain';
import { eventRollups, memoryStats } from './rollup.js';

interface VariantProps {
  decisions: readonly Decision[];
}

interface AttentionCard {
  id: string;
  decision: Decision;
  label: string;
  borderClass: string;
  labelClass: string;
}

function dayCount(days: number): string {
  if (days === 0) return 'today';
  return `${days} day${days === 1 ? '' : 's'}`;
}

function dueValue(decision: Decision): number {
  return decision.dueInDays ?? Number.POSITIVE_INFINITY;
}

function isAttentionOpen(decision: Decision): boolean {
  return decision.status === 'open' && (decision.urgency.level === 'critical' || (decision.dueInDays !== null && decision.dueInDays <= 3));
}

function openLabel(decision: Decision): string {
  const level = decision.urgency.level.toUpperCase();
  if (decision.dueInDays === null) return `NO DEADLINE — ${level}`;
  if (decision.dueInDays === 0) return `DUE TODAY — ${level}`;
  return `DUE IN ${decision.dueInDays} DAY${decision.dueInDays === 1 ? '' : 'S'} — ${level}`;
}

function attentionCards(decisions: readonly Decision[]): AttentionCard[] {
  const escalated = decisions
    .filter((decision) => decision.status === 'escalated' && decision.escalation)
    .sort((a, b) => (b.escalation?.daysAgo ?? 0) - (a.escalation?.daysAgo ?? 0) || a.title.localeCompare(b.title))
    .map((decision) => ({
      id: `escalated:${decision.id}`,
      decision,
      label: `WAITING ON FEEDBACK — with ${decision.escalation?.to ?? 'Unknown'}, ${dayCount(decision.escalation?.daysAgo ?? 0)}`,
      borderClass: 'border-l-violet-500',
      labelClass: 'text-violet-700',
    }));

  const blocked = decisions
    .filter((decision) => decision.status === 'blocked')
    .sort((a, b) => dueValue(a) - dueValue(b) || a.title.localeCompare(b.title))
    .map((decision) => ({
      id: `blocked:${decision.id}`,
      decision,
      label: `BLOCKED — by ${decision.blockedBy ?? 'dependency'}`,
      borderClass: 'border-l-amber-500',
      labelClass: 'text-amber-700',
    }));

  const urgentOpen = decisions
    .filter(isAttentionOpen)
    .sort((a, b) => dueValue(a) - dueValue(b) || a.title.localeCompare(b.title))
    .map((decision) => ({
      id: `open:${decision.id}`,
      decision,
      label: openLabel(decision),
      borderClass: 'border-l-red-500',
      labelClass: 'text-red-700',
    }));

  return [...escalated, ...blocked, ...urgentOpen];
}

function latestResolution(stats: ReturnType<typeof memoryStats>): string {
  if (stats.resolutions.length === 0) return 'no resolutions yet';
  const latest = stats.resolutions.reduce((min, resolution) => Math.min(min, resolution.daysAgo), Number.POSITIVE_INFINITY);
  return latest === 0 ? 'latest today' : `latest ${dayCount(latest)} ago`;
}

function HealthyRows({ decisions }: { decisions: readonly Decision[] }) {
  const rollups = eventRollups(decisions);

  return (
    <div className="space-y-2">
      {rollups.map((rollup) => {
        const eventDecisions = decisions.filter((decision) => decision.event.id === rollup.event.id);
        const quietOpen = eventDecisions.filter((decision) => decision.status === 'open' && !isAttentionOpen(decision)).length;
        const decided = eventDecisions.filter((decision) => decision.status === 'resolved').length;
        const facts = [quietOpen > 0 ? `${quietOpen} open, none critical` : 'nothing else open', decided > 0 ? `${decided} decided` : null].filter(Boolean);

        return (
          <p key={rollup.event.id} className="text-sm text-slate-500">
            <span className="font-medium text-slate-600">{rollup.event.name}</span> — {facts.join(' · ')}
          </p>
        );
      })}
    </div>
  );
}

function AttentionCardView({ card }: { card: AttentionCard }) {
  return (
    <article className={`rounded-lg border border-l-4 border-slate-200 bg-white p-4 shadow-sm ${card.borderClass}`}>
      <div className={`text-xs font-semibold uppercase tracking-wide ${card.labelClass}`}>{card.label}</div>
      <h3 className="mt-2 text-sm font-medium leading-snug text-slate-900">{card.decision.title}</h3>
      <div className="mt-2 inline-flex max-w-full rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
        <span className="truncate">{card.decision.event.name}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{card.decision.urgency.because}</p>
    </article>
  );
}

export function VariantBriefing({ decisions }: VariantProps) {
  const rollups = eventRollups(decisions);
  const cards = attentionCards(decisions);
  const visibleCards = cards.slice(0, 7);
  const hiddenCount = cards.length - visibleCards.length;
  const stats = memoryStats(decisions);

  return (
    <section className="min-h-full px-4 pb-24 pt-6 md:px-6">
      <div className="mx-auto max-w-3xl">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">What needs program attention</h2>
          <p className="text-sm text-slate-500">
            Across {rollups.length} event{rollups.length === 1 ? '' : 's'} · ranked by what ages worst
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {visibleCards.length === 0 && <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">No program-level attention needed.</div>}
          {visibleCards.map((card) => (
            <AttentionCardView key={card.id} card={card} />
          ))}
          {hiddenCount > 0 && <p className="px-1 pt-1 text-sm text-slate-400">+{hiddenCount} more in the inbox</p>}
        </div>

        <div className="mt-8">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Healthy at a glance</h3>
          <div className="mt-3">
            <HealthyRows decisions={decisions} />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-3xl border-t border-slate-200 pt-4">
        <h3 className="text-sm font-semibold text-slate-800">The program is learning</h3>
        <p className="mt-1 text-sm text-slate-500">
          {stats.resolutions.length} resolutions written to program memory · {latestResolution(stats)} · {stats.patternCount} patterns named
        </p>
      </div>
    </section>
  );
}
