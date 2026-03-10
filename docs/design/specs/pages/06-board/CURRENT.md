# Board Page - Current State

> **Route**: `/:slug/projects/:key/board`
> **Status**: 🟡 NEEDS POLISH
> **Last Updated**: 2026-03-09

---

## Screenshots

| Viewport | State | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |
| Desktop | Create Issue Modal | ![](screenshots/desktop-light-create-issue-modal.png) |

---

## Current UI

- The page now inherits the slimmer shared project shell: compact project identity row plus horizontal section nav.
- The board capture uses real seeded issues again, so the first screen shows active lanes instead of a broken empty state.
- Kanban columns and cards were tightened enough that mobile now surfaces actual work on the first screen.
- The create-issue modal now captures correctly across the screenshot matrix.

---

## Recent Improvements

- Shared project chrome was reduced in `src/routes/_auth/_app/$orgSlug/projects/$key/route.tsx`.
- Board and modal capture readiness were fixed in `e2e/screenshot-pages.ts` and `e2e/pages/projects.page.ts`.
- The board lanes/cards were adjusted in `src/components/KanbanBoard.tsx` and `src/components/Kanban/KanbanColumn.tsx` so mobile no longer reads as blank.
- Seeded board state is reliable again through `convex/e2e.ts`.

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| Mobile still spends too much of the viewport on project chrome before the board content begins | Shared project shell | HIGH |
| Light mode still feels somewhat flat across the board shell and lane surfaces | Shared card/surface system | MEDIUM |
| Kanban columns are cleaner, but card hierarchy and drag affordance can still be stronger | Board internals | MEDIUM |

---

## Source Files

- `src/routes/_auth/_app/$orgSlug/projects/$key/route.tsx`
- `src/components/KanbanBoard.tsx`
- `src/components/Kanban/KanbanColumn.tsx`
- `src/components/IssueCard.tsx`
- `e2e/screenshot-pages.ts`
