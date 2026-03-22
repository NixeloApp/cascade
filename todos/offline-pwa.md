# Offline / PWA Remaining Todo

> **Status:** Core complete. Only verification and polish items remain.

## What's Shipped

- Single worker owner: `public/service-worker.js` (registered by `src/lib/serviceWorker.ts`)
- Single manifest owner: VitePWA generates `manifest.webmanifest`
- 4 offline mutation families: userSettings, markAsRead, updateStatus, addComment
- Retry policy: 5s/30s/2min backoff, permanent failure classification
- UX: offline/syncing badges, reconnect toast, OfflineTab diagnostics
- Docs: `OFFLINE_ARCHITECTURE.md` fully rewritten

## Remaining

### Push & Worker Update Safety

Manual browser verification needed:

- [ ] Verify push subscription survives service worker replacement
- [ ] Verify push still works after cache clear + worker re-registration
- [ ] Verify unsubscribe cleanup is correct when subscriptions rotate

### Polish

- [ ] Optimistic UI for queued mutations (e.g., grey out read notification immediately)
- [ ] Server-side idempotency key for comment replay (deferred — low risk for v1)

### Docs

- [ ] Update `docs/setup/PWA.md` after real browser verification of push + install + offline
- [ ] Add a short "Offline Support" section to the main README or feature docs

## Out of Scope

Full offline document editing, offline Kanban board manipulation, offline-first data layer, iOS Background Sync, offline project/issue creation. See OFFLINE_ARCHITECTURE.md for rationale.
