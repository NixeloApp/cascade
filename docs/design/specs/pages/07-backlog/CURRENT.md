# Backlog Page - Current State

> **Route**: `/:slug/projects/:key/backlog`
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

- Backlog now benefits from the same compact shared project shell used by board, calendar, and project settings.
- Seeded sprint and backlog content is trustworthy again in screenshots, so the page no longer reads like a fake empty state.
- The current layout is a sequence of sprint/backlog sections with issue rows and project-level actions at the top.

---

## Recent Improvements

- Screenshot seeding now restores real demo issues and project linkage.
- Shared project chrome is less bloated than the earlier version.
- The backlog baseline is now useful for review again because the page captures real loaded content.

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| Mobile still spends too much space on the project shell before the backlog list begins | Shared project shell | HIGH |
| Sprint sections and issue rows still need stronger hierarchy in light mode | Backlog composition | MEDIUM |
| Interaction feedback in issue rows remains subtle | Backlog row styling | LOW |

---

## Source Files

- `src/routes/_auth/_app/$orgSlug/projects/$key/route.tsx`
- `src/components/backlog/BacklogView.tsx`
- `src/components/backlog/SprintCard.tsx`
- `src/components/backlog/BacklogIssueRow.tsx`
- `convex/e2e.ts`
