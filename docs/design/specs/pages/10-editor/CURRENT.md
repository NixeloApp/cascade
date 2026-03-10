# Document Editor Page - Current State

> **Route**: `/:slug/documents/:id`
> **Status**: 🟡 NEEDS POLISH
> **Last Updated**: 2026-03-09

---

## Screenshots

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

---

## Current UI

- The screenshot baseline now targets the actual editor route again instead of the templates page.
- The page uses the Plate editor stack with a document header, optional sidebar, floating toolbar, and slash menu.
- The current empty or near-empty document state is less dead than before, but the document body still reads sparse in the screenshots because the seeded content is minimal.

---

## Recent Improvements

- Editor route discovery was fixed in `e2e/screenshot-pages.ts`.
- The editor empty state was reworked in `src/components/PlateEditor.tsx` so the page no longer reads like a blank broken canvas.
- Light and dark screenshots now reflect the real document editor surface.

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| The document header still carries too many actions for the amount of visible content | `DocumentHeader` / `PlateEditor` | MEDIUM |
| Desktop light mode still feels sparse because the seeded document body is thin | Editor composition + seed content | MEDIUM |
| Overall surface depth is better, but the editor still needs stronger typography and body rhythm | Editor surface system | LOW |

---

## Source Files

- `src/routes/_auth/_app/$orgSlug/documents/$id.tsx`
- `src/components/PlateEditor.tsx`
- `src/components/Documents/DocumentHeader.tsx`
- `src/components/Plate/FloatingToolbar.tsx`
- `e2e/screenshot-pages.ts`
