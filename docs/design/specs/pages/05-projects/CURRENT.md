# Projects List Page - Current State

> **Route**: `/:slug/projects`
> **Status**: 🟡 NEEDS POLISH
> **Last Updated**: 2026-03-12


> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

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
- When only one project is present, the page promotes it as the primary workspace project with a larger featured card and three supporting highlight cards.
- Empty state uses a real `EmptyState` plus guidance cards instead of a bare dead-end placeholder.
- The create-project modal is captured reliably again across the supported screenshot variants.

---

## Recent Improvements

- Screenshot seeding was repaired, so the page no longer pretends to have no projects when the test org is populated.
- Shared card depth improved through `src/components/ui/Card.tsx`.
- `src/components/ProjectsList.tsx` now gives the single-project case a more intentional composition instead of a broken-looking sparse grid.
- The page width is better constrained through the projects route shell.
- Desktop light mode now has clearer surface separation between the page header, project cards, and background.

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| Desktop light mode still feels underfilled when the seed only produces one project card | Filled state composition | MEDIUM |
| The create-project modal still inherits more shell than necessary from the surrounding dialog system | Shared dialog surface | LOW |

---

## Source Files

- `src/routes/_auth/_app/$orgSlug/projects/index.tsx`
- `src/components/ProjectsList.tsx`
- `src/components/CreateProjectFromTemplate.tsx`
- `src/components/ui/Card.tsx`
