# Projects List Page - Current State

> **Route**: `/:slug/projects`
> **Status**: 🟢 REVIEWED
> **Last Updated**: 2026-03-21

---

## Screenshots

| Viewport | State | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |
| Desktop | Create Modal | ![](screenshots/desktop-light-create-project-modal.png) |

---

## Current UI

- Standard `PageLayout` plus `PageHeader` with a single primary action: `+ Create Project`.
- Filled state is now driven by seeded project data again instead of false empty screenshots.
- When only one project is present, the page now promotes it as a full workspace overview with direct board/roadmap/calendar entry points and supporting coverage panels.
- Empty state uses a real `EmptyState` plus guidance cards instead of a bare dead-end placeholder.
- The create-project modal now uses lighter inset anatomy for the selected template summary instead of stacking another heavy shell inside the dialog.

---

## Recent Improvements

- Screenshot seeding was repaired, so the page no longer pretends to have no projects when the test org is populated.
- Shared card depth improved through `src/components/ui/Card.tsx`.
- `src/components/ProjectsList.tsx` now turns the single-project case into a real workspace surface instead of a sparse card plus filler highlights.
- `src/components/CreateProjectFromTemplate.tsx` now keeps the configure step on one lighter inset summary block, which removes the old double-shell feel from the dialog.
- The page width is better constrained through the projects route shell.
- Desktop light mode now has clearer surface separation between the page header, project cards, and background.

---

## Remaining Gaps

- No projects-specific visual blockers are currently called out after the single-project overview and create-project modal pass.
- Revisit only if a broader shared dialog or authenticated-page shell pass introduces new drift here.

---

## Source Files

- `src/routes/_auth/_app/$orgSlug/projects/index.tsx`
- `src/components/ProjectsList.tsx`
- `src/components/CreateProjectFromTemplate.tsx`
- `src/components/ui/Card.tsx`
