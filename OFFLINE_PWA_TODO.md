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
- `src/service-worker.ts`
- `src/hooks/useOffline.ts`
- `src/components/Settings/OfflineTab.tsx`
- `src/lib/webPush.tsx`
- `public/offline.html`
- `public/manifest.json`
- `convex/offlineSync.ts`
- `convex/offlineSync.test.ts`
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
- Registration is gated to production and skipped for E2E when `window.__convex_test_client` exists.
- The app uses `vite-plugin-pwa` in `vite.config.ts`.
- The app also manually registers `/service-worker.js` in `src/lib/serviceWorker.ts`.

### Custom service worker implementation

- Custom service worker logic exists in `src/service-worker.ts`.
- It uses Workbox APIs directly.
- It includes:
  - precache via `precacheAndRoute(self.__WB_MANIFEST)`
  - runtime caching for Convex origins
  - asset caching
  - offline navigation fallback to `/offline.html`
  - background sync listener for `"sync-mutations"`
  - client message handling for `SKIP_WAITING` and `SYNC_QUEUE`

### Client-side offline queue

- `src/lib/offline.ts` manages IndexedDB with:
  - `mutations`
  - `cachedData`
- It exposes:
  - `offlineDB`
  - `offlineStatus`
  - `queueOfflineMutation()`
  - `processOfflineQueue()`
- `src/hooks/useOffline.ts` provides React hooks for:
  - online/offline status
  - queue count
  - local queue management

### Server-side offline queue

- `convex/offlineSync.ts` defines a second queue model in Convex.
- `convex/schema.ts` contains `offlineSyncQueue`.
- `convex/crons.ts` retries failed items and cleans up old completed items.
- `convex/offlineSync.test.ts` already covers the backend queue behavior well.

### UI surface

- `src/components/Settings/OfflineTab.tsx` exposes an Offline settings tab.
- The current UI claims:
  - cached content
  - offline edits
  - background sync
  - install as app
- The tab currently reads only from the client IndexedDB queue.

### Push notifications

- `src/lib/webPush.tsx` depends on service worker readiness.
- `convex/pushNotifications.ts` manages subscription state server-side.

### Docs

- `docs/setup/PWA.md` exists, but parts of it are stale.
- It still references `/public/service-worker.js` and `src/main.tsx`, which do not match the current implementation.

## Confirmed Gaps And Risk Areas

### 1. Build pipeline coherence is unclear

The repo has all of these at once:
- `vite-plugin-pwa` in `vite.config.ts`
- manual registration of `/service-worker.js`
- a custom Workbox service worker in `src/service-worker.ts`

What is not yet proven:
- whether the built output actually ships the custom `src/service-worker.ts`
- whether `vite-plugin-pwa` is generating a different worker than the one being manually registered
- whether the current registration path is pointing at the right built asset

This is the first thing to verify before broad feature work.

### 2. The offline write path looks incomplete

`src/service-worker.ts` tries to sync queued mutations by POSTing to `/api/sync`.

Current repo scan found:
- no implementation of `/api/sync`
- no other consumer of that endpoint

That means the service worker replay path is likely incomplete or dead.

### 3. There are two queue systems with no obvious bridge

Client queue:
- IndexedDB in `src/lib/offline.ts`

Server queue:
- Convex table and mutations in `convex/offlineSync.ts`

What is not obvious from current code:
- how a local queued mutation becomes a server queue item
- whether both systems are meant to exist long-term
- which one is the source of truth

This is the core architectural gap in the lane.

### 4. Client offline replay is not executing real mutations

`processOfflineQueue()` currently:
- marks local items as `syncing`
- parses stored JSON
- marks items as `synced`

What it does not do:
- call the intended mutation handler
- map `mutationType` to a real Convex mutation
- handle server conflicts
- persist server-generated IDs or reconciliation data

So the queue shape exists, but the end-to-end replay path does not appear fully shipped.

### 5. Install/update UX is only partially wired

`src/lib/serviceWorker.ts` exposes:
- `promptInstall()`
- `clearCache()`
- `isStandalone()`

Current repo scan suggests:
- these helpers are defined
- but they do not appear to have active call sites beyond `register()`

That needs verification and likely cleanup.

### 6. Offline settings copy may overstate reality

The Offline settings tab says:
- cached content is available
- offline edits will sync automatically
- background sync works

Those claims may be ahead of the verified implementation.

The UI should match actual behavior, not intended behavior.

### 7. Documentation drift is real

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

- [ ] Build production locally and inspect the actual emitted service worker artifact.
- [ ] Verify which worker file is served at `/service-worker.js`.
- [ ] Verify whether `vite-plugin-pwa` is generating the worker, augmenting it, or being bypassed.
- [ ] Document the real build/runtime flow in this file once confirmed.
- [ ] Confirm whether `public/manifest.json` or the Vite PWA manifest is the source of truth at build time.
- [ ] Confirm whether install prompts are ever shown in production.
- [ ] Confirm whether push subscription depends on the same service worker that handles offline caching.

## Phase 1: Pick One Queue Architecture

Decision required:
- option A: local IndexedDB queue is the source of truth and replays directly to Convex
- option B: local IndexedDB queue is a short-lived client buffer that flushes into `offlineSyncQueue`
- option C: remove one of the two queue models entirely

- [ ] Write the intended queue architecture in plain language.
- [ ] Define source of truth for mutation status.
- [ ] Define where retry/backoff lives.
- [ ] Define where conflict resolution lives.
- [ ] Define whether queue visibility in Settings reflects local queue, server queue, or both.
- [ ] Define whether background sync is best-effort only or required behavior.

Preferred default unless code proves otherwise:
- use IndexedDB as the client buffer
- replay directly to real Convex mutations
- keep the Convex queue only if there is a concrete product or audit need for server-side persistence

## Phase 2: Make Replay Real

- [ ] Replace the fake `/api/sync` replay path with a real one.
- [ ] Define a typed mapping from `mutationType` to allowed replay handlers.
- [ ] Reject unsupported queued mutation types explicitly.
- [ ] Ensure replay calls the actual backend mutation and captures success/failure.
- [ ] Preserve idempotency where possible.
- [ ] Record retryable vs permanent failure states clearly.
- [ ] Handle deleted/archived target entities safely.
- [ ] Add serialization guards so corrupt payloads do not poison the full queue.
- [ ] Decide whether replay runs:
  - on `online`
  - via background sync
  - on app startup
  - manually from Settings

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

- [ ] Audit `src/components/Settings/OfflineTab.tsx` against the verified implementation.
- [ ] Remove or reword claims that are not actually shipped.
- [ ] Show whether the queue shown is:
  - local only
  - server only
  - merged
- [ ] Show failed vs pending vs syncing counts if those states are real.
- [ ] Wire the "Sync Now" button to actual sync logic instead of a toast-only placeholder.
- [ ] Decide whether users can delete or retry queue items manually.
- [ ] Surface last successful sync time if it is trustworthy.
- [ ] Surface browser capability limits when background sync is unsupported.

## Phase 5: Install And Update Experience

- [ ] Verify whether `promptInstall()` should be invoked somewhere real.
- [ ] Decide whether install prompting should be automatic, manual, or settings-driven.
- [ ] Ensure iOS fallback instructions exist if install prompt cannot be triggered.
- [ ] Make the update banner accessible and consistent with app conventions.
- [ ] Prevent duplicate install/update banners.
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

- [ ] Add `src/lib/serviceWorker.test.ts` for registration/update/install helpers.
- [ ] Add `src/lib/offline.test.ts` for IndexedDB queue behavior if coverage is still missing.
- [ ] Extend `src/hooks/useOffline.test.ts` for real replay-trigger conditions.
- [ ] Extend `src/components/Settings/OfflineTab.test.tsx` so the UI contract matches real queue states and manual sync behavior.

### Backend

- [ ] Keep `convex/offlineSync.test.ts` green while architecture changes land.
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

- [ ] Is the custom `src/service-worker.ts` definitely the worker that production serves?
- [ ] Do we want one queue or two?
- [ ] Should offline mutation replay be generic or opt-in per mutation?
- [ ] Which product surfaces are safe to claim as offline-capable today?
- [ ] Do we want server-side persistence of failed offline actions for support/debugging?
- [ ] Is Background Sync required, or do we need a fallback path for unsupported browsers?

## Concrete First Slice

If we want the smallest high-value first pass:

- [ ] Verify the emitted worker artifact and registration target.
- [ ] Remove the fake `/api/sync` assumption or replace it with a real replay bridge.
- [ ] Make Settings show only truthful offline capabilities.
- [ ] Update `docs/setup/PWA.md` to stop pointing at stale files.

That slice alone would turn this lane from "looks shipped" into "is understandable and diagnosable."

## Done When

- [ ] There is one clearly documented offline replay architecture.
- [ ] The service worker build and registration path is unambiguous.
- [ ] Offline settings UI reflects actual capabilities, not aspirations.
- [ ] Queued offline mutations replay through a real backend path.
- [ ] Push/install/update behavior is verified after worker updates.
- [ ] Docs describe the current implementation accurately.
- [ ] The lane can be worked independently without touching the active `/todos` pipeline.
