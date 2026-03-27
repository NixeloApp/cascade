# Offline / PWA

> **Status:** In Progress
> **Last Updated:** 2026-03-26

Related docs:

- `docs/guides/offline-architecture.md`
- `docs/guides/pwa.md`

## Remaining

### Push / Worker Safety

- [ ] Verify push subscription survives service worker replacement.
- [ ] Verify push still works after cache clear and worker re-registration.
- [ ] Verify unsubscribe cleanup is correct when subscriptions rotate.
- [ ] Confirm the real browser push/install/offline path on desktop and mobile instead of relying on harness confidence alone.

### Docs

- [ ] Refresh `docs/guides/pwa.md` after real browser verification of push, install, and offline flows.
- [ ] Add a short offline-support summary to the main product docs / README once verification is complete.
