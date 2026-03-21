# Dashboard Page - Current State

> **Route**: `/:slug/dashboard`
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

- The dashboard now reads like a calmer authenticated workspace instead of a hero card surrounded by secondary panels.
- The greeting, focus item, and overview band still lead the page, but the emphasis is tighter and the work lists feel like peers rather than afterthoughts.
- The right-rail workspace and activity panels now use the same inset shell discipline as the rest of the dashboard, so light mode no longer collapses into one flat sheet.
- Empty states are more product-specific and the dashboard screenshot suite now captures the real responsive states, including loading, customize, collapsed desktop sidebar, and mobile sidebar states.

---

## Current Structure

- **Page header**
  - Shared authenticated page header with workspace eyebrow and customize action
- **Command summary**
  - Greeting with a compact day/status pill and weekly completion summary
- **Top workspace band**
  - Focus item panel
  - Overview metrics panel
- **Main work area**
  - My issues list with assigned/created filtering
  - Workspaces panel
  - Recent activity panel

---

## Recent Improvements

- The greeting and focus zone were rebuilt to reduce top-of-page visual overreach and match the shared dashboard panel anatomy.
- Quick stats spacing was tightened so the overview tiles feel denser and less like a second hero.
- Workspace and activity panels now use inset surfaces and more product-grounded empty-state copy.
- The dashboard shell background now carries the page weight, which lets the focus panel stop doing that job with extra glow and chrome.
- `e2e/screenshot-pages.ts` now treats dashboard loading, customize, collapsed-sidebar, and mobile-sidebar states as first-class captures instead of relying on brittle skip behavior.

---

## Review Notes

| Focus | Result | Severity |
|-------|--------|----------|
| Top-of-page weighting | Fixed by calming the greeting/focus treatment and moving more weight into the shared shell | RESOLVED |
| Light-mode panel separation | Fixed for the dashboard side panels with inset surfaces and cleaner panel boundaries | RESOLVED |
| Screenshot harness discipline | Fixed for loading/customize/mobile sidebar captures, with deterministic responsive-state coverage | RESOLVED |

---

## Source Files

- `src/routes/_auth/_app/$orgSlug/dashboard.tsx`
- `src/components/Dashboard.tsx`
- `src/components/Dashboard/Greeting.tsx`
- `src/components/Dashboard/FocusZone.tsx`
- `src/components/Dashboard/QuickStats.tsx`
- `src/components/Dashboard/WorkspacesList.tsx`
- `src/components/Dashboard/RecentActivity.tsx`
- `e2e/screenshot-pages.ts`
