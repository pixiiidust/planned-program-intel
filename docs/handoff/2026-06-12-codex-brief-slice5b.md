<task>
Implement slice 5.2 (#21) of planned-program-intel: the engine picker in a settings drawer, plus the manual live-eval script for the distillation prompt. Repo root: D:\planned-program-intel\planned-program-intel. This builds directly on the slice-5.1 code already in the tree (shared distillation module in packages/adapters/src/ai/distillation.ts, engine settings contract in apps/web/src/lib/distillation.ts, Worker in apps/edge). Read those first — do not change their contracts.

Settled design (do not redesign):
- The engine picker makes the AI port's adapters a clickable feature. Three visible engines: **Demo** (default; the capped Worker proxy — our key behind a capped proxy), **Bring your own key** (browser-direct to OpenRouter; key in sessionStorage only, never sent to our infrastructure; this path doubles as the route to free OpenRouter models — say so in the picker copy), **Local** (user-supplied Ollama endpoint; offline and keyless is its point). The canned/verbatim fallback is universal and NOT in the menu.
- The settings drawer also becomes the home of the reset-demo-data affordance (it moves out of the header).
- Selection drives the live distillation moment via the storage contract ALREADY implemented in apps/web/src/lib/distillation.ts: localStorage `ppi-engine` | `ppi-byok-model` | `ppi-ollama-endpoint` | `ppi-ollama-model`; sessionStorage `ppi-byok-key`. The drawer writes those keys; distillResolution already reads them per resolution. Any engine failure stays silent per the degradation contract (already handled — don't touch it).
- Live eval: the same DISTILLATION_FIXTURES against real Haiku via OpenRouter; mechanical assertions + outputs printed for human review; a manual pre-ship script, NEVER run in CI.

## Files to create/modify

### 1. apps/web/src/components/SettingsDrawer.tsx (NEW)
A small dialog panel, visually consistent with the app (white, ring-1 ring-slate-200, rounded-lg, shadow-xl, text-sm). Props: `{ open: boolean; onClose: () => void; onReset: () => void }`.
- Renders nothing when closed. When open: fixed positioning below the header, right-aligned on md+ (`md:right-4 md:w-96`), inset-x-4 on mobile; `role="dialog"` `aria-label="Settings"`; closes on Escape and on clicking the backdrop (a transparent fixed overlay behind the panel).
- **Engine picker**: heading "Distillation engine" with one short explainer line, e.g. "Condenses your reasoning into the Precedent that lands in similar decisions. Resolution never waits on it." Radio group (real `<input type="radio">`, accessible labels) with three options:
  - `Demo` — copy: "Our key, behind a capped proxy. Haiku does the distilling."
  - `Bring your own key` — copy: "Your OpenRouter key, sent browser-direct to the provider — never to our infrastructure. Also the route to free models (try a `:free` model id)."
  - `Local` — copy: "Your Ollama endpoint. Offline and keyless."
- Conditional fields under the selected option:
  - BYO: password-type input labeled "OpenRouter API key" (value from sessionStorage `ppi-byok-key`, written on change; never written to localStorage) + text input labeled "Model" (localStorage `ppi-byok-model`). Under the key input one quiet line: "Stored in sessionStorage only — gone when the tab closes."
  - Local: text inputs labeled "Ollama endpoint" and "Model" (localStorage `ppi-ollama-endpoint` / `ppi-ollama-model`).
- Writes happen immediately on change (no save button). Read initial values via the exported helpers from ../lib/distillation.js (loadEngineSettings, loadByokKey); add small exported setters to apps/web/src/lib/distillation.ts (`saveEngineChoice`, `saveByokKey`, `saveByokModel`, `saveOllamaEndpoint`, `saveOllamaModel`) that write the same keys, wrapped in try/catch like the readers.
- **Reset section** at the bottom, separated by a border-t: a button with accessible name exactly `Reset demo data` (full text, no mobile abbreviation needed inside the drawer) and a one-line note "Restores the pristine seed." Clicking calls `onReset` and then `onClose`.

### 2. apps/web/src/App.tsx
- Remove the header "Reset demo data" button (including its mobile "Reset" variant and aria-label).
- Add in its place a header button with visible text `Settings` styled like the old reset link (text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2), toggling the drawer.
- Render `<SettingsDrawer open={...} onClose={...} onReset={() => void handleReset()} />` near the toast at the shell level. handleReset itself is unchanged.

### 3. packages/pipeline/src/evalDistill.ts (NEW) + packages/pipeline/package.json script
- Script `"eval:distill": "tsx src/evalDistill.ts"`.
- Top comment: "Manual pre-ship eval of the distillation prompt against real Haiku via OpenRouter (the #14 narration-review pattern). Run before any prompt change ships. NEVER wired into CI — it spends real money and its value is the human read of the outputs."
- Behavior: reuse the repo-root .env loading exactly the way cli.ts does (extract `loadRepoEnv` into a tiny shared helper or duplicate the ~10 lines with a pointer comment — prefer extracting to `src/env.ts` and having cli.ts import it). Require OPENROUTER_API_KEY (die with the same message style as cli.ts). For each fixture in DISTILLATION_FIXTURES (import from @ppi/adapters):
  - Call the engine DIRECTLY (createOpenRouterAi({ apiKey, model: 'anthropic/claude-haiku-4.5', maxTokens: DISTILL_MAX_TOKENS }).generateJson(buildDistillationRequest(input))) — no 3s abort here; this is an eval, not the live moment. Catch errors per fixture and report them as failures without stopping the run.
  - Print: fixture name, the input reasoning (first ~120 chars), the RAW model text, and the verdict from acceptDistilledText (ACCEPTED with final text, or REJECTED — name which mechanical guard failed: empty / digits / sentence count / malformed shape; compute the named reason inline in the script with the same checks, don't change the shared module).
  - End with a summary table (fixture → pass/fail) and `process.exit(1)` if any mechanical assertion failed, else 0. Note in output that prompt-injection and condensation quality are judged by the human reading the outputs.

### 4. e2e updates (use ./fixtures — its '**/distill' abort stays the baseline)
- e2e/resolve.spec.ts 'Reset demo data restores the pristine seed' and e2e/feed.spec.ts 'reset re-arms' (and any other spec clicking the reset button — grep for 'Reset demo data'): the reset button now lives in the drawer. Update to: click `getByRole('button', { name: 'Settings' })`, then click `getByRole('button', { name: 'Reset demo data' })` inside the dialog. Change nothing else in those specs.
- e2e/settings.spec.ts (NEW):
  - Spec 1 'engine picker persists and the drawer hosts reset': open Settings; expect the dialog visible with the Demo radio checked by default; check 'Bring your own key'; fill the key input with 'sk-or-test-1234' and Model with 'google/gemma-2-9b-it:free'; reload the page; open Settings; expect BYO still checked and model value persisted, key input still populated (same tab session); assert via page.evaluate that `localStorage.getItem('ppi-byok-key') === null` and `sessionStorage.getItem('ppi-byok-key')` equals the typed key (the key NEVER touches localStorage); expect the 'Reset demo data' button present inside the dialog.
  - Spec 2 'BYO engine drives the live moment browser-direct': open Settings, pick BYO, fill key + leave default model, close the drawer (Escape). Route `**/openrouter.ai/**` with a fulfilled chat-completions response whose JSON body is `{ choices: [{ message: { content: JSON.stringify({ distilled: 'Accepted because storm exposure outweighed the deposit ask.' }) } }] }` (content-type application/json, access-control-allow-origin *). Resolve the Lisbon decision (same steps as e2e/distillation.spec.ts resolveLisbon). Expect the toast to settle to `✦ distilled`, and the sibling's precedent chip `title` attribute to contain 'Your key' (assert via locator attribute on the chip in the precedents block after navigating like distillation.spec.ts does).
  - Spec 3 'Ollama selection switches the target': open Settings, pick Local, set endpoint to 'http://localhost:11434'; route `**/api/chat` to fulfill with `{ message: { content: JSON.stringify({ distilled: 'Kept the local crew because the variance was not worth the premium.' }) } }`; resolve Lisbon; expect `✦ distilled` toast and the chip title to contain 'Ollama'.
- Mind the project gotchas: asserted strings single text nodes; getByRole name matching is substring-based — 'Reset demo data' inside the drawer must not collide with other buttons; `?feedDelay=0` only if asserting counts.

## Constraints
- Do NOT change the distillation module, demoProxy, Worker, or the storage KEY NAMES — only add the setter helpers in apps/web/src/lib/distillation.ts.
- Do NOT add the eval script to CI (.github/workflows) or to any npm script that CI calls (verify `validate`, `test`, `typecheck`, `build` are untouched).
- Do NOT run npm install; no new dependencies are needed.
- Do NOT echo, read, or reference the repo-root .env contents — the eval script reads it at runtime on Jamie's machine only.
- Keep comment style sparse and domain-flavored like the codebase.
</task>

<verification_loop>
1. `npm.cmd run typecheck` at the repo root — @ppi/edge may still fail on missing @cloudflare/workers-types if the reviewer hasn't installed yet; every other workspace must pass.
2. `npm.cmd test` — all vitest green.
3. Do NOT run Playwright or the eval script — the reviewer runs both.
</verification_loop>

<action_safety>
No git commands, no npm install, no network calls, no deploys. Work only inside D:\planned-program-intel\planned-program-intel.
</action_safety>
