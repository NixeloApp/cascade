# Timesheet Page - Target State

> **Route**: `/:slug/projects/:key/timesheet`
> **Goal**: Streamlined project-scoped time tracking with better loading and page consistency

---

## Planned Improvements

| # | Improvement | Notes |
|---|-------------|-------|
| 1 | Add PageHeader for consistency | Other project sub-pages (activity, billing) use PageHeader; timesheet should too |
| 2 | Eliminate double-loading | Preload the `ProjectTimesheet` chunk during route navigation to avoid two sequential loading states |
| 3 | Timer integration | Inline timer start/stop button in the header for quick time logging |
| 4 | Weekly grid view | Calendar-style week grid for entering hours per day, in addition to the list view |
| 5 | Approval workflow | Submit timesheet for manager approval with approval/rejection states |

---

## Not Planned

- Moving burn rate or rates management into this page as separate routes --
  they are tabs within the shared `TimeTrackingPage` and should remain there.
- Project-specific rate overrides -- rates are org-wide and managed on the rates tab.

---

## Acceptance Criteria

- [ ] Page uses `PageHeader` with title "Timesheet" for visual consistency with sibling project pages.
- [ ] Only one loading state is visible during initial page load (not project-load then chunk-load).
- [ ] Admin users still see Burn Rate and Hourly Rates tabs.
- [ ] Viewer users see only the Entries tab with no visible disabled tabs.
- [ ] Time entries load with skeleton states, not a centered spinner.
