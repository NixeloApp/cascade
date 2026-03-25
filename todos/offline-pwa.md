# Offline / PWA

> **Status:** Core infrastructure shipped; verification and polish remain
> **Last Updated:** 2026-03-24

Related docs:

- `docs/guides/offline-architecture.md`
- `docs/guides/pwa.md`

## Remaining

### Push / Worker Safety

- [ ] Verify push subscription survives service worker replacement.
- [ ] Verify push still works after cache clear and worker re-registration.
- [ ] Verify unsubscribe cleanup is correct when subscriptions rotate.

### UX / Replay Polish

- [ ] Add optimistic UI for queued mutations where the current UX still waits for replay confirmation.
- [ ] Add a server-side idempotency strategy for replayed comments if we want stronger guarantees than the current low-risk behavior.

### Docs

- [ ] Refresh `docs/guides/pwa.md` after real browser verification of push, install, and offline flows.
- [ ] Add a short offline-support summary to the main product docs / README once verification is complete.
