// PROTOTYPE — #27 variant round 3. Settled so far: Quiet-ledger panel
// (round 1), bell-icon trigger with neutral count badge (round 2). This round
// varies the ENTRY ROW anatomy (the line-breaking complaint) and fixes:
// horizontal overflow (min-w-0 / overflow-x-hidden), ugly scrollbar (thin),
// badge clears when the panel opens. The static mock toast is GONE — instead
// a dev-only CSS override restyles the REAL toast into the Quiet-ledger
// language, so Accept shows a white functional toast (working View, no
// "View all"). ?variant=A|B|C. Delete after a winner is picked.
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

// Restyle the LIVE toast (App.tsx renders it; selector scoped to fixed+top-4
// so the dark switcher pill and tab buttons are untouched). Judging aid only —
// the real restyle ships via the Codex brief.
const PROTOTYPE_CSS = `
div.fixed.top-4.bg-slate-900 {
  background: #fff !important;
  color: rgb(51 65 85) !important;
  outline: 1px solid rgb(226 232 240);
}
div.fixed.top-4.bg-slate-900 .text-sky-300 { color: rgb(3 105 161) !important; }
div.fixed.top-4.bg-slate-900 .text-slate-400 { color: rgb(148 163 184) !important; }
.proto-activity-list { scrollbar-width: thin; scrollbar-color: rgb(203 213 225) transparent; }
.proto-activity-list::-webkit-scrollbar { width: 6px; }
.proto-activity-list::-webkit-scrollbar-thumb { background: rgb(203 213 225); border-radius: 3px; }
`;

const VARIANTS = ['A', 'B', 'C'] as const;
type VariantKey = (typeof VARIANTS)[number];
const VARIANT_NAMES: Record<VariantKey, string> = {
  A: 'Meta line above',
  B: 'Time gutter (incumbent)',
  C: 'Meta line below',
};

function variantFromUrl(): VariantKey {
  const v = new URLSearchParams(window.location.search).get('variant');
  return v === 'A' || v === 'C' ? v : 'B';
}

export function ActivityPanelPrototype() {
  const [open, setOpen] = useState(false);
  const [unseen, setUnseen] = useState(2);
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

  function openPanel() {
    setOpen((o) => !o);
    setUnseen(0); // opening marks everything seen — the badge's job is done
  }

  return (
    <>
      <style>{PROTOTYPE_CSS}</style>

      <button type="button" onClick={openPanel} aria-label="Activity" className="relative text-slate-400 hover:text-slate-600">
        <BellIcon />
        {unseen > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[14px] rounded-full bg-slate-900 px-1 text-center text-[9px] leading-[14px] text-white">
            {unseen}
          </span>
        )}
      </button>

      {open && (
        <>
          <button type="button" aria-label="Close activity" className="fixed inset-0 z-40 cursor-default bg-transparent" onClick={() => setOpen(false)} />
          <div className="fixed top-16 inset-x-4 md:inset-x-auto md:right-4 md:w-96 z-50 whitespace-normal rounded-lg bg-white text-sm shadow-xl ring-1 ring-slate-200">
            <div className="px-4 pt-4 pb-2">
              <h2 className="font-semibold text-slate-900">Activity</h2>
              <p className="mt-0.5 text-xs text-slate-400">This session · clears on reload</p>
            </div>
            <ul className="proto-activity-list divide-y divide-slate-100 px-4 pb-2 max-h-96 overflow-y-auto overflow-x-hidden">
              {ENTRIES.map((entry, i) => (
                <li key={i} className="py-2.5">
                  {variant === 'A' && <RowMetaAbove entry={entry} />}
                  {variant === 'B' && <RowTimeGutter entry={entry} />}
                  {variant === 'C' && <RowMetaBelow entry={entry} />}
                </li>
              ))}
            </ul>
          </div>
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

function BellIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

// A — tiny meta line (time · ✦) above; the message owns its lines and never
// shares them with chrome. View hangs off the message end.
function RowMetaAbove({ entry }: { entry: PrototypeEntry }) {
  return (
    <>
      <span className="block text-[10px] text-slate-400">
        {entry.ago} ago{entry.distilled && <span className="text-sky-700"> · ✦ distilled</span>}
      </span>
      <span className="block text-slate-700 leading-snug mt-0.5">
        {entry.message}
        {entry.jump && <button type="button" className="ml-2 text-xs text-sky-700 underline underline-offset-2 hover:text-sky-900">View</button>}
      </span>
    </>
  );
}

// B — incumbent: time gutter left, message wraps beside it (min-w-0 fixes the
// round-2 overflow), chip inline, View pinned right.
function RowTimeGutter({ entry }: { entry: PrototypeEntry }) {
  return (
    <span className="flex items-start gap-3">
      <span className="w-8 shrink-0 pt-0.5 text-[10px] text-slate-400">{entry.ago}</span>
      <span className="flex-1 min-w-0 text-slate-700 leading-snug">
        {entry.message}
        {entry.distilled && (
          <span className="ml-2 inline-flex align-middle text-[10px] rounded-full px-2 py-0.5 text-sky-700 ring-1 ring-sky-200 bg-white">✦ distilled</span>
        )}
      </span>
      {entry.jump && <button type="button" className="shrink-0 text-xs text-sky-700 underline underline-offset-2 hover:text-sky-900">View</button>}
    </span>
  );
}

// C — message first at full width; one quiet footer line carries time · ✦ · View.
function RowMetaBelow({ entry }: { entry: PrototypeEntry }) {
  return (
    <>
      <span className="block text-slate-700 leading-snug">{entry.message}</span>
      <span className="block text-[10px] text-slate-400 mt-1">
        {entry.ago} ago{entry.distilled && <span className="text-sky-700"> · ✦ distilled</span>}
        {entry.jump && (
          <>
            {' · '}
            <button type="button" className="text-xs text-sky-700 underline underline-offset-2 hover:text-sky-900">View</button>
          </>
        )}
      </span>
    </>
  );
}
