import { useEffect, useRef, useState } from 'react';
import type { Decision, Persona } from '@ppi/domain';
import { needsYouCount } from '@ppi/domain';

interface PersonaSwitcherProps {
  personas: Persona[];
  current: Persona | null;
  decisions: Decision[];
  onSwitch: (persona: Persona | null) => void;
}

function samePersona(a: Persona | null, b: Persona | null): boolean {
  if (!a || !b) return a === b;
  return a.group === b.group && a.name === b.name && a.role === b.role;
}

function rowClass(selected: boolean): string {
  return `w-full rounded-md px-3 py-2 text-left flex items-center justify-between gap-3 ${
    selected ? 'bg-indigo-50 text-indigo-900 ring-1 ring-inset ring-indigo-100' : 'text-slate-700 hover:bg-slate-50'
  }`;
}

export function PersonaSwitcher({ personas, current, decisions, onSwitch }: PersonaSwitcherProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const deciders = personas.filter((p) => p.group === 'decider');
  const escalationPaths = personas.filter((p) => p.group === 'escalation-path');

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function choose(persona: Persona | null) {
    onSwitch(persona);
    setOpen(false);
  }

  const currentName = current?.name ?? 'Whole program';

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1 sm:flex-none">
      <button
        type="button"
        data-testid="persona-switcher"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((next) => !next)}
        className="max-w-full rounded-lg ring-1 ring-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
      >
        <span aria-hidden="true" className="hidden sm:inline text-xs text-slate-400">
          Viewing as
        </span>
        <span className="font-medium truncate">{currentName}</span>
        <span aria-hidden="true" className="text-slate-400">
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute left-1/2 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg bg-white p-2 shadow-xl ring-1 ring-slate-200">
          <button
            type="button"
            data-testid="persona-option"
            aria-pressed={current === null}
            onClick={() => choose(null)}
            className={rowClass(current === null)}
          >
            <span className="text-sm font-medium">Whole program</span>
          </button>

          <div className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Deciders</div>
          {deciders.map((persona) => (
            <button
              key={`${persona.group}-${persona.name}-${persona.role}`}
              type="button"
              data-testid="persona-option"
              aria-pressed={samePersona(current, persona)}
              onClick={() => choose(persona)}
              className={rowClass(samePersona(current, persona))}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{persona.name}</span>
                <span className="block truncate text-xs text-slate-500">{persona.role}</span>
              </span>
              <span className="min-w-6 rounded-full bg-slate-100 px-2 py-0.5 text-center text-xs font-semibold text-slate-600">
                {needsYouCount(persona, decisions)}
              </span>
            </button>
          ))}

          <div className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Escalation paths</div>
          {escalationPaths.map((persona) => (
            <button
              key={`${persona.group}-${persona.name}-${persona.role}`}
              type="button"
              data-testid="persona-option"
              aria-pressed={samePersona(current, persona)}
              onClick={() => choose(persona)}
              className={rowClass(samePersona(current, persona))}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{persona.name}</span>
                <span className="block truncate text-xs text-slate-500">{persona.role}</span>
              </span>
              <span className="min-w-6 rounded-full bg-slate-100 px-2 py-0.5 text-center text-xs font-semibold text-slate-600">
                {needsYouCount(persona, decisions)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
