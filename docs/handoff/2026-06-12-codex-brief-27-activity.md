<task>
Implement the #27 activity timeline in planned-program-intel: a session-scoped activity panel fed by every toast, a header bell with an unseen-count badge, the toast restyled to the panel's white language, and deletion of the prototype that explored this design. Repo root: D:\planned-program-intel\planned-program-intel. The design is fully settled (three variant rounds, verdicts on issue #27) — do not redesign. The dev-only prototype `apps/web/src/components/ActivityPanelPrototype.tsx` is the visual reference for the panel chrome, bell, badge, and row anatomy "A" (meta line above): copy its visual language, then DELETE it and its App.tsx mount/import as part of this change.

Settled behavior (verbatim contract):
- Every toast the app fires also appends an activity entry capturing what the toast showed: message, timestamp, optional jump target, and whether distillation landed. Session-scoped React state only — NO persistence, gone on reload. Capped at 20 entries (drop oldest), rendered newest-first.
- The bell badge shows the count of unseen entries and is hidden while the panel is open. Closing the panel marks all entries seen. Clicking an entry's View marks that entry seen immediately, navigates exactly like the toast View, and closes the panel.
- Unseen entries are visually highlighted in the list.
- ✦ appears on an entry ONLY when distillation actually landed (the toast reached '✦ distilled'). Failures stay wordless — the entry simply never gains the mark (ADR-0002 honest visibility). Pending shows nothing in the list.
- Reset clears the activity list, then the reset toast appends its own entry (so the list shows exactly one entry after reset).
- The live toast is restyled to the white Quiet-ledger language. NO new "View all" affordance. Every existing e2e-asserted toast string and behavior is unchanged.

## Files to create/modify

### 1. apps/web/src/components/ActivityPanel.tsx (NEW)
Presentational panel, visual twin of the prototype's Quiet ledger + row anatomy A. Props:
`{ open: boolean; entries: ActivityEntry[]; onClose: () => void; onJump: (entry: ActivityEntry) => void }`
(import the ActivityEntry type from ../lib/activity.js, see section 2).
- Renders nothing when closed. When open: transparent backdrop button (aria-label "Close activity", fixed inset-0 z-40, closes on click) + panel `fixed top-16 inset-x-4 md:inset-x-auto md:right-4 md:w-96 z-50 whitespace-normal rounded-lg bg-white text-sm shadow-xl ring-1 ring-slate-200`, `role="dialog"` `aria-label="Activity"`. Closes on Escape (window keydown listener while open).
- Header block: h2 "Activity" (font-semibold text-slate-900) + one quiet line "This session · clears on reload" (text-xs text-slate-400).
- List: `ul` with `divide-y divide-slate-100 px-4 pb-2 max-h-96 overflow-y-auto overflow-x-hidden` and the class `activity-list` (for the thin-scrollbar CSS, section 5). Empty state when no entries: a single quiet line "Nothing yet — decisions you make will land here." (text-xs text-slate-400, py-3).
- Each entry `li` (newest first; py-2.5), row anatomy A:
  - Meta line: `<span className="block text-[10px] text-slate-400">{ago} ago{distilled && <span className="text-sky-700"> · ✦ distilled</span>}</span>` — the "✦ distilled" must stay a single text node inside its span.
  - Message line: block text-slate-700 leading-snug mt-0.5 with the message text, and if the entry has a jump, a View button at the end: `ml-2 text-xs text-sky-700 underline underline-offset-2 hover:text-sky-900`, accessible name exactly "View", onClick → onJump(entry).
  - Unseen highlight: when `entry.unseen`, the li gets a subtle tint `bg-sky-50/60 -mx-4 px-4` (seen entries keep plain `px-0`... implement as: li always `-mx-4 px-4`, conditionally add bg-sky-50/60) AND `data-unseen="true"` (attribute absent when seen — e2e hooks on it).
  - Relative time: helper `agoLabel(at: number, now?: number)` exported from ../lib/activity.js: "now" under 60s, then "Xm", then "Xh" (no days needed). Computed at render.

### 2. apps/web/src/lib/activity.ts (NEW)
The tiny domain of the panel, unit-testable:
```ts
export interface ActivityEntry {
  id: number;
  at: number; // Date.now()
  message: string;
  jump?: { tab: QueueTab-equivalent; id: string }; // reuse the app's existing jump shape (same type as Toast['jump'] — move/share the type, do not duplicate it loosely)
  distilled: boolean;
  unseen: boolean;
}
export function appendEntry(entries: ActivityEntry[], entry: Omit<ActivityEntry, 'id' | 'at' | 'distilled' | 'unseen'> & { at?: number }): ActivityEntry[]  // prepends with next id, at = provided or Date.now(), distilled false, unseen true; caps at 20 (drops oldest)
export function markAllSeen(entries: ActivityEntry[]): ActivityEntry[]
export function markSeen(entries: ActivityEntry[], id: number): ActivityEntry[]
export function markDistilled(entries: ActivityEntry[], id: number): ActivityEntry[]
export function unseenCount(entries: ActivityEntry[]): number
export function agoLabel(at: number, now?: number): string
```
Pure functions, no React. The QueueTab type lives in the app — put the shared jump type wherever App.tsx's Toast type can also use it without circular imports (App imports from lib already; defining the jump shape here and having App's Toast reuse it is fine).
Add `apps/web/src/lib/activity.test.ts` (vitest, colocated like existing web lib tests if any exist — check; otherwise follow the repo's test placement convention) covering: cap at 20, prepend order, markSeen/markAllSeen, markDistilled, unseenCount, agoLabel boundaries (59s → "now", 60s → "1m", 3600s → "1h").

### 3. apps/web/src/App.tsx
- State: `const [activity, setActivity] = useState<ActivityEntry[]>([])` and `const [activityOpen, setActivityOpen] = useState(false)`.
- A `notify` helper that replaces every direct `setToast({...})` call site: it sets the toast AND appends an activity entry via appendEntry (message + jump from the toast). It returns the new entry's id. EXCEPTIONS, handled explicitly:
  - The reseed toast ("Demo data refreshed — a new version of the seed was deployed.") and the reset toast: reset first clears activity to [] then notifies (so reset yields exactly one entry). The reseed toast notifies normally.
  - updateDistillToast stays a TOAST-ONLY update (it mutates the existing toast's distill field, not a new event) — but when it lands 'done', the matching activity entry must gain distilled: handleResolve captures the id returned by notify for the nudge toast and passes it to runDistillation, which on success calls setActivity(markDistilled(..., id)) alongside updateDistillToast('done'). On failure: nothing (wordless).
- Bell in the header, replacing nothing: insert between the counts span and the Settings button, exactly where the prototype mounted: `<button type="button" aria-label="Activity" className="relative text-slate-400 hover:text-slate-600">` with the prototype's inline BellIcon SVG (15x15, stroke currentColor) and, when `!activityOpen && unseenCount(activity) > 0`, the badge span `absolute -top-1.5 -right-1.5 min-w-[14px] rounded-full bg-slate-900 px-1 text-center text-[9px] leading-[14px] text-white` showing the count. Clicking toggles the panel; opening the panel closes the settings drawer and vice versa (the two share the top-right space).
- Panel close semantics: whenever the panel transitions open→closed (backdrop, Escape, bell re-click, or a View jump), mark all seen.
- onJump(entry): markSeen(entry.id), close the panel, then perform exactly what the toast View does — extract the existing toast-View handler body into a single `jumpTo(jump)` function used by both (setView inbox, persona null, tab, selectedId, mobileDetail true; the toast path also clears the toast — keep that in the toast's own onClick, not in jumpTo).
- Toast restyle (visual only — every asserted string, the ✦/✦ distilled states, View, and the Dismiss button keep their exact text/roles/behavior):
  - Container: `bg-slate-900 text-white` → `bg-white text-slate-700 ring-1 ring-slate-200` (keep fixed top-4 left-4 right-4 md:left-auto z-50, flex, rounded-lg, px-4 py-3, shadow-xl).
  - Distill span: pending `text-sm animate-pulse text-sky-700`; done `text-sm text-sky-700` (was text-sky-300); failed unchanged (opacity-0 fade).
  - View button: `text-sky-300 hover:text-sky-200` → `text-sky-700 hover:text-sky-900` (keep underline classes).
  - Dismiss ×: `text-slate-400 hover:text-white` → `text-slate-400 hover:text-slate-600`.
- DELETE the prototype: remove `apps/web/src/components/ActivityPanelPrototype.tsx`, its import, and the `{import.meta.env.DEV && <ActivityPanelPrototype />}` mount + its comment.

### 4. apps/web/src/index.css
Add a small scoped block for the thin scrollbar (matches the prototype):
```css
.activity-list { scrollbar-width: thin; scrollbar-color: rgb(203 213 225) transparent; }
.activity-list::-webkit-scrollbar { width: 6px; }
.activity-list::-webkit-scrollbar-thumb { background: rgb(203 213 225); border-radius: 3px; }
```
Match the file's existing comment style if it has one.

### 5. e2e/activity.spec.ts (NEW — import { expect, test } from './fixtures'; the suite-wide **/distill abort is the baseline)
- Spec 1 'resolving feeds the activity panel and the badge tracks unseen':
  - goto '/'; expect `getByRole('button', { name: 'Activity' })` visible and to NOT contain text '1' (no badge yet).
  - Resolve Lisbon (same steps as e2e/distillation.spec.ts resolveLisbon — duplicate the helper locally).
  - Expect the Activity button to contain text '1'.
  - Click it; expect `getByRole('dialog', { name: 'Activity' })` visible; expect an entry containing '✓ Decided. Your reasoning now appears in 1 similar open decision' with `[data-unseen="true"]` on its li; expect NO '✦ distilled' inside the dialog (distill aborted → wordless).
  - Click the dialog's `getByRole('button', { name: 'View' })`; expect the dialog hidden, the detail pane to contain 'Berlin venue contract missing cancellation cap', and the Activity button to no longer show a badge.
- Spec 2 'closing the panel marks entries seen':
  - Resolve Lisbon; open the panel; close it via Escape; reopen; expect the entry present but WITHOUT `data-unseen` (locator `[data-unseen]` count 0 inside the dialog).
- Spec 3 'reset clears the list down to the reset entry':
  - Resolve Lisbon; open Settings; click 'Reset demo data'; open the Activity panel; expect exactly one li in the list, containing '✓ Demo data reset to the pristine seed'.
- Do NOT touch the existing toast/journey/distillation/resolve/feed/settings specs — they must pass unchanged (the toast restyle is class-only). Mind: 'View' exists on the toast too — always scope the panel's View through the dialog locator. Composite asserted strings stay single text nodes. `?feedDelay=0` only if asserting counts.

## Constraints
- Do NOT touch packages/adapters, packages/pipeline, apps/edge, or the storage contract — this is pure web UI + one new lib module.
- No persistence of activity (no localStorage/sessionStorage/IndexedDB).
- No new dependencies; do NOT run npm install.
- Keep comment style sparse and domain-flavored like the codebase.
- All existing e2e-asserted strings/roles unchanged: '✓ Decided. Your reasoning now appears…', '✦' / '✦ distilled', 'View', 'Dismiss notification', 'Settings', 'Reset demo data'.
</task>

<verification_loop>
1. `npm.cmd run typecheck` at the repo root — every workspace must pass (note: @ppi/edge may complain only if workers-types are missing locally; everything else must be clean).
2. `npm.cmd test` — all vitest green including the new activity.test.ts.
3. Do NOT run Playwright — the reviewer runs the e2e suite.
</verification_loop>

<action_safety>
No git commands, no npm install, no network calls, no deploys. Work only inside D:\planned-program-intel\planned-program-intel.
</action_safety>
