// The three-tab inbox over the hand-converted seed (#8). Tabs are views over
// lifecycle states (Needs you = Open + Blocked, Waiting = Escalated,
// Decided = Resolved); tab switch auto-selects the top item.
import { useEffect, useState } from 'react';
import type { Decision, QueueTab } from '@ppi/domain';
import { tabOf } from '@ppi/domain';
import { InMemoryDecisionSource } from '@ppi/adapters';
import { DetailPane } from './components/DetailPane.js';
import { defaultSort, QueueList } from './components/QueueList.js';

const source = new InMemoryDecisionSource();

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

export default function App() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [tab, setTab] = useState<QueueTab>('needs-you');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);

  useEffect(() => {
    void source.listDecisions().then((ds) => {
      setDecisions(ds);
      setSelectedId(defaultSort('needs-you', ds.filter((d) => tabOf(d) === 'needs-you'))[0]?.id ?? null);
    });
  }, []);

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

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="px-4 md:px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="text-lg font-semibold whitespace-nowrap">Program Intel</h1>
          <span className="text-sm text-slate-500 truncate">Acme Corp event portfolio</span>
        </div>
        <div className="hidden sm:block text-sm text-slate-500 whitespace-nowrap">
          {counts['needs-you']} need you · {counts.waiting} waiting · {counts.decided} decided
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
            <DetailPane decision={selected} onBack={() => setMobileDetail(false)} />
          ) : (
            <div className="hidden md:flex h-full items-center justify-center p-10">
              <p className="text-sm text-slate-400 max-w-xs text-center leading-relaxed">{EMPTY_STATE[tab]}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
