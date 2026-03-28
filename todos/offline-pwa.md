# Offline / PWA

> **Status:** In Progress
> **Last Updated:** 2026-03-27

Related docs:

- `docs/guides/offline-architecture.md`
- `docs/guides/pwa.md`

## Remaining

### Raw DOM — Move to React

The codebase has several places using raw DOM manipulation instead of React. All should be React components or hooks.

**serviceWorker.ts (worst — visually broken):**
- [ ] PWA install banner (`src/lib/serviceWorker.ts:200-229`) — `document.createElement`, `innerHTML`, manual event listeners. Renders under other UI because z-index fights React layers.
- [ ] SW update banner (`src/lib/serviceWorker.ts:127-147`) — same raw DOM pattern.
- [ ] Replace both with React components using app UI primitives (`Card`, `Button`, `Typography`)
- [ ] Expose `beforeinstallprompt` and SW update events via React hooks (`usePwaInstall()`, `useSwUpdate()`) instead of raw DOM callbacks
- [ ] Delete all `innerHTML`, `document.createElement`, `document.getElementById` from serviceWorker.ts

**Other raw DOM in production code:**
- [ ] `src/components/Settings/AdminTab.tsx:50` — `document.getElementById` for scroll-to-section. Use a React ref instead.
- [ ] `src/components/Documents/DocumentSidebar.tsx:258` — `document.getElementById` for heading anchor scroll. Use a React ref instead.
- [ ] `src/components/Plate/SlashMenu.tsx:46` — `document.createElement("input")` for file upload. Move to a React-managed hidden input.

**Legitimate raw DOM (no action needed):**
- File download trick (`csv.ts`, `markdown.ts`, `ExportPanel.tsx`, `TimeEntriesList.tsx`, `BillingReport.tsx`) — `createElement("a")` + click for blob downloads. No React API for this.
- `DragHandle.tsx:88` — `createElement("div")` for browser drag ghost image. Required by drag API.
- `__root.tsx:75` — `document.body.classList.add("app-hydrated")`. Runs before React.
- `main.tsx:9-10` — React root mount. Obviously.

### Push / Worker Safety

- [ ] Verify push subscription survives service worker replacement.
- [ ] Verify push still works after cache clear and worker re-registration.
- [ ] Verify unsubscribe cleanup is correct when subscriptions rotate.
- [ ] Confirm the real browser push/install/offline path on desktop and mobile instead of relying on harness confidence alone.

### Docs

- [ ] Refresh `docs/guides/pwa.md` after real browser verification of push, install, and offline flows.
- [ ] Add a short offline-support summary to the main product docs / README once verification is complete.
