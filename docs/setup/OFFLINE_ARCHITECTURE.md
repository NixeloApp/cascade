# Offline Replay Architecture

This document describes the current offline/PWA runtime as it exists in the repo.

It is intentionally narrower than the general PWA setup guide in `docs/setup/PWA.md`.

## Goals

The current offline lane is optimized for:

- truthful behavior
- low-conflict implementation ownership
- local diagnosability
- incremental extension of replay support

It is not yet a full offline-first product architecture.

## Current Source Of Truth

There is one offline mutation queue in the app today:

- local IndexedDB, managed by `src/lib/offline.ts`

There is no active server-side offline queue.

What this means:

- Settings reflects local queue state only
- retry counts and backoff live in the client queue processor
- replay success/failure is determined client-side
- support/debugging does not currently have a durable server-side audit trail for failed offline actions

## Key Files

Runtime entry points:

- `src/routes/__root.tsx` — OfflineReplayBootstrap registers handlers and triggers queue flush
- `src/lib/serviceWorker.ts` — SW registration lifecycle
- `public/service-worker.js` — the runtime service worker (push, caching, offline fallback)

Offline queue and replay:

- `src/lib/offline.ts` — OfflineDB, queue processing, failure classification, backoff
- `src/hooks/useOffline.ts` — React hook for online/offline status
- `src/lib/offlineUserSettings.ts` — userSettings.update replay handler
- `src/lib/offlineIssues.ts` — issues.updateStatus replay handler
- `src/lib/offlineComments.ts` — issues.addComment replay handler
- `src/lib/offlineNotifications.ts` — notifications.markAsRead replay handler
- `src/hooks/useOfflineIssueUpdateStatus.ts` — hook for offline-capable status changes
- `src/hooks/useOfflineAddComment.ts` — hook for offline-capable comments
- `src/hooks/useOfflineNotificationMarkAsRead.ts` — hook for offline-capable notification reads

UI and diagnostics:

- `src/components/Settings/OfflineTab.tsx` — queue diagnostics, retry/delete controls
- App header badges — offline/syncing indicators (WifiOff, RefreshCw icons)

## Service Worker Ownership

**Resolved.** Single unambiguous owner for each concern:

- **Worker:** `public/service-worker.js`, registered by `src/lib/serviceWorker.ts`
- **Manifest:** VitePWA generates `manifest.webmanifest` (linked in built HTML)
- **Generated /sw.js:** `selfDestroying: true` — self-destructs if accidentally loaded
- **Legacy manifest.json:** Removed — VitePWA is the sole manifest owner

## Queue Shape

Queued mutations are stored in IndexedDB with these fields:

- `mutationType` — registered handler key (e.g., `"issues.updateStatus"`)
- `mutationArgs` — JSON-serialized handler arguments
- `status` — `"pending"` | `"syncing"` | `"synced"` | `"failed"`
- `attempts` — number of replay attempts made
- `timestamp` — when the mutation was queued
- `syncedAt` — when replay succeeded (set on sync)
- `error` — human-readable failure reason
- `nextRetryAfter` — timestamp after which the mutation is eligible for retry (backoff)

Status meanings:

- `pending`: waiting to be replayed (may have a backoff window via nextRetryAfter)
- `syncing`: actively being replayed right now
- `synced`: replay succeeded — cleaned up after 24h
- `failed`: replay exhausted retries or hit a permanent failure

The Settings screen intentionally hides `synced` entries and focuses on non-synced queue state.

## Replay Lifecycle

### 1. Queue creation

Offline-capable frontend code calls:

- `queueOfflineMutation(mutationType, mutationArgs)`

That writes a local IndexedDB entry with:

- JSON-serialized args
- `pending` status
- attempt count `0`

### 2. Replay triggers

Replay currently runs from the client in these situations:

- authenticated app startup (silent — no toast)
- browser `online` transitions (shows toast if items synced: "Back online — N changes synced")
- manual `Process Queue` action from Settings

Background Sync may also be requested when supported by the browser, but replay cannot depend on it.

### 3. Replay processing

`processOfflineQueue()` returns `OfflineQueueResult { processed, synced, failed, skipped }`:

- loads pending entries
- skips entries still in backoff window (`nextRetryAfter > now`)
- marks each eligible item `syncing`
- increments `attempts`
- parses and validates `mutationArgs`
- resolves a replay handler from the handler registry
- executes the real replay handler
- marks the item `synced` on success
- records the last successful local replay timestamp for diagnostics

### 4. Failure handling

**Permanent failures** (detected by `isPermanentFailure()`):

Errors matching patterns like "not found", "not authenticated", "forbidden",
"validation", "has been deleted", "revoked" are classified as permanent.
These immediately go to `failed` status with a human-readable reason
from `getFailureReason()`, regardless of attempt count.

**Transient failures** (network errors, timeouts, 5xx):

- item returns to `pending` with a `nextRetryAfter` backoff timestamp
- backoff schedule: 5s after 1st failure, 30s after 2nd, 2min after 3rd
- items become `failed` once attempts reach `MAX_OFFLINE_REPLAY_ATTEMPTS` (3)

**Edge cases:**

- unsupported mutation types: permanent failure with clear message
- corrupt payloads (non-object JSON): treated as transient (may be fixed by code update)
- items stuck in `syncing` from a crashed tab: recovered to `pending` on next queue run

## Replay Handler Model

Replay is opt-in per mutation type. This is a deliberate constraint.

Why:

- prevents generic blind replay of arbitrary payloads
- forces each offline-capable mutation family to define its own safety assumptions
- keeps unsupported mutation types explicit instead of silently pretending they synced

Current live replay coverage:

| Mutation type | Wired from | Idempotency | Conflict risk |
|--------------|------------|-------------|---------------|
| `userSettings.update` | PreferencesTab (theme, timezone, dashboard layout) | Idempotent — last-write-wins | None |
| `notifications.markAsRead` | NotificationCenter, notifications page | Trivially idempotent | None |
| `issues.updateStatus` | IssueDetailSidebar status dropdown | Last-write-wins, skips optimistic lock | Medium — status may have moved |
| `issues.addComment` | IssueComments form | Append-only, no server-side dedup yet | Low — only edge case is deleted issue |

**UX indicators:**
- Offline badge in app header (WifiOff icon) — visible on every page
- Syncing badge in app header (spinning RefreshCw) — visible while queue drains
- "Comment queued — will post when you reconnect" toast for offline comments
- "Back online — N changes synced" toast on reconnect when queue had items
- Settings > Offline tab shows full queue diagnostics with retry/delete controls

## Background Sync Policy

Current policy:

- use Background Sync when the browser exposes it
- never require it for correctness
- always keep foreground replay paths available

Practical fallback when Background Sync is unavailable:

- replay on authenticated app startup
- replay on reconnect
- replay from the Settings button

## Known Gaps

The current architecture still lacks:

- replay coverage for more mutation families (current: 4)
- server-side idempotency key for comment replay (low risk for v1)
- optimistic UI for queued mutations (e.g., grey out read notification)
- end-to-end browser verification for push across worker updates
- durable server-side auditing for failed offline actions

## Extension Rules

When adding another offline-capable mutation family:

1. Add a specific queue producer for that mutation family.
2. Register an explicit replay handler in `OfflineReplayBootstrap`.
3. Decide what makes a failure retryable versus permanent — update `isPermanentFailure` patterns if needed.
4. Add unit coverage for queueing and replay behavior.
5. Update the Settings copy only if the capability is truly live.

Do not:

- add a generic catch-all replay path
- claim offline support for a feature without a real replay handler
- reintroduce a second queue model unless there is a concrete product or compliance need

## Verification Checklist

For local verification of the current architecture:

```bash
pnpm test --run src/lib/offline.test.ts src/hooks/useOffline.test.ts src/components/Settings/OfflineTab.test.tsx src/hooks/useOfflineIssueUpdateStatus.test.ts src/hooks/useOfflineAddComment.test.ts src/hooks/useOfflineNotificationMarkAsRead.test.ts
pnpm build
```

For runtime inspection:

1. Build and preview the app in production mode.
2. Confirm `/service-worker.js` is the registered worker in DevTools.
3. Confirm queued mutations appear in Settings > Offline while offline.
4. Reconnect or use `Process Queue` and verify the queue clears.
5. Check `Last Successful Replay` in Settings updates afterward.
6. Verify "Back online — N changes synced" toast appears on reconnect.

## Current Test Coverage

Automated coverage:

- `src/lib/offline.test.ts` — queue processing, failure classification, backoff, retry eligibility
- `src/hooks/useOffline.test.ts` — online/offline status hook
- `src/hooks/useOfflineUserSettingsUpdate.test.ts` — user settings replay hook
- `src/hooks/useOfflineIssueUpdateStatus.test.ts` — issue status update replay hook
- `src/hooks/useOfflineAddComment.test.ts` — comment replay hook
- `src/hooks/useOfflineNotificationMarkAsRead.test.ts` — notification read replay hook
- `src/components/Settings/OfflineTab.test.tsx` — queue diagnostics UI
- `src/lib/serviceWorker.test.ts` — SW registration lifecycle

Production-preview browser automation:

- `e2e/preview/pwa-runtime.spec.ts` — SW registration, manifest, cache, installability
- `e2e/preview/offline-replay-preview.spec.ts` — authenticated offline routes, queue replay
