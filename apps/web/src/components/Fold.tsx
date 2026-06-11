import type { ReactNode } from 'react';

/** Evidence folds below the call panel, collapsed by default (round-2 verdict). */
export function Fold({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details className="mb-3 rounded-xl bg-white ring-1 ring-slate-200 px-4 py-3 group" open={defaultOpen}>
      <summary className="text-sm font-medium text-slate-700 cursor-pointer select-none list-none flex items-center justify-between">
        {title}
        <span className="text-slate-400 group-open:rotate-90 transition-transform">▸</span>
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}
