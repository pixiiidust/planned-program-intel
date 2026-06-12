import { useEffect } from 'react';
import { agoLabel, type ActivityEntry } from '../lib/activity.js';

interface ActivityPanelProps {
  open: boolean;
  entries: ActivityEntry[];
  onClose: () => void;
  onJump: (entry: ActivityEntry) => void;
}

export function ActivityPanel({ open, entries, onClose, onJump }: ActivityPanelProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <>
      <button type="button" aria-label="Close activity" className="fixed inset-0 z-40 cursor-default bg-transparent" onClick={onClose} />
      <div
        className="fixed top-16 inset-x-4 md:inset-x-auto md:right-4 md:w-96 z-50 whitespace-normal rounded-lg bg-white text-sm shadow-xl ring-1 ring-slate-200"
        role="dialog"
        aria-label="Activity"
      >
        <div className="px-4 pt-4 pb-2">
          <h2 className="font-semibold text-slate-900">Activity</h2>
          <p className="mt-0.5 text-xs text-slate-400">This session · clears on reload</p>
        </div>
        <ul className="activity-list divide-y divide-slate-100 px-4 pb-2 max-h-96 overflow-y-auto overflow-x-hidden">
          {entries.length === 0 ? (
            <li className="py-3 text-xs text-slate-400">Nothing yet — decisions you make will land here.</li>
          ) : (
            entries.map((entry) => {
              const label = agoLabel(entry.at);
              return (
                <li key={entry.id} className={`-mx-4 px-4 py-2.5 ${entry.unseen ? 'bg-sky-50/60' : ''}`} data-unseen={entry.unseen ? 'true' : undefined}>
                  <span className="block text-[10px] text-slate-400">
                    {label === 'now' ? 'now' : `${label} ago`}{entry.distilled && <span className="text-sky-700"> · ✦ distilled</span>}
                  </span>
                  <span className="block text-slate-700 leading-snug mt-0.5">
                    {entry.message}
                    {entry.jump && (
                      <button type="button" className="ml-2 text-xs text-sky-700 underline underline-offset-2 hover:text-sky-900" onClick={() => onJump(entry)}>
                        View
                      </button>
                    )}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </>
  );
}
