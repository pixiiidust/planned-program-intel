// PROTOTYPE — #27 activity-timeline variant round. Throwaway: dev-only mount,
// canned entries, no persistence. Three structurally different takes on the
// settled design (header affordance → right panel, session-scoped past-toasts
// data, ✦ appears only when distillation actually landed). Flip with the
// bottom bar or ?variant=A|B|C. Delete after a winner is picked.
import { useEffect, useState } from 'react';

interface PrototypeEntry {
  ago: string;
  message: string;
  distilled?: boolean;
  jump?: boolean;
}

// Canned session: real toast strings, one wordless-failure case (14m — no ✦).
const ENTRIES: PrototypeEntry[] = [
  { ago: '2m', message: '✓ Decided. Your reasoning now appears in 1 similar open decision', distilled: true, jump: true },
  { ago: '9m', message: 'New decision detected from the simulated feed', jump: true },
  { ago: '14m', message: '✓ Decided. Your reasoning now appears in 2 similar open decisions', jump: true },
  { ago: '21m', message: `✓ Feedback sent — back to Dana Whitfield's queue`, jump: true },
  { ago: '28m', message: '✓ Moved to Waiting', jump: true },
  { ago: '34m', message: '✓ Demo data reset to the pristine seed' },
];

const VARIANTS = ['A', 'B', 'C'] as const;
type VariantKey = (typeof VARIANTS)[number];
const VARIANT_NAMES: Record<VariantKey, string> = {
  A: 'Quiet ledger',
  B: 'Timeline spine',
  C: 'Toast replay',
};

function variantFromUrl(): VariantKey {
  const v = new URLSearchParams(window.location.search).get('variant');
  return v === 'B' || v === 'C' ? v : 'A';
}

export function ActivityPanelPrototype() {
  const [open, setOpen] = useState(true);
  const [variant, setVariant] = useState<VariantKey>(variantFromUrl);

  function cycle(delta: number) {
    const next = VARIANTS[(VARIANTS.indexOf(variant) + delta + VARIANTS.length) % VARIANTS.length]!;
    setVariant(next);
    const url = new URL(window.location.href);
    url.searchParams.set('variant', next);
    window.history.replaceState(null, '', url);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (event.key === 'ArrowLeft') cycle(-1);
      if (event.key === 'ArrowRight') cycle(1);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <>
      {/* Stand-in for the header affordance (left of Settings); fixed so App.tsx stays untouched. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed top-[15px] right-[92px] z-[55] text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
      >
        Activity
        <span className="absolute -top-0.5 -right-2 size-1.5 rounded-full bg-sky-500" />
      </button>

      {open && (
        <>
          <button type="button" aria-label="Close activity" className="fixed inset-0 z-40 cursor-default bg-transparent" onClick={() => setOpen(false)} />
          {variant === 'A' && <QuietLedger />}
          {variant === 'B' && <TimelineSpine />}
          {variant === 'C' && <ToastReplay />}
        </>
      )}

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 rounded-full bg-slate-900 text-white px-4 py-2 text-xs shadow-xl">
        <button type="button" onClick={() => cycle(-1)} className="hover:text-sky-300">←</button>
        <span className="font-medium whitespace-nowrap">{variant} — {VARIANT_NAMES[variant]}</span>
        <button type="button" onClick={() => cycle(1)} className="hover:text-sky-300">→</button>
      </div>
    </>
  );
}

// A — Quiet ledger: SettingsDrawer twin. Row list, time gutter, chip echoes
// the precedent provenance chip. Message-first hierarchy.
function QuietLedger() {
  return (
    <div className="fixed top-16 inset-x-4 md:inset-x-auto md:right-4 md:w-96 z-50 rounded-lg bg-white text-sm shadow-xl ring-1 ring-slate-200">
      <div className="px-4 pt-4 pb-2">
        <h2 className="font-semibold text-slate-900">Activity</h2>
        <p className="mt-0.5 text-xs text-slate-400">This session · clears on reload</p>
      </div>
      <ul className="divide-y divide-slate-100 px-4 pb-2 max-h-80 overflow-y-auto">
        {ENTRIES.map((entry, i) => (
          <li key={i} className="flex items-start gap-3 py-2.5">
            <span className="w-8 shrink-0 pt-0.5 text-[10px] text-slate-400">{entry.ago}</span>
            <span className="flex-1 text-slate-700 leading-snug">
              {entry.message}
              {entry.distilled && (
                <span className="ml-2 inline-flex align-middle text-[10px] rounded-full px-2 py-0.5 text-sky-700 ring-1 ring-sky-200 bg-white">✦ distilled</span>
              )}
            </span>
            {entry.jump && <button type="button" className="text-xs text-sky-700 underline underline-offset-2 hover:text-sky-900">View</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// B — Timeline spine: chronology-first. A vertical rail with nodes; the ✦
// lives in the node colour, not a chip. Airier, no dividers.
function TimelineSpine() {
  return (
    <div className="fixed top-16 inset-x-4 md:inset-x-auto md:right-4 md:w-96 z-50 rounded-lg bg-white text-sm shadow-xl ring-1 ring-slate-200 px-5 py-4">
      <h2 className="font-semibold text-slate-900">Activity</h2>
      <div className="relative mt-3 max-h-80 overflow-y-auto">
        <div className="absolute left-[5px] top-1 bottom-1 border-l border-slate-200" />
        <ul className="space-y-4">
          {ENTRIES.map((entry, i) => (
            <li key={i} className="relative pl-6">
              <span className={`absolute left-0 top-1 size-3 rounded-full ring-2 ring-white ${entry.distilled ? 'bg-sky-400' : 'bg-slate-300'}`} />
              <span className="block text-[10px] uppercase tracking-wide text-slate-400">{entry.ago} ago{entry.distilled ? ' · ✦ distilled' : ''}</span>
              <span className="block text-slate-700 leading-snug mt-0.5">
                {entry.message}
                {entry.jump && (
                  <button type="button" className="ml-2 text-xs text-sky-700 underline underline-offset-2 hover:text-sky-900">View</button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// C — Toast replay: where toasts went. Chromeless stack of the live toast's
// exact anatomy (dark pill, sky ✦, underlined View), newest on top, older
// entries receding. Continuity-with-the-moment hierarchy.
function ToastReplay() {
  return (
    <div className="fixed top-16 inset-x-4 md:inset-x-auto md:right-4 md:w-96 z-50 max-h-96 overflow-y-auto space-y-2 pr-1">
      {ENTRIES.map((entry, i) => (
        <div
          key={i}
          className="flex items-center justify-between md:justify-start gap-3 rounded-lg bg-slate-900 text-white px-4 py-3 shadow-xl"
          style={{ opacity: Math.max(1 - i * 0.12, 0.45) }}
        >
          <span className="text-[10px] text-slate-400 shrink-0">{entry.ago}</span>
          <span className="text-sm flex-1">{entry.message}</span>
          {entry.distilled && <span className="text-sm text-sky-300">✦ distilled</span>}
          {entry.jump && <button type="button" className="text-sm underline underline-offset-2 text-sky-300 hover:text-sky-200">View</button>}
        </div>
      ))}
    </div>
  );
}
