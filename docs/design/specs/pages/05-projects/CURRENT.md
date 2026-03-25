# Projects List Page - Current State

> **Route**: `/:slug/projects`
> **Status**: REVIEWED
> **Last Updated**: 2026-03-25

This route now has a full reviewed matrix for the important top-level states instead of only the happy-path grid plus create modal.

## Screenshot Matrix

| Viewport | Multi-Project Grid | Single Project | Empty State | Loading State | Create Modal |
|----------|--------------------|----------------|-------------|---------------|--------------|
| Desktop Dark | ![](screenshots/desktop-dark.png) | ![](screenshots/desktop-dark-single-project.png) | ![](screenshots/desktop-dark-empty.png) | ![](screenshots/desktop-dark-loading.png) | ![](screenshots/desktop-dark-create-project-modal.png) |
| Desktop Light | ![](screenshots/desktop-light.png) | ![](screenshots/desktop-light-single-project.png) | ![](screenshots/desktop-light-empty.png) | ![](screenshots/desktop-light-loading.png) | ![](screenshots/desktop-light-create-project-modal.png) |
| Tablet Light | ![](screenshots/tablet-light.png) | ![](screenshots/tablet-light-single-project.png) | ![](screenshots/tablet-light-empty.png) | ![](screenshots/tablet-light-loading.png) | ![](screenshots/tablet-light-create-project-modal.png) |
| Mobile Light | ![](screenshots/mobile-light.png) | ![](screenshots/mobile-light-single-project.png) | ![](screenshots/mobile-light-empty.png) | ![](screenshots/mobile-light-loading.png) | ![](screenshots/mobile-light-create-project-modal.png) |

## Current Read

- Default seeded state is a real multi-project workspace grid, not a stretched single-card placeholder.
- The one-project branch is now screenshot-reviewed across the full viewport matrix, so the route’s biggest conditional layout is no longer unverified.
- Empty state review now happens inside the authenticated app shell instead of being inferred from a different route context.
- Loading no longer falls back to a generic spinner; it uses a projects-shaped skeleton shell that preserves layout and hierarchy.
- The create-project modal remains in the reviewed matrix, so route changes cannot quietly regress the primary action path.

## Route Contract

- `ProjectsList` has four meaningful view states:
  - loading shell
  - empty workspace
  - single-project overview
  - multi-project grid
- The route should keep the “single project becomes the workspace hub” behavior; that branch is intentional and now explicitly covered.
- Any future additions such as search, filters, or quick actions need screenshot coverage for their own empty/loading states instead of only the default grid.

## Source Files

- `src/components/ProjectsList.tsx`
- `src/components/ProjectsList.test.tsx`
- `e2e/pages/projects.page.ts`
- `e2e/screenshot-lib/interactive-captures.ts`
- `convex/e2e.ts`

## Remaining Gaps

- No route-local blocker remains.
- Remaining work is branch-level visual polish from the broader consistency pass, not missing credibility or missing state coverage on this page.
