// The inbox shell (#10): Decisions load from the persistence port (IndexedDB
// demo adapter), the four verbs transition lifecycle state via domain logic
// and persist, resolving auto-advances with a jump-back toast, and a stale
// seed (version-stamp mismatch after a redeploy) nukes-and-reseeds with a
// one-line toast. "Reset demo data" restores the pristine seed.
import { useEffect, useRef, useState } from 'react';
import type { Decision, Persona, QueueTab } from '@ppi/domain';
import { applyAction, detectFromFeed, landPrecedent, openSiblingsOf, personaQueue, personasFrom, precedentFrom } from '@ppi/domain';
import { DEMO_PROGRAM_THRESHOLDS, DEMO_SEED, DEMO_SENIOR_ROLES, IndexedDbDecisionRepository, ScriptedSignalFeed } from '@ppi/adapters';
import type { ResolveOutcome } from './components/ActionPanel.js';
import { DetailPane } from './components/DetailPane.js';
import { PersonaSwitcher } from './components/PersonaSwitcher.js';
import { PortfolioPrototype } from './components/portfolio-prototype/PortfolioPrototype.js';
import { defaultSort, QueueList } from './components/QueueList.js';
import { FEED_DECISION_IDS, feedDelayMs } from './lib/feed.js';

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

function feedHasFired(decisions: readonly Decision[]): boolean {
  return decisions.some((d) => FEED_DECISION_IDS.has(d.id));
}

function personaKey(persona: Persona | null): string {
  return persona ? `${persona.group}:${persona.name}:${persona.role}` : 'whole-program';
}

interface Toast {
  message: string;
  jump?: { tab: QueueTab; id: string };
}

export default function App() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [tab, setTab] = useState<QueueTab>('needs-you');
  const [view, setView] = useState<'inbox' | 'portfolio'>('inbox');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const decisionsRef = useRef<Decision[]>([]);
  const feedUnsubscribeRef = useRef<(() => void) | null>(null);

  function stopFeed() {
    feedUnsubscribeRef.current?.();
    feedUnsubscribeRef.current = null;
  }

  function armFeedIfNeeded(ds: Decision[]) {
    stopFeed();
    const delayMs = feedDelayMs(window.location.search);
    const feedDecisions = DEMO_SEED.feedDecisions ?? [];
    if (delayMs === null || feedDecisions.length === 0 || feedHasFired(ds)) return;

    const feed = new ScriptedSignalFeed({ delayMs });
    feedUnsubscribeRef.current = feed.subscribe((signal) => {
      stopFeed();
      const detected = detectFromFeed(signal, feedDecisions, DEMO_PROGRAM_THRESHOLDS);
      if (!detected || decisionsRef.current.some((d) => d.id === detected.id)) return;

      void repository.save(detected).then(() => {
        setDecisions((current) => {
          if (current.some((d) => d.id === detected.id)) return current;
          const next = [...current, detected];
          decisionsRef.current = next;
          return next;
        });
        setToast({ message: 'New decision detected from the simulated feed', jump: { tab: 'needs-you', id: detected.id } });
      });
    });
  }

  useEffect(() => {
    let cancelled = false;
    void repository.load().then(({ decisions: ds, reseeded }) => {
      if (cancelled) return;
      decisionsRef.current = ds;
      setDecisions(ds);
      setSelectedId(defaultSort('needs-you', personaQueue(null, 'needs-you', ds))[0]?.id ?? null);
      armFeedIfNeeded(ds);
      if (reseeded) setToast({ message: 'Demo data refreshed — a new version of the seed was deployed.' });
    });
    return () => {
      cancelled = true;
      stopFeed();
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    decisionsRef.current = decisions;
  }, [decisions]);

  const personas = personasFrom(decisions, DEMO_SENIOR_ROLES);
  const inTab = personaQueue(persona, tab, decisions);
  const counts = Object.fromEntries(TABS.map((t) => [t.key, personaQueue(persona, t.key, decisions).length])) as Record<QueueTab, number>;
  const selected = decisions.find((d) => d.id === selectedId) ?? null;

  function switchTab(next: QueueTab) {
    setTab(next);
    setSelectedId(defaultSort(next, personaQueue(persona, next, decisions))[0]?.id ?? null);
    setMobileDetail(false);
  }

  function switchPersona(next: Persona | null) {
    setPersona(next);
    setTab('needs-you');
    setSelectedId(defaultSort('needs-you', personaQueue(next, 'needs-you', decisions))[0]?.id ?? null);
    setMobileDetail(false);
  }

  function advanceIfSelectedLeftCurrentQueue(updated: Decision[], movedId: string) {
    const remaining = defaultSort(tab, personaQueue(persona, tab, updated));
    if (remaining.some((d) => d.id === movedId)) return;
    setSelectedId(remaining[0]?.id ?? null);
    if (remaining.length === 0) setMobileDetail(false);
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
    advanceIfSelectedLeftCurrentQueue(updated, next.id);
  }

  async function handleReturnFeedback(decision: Decision, text: string) {
    const next = applyAction(decision, {
      kind: 'feedbackReturned',
      feedback: { text: text.trim(), from: decision.escalation!.to, daysAgo: 0 },
    });

    await repository.save(next);

    const updated = decisions.map((d) => (d.id === next.id ? next : d));
    setDecisions(updated);
    setToast({
      message: `\u2713 Feedback sent \u2014 back to ${decision.owner.name}'s queue`,
      jump: { tab: 'needs-you', id: decision.id },
    });
    advanceIfSelectedLeftCurrentQueue(updated, next.id);
  }

  async function handleReset() {
    stopFeed();
    const ds = await repository.reset();
    decisionsRef.current = ds;
    setDecisions(ds);
    setPersona(null);
    setTab('needs-you');
    setSelectedId(defaultSort('needs-you', personaQueue(null, 'needs-you', ds))[0]?.id ?? null);
    setMobileDetail(false);
    armFeedIfNeeded(ds);
    setToast({ message: '✓ Demo data reset to the pristine seed' });
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="px-4 md:px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="text-lg font-semibold whitespace-nowrap">Program Intel</h1>
          <span className="text-sm text-slate-500 truncate hidden sm:inline">Acme Corp event portfolio</span>
        </div>
        {import.meta.env.DEV && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setView('inbox')}
              className={`px-3 py-1.5 rounded-md text-sm ${view === 'inbox' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Inbox
            </button>
            <button
              type="button"
              onClick={() => setView('portfolio')}
              className={`px-3 py-1.5 rounded-md text-sm ${view === 'portfolio' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Portfolio
            </button>
          </div>
        )}
        <PersonaSwitcher personas={personas} current={persona} decisions={decisions} onSwitch={switchPersona} />
        <div className="flex items-center gap-4 whitespace-nowrap">
          <span className="hidden sm:block text-sm text-slate-500">
            {counts['needs-you']} need you · {counts.waiting} waiting · {counts.decided} decided
          </span>
          <button onClick={() => void handleReset()} className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2">
            Reset demo data
          </button>
        </div>
      </header>

      {import.meta.env.DEV && view === 'portfolio' ? (
        <PortfolioPrototype decisions={decisions} />
      ) : (
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
                key={`${personaKey(persona)}:${tab}`}
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
              onReturnFeedback={(text) => void handleReturnFeedback(selected, text)}
              isFeedbackRequest={persona?.group === 'escalation-path' && selected.status === 'escalated' && selected.escalation?.to === persona.name}
            />
          ) : (
            <div className="hidden md:flex h-full items-center justify-center p-10">
              <p className="text-sm text-slate-400 max-w-xs text-center leading-relaxed">{EMPTY_STATE[tab]}</p>
            </div>
          )}
        </main>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-4 right-4 md:left-auto z-50 flex items-center justify-between md:justify-start gap-3 rounded-lg bg-slate-900 text-white px-4 py-3 shadow-xl">
          <span className="text-sm">{toast.message}</span>
          {toast.jump && (
            <button
              onClick={() => {
                setPersona(null);
                setTab(toast.jump!.tab);
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
