# Timesheet Page - Current State

> **Route**: `/:slug/projects/:key/timesheet`
> **Status**: IMPLEMENTED -- lazy-loaded wrapper around `TimeTrackingPage`
> **Last Updated**: 2026-03-22

---

## Purpose

Project-scoped timesheet view. Provides the same time tracking interface available
at the org-level (`/:slug/time-tracking`), but locked to a single project. Includes
time entry list, burn rate dashboard (admin only), and hourly rate management
(admin only), all filtered to the given project's data.

---

## Route Anatomy

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppSidebar / ProjectShell      PageLayout                                   │
│ ┌─────────────────────────────────────────────────────────────────────────┐  │
│ │                                                                       │  │
│ │  React.Suspense fallback (LoadingSpinner "Loading timesheet...")       │  │
│ │                                                                       │  │
│ │  ProjectTimesheet -> TimeTrackingPage                                 │  │
│ │                                                                       │  │
│ │  ┌─ OverviewBand ─────────────────────────────────────────────────┐   │  │
│ │  │ "Operations pulse"  Logged | Entries | Billable  metrics      │   │  │
│ │  └────────────────────────────────────────────────────────────────┘   │  │
│ │                                                                       │  │
│ │  ┌─ PageControls ─────────────────────────────────────────────────┐   │  │
│ │  │ Tabs: [Time Entries]  [Burn Rate & Costs]*  [Hourly Rates]*   │   │  │
│ │  │ Date Range: [Last 7 Days v]                                    │   │  │
│ │  └────────────────────────────────────────────────────────────────┘   │  │
│ │  * admin/editor only                                                  │  │
│ │                                                                       │  │
│ │  ┌─ Tab Content ──────────────────────────────────────────────────┐   │  │
│ │  │ TimeEntriesList  (default)                                     │   │  │
│ │  │   or  BurnRateDashboard  (admin)                               │   │  │
│ │  │   or  UserRatesManagement  (admin)                             │   │  │
│ │  └────────────────────────────────────────────────────────────────┘   │  │
│ │                                                                       │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Composition Walkthrough

1. **Route** extracts `key`, calls `useProjectByKey(key)`. Shows loading or error states.
2. **PageLayout** with no maxWidth constraint.
3. **React.Suspense** wraps the lazy-loaded `ProjectTimesheet` component. Fallback is
   a centered `LoadingSpinner` with "Loading timesheet..." message.
4. **ProjectTimesheet** is a thin wrapper that passes `projectId` and `userRole` to
   `TimeTrackingPage`.
5. **TimeTrackingPage** renders the full time tracking interface:
   - **OverviewBand**: Summary metrics (Logged time, Entry count, Billable value).
   - **PageControls**: Tabs for switching between views, plus date-range filter.
     - The project selector is hidden because `projectId` is pre-set.
     - Burn Rate and Hourly Rates tabs are hidden for non-admin roles.
   - **Tab content**: `TimeEntriesList`, `BurnRateDashboard`, or `UserRatesManagement`
     depending on active tab and permissions.

---

## Screenshot Matrix

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

---

## Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | No PageHeader -- the OverviewBand from TimeTrackingPage acts as the header, which is different from other project sub-pages | Route | LOW |
| 2 | Lazy loading adds a second loading step (first for project, then for component) which can feel slow | Route | LOW |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/projects/$key/timesheet.tsx` | Route definition (49 lines) |
| `src/components/TimeTracking/ProjectTimesheet.tsx` | Thin wrapper (14 lines) |
| `src/components/TimeTracking/TimeTrackingPage.tsx` | Main time tracking UI |
| `src/components/TimeTracking/TimeEntriesList.tsx` | Time entries tab content |
| `src/components/TimeTracking/BurnRateDashboard.tsx` | Burn rate tab content |
| `src/components/TimeTracking/UserRatesManagement.tsx` | Rates tab content |
| `src/hooks/useProjectByKey.ts` | Resolves project by key param |
| `src/components/layout/PageLayout.tsx` | Page shell |
| `src/components/ui/LoadingSpinner.tsx` | Suspense fallback |
