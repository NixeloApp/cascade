# Offline / PWA Remaining Todo

## Design Intent

This is **not** a local-first offline app. Convex is server-authoritative, and fighting
that would be a multi-month architecture rewrite for diminishing returns.

The goal is **graceful degradation during connectivity blips**: the app doesn't break when
signal drops for 10-60 seconds, queued actions replay transparently on reconnect, and the
PWA install experience is solid. This is what Notion, Linear, and every serious SaaS tool
ships — not full offline operation, but a non-broken experience when the network hiccups.

## Current Branch Snapshot

- branch: `fix-backend`
- all typecheck, validators (53/53), unit tests (33 affected), and preview E2E (7/7) pass
- all PR review comments resolved

## Current Verified State

What is already true in the repo:

- the app registers `/service-worker.js` from `src/lib/serviceWorker.ts`
- built HTML no longer auto-registers the generated `vite-plugin-pwa` worker
- `vite-plugin-pwa` still emits `/sw.js` (to be resolved in Section 2)
- built HTML links `/manifest.webmanifest`
- production-preview E2E confirms `/service-worker.js` controls runtime
- production-preview E2E confirms the runtime caches `/`, `/offline.html`, `/manifest.webmanifest`
- production-preview E2E confirms uncached offline navigation falls back to `offline.html`
- production-preview E2E confirms previously visited authenticated routes survive offline reload
- production-preview E2E confirms Chromium reports zero installability errors
- PWA icon set committed in `public/` (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `badge-72.png`)
- local IndexedDB is the only offline mutation queue (server-side queue removed)
- `userSettings.update` is the first real replayable offline mutation family
- replay triggers: authenticated startup, reconnect (`online` event), manual "Process Queue"
- Settings > Offline shows truthful queue diagnostics, failed-items-first display, retry/delete controls
- type guard validates replay args before sending to Convex
- SW precache uses `Promise.allSettled` so a single 404 doesn't block install
- offline architecture and verification docs exist (`docs/setup/PWA.md`, `docs/setup/OFFLINE_ARCHITECTURE.md`)

## ~~Section 0: Code Review Bugs~~ (ALL RESOLVED)

All 7 bugs + 18 PR review comments fixed. See commits `12b358df`, `73f46da4`, `2dd1ab20`.

---

## Remaining Work

### 1. Push & Worker Update Safety

Verify push notifications still work after the SW file changes in this PR.

- [ ] Verify push subscription survives service worker replacement.
- [ ] Verify push still works after cache clear + worker re-registration.
- [ ] Verify unsubscribe cleanup is correct when subscriptions rotate.
- [ ] Confirm whether push depends only on SW support or also on install state in practice.

### 2. Worker / Manifest Ownership Cleanup

Collapse to one obvious owner for each concern.

- [ ] Decide: keep manual `public/service-worker.js` or fully move to `vite-plugin-pwa` generated worker.
- [ ] Remove the unused path so there is one obvious worker owner.
- [ ] Remove or intentionally keep `public/manifest.json` (currently a legacy artifact alongside `manifest.webmanifest`).
- [ ] Re-check build output after cleanup — only intended artifacts should remain.
- [ ] Move `OFFLINE_PWA_TODO.md` to `todos/offline-pwa.md` and add to `todos/README.md`.

### 3. High-Value Replay Mutations

These are the actions users most commonly perform during a connectivity blip. Each is
small, idempotent or append-only, and low-conflict — ideal for offline replay without
needing a full local-first data layer.

**Priority order** (by frequency × simplicity × conflict risk):

#### ~~3.1 Mark notification as read~~ ✅ DONE (PR #909)

Replay handler registered, wired into NotificationCenter and notifications page.
Trivially idempotent, zero conflict risk.

#### ~~3.2 Toggle issue status~~ ✅ DONE (PR #909)

Replay handler registered, wired into IssueDetailSidebar.
Skips optimistic lock (expectedVersion) for replay. Uses newOrder: 0.
Last-write-wins — acceptable for connectivity blips.

#### ~~3.3 Add comment to issue~~ ✅ DONE (PR #910)

Replay handler registered, wired into IssueComments.
Attachments not supported offline (can't queue file uploads).
No server-side idempotency key for v1 — duplicate risk minimal for blip scenarios.
Shows toast: "Comment queued — will post when you reconnect".

#### 3.4 Remaining replay infrastructure

- [ ] Add server-side idempotency key for comment replay (deferred — low risk for v1)
- [x] Update `docs/setup/OFFLINE_ARCHITECTURE.md` with expanded mutation table
- [ ] Update OfflineTab "Current Verified Capabilities" list

### 4. Retry Policy

- [ ] Decide whether current 3-attempt best-effort model is sufficient or needs real backoff.
- [ ] If backoff: define timing policy (e.g., 5s, 30s, 2min) and where it lives.
- [ ] Classify failure types: retryable (network error, 5xx) vs permanent (404, validation, deleted entity).
- [ ] Permanent failures should stop retrying immediately and show a clear message in the queue UI.

### 5. Graceful Degradation UX

These are UI-level improvements that make connectivity blips feel invisible to the user.

- [ ] Show a subtle "offline" indicator in the app header (not just the Settings tab) when connectivity drops.
- [ ] Show optimistic UI for queued mutations — e.g., when a notification is marked read offline, grey it out immediately, don't wait for replay.
- [ ] Show a "syncing" indicator when the queue is processing on reconnect.
- [ ] Auto-dismiss the offline indicator after successful reconnect + queue drain.
- [ ] Consider a toast on reconnect: "Back online — N changes synced" (only if queue was non-empty).

### 6. Tests

- [ ] Cover push after worker update (if test harness supports it reliably).
- [ ] E2E test for mark-notification-as-read offline replay.
- [ ] E2E test for issue status toggle offline replay.
- [ ] E2E test for comment creation offline replay.
- [ ] Unit test for idempotency key deduplication.

### 7. Docs

- [ ] Update `docs/setup/PWA.md` after real browser verification of push + install + offline.
- [ ] Update `docs/setup/OFFLINE_ARCHITECTURE.md` with expanded mutation replay table.
- [ ] Add a short "Offline Support" section to the main README or feature docs.

---

## What This Is NOT

To prevent scope creep, these are explicitly **out of scope** for the offline lane:

- **Full offline document editing** — would require a CRDT/OT sync layer (e.g., Yjs) on top of BlockNote. Fundamental architecture work, not an incremental addition.
- **Offline Kanban board manipulation** — would require cached board state + optimistic drag-and-drop + reorder conflict resolution. Complex and low ROI for connectivity blips.
- **Offline-first data layer** — would require something like `rxdb`, `electric-sql`, or a custom Convex sync adapter. Contradicts the server-authoritative model.
- **iOS Background Sync** — Safari doesn't support the Background Sync API. Replay only works while the app is open.
- **Offline project/issue creation** — ID generation, key sequencing (PROJ-123), and cross-entity references make this very complex for marginal benefit.

If any of these become requirements, they should be separate initiatives with their own architecture proposals.

---

## Open Questions

- [ ] Should Background Sync remain best-effort only, or eventually become a supported path? (Limited browser support, especially no iOS.)
- [ ] Should replay stay opt-in per mutation type, or should there be a generic replay layer? (Opt-in is safer — each mutation has different idempotency/conflict characteristics.)
- [ ] Do failed offline actions need server-side audit logging for support? (Probably not for v1 — local queue UI is sufficient.)
- [ ] Is it worth keeping `vite-plugin-pwa` if manual worker ownership remains the model? (Decide in Section 2.)

## Done When

- [x] All Section 0 (code review bugs) items are resolved.
- [ ] One worker path clearly owns runtime behavior.
- [ ] One manifest path clearly owns install metadata.
- [ ] Push behavior is verified after worker changes.
- [x] At least `markNotificationAsRead` and `toggleIssueStatus` are replayable beyond `userSettings.update`. (4 mutations total: userSettings, markAsRead, updateStatus, addComment)
- [x] Offline indicator visible in app header during connectivity loss.
- [ ] Docs match the verified runtime.
