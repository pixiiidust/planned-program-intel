// PROTOTYPE — #27 variant round 2. Round 1 settled the panel form (Quiet
// ledger). This round varies the HEADER TRIGGER affordance only; the trigger
// now renders inside the real header flex (no overlap with the counts).
// Throwaway: dev-only mount, canned entries. ?variant=A|B|C. Delete after a
// winner is picked.
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

const UNSEEN_COUNT = 2; // canned: entries since the panel was last opened

const VARIANTS = ['A', 'B', 'C'] as const;
type VariantKey = (typeof VARIANTS)[number];
const VARIANT_NAMES: Record<VariantKey, string> = {
  A: 'Text link, no indicator',
  B: 'Bell icon + count badge',
  C: 'Text + tab-style count',
};

function variantFromUrl(): VariantKey {
  const v = new URLSearchParams(window.location.search).get('variant');
  return v === 'B' || v === 'C' ? v : 'A';
}

export function ActivityPanelPrototype() {
  const [open, setOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(true);
  const [variant, setVariant] = useState<VariantKey>(variantFromUrl);

  function cycle(delta: number) {
    const next = VARIANTS[(VARIANTS.indexOf(variant) + delta + VARIANTS.length) % VARIANTS.length]!;
    setVariant(next);
    setToastVisible(true); // re-show the mock toast so each variant is judged with it
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

  const toggle = () => setOpen((o) => !o);

  return (
    <>
      {variant === 'A' && (
        <button type="button" onClick={toggle} className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2">
          Activity
        </button>
      )}
      {variant === 'B' && (
        <button type="button" onClick={toggle} aria-label="Activity" className="relative text-slate-400 hover:text-slate-600">
          <BellIcon />
          {UNSEEN_COUNT > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[14px] rounded-full bg-slate-900 px-1 text-center text-[9px] leading-[14px] text-white">
              {UNSEEN_COUNT}
            </span>
          )}
        </button>
      )}
      {variant === 'C' && (
        <button type="button" onClick={toggle} className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 whitespace-nowrap">
          Activity ({UNSEEN_COUNT})
        </button>
      )}

      {open && (
        <>
          <button type="button" aria-label="Close activity" className="fixed inset-0 z-40 cursor-default bg-transparent" onClick={() => setOpen(false)} />
          <QuietLedger />
        </>
      )}

      {/* Mock toast in the Quiet-ledger language (Jamie: toast should match A),
          with "View all" opening the panel. Stands in for the dark live toast. */}
      {toastVisible && (
        <div className="fixed top-4 left-4 right-4 md:left-auto z-50 flex items-center justify-between md:justify-start gap-3 whitespace-normal rounded-lg bg-white px-4 py-3 text-slate-700 shadow-xl ring-1 ring-slate-200">
          <span className="text-sm">✓ Decided. Your reasoning now appears in 1 similar open decision</span>
          <span className="inline-flex text-[10px] rounded-full px-2 py-0.5 text-sky-700 ring-1 ring-sky-200 bg-white">✦ distilled</span>
          <button type="button" className="text-sm text-sky-700 underline underline-offset-2 hover:text-sky-900">View</button>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setToastVisible(false);
            }}
            className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-600 whitespace-nowrap"
          >
            View all
          </button>
          <button type="button" aria-label="Dismiss notification" onClick={() => setToastVisible(false)} className="text-sm leading-none text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 rounded-full bg-slate-900 text-white px-4 py-2 text-xs shadow-xl">
        <button type="button" onClick={() => cycle(-1)} className="hover:text-sky-300">←</button>
        <span className="font-medium whitespace-nowrap">{variant} — {VARIANT_NAMES[variant]}</span>
        <button type="button" onClick={() => cycle(1)} className="hover:text-sky-300">→</button>
      </div>
    </>
  );
}

function BellIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

// Round-1 winner: SettingsDrawer twin. Row list, time gutter, provenance-chip
// echo for the ✦ state. Unchanged from round 1.
function QuietLedger() {
  return (
    <div className="fixed top-16 inset-x-4 md:inset-x-auto md:right-4 md:w-96 z-50 whitespace-normal rounded-lg bg-white text-sm shadow-xl ring-1 ring-slate-200">
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
