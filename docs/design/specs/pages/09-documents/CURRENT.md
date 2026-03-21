# Documents Page - Current State

> **Route**: `/:slug/documents`
> **Status**: 🟢 REVIEWED
> **Last Updated**: 2026-03-21

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

- The route now reads as a document workspace instead of a sparse header plus floating cards.
- The primary surface is a searchable recent-documents list, so users can jump straight into the latest spec or handoff without digging through the sidebar first.
- The secondary rail now uses the real document tree as a library index, which keeps folders/favorites/archived pages visible without turning the page into another fake dashboard.
- The route owns real blank-document creation from the page header, not just template browsing.

---

## Recent Improvements

- Increased the route width and rebuilt the page into a two-part workspace: searchable recent list plus tree-based library index.
- Added route-owned blank-document creation with direct navigation into the editor after creation.
- Added workspace summary metrics and a latest-updated signal so the page explains the state of the library at a glance instead of leaving most of the viewport empty.
- Added focused route tests for search filtering, document creation, and the shared library-index rail.
- Refreshed the reviewed screenshots so desktop/tablet/mobile now capture the actual route composition instead of the old placeholder summary.

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| Search only filters the recent-documents list, not the nested tree itself | Library index | LOW |
| Tree rows still use the existing lightweight action model rather than richer rename/move/drag interactions | Shared document tree | LOW |

---

## Source Files

- `src/routes/_auth/_app/$orgSlug/documents/index.tsx`
- `src/routes/_auth/_app/$orgSlug/documents/index.test.tsx`
- `src/components/Documents/DocumentTree.tsx`
- `docs/design/specs/pages/09-documents/screenshots/*`
