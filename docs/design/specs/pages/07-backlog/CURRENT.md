# Backlog Page - Current State

> **Route**: `/:slug/projects/:key/backlog`
> **Status**: 🟢 Good
> **Last Updated**: 2026-03-12


> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

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

- Backlog now benefits from the same compact shared project shell used by board, calendar, and project settings.
- Seeded sprint and backlog content is trustworthy again in screenshots, so the page no longer reads like a fake empty state.
- The current mobile layout reads as a compact kanban-style backlog view with tighter workflow columns and lighter chrome.

---

## Recent Improvements

- Screenshot seeding now restores real demo issues and project linkage.
- Shared project chrome is less bloated than the earlier version.
- The backlog baseline is now useful for review again because the page waits for a real loaded board state before capture.
- The mobile project shell and tabs are tighter than the previous pass, so more of the backlog shows on first paint.
- Mobile columns are narrower, so the first two lanes read more cleanly instead of clipping immediately at the viewport edge.
- Mobile filter/search controls now inherit the quieter shared filter chrome, so the backlog lanes get more of the first visual hit.
- The mobile selection toggle now sits in the same shared floating toolbar cluster used by board, so backlog no longer burns a detached utility row before the first lane.
- Mobile lanes now use a staged snap layout, so backlog starts with one dominant lane instead of two equally compressed columns.
- The shared floating toolbar keeps controls available without stealing the first visual hit from the backlog content.

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| Light-mode hierarchy inside the backlog lanes could still be stronger | Backlog/card styling | LOW |

---

## Source Files

- `src/routes/_auth/_app/$orgSlug/projects/$key/route.tsx`
- `src/components/FilterBar.tsx`
- `src/components/KanbanBoard.tsx`
- `src/components/Kanban/KanbanColumn.tsx`
- `e2e/screenshot-pages.ts`
- `convex/e2e.ts`
