# Time Tracking Page - Current State

> **Route**: `/:slug/time-tracking`
> **Status**: REVIEWED
> **Last Updated**: 2026-03-25

> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

---

## Purpose

The time tracking page is the organization-wide time and billing dashboard. It answers:

1. How much time has the team logged this week/month?
2. What's the burn rate and cost breakdown per project?
3. Are billable rates configured correctly for each user?
4. Can I quickly log time or review individual entries?

This is an admin-only surface. Non-admin users are redirected to the dashboard. The page
combines time entry management, burn rate analytics, and user rate configuration in a single
tabbed view.

---

## Permissions & Access

- The route is organization-admin only.
- Non-admin users are redirected before the time-tracking dashboard renders.
- Burn-rate and user-rate surfaces are admin review tools, not end-user timesheet views.

---

## Screenshot Matrix

### Canonical route captures

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

### Additional state captures

| State | Desktop Dark | Desktop Light | Tablet Light | Mobile Light |
|-------|-------------|---------------|--------------|--------------|
| Burn rate tab | `desktop-dark-burn-rate.png` | `desktop-light-burn-rate.png` | `tablet-light-burn-rate.png` | `mobile-light-burn-rate.png` |
| User rates tab | `desktop-dark-rates.png` | `desktop-light-rates.png` | `tablet-light-rates.png` | `mobile-light-rates.png` |
| Empty entries | `desktop-dark-empty.png` | `desktop-light-empty.png` | `tablet-light-empty.png` | `mobile-light-empty.png` |
| All-time range | `desktop-dark-all-time.png` | `desktop-light-all-time.png` | `tablet-light-all-time.png` | `mobile-light-all-time.png` |
| Truncated summary metrics | `desktop-dark-truncated.png` | `desktop-light-truncated.png` | `tablet-light-truncated.png` | `mobile-light-truncated.png` |
| Manual entry modal | `desktop-dark-manual-entry-modal.png` | `desktop-light-manual-entry-modal.png` | `tablet-light-manual-entry-modal.png` | `mobile-light-manual-entry-modal.png` |

---

## Route Anatomy

```text
+------------------------------------------------------------------------------+
| Global app shell                                                             |
| sidebar + top utility bar                                                    |
+------------------------------------------------------------------------------+
| Time Tracking route (admin only)                                             |
|                                                                              |
|  PageHeader                                                                  |
|  "Time Tracking" + "Track time, analyze costs, and monitor burn rate"        |
|                                                                              |
|  OverviewBand (summary metrics)                                              |
|  +------------------------------------------------------------------------+ |
|  | Logged        | Billable       | Cost           | Entries              | |
|  | 42h 30m       | 38h 15m        | $5,737.50      | 127                  | |
|  | (Last 7 Days)                                                          | |
|  +------------------------------------------------------------------------+ |
|                                                                              |
|  Controls                                                                    |
|  +------------------------------------------------------------------------+ |
|  | Project: [All Projects v]    Date Range: [Last 7 Days v]               | |
|  +------------------------------------------------------------------------+ |
|                                                                              |
|  Tabs                                                                        |
|  +-------------------+-------------------+-------------------+              |
|  | Entries           | Burn Rate         | User Rates        |              |
|  +-------------------+-------------------+-------------------+              |
|                                                                              |
|  Tab Content                                                                 |
|  +------------------------------------------------------------------------+ |
|  | TimeEntriesList (entries tab)                                           | |
|  | BurnRateDashboard (burn-rate tab, project-scoped only)                  | |
|  | UserRatesManagement (rates tab, admin only)                             | |
|  +------------------------------------------------------------------------+ |
|                                                                              |
+------------------------------------------------------------------------------+
```

---

## Current Composition

### 1. Route wrapper (60 lines)

- Admin-only: checks `api.users.isOrganizationAdmin`, redirects non-admins.
- Lazy-loads `TimeTrackingPage` (heavy component).
- Passes `isGlobalAdmin` prop for full tab access.

### 2. Overview band

- `OverviewBand` component showing 3 summary metrics:
  - **Logged** — total duration in human-readable format (e.g., "42h 30m")
  - **Entries** — entry count
  - **Billable** — billable duration or tracked billable value
- The copy is now literal and scope-driven: it explains that the summary reflects the active project
  and date range instead of reading like a generic dashboard slogan.
- Each metric shows "+" suffix when data is truncated beyond query limits.
- Metrics respect the selected date range and project filter.
- Data from `api.timeTracking.getTimeEntrySummary` query.

### 3. Controls

- **Project filter**: Select dropdown — "All Projects" or specific project.
  The entries tab works org-wide. Burn-rate review states auto-select the seeded project for
  screenshot capture, while the product still shows a project-selection prompt when burn
  analysis is opened on "All Projects".
- **Date range**: Select — "Last 7 Days", "Last 30 Days", "All Time".
  Maps to WEEK, MONTH, or no date bound for the query.

### 4. Tabs

Three tabs with role-gated visibility:

- **Entries** — always visible. `TimeEntriesList` (286 lines).
  - Grouped list of time entries with date, duration, issue, badges, and delete actions.
  - "Add Time Entry" button opens the shared `TimeEntryModal`.

- **Burn Rate** — visible for admin+ when a specific project is selected.
  `BurnRateDashboard` (277 lines).
  - Burn-rate summary cards.
  - Hours and billable summary.
  - Team member cost breakdown.

- **User Rates** — visible for admin+.
  `UserRatesManagement` (291 lines).
  - Current active rate list.
  - Default and project-specific overrides.
  - Add/edit modal for the current user's rates.

### 5. Manual time entry modal

- `TimeEntryModal` — shared log-time form used here and from the timer widget.
- Fields: project, issue, date, duration (hours:minutes), notes, billable toggle.
- Validation via `timeEntryValidation.ts` and `useTimeEntryForm.ts`.
- Also accessible from the global timer widget in the app header.

---

## Primary Flow

1. An admin opens the organization time-tracking route.
2. The page shows overview metrics scoped to the active project and date-range filters.
3. The entries tab stays available org-wide for entry review and manual logging.
4. Burn rate becomes meaningful once a specific project is selected.
5. User rates stays available as the configuration surface for the current admin's rate records.

---

## Alternate / Failure Flows

- The all-project state keeps entries visible but intentionally prompts for project selection before
  burn-rate analysis becomes useful.
- The reviewed screenshot matrix includes empty entries, manual entry modal, truncated summaries,
  all-time range, and both secondary tabs so contributors do not have to infer those branches from
  filenames.
- Export and manual-entry actions are documented as part of the route even though the header timer
  widget remains the primary quick-entry surface elsewhere in the app.

---

## Empty / Loading / Error States

- The route redirects non-admin users instead of rendering a partial, disabled dashboard.
- Empty entry data renders an explicit reviewed empty state instead of blanking the tab content.
- Loading resolves through the route wrapper and the internal queries; the burn-rate and rate views
  do not render until their scoped data is available.

---

## State Coverage

### States the current spec explicitly covers

- Entries tab with populated list (4 viewports)
- Burn rate tab with seeded project selected (4 viewports)
- User rates tab with seeded active rates (4 viewports)
- Empty entries state (4 viewports)
- All-time date-range state (4 viewports)
- Truncated metric state showing "+" suffixes (4 viewports)
- Manual time entry modal open (4 viewports)

---

## Current Strengths

| Area | Current Read |
|------|--------------|
| Metric overview | OverviewBand gives instant visibility into time/cost without drilling in. |
| Tab organization | Clean separation: entries for logging, burn for analysis, rates for config. |
| Truncation honesty | "+" suffix on metrics when data exceeds query limits (from isTruncated flag). |
| Admin gating | Non-admins redirected immediately. No partial-access confusion. |
| Filter reactivity | Project and date range filters update all tabs and metrics in real time. |

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| ~~1~~ | ~~Confusing empty state for project-scoped tabs~~ **Fixed** — replaced inline SVG prompt with proper EmptyState component that clearly directs users to select a project | ~~UX~~ | ~~MEDIUM~~ |
| ~~2~~ | ~~No CSV export for time entries~~ **Fixed** — Export CSV button in TimeEntriesList header, generates CSV with date, description, issue, duration, billable status, rate, cost | ~~feature gap~~ | ~~MEDIUM~~ |
| 3 | `TimeEntryModal` still carries a lot of form chrome and input orchestration in one place. | architecture | LOW |
| ~~4~~ | ~~ProjectTimesheet stub~~ **Fixed** — deleted pass-through wrapper. Route now lazy-imports TimeTrackingPage directly. | ~~dead code~~ | ~~LOW~~ |

---

## Source Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/routes/.../time-tracking.tsx` | 60 | Route: admin gate, lazy load |
| `src/components/TimeTracking/TimeTrackingPage.tsx` | 422 | Main dashboard: tabs, controls, overview |
| `src/components/TimeTracking/TimeEntriesList.tsx` | 286 | Time entry table with actions |
| `src/components/TimeTracking/BurnRateDashboard.tsx` | 277 | Cost analytics charts |
| `src/components/TimeTracking/UserRatesManagement.tsx` | 291 | Hourly rate configuration |
| `src/components/TimeTracking/TimeEntryModal.tsx` | -- | Shared log-time modal used on this route and from the timer widget |
| `src/components/TimeTracking/TimerWidget.tsx` | -- | Global timer in app header |
| `e2e/screenshot-pages.ts` | -- | `filled-time-tracking` spec |

---

## Acceptance Criteria

- The doc makes the admin-only gate explicit.
- Canonical screenshots and reviewed alternate states are listed with their exact filenames.
- The difference between org-wide entries review and project-scoped burn-rate review is documented.
- Empty, loading, and manual-entry states are described without requiring route-code inspection.

---

## Review Guidance

- The admin-only gate is correct. Do not expose billing data to non-admins.
- The OverviewBand pattern is the right summary format. Do not replace with cards or charts.
- If "All Projects" needs burn rate, aggregate across projects instead of hiding the tab.
- The timer widget in the app header is the primary time entry path. The manual modal is secondary.
- Do not merge this page with project-level timesheet. They serve different audiences.

---

## Summary

The time tracking page is a mature admin dashboard combining time entry management, burn rate
analytics, and user rate configuration. The OverviewBand gives instant summary metrics, tabs
separate concerns cleanly, the admin gate prevents data leaks, and the reviewed screenshot
matrix now covers the route's real operating states instead of only the canonical entries view.
