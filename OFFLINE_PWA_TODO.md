# Offline / PWA Remaining Todo

This file intentionally lives at the repo root instead of `todos/`.

Purpose:

- keep the offline/PWA lane separate from the active `/todos` pipeline
- show only remaining work
- make handoff easy when multiple agents or devices are involved

## Current Branch Snapshot

- branch: `fix-backend`
- worktree: clean
- latest verified commands on this branch:
  - `pnpm run typecheck`
  - `pnpm test --run src/lib/authRecovery.test.ts src/lib/offline.test.ts src/hooks/useConvexHelpers.test.ts src/components/Dashboard.test.tsx`
  - `pnpm test --run src/hooks/useOfflineUserSettingsUpdate.test.ts src/components/Settings/OfflineTab.test.tsx src/lib/authRecovery.test.ts src/lib/offline.test.ts`
  - `pnpm exec playwright test -c playwright.preview.config.ts --workers=1`
- latest preview result: `7/7` tests passed against the built app

## Current Verified State

What is already true in the repo:

- the app registers `/service-worker.js` from `src/lib/serviceWorker.ts`
- built HTML no longer auto-registers the generated `vite-plugin-pwa` worker
- `vite-plugin-pwa` still emits `/sw.js`
- built HTML links `/manifest.webmanifest`
- production-preview browser automation now confirms `/service-worker.js` controls runtime and `/sw.js` does not take control unexpectedly
- production-preview browser automation now confirms the runtime links `/manifest.webmanifest` and caches `/`, `/offline.html`, and `/manifest.webmanifest`
- the public PWA icon set now exists in `public/` (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `badge-72.png`)
- production-preview browser automation now confirms uncached offline navigation falls back to `offline.html`
- production-preview browser automation now confirms previously visited authenticated routes reload and navigate offline in preview
- production-preview browser automation now confirms Chromium reports zero installability errors for the built app
- local IndexedDB is the only offline mutation queue source of truth
- `userSettings.update` is the first real replayable offline mutation family
- replay runs on authenticated startup, reconnect, and manual `Process Queue`
- Settings shows truthful local queue diagnostics, last successful local replay time, and capability-limit warnings
- browser automation now covers queued timezone replay for `userSettings.update` in `e2e/settings/offline-replay.spec.ts`
- browser automation now covers preview-runtime worker ownership and uncached offline fallback in `e2e/preview/pwa-runtime.spec.ts`
- browser automation now covers authenticated preview replay, manual `Process Queue`, and `Last Successful Replay` updates in `e2e/preview/offline-replay-preview.spec.ts`
- offline architecture and verification docs now exist:
  - `docs/setup/PWA.md`
  - `docs/setup/OFFLINE_ARCHITECTURE.md`

## Recommended Next Step

Highest-value next move:

1. **Fix Section 0 code review bugs** — these are correctness issues that block merge.
   Start with 0.5 (race condition) and 0.3 (stale object) as they can silently corrupt queue state.
   Items 0.1/0.6 share a single fix (stabilize `persistedState` ref). Item 0.4 is a one-liner.
2. Then resume with push behavior verification and worker/manifest ownership cleanup.

Why:

- the Section 0 bugs can permanently mark queued mutations as `failed` (0.5), use stale attempt counts (0.3), or trigger unnecessary re-renders on every navigation (0.1/0.6)
- these are not theoretical — they affect the happy path for any user who goes offline and comes back
- the remaining push/worker uncertainty is still the next open risk after correctness is fixed

## Remaining Work

## 0. Code Review Bugs (must fix before merge)

Issues found during review of the `fix-backend` branch. All are implementation bugs or
correctness gaps in already-shipped code on this branch.

### 0.1 Infinite-render risk in `useStableOrgData`

**File:** `src/routes/_auth/_app/$orgSlug/route.tsx:94-132`

`readLocalStorageJson()` is called unconditionally in the component body, returning a
fresh object reference every render. That object is in the dependency arrays of two
`useEffect`s, so both effects fire every render, each calling `writeLocalStorageJson`.
If anything downstream reads that key reactively, this becomes an infinite loop.

- [ ] Read `persistedState` once into a `useRef` (or `useState` with lazy initializer) so the reference is stable.
- [ ] Remove `persistedState` from both `useEffect` dependency arrays.
- [ ] Add a unit test that renders `OrganizationLayout` twice and asserts `writeLocalStorageJson` is not called on a no-op re-render.

### 0.2 Untyped args in `replayUserSettingsUpdate`

**File:** `src/lib/offlineUserSettings.ts:14-18`

The replay handler receives `OfflineMutationArgs` (`Record<string, unknown>`) but
passes it straight to `client.mutation(api.userSettings.update, args)` with no
validation. If the queued payload is malformed (corruption, schema migration), the
Convex call throws a runtime error with no user-facing recovery.

- [ ] Add a type guard (`isUserSettingsUpdateArgs`) that validates the shape before calling `client.mutation`.
- [ ] On validation failure, mark the mutation as permanently `failed` with a descriptive error instead of retrying.
- [ ] Add a unit test that queues malformed args and asserts the item is marked `failed`, not retried.

### 0.3 Double attempt-count increment / stale object in `processQueuedMutation`

**File:** `src/lib/offline.ts:528-544`

Line 532 calls `updateMutationStatus("syncing", { incrementAttempts: true })`, bumping
the DB record to `N+1`. The catch block on line 544 then computes
`getNextFailureStatus(mutation.attempts + 1)` — but `mutation` is the stale pre-write
object, so this evaluates to `original + 1` which happens to match the DB by accident.
`nextAttemptCount` (line 528) is computed but only used for the log message.

- [ ] After the `"syncing"` write, update the local `mutation.attempts` (or use `nextAttemptCount`) so the catch block uses the authoritative value.
- [ ] Change the catch block to `getNextFailureStatus(nextAttemptCount)` instead of `getNextFailureStatus(mutation.attempts + 1)`.
- [ ] Add a unit test that replays a mutation at attempt 2, triggers a failure, and asserts the status is `"failed"` (not `"pending"`).

### 0.4 Redundant online check in `canQueueOfflineReplay`

**File:** `src/hooks/useOfflineUserSettingsUpdate.ts:16-18`

```typescript
function canQueueOfflineReplay(isOnline: boolean): boolean {
  return !isOnline || (typeof navigator !== "undefined" && navigator.onLine === false);
}
```

`useOnlineStatus` already tracks `navigator.onLine`. If `isOnline` is `true` but
`navigator.onLine` is `false`, that is a state inconsistency in `OfflineStatusManager`,
not a valid queuing condition. The double-check masks the real bug.

- [ ] Simplify to `return !isOnline;`.
- [ ] If the `OfflineStatusManager` can genuinely drift from `navigator.onLine`, fix the manager instead.
- [ ] Update the test for `shouldQueueOfflineUpdate` to cover the simplified path.

### 0.5 Race between handler registration and queue flush on reconnect

**File:** `src/routes/__root.tsx:123-163`

`OfflineReplayBootstrap` has two effects: one registers the replay handler, the other
flushes the queue (and listens for `online` events). Both gate on
`isAuthenticated && !isLoading`, but React does not guarantee effect execution order
across renders. If the `online` event fires before the handler-registration effect has
run, `processOfflineQueue` throws `UnsupportedOfflineMutationError` for every queued
item. After 3 such races, items are permanently marked `failed`.

- [ ] Merge both effects into a single `useEffect` so handler registration always precedes the flush.
- [ ] Alternatively, make `processOfflineQueue` skip (not fail) mutations with no registered handler, logging a warning instead.
- [ ] Add a test that calls `processOfflineQueue` before any handler is registered and asserts items remain `pending`, not `failed`.

### 0.6 `persistedState` JSON-parsed on every render in org layout

**File:** `src/routes/_auth/_app/$orgSlug/route.tsx:94`

`readLocalStorageJson` is called unconditionally inside the component body (not memoized).
It parses JSON from localStorage on every render. The org layout is a hot path — every
navigation within an org re-renders this component.

- [ ] Move the read into a `useState` lazy initializer or `useRef` so it runs once.
- [ ] If the persisted state needs to stay fresh across tabs, use a `storage` event listener to update the ref.

> **Note:** This overlaps with 0.1. Fixing 0.1 (stabilizing the ref) also fixes 0.6.
> Keep both items so the performance concern is explicitly tracked even if they share
> a single fix.

### 0.7 `OFFLINE_PWA_TODO.md` location diverges from convention

**File:** `OFFLINE_PWA_TODO.md` (repo root)

The project convention (CLAUDE.md, `todos/README.md`) tracks backlog in the `todos/`
directory. This file lives at root with a comment explaining why, but it creates a
discoverability gap — future agents or contributors may not find it.

- [ ] Move `OFFLINE_PWA_TODO.md` to `todos/offline-pwa.md`.
- [ ] Add a row in `todos/README.md` under a new "Parallel Tracks" section (alongside `meeting-intelligence.md`).
- [ ] Remove the root-level file.

## 1. Push And Worker Update Safety

- [ ] Verify push subscription survives service worker replacement.
- [ ] Verify push still works after cache clear plus worker re-registration.
- [ ] Verify unsubscribe cleanup is correct when subscriptions rotate.
- [ ] Confirm whether push depends only on service worker support or also on install state in practice.

## 2. Worker / Manifest Ownership Cleanup

- [ ] Decide whether the app should keep manual worker ownership or fully move to the generated PWA worker.
- [ ] Remove the unused path after that decision so there is one obvious worker owner.
- [ ] Remove or intentionally keep `public/manifest.json`; do not leave it as an unexplained legacy artifact.
- [ ] Re-check build output after cleanup and confirm only the intended worker/manifest artifacts remain meaningful.

## 3. Replay Coverage Expansion

- [ ] Choose the next replayable mutation family after `userSettings.update`.
- [ ] Add an explicit replay handler for that mutation family.
- [ ] Define idempotency expectations for each replayable mutation family before expanding coverage.
- [ ] Define how deleted or archived target entities should fail.
- [ ] Define how conflict resolution should work when server state moved while the client was offline.

## 4. Retry Policy

- [ ] Decide whether the current retry model remains best-effort only or needs real backoff.
- [ ] If real backoff is required, define where that timing policy lives.
- [ ] Decide which failures should be treated as retryable versus effectively permanent.

## 5. Tests Still Missing

- [ ] Cover push after worker update only if the test harness can do it reliably.

## 6. Docs To Revisit After Runtime Proof

- [ ] Update `docs/setup/PWA.md` again after real browser verification so it reflects proven runtime behavior, not just source-level ownership.
- [ ] Update `docs/setup/OFFLINE_ARCHITECTURE.md` if replay expands beyond `userSettings.update`.
- [ ] Add a short note with final browser-verification findings once install/offline/push behavior is confirmed.

## Open Questions

- [ ] Should Background Sync remain best-effort only forever, or eventually become part of the supported path?
- [ ] Should replay stay opt-in per mutation type, or should there ever be a more generic replay layer?
- [ ] Do failed offline actions need durable server-side audit logging for support/debugging?
- [ ] Is it worth keeping `vite-plugin-pwa` generation if manual worker ownership remains the intended model?

## Done When

- [ ] All Section 0 (code review bugs) items are resolved — these block merge.
- [ ] One worker path clearly owns runtime behavior.
- [ ] One manifest path clearly owns install metadata.
- [ ] Push behavior is verified after worker changes.
- [ ] At least one additional mutation family is replayable, or the team explicitly decides to stop at `userSettings.update`.
- [ ] Docs match the verified runtime.
