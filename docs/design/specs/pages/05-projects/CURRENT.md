# Projects List Page - Current State

> **Route**: `/:slug/projects`
> **Status**: REVIEWED, with minor density follow-up only
> **Last Updated**: 2026-03-21

> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

---

## Screenshot Matrix

| Viewport | Base Route | Create Project Modal |
|----------|------------|----------------------|
| Desktop Dark | ![](screenshots/desktop-dark.png) | ![](screenshots/desktop-dark-create-project-modal.png) |
| Desktop Light | ![](screenshots/desktop-light.png) | ![](screenshots/desktop-light-create-project-modal.png) |
| Tablet Light | ![](screenshots/tablet-light.png) | ![](screenshots/tablet-light-create-project-modal.png) |
| Mobile Light | ![](screenshots/mobile-light.png) | ![](screenshots/mobile-light-create-project-modal.png) |

---

## Current Read

- The route is now a real projects workspace instead of a sparse list with a modal.
- When only one project is present, the page treats it as the main workspace overview rather than
  a broken-looking underfilled grid.
- The create-project flow remains part of the reviewed screenshot matrix instead of living as an
  untracked modal branch.

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| The single-project case is much better, but some light-mode captures can still feel slightly underfilled when the seeded org is tiny | route composition | LOW |
| The template/configure step inside the modal is cleaner now, but still inherits more dialog shell than the task strictly needs | shared dialog anatomy | LOW |

---

## Source Files

- `src/routes/_auth/_app/$orgSlug/projects/index.tsx`
- `src/components/ProjectsList.tsx`
- `src/components/CreateProjectFromTemplate.tsx`
- `e2e/screenshot-pages.ts`

---

## Summary

Projects is current and trustworthy. The remaining work is polish, not route credibility.
