import { useEffect, useState } from 'react';
import type { EngineChoice } from '../lib/distillation.js';
import {
  loadByokKey,
  loadEngineSettings,
  saveByokKey,
  saveByokModel,
  saveEngineChoice,
  saveOllamaEndpoint,
  saveOllamaModel,
} from '../lib/distillation.js';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  onReset: () => void;
}

export function SettingsDrawer({ open, onClose, onReset }: SettingsDrawerProps) {
  const [engine, setEngine] = useState<EngineChoice>('demo');
  const [byokKey, setByokKey] = useState('');
  const [byokModel, setByokModel] = useState('');
  const [ollamaEndpoint, setOllamaEndpoint] = useState('');
  const [ollamaModel, setOllamaModel] = useState('');

  useEffect(() => {
    if (!open) return;
    const settings = loadEngineSettings();
    setEngine(settings.engine);
    setByokKey(loadByokKey() ?? '');
    setByokModel(settings.byokModel);
    setOllamaEndpoint(settings.ollamaEndpoint);
    setOllamaModel(settings.ollamaModel);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  function chooseEngine(value: EngineChoice) {
    setEngine(value);
    saveEngineChoice(value);
  }

  return (
    <>
      <button type="button" aria-label="Close settings" className="fixed inset-0 z-40 cursor-default bg-transparent" onClick={onClose} />
      <div
        role="dialog"
        aria-label="Settings"
        className="fixed top-16 inset-x-4 md:inset-x-auto md:right-4 md:w-96 z-50 rounded-lg bg-white p-4 text-sm shadow-xl ring-1 ring-slate-200"
      >
        <section>
          <h2 className="font-semibold text-slate-900">Distillation engine</h2>
          <p className="mt-1 text-slate-500 leading-relaxed">
            Condenses your reasoning into the Precedent that lands in similar decisions. Resolution never waits on it.
          </p>

          <fieldset className="mt-4 space-y-3">
            <legend className="sr-only">Distillation engine</legend>
            <EngineOption
              value="demo"
              checked={engine === 'demo'}
              onChange={chooseEngine}
              title="Demo"
              description="Our key, behind a capped proxy. Haiku does the distilling."
            />
            <EngineOption
              value="byok"
              checked={engine === 'byok'}
              onChange={chooseEngine}
              title="Bring your own key"
              description="Your OpenRouter key, sent browser-direct to the provider — never to our infrastructure. Also the route to free models (try a ':free' model id)."
            />
            {engine === 'byok' && (
              <div className="ml-6 space-y-3 rounded-md bg-slate-50 p-3 ring-1 ring-slate-100">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">OpenRouter API key</span>
                  <input
                    type="password"
                    value={byokKey}
                    onChange={(event) => {
                      setByokKey(event.target.value);
                      saveByokKey(event.target.value);
                    }}
                    className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </label>
                <p className="text-xs text-slate-400">Stored in sessionStorage only — gone when the tab closes.</p>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Model</span>
                  <input
                    type="text"
                    value={byokModel}
                    onChange={(event) => {
                      setByokModel(event.target.value);
                      saveByokModel(event.target.value);
                    }}
                    className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </label>
              </div>
            )}
            <EngineOption
              value="ollama"
              checked={engine === 'ollama'}
              onChange={chooseEngine}
              title="Local"
              description="Your Ollama endpoint. Offline and keyless."
            />
            {engine === 'ollama' && (
              <div className="ml-6 space-y-3 rounded-md bg-slate-50 p-3 ring-1 ring-slate-100">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Ollama endpoint</span>
                  <input
                    type="text"
                    value={ollamaEndpoint}
                    onChange={(event) => {
                      setOllamaEndpoint(event.target.value);
                      saveOllamaEndpoint(event.target.value);
                    }}
                    className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Model</span>
                  <input
                    type="text"
                    value={ollamaModel}
                    onChange={(event) => {
                      setOllamaModel(event.target.value);
                      saveOllamaModel(event.target.value);
                    }}
                    className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </label>
              </div>
            )}
          </fieldset>
        </section>

        <section className="mt-5 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => {
              onReset();
              onClose();
            }}
            className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
          >
            Reset demo data
          </button>
          <p className="mt-1 text-xs text-slate-500">Restores the pristine seed.</p>
        </section>
      </div>
    </>
  );
}

interface EngineOptionProps {
  value: EngineChoice;
  checked: boolean;
  onChange: (value: EngineChoice) => void;
  title: string;
  description: string;
}

function EngineOption({ value, checked, onChange, title, description }: EngineOptionProps) {
  return (
    <label className="flex cursor-pointer items-start gap-2">
      <input type="radio" name="distillation-engine" value={value} checked={checked} onChange={() => onChange(value)} className="mt-1" />
      <span>
        <span className="block font-medium text-slate-900">{title}</span>
        <span className="block text-slate-500 leading-relaxed">{description}</span>
      </span>
    </label>
  );
}
