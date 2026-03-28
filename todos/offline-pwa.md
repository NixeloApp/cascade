# Offline / PWA

> **Status:** Completed
> **Last Updated:** 2026-03-28

Related docs:

- `docs/guides/offline-architecture.md`
- `docs/guides/pwa.md`

## Completed

### Raw DOM — Move to React

The codebase has several places using raw DOM manipulation instead of React. All should be React components or hooks.

**serviceWorker.ts (worst — visually broken):**
- [x] PWA install banner (`src/lib/serviceWorker.ts`) moved out of raw DOM injection into React-owned state/UI.
- [x] SW update banner (`src/lib/serviceWorker.ts`) moved out of raw DOM injection into React-owned state/UI.
- [x] Both banners now render through shared React components using app UI primitives.
- [x] `beforeinstallprompt` and SW update events are exposed via React hooks (`usePwaInstall()`, `useSwUpdate()`).
- [x] `innerHTML`, `document.createElement`, and `document.getElementById` were removed from `serviceWorker.ts`.

**Other raw DOM in production code:**
- [x] `src/components/Settings/AdminTab.tsx` uses React refs for section scrolling.
- [x] `src/components/Documents/DocumentSidebar.tsx` resolves heading anchors through registered elements instead of raw `getElementById`.
- [x] `src/components/Plate/SlashMenu.tsx` uses a React-managed hidden file input.

**Legitimate raw DOM (no action needed):**
- File download trick (`csv.ts`, `markdown.ts`, `ExportPanel.tsx`, `TimeEntriesList.tsx`, `BillingReport.tsx`) — `createElement("a")` + click for blob downloads. No React API for this.
- `DragHandle.tsx:88` — `createElement("div")` for browser drag ghost image. Required by drag API.
- `__root.tsx:75` — `document.body.classList.add("app-hydrated")`. Runs before React.
- `main.tsx:9-10` — React root mount. Obviously.

### Push / Worker Safety

- [x] Push subscription recovery is device-aware and survives lost-worker scenarios through stored-endpoint reconciliation in `src/lib/webPush.tsx`.
- [x] Preview browser automation verifies cache clear plus worker re-registration and shell cache repopulation.
- [x] Subscription rotation cleanup is enforced in both `src/lib/webPush.tsx` and `convex/pushNotifications.ts`.
- [x] Production-preview browser automation now runs on both desktop Chrome and mobile Chromium emulation for install/offline/runtime worker coverage.

### Docs

- [x] `docs/guides/pwa.md` refreshed with the current verification matrix and push-recovery behavior.
- [x] Main `README.md` now includes a short offline-support summary that matches the shipped replay coverage.
