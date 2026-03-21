# Offline / PWA Lane Todo

This file intentionally lives at the repo root instead of `todos/`.

Purpose:
- reserve a low-conflict parallel work lane
- keep scope away from the active MVP pipeline in `todos/`
- make the current offline/PWA reality explicit before code changes start

## Ownership Boundary

Primary ownership for this lane:
- `src/lib/offline.ts`
- `src/lib/serviceWorker.ts`
- `src/hooks/useOffline.ts`
- `src/components/Settings/OfflineTab.tsx`
- `src/lib/webPush.tsx`
- `public/offline.html`
- `public/manifest.json`
- `convex/pushNotifications.ts`
- `convex/pushNotifications.test.ts`
- `convex/crons.ts`
- `docs/setup/PWA.md`

Avoid unless absolutely required:
- `todos/`
- `scripts/validate/`
- `e2e/screenshot-pages.ts`
- shared `src/components/ui/` primitives
- meetings/editor/Yjs surfaces
- route-wide visual cleanup work

If a change must cross that boundary, keep it narrow and note it in the PR/change summary.

## Why This Is A Good Parallel Lane

This area is not claimed in the active MVP todo pipeline.

It is also structurally isolated:
- mostly platform code
- mostly backend queueing and service worker behavior
- limited overlap with the current validator/screenshots/Tailwind/doc-spec work

## Current Confirmed State

### Registration and runtime

- Service worker registration happens in `src/routes/__root.tsx`, not `src/main.tsx`.
- Registration is gated to production and skipped entirely for `import.meta.env.MODE === "e2e"`.
- The app uses `vite-plugin-pwa` in `vite.config.ts`.
- The app also manually registers `/service-worker.js` in `src/lib/serviceWorker.ts`.
- `src/lib/serviceWorker.ts` now registers immediately if the page is already loaded, instead of waiting forever on a missed `load` event.
- `vite.config.ts` now sets `injectRegister: false`, so the current production build no longer injects `registerSW.js`.
- The production build still ships `/service-worker.js` from `public/service-worker.js`.
- The production build still emits `sw.js` from `vite-plugin-pwa`, but it is not auto-registered by built HTML.
- E2E-only `window.__convex_test_client` exposure is now scoped to `import.meta.env.MODE === "e2e"`, so normal production builds no longer suppress service-worker registration accidentally.
- The dead `src/service-worker.ts` worker candidate has been removed so the repo no longer suggests a second custom worker source file.

### Client-side offline queue

- `src/lib/offline.ts` manages IndexedDB with:
  - `mutations`
  - `cachedData`
- It exposes:
  - `offlineDB`
  - `offlineStatus`
  - `queueOfflineMutation()`
  - `processOfflineQueue()`
- `src/hooks/useOfflineUserSettingsUpdate.ts` now provides the first real queue producer for `userSettings.update`.
- `src/routes/__root.tsx` now registers the first replay handler and flushes the queue on authenticated app startup and on reconnect.
- `src/hooks/useOffline.ts` provides React hooks for:
  - online/offline status
  - queue count
  - local queue management

### UI surface

- `src/components/Settings/OfflineTab.tsx` exposes an Offline settings tab.
- The tab currently reports:
  - browser connectivity
  - local IndexedDB queue state
  - queued item status breakdown for `pending`, `syncing`, and `failed`
  - manual retry/remove controls for failed local queue entries
  - detected service worker/background sync capability
- The tab intentionally avoids claiming verified end-to-end offline replay.

### Push notifications

- `src/lib/webPush.tsx` depends on service worker readiness.
- `convex/pushNotifications.ts` manages subscription state server-side.
- `src/lib/webPush.tsx` uses `navigator.serviceWorker.ready`, so push attaches to whichever service worker owns the app scope at runtime.

### Docs

- `docs/setup/PWA.md` and `docs/README.md` have been updated to reflect the current worker/manifest ownership.
- `src/lib/serviceWorker.test.ts` now covers registration, update banner behavior, install prompt behavior, and cache-clearing behavior.
- Remaining doc work is about keeping future replay/install behavior aligned as implementation changes continue.

## Phase 0 Findings Verified

### Build artifact reality

- Running `pnpm build` now completes successfully.
- The current build emits `dist/client/service-worker.js`, `dist/client/sw.js`, `dist/client/manifest.json`, and `dist/client/manifest.webmanifest`.
- `dist/client/service-worker.js` is copied from `public/service-worker.js`.
- `dist/client/sw.js` is the generated `vite-plugin-pwa` worker.
- `dist/client/index.html` includes a single manifest link for `/manifest.webmanifest`.
- `dist/client/index.html` no longer includes the plugin-injected `/registerSW.js` script tag.
- The manually registered `public/service-worker.js` now caches `/manifest.webmanifest`.

### What this proves

- `vite-plugin-pwa` is active and still generating its own worker and manifest.
- The app code registers `/service-worker.js` from `public/service-worker.js`.
- there is no longer a second custom worker source file in `src/` competing for ownership.
- Auto-registration conflict is reduced because built HTML no longer auto-registers `/sw.js`.
- Manifest ownership is mostly aligned on `manifest.webmanifest`, though `public/manifest.json` is still emitted as an unused artifact.
- `promptInstall()` is now invoked from the root app shell for production, non-E2E builds.

### Build verification note

- `pnpm install --frozen-lockfile` restored the missing `babel-plugin-react-compiler` package in `node_modules`.
- Production build verification is no longer blocked by that missing dependency.

## Confirmed Gaps And Risk Areas

### 1. Build pipeline coherence is unclear

The repo has all of these at once:
- `vite-plugin-pwa` in `vite.config.ts`
- manual registration of `/service-worker.js`

What Phase 0 already proved:
- `vite-plugin-pwa` generates `/sw.js`
- the app ships and manually registers `/service-worker.js`
- plugin auto-registration is now disabled in source config and absent from built HTML
- the dead `src/service-worker.ts` candidate has been removed from source

What is still not proven:
- whether `sw.js` remains completely unused in the runtime after the source-side registration change
- whether push, caching, and update behavior all land cleanly on the manually registered worker only
- whether the unused emitted `public/manifest.json` should be removed entirely

This is no longer a competing-registration problem in built HTML, but it is still a split-ownership problem.

### 2. The offline write path is now explicitly partial

The dead `/api/sync` assumption is gone with the removal of `src/service-worker.ts`.

Current queue behavior:
- `processOfflineQueue()` now increments attempts intentionally
- validates that queued payloads deserialize to JSON objects
- routes replay only through explicitly registered handlers
- records unsupported mutation types as queue failures instead of falsely marking them synced
- the app now registers a real replay handler for `userSettings.update`
- queued `userSettings.update` entries can be produced from dashboard layout, theme, and timezone preferences when offline

That makes the current limitation explicit, but it is still not a full backend replay implementation.

### 3. Client offline replay is not executing product mutations yet

`processOfflineQueue()` currently:
- marks local items as `syncing`
- validates queued payloads
- dispatches only to registered replay handlers
- marks unsupported or corrupt entries back to `pending` or `failed` with explicit errors

What it does not do:
- register replay handlers for most product mutations yet
- handle server conflicts
- persist server-generated IDs or reconciliation data

So the queue shape exists, the failure semantics are truthful, and one real product replay path now exists, but the broader end-to-end replay architecture is still not fully shipped.

### 4. Install/update UX is only partially wired

`src/lib/serviceWorker.ts` exposes:
- `promptInstall()`
- `clearCache()`
- `isStandalone()`

Current repo scan suggests:
- `promptInstall()` is now called from the root app shell in production, non-E2E builds
- registration no longer depends on catching a late `window.load` event
- update and install banners now guard against duplicate DOM insertion

What is still missing:
- product-level confirmation that the install prompt actually appears under real browser installability conditions
- iOS fallback guidance
- analytics or durable logging for update/install interactions

### 5. Offline settings copy may overstate reality

The Offline settings tab says:
- cached content is available
- offline edits will sync automatically
- background sync works

Those claims may be ahead of the verified implementation.

The UI should match actual behavior, not intended behavior.

### 6. Documentation drift is real

`docs/setup/PWA.md` appears older than the current implementation and should not be treated as authoritative until corrected.

## Lane Goals

Primary goal:
- make offline/PWA behavior truthful, coherent, and testable

Secondary goals:
- make install/update behavior real and understandable
- make queue/retry behavior observable
- align docs and settings UI with what actually works

Non-goals for this lane:
- native mobile apps
- major shared UI system refactors
- screenshot/validator infra work unless strictly required
- ambitious offline-first CRDT work for documents/editor

## Execution Plan

## Phase 0: Establish The Truth

- [x] Build production locally and inspect emitted PWA artifacts.
- [x] Verify which worker file is served at `/service-worker.js`. It is the copied `public/service-worker.js`.
- [x] Verify whether `vite-plugin-pwa` is generating the worker, augmenting it, or being bypassed. It is generating a separate `/sw.js`; source config now disables its auto-registration.
- [x] Document the real build/runtime flow in this file once confirmed.
- [x] Confirm whether `public/manifest.json` or the Vite PWA manifest is the source of truth at build time. Current answer: built HTML now links only `manifest.webmanifest`, and the manual worker caches that same path.
- [x] Wire install prompt handling into the production app shell.
- [ ] Confirm whether install prompts are actually shown in production under browser installability rules.
- [x] Confirm code-path ownership for push readiness. `src/lib/webPush.tsx` waits on `navigator.serviceWorker.ready`, which currently resolves against the manually registered `/service-worker.js` path.

## Phase 1: Queue Architecture

- [x] Remove the unused Convex `offlineSync` queue path so the app no longer carries two offline queue models.
- [ ] Write the intended queue architecture in plain language.
- [x] Define source of truth for mutation status.
- [x] Define whether queue visibility in Settings reflects local queue, server queue, or both.
- [x] Define where retry counting lives. It now lives in the client queue processor in `src/lib/offline.ts`.
- [ ] Define whether real backoff exists or whether retries remain best-effort only.
- [ ] Define where conflict resolution lives.
- [ ] Define whether background sync is best-effort only or required behavior.

Current direction:
- IndexedDB is the only offline queue source of truth in the app
- replay should target real backend mutations directly
- reintroduce a server-side queue only if there is a concrete product or audit need

## Phase 2: Make Replay Real

- [x] Remove the fake `/api/sync` replay assumption from the source tree.
- [x] Define a replay-handler registry for allowed `mutationType` values.
- [x] Reject unsupported queued mutation types explicitly.
- [x] Wire the first replay handler through a real backend mutation (`userSettings.update`) and capture success/failure.
- [ ] Extend real replay beyond the initial `userSettings.update` path.
- [ ] Preserve idempotency where possible.
- [ ] Record retryable vs permanent failure states clearly.
- [ ] Handle deleted/archived target entities safely.
- [x] Add serialization guards so corrupt payloads do not poison the full queue.
- [x] Run replay on app startup for the current authenticated client path.
- [x] Run replay on `online` for the current authenticated client path.
- [ ] Decide whether replay should also run via background sync.
- [x] Add a manual queue-processing path from Settings.

## Phase 3: Tighten Read Caching And Offline Navigation

- [ ] Verify offline navigation fallback actually works for app routes in production.
- [ ] Verify the current `fetch` handler does not unintentionally override Workbox runtime caching.
- [ ] Define which routes should work offline:
  - app shell only
  - recently visited pages
  - selected cached entities
- [ ] Define which data is safe to cache locally.
- [ ] Add cache versioning and cleanup rules that match the chosen strategy.
- [ ] Ensure offline fallback behavior distinguishes:
  - uncached route
  - cached stale route
  - authenticated but unreachable backend
- [ ] Decide whether Convex requests should be cached at all, and if so, which subset.

## Phase 4: Make The UI Honest

- [x] Audit `src/components/Settings/OfflineTab.tsx` against the verified implementation.
- [x] Remove or reword claims that are not actually shipped.
- [x] Show whether the queue shown is:
  - local only
  - server only
  - merged
- [x] Show failed vs pending vs syncing counts if those states are real.
- [x] Replace the toast-only queue button with truthful local queue refresh behavior.
- [x] Add manual retry/remove controls for failed local queue items.
- [x] Surface last successful local replay time if it is trustworthy.
- [x] Surface browser capability limits when background sync is unsupported.

## Phase 5: Install And Update Experience

- [ ] Verify whether `promptInstall()` should be invoked somewhere real.
- [x] Invoke `promptInstall()` from the production app shell.
- [ ] Decide whether install prompting should remain automatic or move to a manual/settings-driven entry point.
- [ ] Ensure iOS fallback instructions exist if install prompt cannot be triggered.
- [ ] Make the update banner accessible and consistent with app conventions.
- [x] Prevent duplicate install/update banners.
- [ ] Add explicit analytics or logging for:
  - service worker registered
  - update found
  - update accepted
  - install prompt shown
  - install accepted
  - install dismissed

## Phase 6: Push Notification Integration

- [ ] Verify push subscription survives service worker updates.
- [ ] Verify push still works after cache clears and worker replacement.
- [ ] Ensure push readiness failures do not silently degrade the rest of the lane.
- [ ] Document whether push requires PWA install or only service worker support.
- [ ] Verify unsubscribe cleanup is correct when subscriptions rotate.

## Phase 7: Tests

### Unit / component

- [x] Add `src/lib/serviceWorker.test.ts` for registration/update/install helpers.
- [x] Add `src/lib/offline.test.ts` for queue replay guardrails and failure classification.
- [ ] Extend `src/hooks/useOffline.test.ts` for real replay-trigger conditions.
- [ ] Extend `src/components/Settings/OfflineTab.test.tsx` so the UI contract matches real queue states and manual sync behavior.

### Backend

- [ ] Add tests for whichever replay bridge becomes canonical.
- [ ] Add tests for failure classification and retry behavior.

### E2E

- [ ] Add a focused `e2e` offline/PWA spec once the runtime is trustworthy.
- [ ] Verify:
  - installability
  - offline route fallback
  - recently visited route access offline
  - queued mutation replay after reconnect
  - update flow

Important:
- do not expand screenshot infrastructure as part of this lane unless there is no alternative

## Phase 8: Docs And Ops

- [ ] Rewrite `docs/setup/PWA.md` to match the real code paths.
- [ ] Document the actual service worker build pipeline.
- [ ] Document browser support and known limitations.
- [ ] Document local verification steps for offline, update, and push behavior.
- [ ] Add troubleshooting guidance for stale workers and bad caches.
- [ ] Add a short architecture note explaining queue ownership and replay flow.

## Open Questions

- [ ] Do we want one queue or two?
- [ ] Should offline mutation replay be generic or opt-in per mutation?
- [ ] Which product surfaces are safe to claim as offline-capable today?
- [ ] Do we want server-side persistence of failed offline actions for support/debugging?
- [ ] Is Background Sync required, or do we need a fallback path for unsupported browsers?

## Concrete First Slice

If we want the smallest high-value first pass:

- [x] Verify the emitted worker artifact and registration target.
- [x] Remove the fake `/api/sync` assumption or replace it with a real replay bridge.
- [x] Make Settings show only truthful offline capabilities.
- [x] Update `docs/setup/PWA.md` to stop pointing at stale files.

That slice alone would turn this lane from "looks shipped" into "is understandable and diagnosable."

## Done When

- [ ] There is one clearly documented offline replay architecture.
- [ ] The service worker build and registration path is unambiguous.
- [ ] Offline settings UI reflects actual capabilities, not aspirations.
- [ ] Queued offline mutations replay through a real backend path.
- [ ] Push/install/update behavior is verified after worker updates.
- [ ] Docs describe the current implementation accurately.
- [ ] The lane can be worked independently without touching the active `/todos` pipeline.
