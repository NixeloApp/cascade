# Issue Detail Page - Current State

> **Route**: `/:slug/issues/:key`
> **Status**: 🟡 NEEDS POLISH
> **Last Updated**: 2026-03-09


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

- The screenshot baseline now captures the real issue detail route again instead of the `Issue not found` error state.
- The page uses the expected split layout: main issue content on the left and detail fields in the right sidebar.
- Modal variants for issue detail overlays are also capturing correctly again.

---

## Recent Improvements

- Route discovery and seeded issue linkage were fixed in the screenshot harness.
- The issue page is reviewable again across desktop, tablet, and mobile screenshots.
- The current screenshots now reflect real issue content rather than harness failure.

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| Sidebar controls still need more consistent field treatment and hover behavior | `IssueSidebar` | MEDIUM |
| Activity feed still lacks a stronger timeline treatment | `ActivityFeed` | MEDIUM |
| Comment entry and description surfaces are serviceable but not yet polished | Main content sections | LOW |

---

## Source Files

- `src/routes/_auth/_app/$orgSlug/issues/$key.tsx`
- `src/components/issues/IssueDetail.tsx`
- `src/components/issues/IssueSidebar.tsx`
- `src/components/issues/ActivityFeed.tsx`
- `e2e/screenshot-pages.ts`
