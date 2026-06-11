// Walking skeleton (#7): a one-item Needs-you inbox with a detail pane,
// running on the domain package + demo adapter. Issues #8–#11 thicken this
// into the full converged design from prototype/NOTES.md.
import { useEffect, useState } from 'react';
import type { Decision } from '@ppi/domain';
import { needsYou } from '@ppi/domain';
import { InMemoryDecisionSource } from '@ppi/adapters';

const source = new InMemoryDecisionSource();

const URGENCY_STYLE: Record<Decision['urgency']['level'], string> = {
  critical: 'bg-red-100 text-red-700 ring-red-200',
  high: 'bg-orange-100 text-orange-700 ring-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  low: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export default function App() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    void source.listDecisions().then((ds) => {
      setDecisions(ds);
      setSelectedId(needsYou(ds)[0]?.id ?? null);
    });
  }, []);

  const queue = needsYou(decisions);
  const selected = decisions.find((d) => d.id === selectedId) ?? null;

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="px-4 md:px-6 py-3 bg-white border-b border-slate-200 flex items-baseline gap-3">
        <h1 className="text-lg font-semibold whitespace-nowrap">Program Intel</h1>
        <span className="text-sm text-slate-500 truncate">Acme Corp event portfolio</span>
      </header>

      <div className="flex-1 flex min-h-0">
        <aside className="w-full md:w-[380px] md:border-r border-slate-200 bg-white flex flex-col">
          <nav className="flex gap-1 p-2 border-b border-slate-100">
            <span className="px-3 py-1.5 rounded-md text-sm bg-slate-900 text-white">Needs you ({queue.length})</span>
          </nav>
          <ul className="flex-1 overflow-y-auto">
            {queue.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => setSelectedId(d.id)}
                  aria-current={selectedId === d.id}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${
                    selectedId === d.id ? 'md:bg-indigo-50 md:border-l-4 md:border-l-indigo-500' : 'md:border-l-4 md:border-l-transparent'
                  }`}
                >
                  <span
                    className={`inline-flex items-center h-5 px-1.5 rounded ring-1 text-[11px] font-semibold mb-1 ${URGENCY_STYLE[d.urgency.level]}`}
                  >
                    {d.urgency.level.toUpperCase()}
                  </span>
                  <p className="text-sm font-medium leading-snug">{d.title}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {d.owner.name} · {d.eventName}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="hidden md:block flex-1 overflow-y-auto" data-testid="decision-detail">
          {selected && (
            <div className="max-w-3xl mx-auto px-4 md:px-8 py-5">
              <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 md:p-5 mb-3">
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-1.5">{selected.eventName}</p>
                <h2 className="text-lg md:text-xl font-semibold leading-snug mb-4">{selected.title}</h2>
                <dl className="space-y-3 text-sm text-slate-700">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Problem</dt>
                    <dd>{selected.problem}</dd>
                  </div>
                  <div>
                    <dt
                      className={`inline-flex items-center h-5 px-1.5 rounded ring-1 text-[11px] font-semibold ${URGENCY_STYLE[selected.urgency.level]}`}
                    >
                      {selected.urgency.level.toUpperCase()}
                    </dt>
                    <dd>{selected.urgency.because}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Action</dt>
                    <dd>{selected.actionNeeded}</dd>
                  </div>
                </dl>
              </div>
              <section className="rounded-xl ring-2 ring-indigo-300 bg-indigo-50 p-4 md:p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-2">Recommendation</h3>
                <p className="text-base font-medium leading-snug">{selected.recommendation.action}</p>
                <p className="text-sm text-slate-600 mt-2">
                  <span className="font-semibold text-slate-700">Why: </span>
                  {selected.recommendation.why}
                </p>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
