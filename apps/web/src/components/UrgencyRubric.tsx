// Tap-to-open urgency rubric tying levels to business outcomes (round-6
// verdict): the chip is never an unexplained label.
import { useState } from 'react';
import type { Urgency, UrgencyLevel } from '@ppi/domain';
import { URGENCY_STYLE } from './UrgencyChip.js';

export const URGENCY_RUBRIC: Record<UrgencyLevel, string> = {
  critical: 'Likely irreversible business loss within days if no one acts — committed money, locked dates, or stakeholder trust.',
  high: 'Material cost or risk that compounds quickly. Recoverable, but every day of delay is expensive.',
  medium: 'Real but bounded cost of delay. Decide inside the stated window and nothing is lost.',
  low: 'Minimal downside either way. Batch it with other calls.',
};

/**
 * Interactive urgency chip for the detail header: opens the rubric popover.
 * Outdented by its own padding so its first letter aligns with the P of
 * PROBLEM and the A of ACTION (round-6 verdict).
 */
export function UrgencyTrigger({ urgency }: { urgency: Urgency }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block shrink-0 align-top">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center h-5 px-1.5 rounded ring-1 text-[11px] font-semibold -ml-1.5 cursor-help ${URGENCY_STYLE[urgency.level]}`}
        title="What do these levels mean?"
      >
        {urgency.level.toUpperCase()}
        <span className="opacity-60 ml-1">ⓘ</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 w-[19rem] max-w-[80vw] z-40 rounded-lg bg-slate-900 text-slate-100 p-3.5 shadow-xl text-left">
            <p className="text-xs font-semibold mb-2.5 text-slate-300">
              Urgency = size and reversibility of the business loss if nobody acts.
            </p>
            {(Object.entries(URGENCY_RUBRIC) as [UrgencyLevel, string][]).map(([level, text]) => (
              <p key={level} className={`text-xs mb-2 leading-snug ${level === urgency.level ? 'text-white' : 'text-slate-500'}`}>
                <span className={`font-bold uppercase ${level === urgency.level ? 'text-amber-300' : ''}`}>{level}</span> — {text}
              </p>
            ))}
          </div>
        </>
      )}
    </span>
  );
}
