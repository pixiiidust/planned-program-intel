// The inbox shell (#10): Decisions load from the persistence port (IndexedDB
// demo adapter), the four verbs transition lifecycle state via domain logic
// and persist, resolving auto-advances with a jump-back toast, and a stale
// seed (version-stamp mismatch after a redeploy) nukes-and-reseeds with a
// one-line toast. "Reset demo data" restores the pristine seed.
import { useEffect, useState } from 'react';
import type { Decision, QueueTab } from '@ppi/domain';
import { applyAction, landPrecedent, openSiblingsOf, precedentFrom, tabOf } from '@ppi/domain';
import { DEMO_SEED, IndexedDbDecisionRepository } from '@ppi/adapters';
import type { ResolveOutcome } from './components/ActionPanel.js';
import { DetailPane } from './components/DetailPane.js';
import { defaultSort, QueueList } from './components/QueueList.js';

const repository = new IndexedDbDecisionRepository();

const TABS: { key: QueueTab; label: string }[] = [
  { key: 'needs-you', label: 'Needs you' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'decided', label: 'Decided' },
];

const EMPTY_STATE: Record<QueueTab, string> = {
  'needs-you': 'Nothing needs you right now. New decisions appear here as the system detects them.',
  waiting: 'Nothing is waiting on others. Decisions you escalate for feedback sit here until it arrives.',
  decided: 'No calls made yet. Decided items land here, with their reasoning saved to program memory.',
};

interface Toast {
  message: string;
  jump?: { tab: QueueTab; id: string };
}

export default function App() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [tab, setTab] = useState<QueueTab>('needs-you');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    void repository.load().then(({ decisions: ds, reseeded }) => {
      setDecisions(ds);
      setSelectedId(defaultSort('needs-you', ds.filter((d) => tabOf(d) === 'needs-you'))[0]?.id ?? null);
      if (reseeded) setToast({ message: 'Demo data refreshed — a new version of the seed was deployed.' });
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const inTab = decisions.filter((d) => tabOf(d) === tab);
  const counts = Object.fromEntries(TABS.map((t) => [t.key, decisions.filter((d) => tabOf(d) === t.key).length])) as Record<
    QueueTab,
    number
  >;
  const selected = decisions.find((d) => d.id === selectedId) ?? null;

  function switchTab(next: QueueTab) {
    setTab(next);
    setSelectedId(defaultSort(next, decisions.filter((d) => tabOf(d) === next))[0]?.id ?? null);
    setMobileDetail(false);
  }

  async function handleResolve(decision: Decision, outcome: ResolveOutcome) {
    const next =
      outcome.choice === 'escalated'
        ? applyAction(decision, {
            kind: 'escalate',
            escalation: { to: outcome.escalatedTo, reasoning: outcome.reasoning, requestedBy: decision.owner.name, daysAgo: 0 },
          })
        : applyAction(decision, {
            kind: 'resolve',
            resolution: {
              choice: outcome.choice,
              reasoning: outcome.reasoning,
              ...(outcome.changedTo ? { changedTo: outcome.changedTo } : {}),
              decidedBy: decision.owner.name,
              daysAgo: 0,
            },
          });

    // The memory loop: a Resolution spawns a Precedent that lands in the
    // Evidence of similar open Decisions (seeded sibling map). Verbatim
    // reasoning is the deterministic baseline; distillation arrives in slice 5.
    const landed =
      next.status === 'resolved' && next.resolution
        ? openSiblingsOf(next.id, decisions, DEMO_SEED.siblings).map((s) => landPrecedent(s, precedentFrom(next, next.resolution!)))
        : [];

    await repository.save(next);
    for (const sibling of landed) await repository.save(sibling);

    const byId = new Map([[next.id, next], ...landed.map((s) => [s.id, s] as const)]);
    const updated = decisions.map((d) => byId.get(d.id) ?? d);
    setDecisions(updated);

    const movedTo: QueueTab = outcome.choice === 'escalated' ? 'waiting' : 'decided';
    if (landed.length > 0) {
      // The nudge: the loop closes visibly, in front of the user.
      setToast({
        message: `✓ Decided. Your reasoning now appears in ${landed.length} similar open decision${landed.length === 1 ? '' : 's'}`,
        jump: { tab: 'needs-you', id: landed[0]!.id },
      });
    } else {
      setToast({ message: `✓ Moved to ${movedTo === 'waiting' ? 'Waiting' : 'Decided'}`, jump: { tab: movedTo, id: next.id } });
    }

    // Auto-advance to the next item in the current tab.
    if (tab !== movedTo) {
      const remaining = defaultSort(tab, updated.filter((d) => tabOf(d) === tab));
      setSelectedId(remaining[0]?.id ?? null);
      if (remaining.length === 0) setMobileDetail(false);
    }
  }

  async function handleReset() {
    const ds = await repository.reset();
    setDecisions(ds);
    setTab('needs-you');
    setSelectedId(defaultSort('needs-you', ds.filter((d) => tabOf(d) === 'needs-you'))[0]?.id ?? null);
    setMobileDetail(false);
    setToast({ message: '✓ Demo data reset to the pristine seed' });
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="px-4 md:px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="text-lg font-semibold whitespace-nowrap">Program Intel</h1>
          <span className="text-sm text-slate-500 truncate hidden sm:inline">Acme Corp event portfolio</span>
        </div>
        <div className="flex items-center gap-4 whitespace-nowrap">
          <span className="hidden sm:block text-sm text-slate-500">
            {counts['needs-you']} need you · {counts.waiting} waiting · {counts.decided} decided
          </span>
          <button onClick={() => void handleReset()} className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2">
            Reset demo data
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <aside className={`${mobileDetail ? 'hidden' : 'flex'} md:flex w-full md:w-[380px] md:border-r border-slate-200 bg-white flex-col`}>
          <nav className="flex gap-1 p-2 border-b border-slate-100">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={`px-3 py-1.5 rounded-md text-sm ${tab === t.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {t.label} ({counts[t.key]})
              </button>
            ))}
          </nav>
          <div className="flex-1 overflow-y-auto">
            {inTab.length === 0 ? (
              <p className="p-6 text-sm text-slate-400 leading-relaxed">{EMPTY_STATE[tab]}</p>
            ) : (
              <QueueList
                key={tab}
                decisions={inTab}
                tab={tab}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id);
                  setMobileDetail(true);
                }}
              />
            )}
          </div>
        </aside>

        <main className={`${mobileDetail ? 'block' : 'hidden'} md:block flex-1 overflow-y-auto`} data-testid="decision-detail">
          {selected ? (
            <DetailPane
              decision={selected}
              onBack={() => setMobileDetail(false)}
              onResolve={(outcome) => void handleResolve(selected, outcome)}
            />
          ) : (
            <div className="hidden md:flex h-full items-center justify-center p-10">
              <p className="text-sm text-slate-400 max-w-xs text-center leading-relaxed">{EMPTY_STATE[tab]}</p>
            </div>
          )}
        </main>
      </div>

      {toast && (
        <div className="fixed top-4 left-4 right-4 md:left-auto z-50 flex items-center justify-between md:justify-start gap-3 rounded-lg bg-slate-900 text-white px-4 py-3 shadow-xl">
          <span className="text-sm">{toast.message}</span>
          {toast.jump && (
            <button
              onClick={() => {
                switchTab(toast.jump!.tab);
                setSelectedId(toast.jump!.id);
                setMobileDetail(true);
                setToast(null);
              }}
              className="text-sm underline underline-offset-2 text-sky-300 hover:text-sky-200"
            >
              View
            </button>
          )}
        </div>
      )}
    </div>
  );
}
