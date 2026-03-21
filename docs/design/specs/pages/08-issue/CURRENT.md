# Issue Detail Page - Current State

> **Route**: `/:slug/issues/:key`
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

- The standalone issue route now resolves seeded demo issues reliably again, even when issue keys collide across organizations.
- The page reads as one issue workspace instead of a header plus a pile of unrelated cards.
- Main content is grouped into `Overview`, `Subtasks`, and `Discussion`, with the sidebar using the same section anatomy for properties, tracking, attachments, watchers, and dependencies.
- Screenshot capture now waits for the discussion area to settle instead of freezing the page mid-loading.

---

## Recent Improvements

- Added a shared issue-detail section shell and moved the route onto clearer main/sidebar surfaces.
- Reworked metadata rows, watchers, and comments so empty states and supporting copy feel intentional instead of generic filler.
- Fixed the direct-route lookup path by scoping issue-key resolution to the current organization.
- Hardened screenshot discovery so the issue page uses a live visible issue key from the seeded product state instead of trusting stale seeded keys.

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| Sidebar metadata rows are cleaner but still denser than the main content on narrower viewports | Right rail | LOW |
| Attachments and dependency sections still need a broader product-wide pass for empty-state consistency | Shared issue side modules | LOW |

---

## Source Files

- `src/routes/_auth/_app/$orgSlug/issues/$key.tsx`
- `src/components/IssueDetail/IssueDetailLayout.tsx`
- `src/components/IssueDetail/IssueDetailContent.tsx`
- `src/components/IssueDetail/IssueDetailSidebar.tsx`
- `src/components/IssueComments.tsx`
- `convex/issues/queries.ts`
- `e2e/screenshot-pages.ts`
