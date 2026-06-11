import type { Urgency, UrgencyLevel } from '@ppi/domain';

// Round-6 verdict: chip badge, height-locked to the 20px text line.
export const URGENCY_STYLE: Record<UrgencyLevel, string> = {
  critical: 'bg-red-100 text-red-700 ring-red-200',
  high: 'bg-orange-100 text-orange-700 ring-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  low: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function UrgencyChip({ urgency, className = '' }: { urgency: Urgency; className?: string }) {
  return (
    <span
      className={`inline-flex items-center h-5 px-1.5 rounded ring-1 text-[11px] font-semibold align-top ${URGENCY_STYLE[urgency.level]} ${className}`}
    >
      {urgency.level.toUpperCase()}
    </span>
  );
}
