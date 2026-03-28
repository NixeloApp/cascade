# Offline / PWA

> **Status:** In Progress
> **Last Updated:** 2026-03-27

Related docs:

- `docs/guides/offline-architecture.md`
- `docs/guides/pwa.md`

## Remaining

### PWA Install Banner — Move to React

The install banner in `src/lib/serviceWorker.ts:200-229` is raw DOM manipulation (`document.createElement`, `innerHTML`, manual event listeners). It renders outside React, fights z-index layers, and is visually broken (renders under other UI).

- [ ] Replace with a proper React component (e.g. `PwaInstallBanner`)
- [ ] Use the app's existing UI primitives (`Card`, `Button`, `Flex`, `Typography`)
- [ ] Respect the app's z-index token system (`z-toast-critical` etc.)
- [ ] Use React state for show/dismiss instead of `localStorage` + manual DOM removal
- [ ] Keep the `beforeinstallprompt` event listener in `serviceWorker.ts` but expose the prompt via a React-friendly hook (e.g. `usePwaInstall()`) instead of calling `showInstallPrompt()` with raw DOM
- [ ] Delete all raw `innerHTML` and `document.createElement` code from `serviceWorker.ts`

### Push / Worker Safety

- [ ] Verify push subscription survives service worker replacement.
- [ ] Verify push still works after cache clear and worker re-registration.
- [ ] Verify unsubscribe cleanup is correct when subscriptions rotate.
- [ ] Confirm the real browser push/install/offline path on desktop and mobile instead of relying on harness confidence alone.

### Docs

- [ ] Refresh `docs/guides/pwa.md` after real browser verification of push, install, and offline flows.
- [ ] Add a short offline-support summary to the main product docs / README once verification is complete.
