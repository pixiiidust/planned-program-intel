// PROTOTYPE (#18) — throwaway variant sketch; dev-only, never ships. Winner gets rebuilt properly in #19.
import { useCallback, useEffect, useState } from 'react';
import type { Decision } from '@ppi/domain';
import { VariantBriefing } from './VariantBriefing.js';
import { VariantFlow } from './VariantFlow.js';
import { VariantLedger } from './VariantLedger.js';

type VariantKey = 'A' | 'B' | 'C';

interface PortfolioPrototypeProps {
  decisions: readonly Decision[];
}

const VARIANTS: { key: VariantKey; name: string }[] = [
  { key: 'A', name: 'Program ledger' },
  { key: 'B', name: 'Attention briefing' },
  { key: 'C', name: 'Decision flow' },
];

function normalizeVariant(value: string | null): VariantKey {
  return value === 'B' || value === 'C' ? value : 'A';
}

function readVariantFromUrl(): VariantKey {
  return normalizeVariant(new URLSearchParams(window.location.search).get('variant'));
}

function writeVariantToUrl(next: VariantKey): void {
  const url = new URL(window.location.href);
  url.searchParams.set('variant', next);
  window.history.replaceState(window.history.state, '', url);
}

function isTypingTarget(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false;
  return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable;
}

function variantIndex(key: VariantKey): number {
  const index = VARIANTS.findIndex((variant) => variant.key === key);
  return index === -1 ? 0 : index;
}

export function PortfolioPrototype({ decisions }: PortfolioPrototypeProps) {
  const [variant, setVariant] = useState<VariantKey>(() => readVariantFromUrl());

  const cycle = useCallback((direction: -1 | 1) => {
    setVariant((current) => {
      const next = VARIANTS[(variantIndex(current) + direction + VARIANTS.length) % VARIANTS.length]?.key ?? 'A';
      writeVariantToUrl(next);
      return next;
    });
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(document.activeElement)) return;
      if (event.key === 'ArrowLeft') cycle(-1);
      if (event.key === 'ArrowRight') cycle(1);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cycle]);

  const current = VARIANTS[variantIndex(variant)] ?? VARIANTS[0]!;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      {variant === 'A' && <VariantLedger decisions={decisions} />}
      {variant === 'B' && <VariantBriefing decisions={decisions} />}
      {variant === 'C' && <VariantFlow decisions={decisions} />}

      {import.meta.env.DEV && (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-2 py-1.5 text-sm text-white shadow-xl">
          <button
            type="button"
            aria-label="Previous portfolio prototype"
            onClick={() => cycle(-1)}
            className="grid h-8 w-8 place-items-center rounded-full text-lg leading-none text-white hover:bg-white/15"
          >
            ←
          </button>
          <span className="min-w-48 text-center text-sm font-medium">
            {current.key} — {current.name}
          </span>
          <button
            type="button"
            aria-label="Next portfolio prototype"
            onClick={() => cycle(1)}
            className="grid h-8 w-8 place-items-center rounded-full text-lg leading-none text-white hover:bg-white/15"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
