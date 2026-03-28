# Billing Page - Current State

> **Route**: `/:slug/projects/:key/billing`
> **Status**: REVIEWED
> **Last Updated**: 2026-03-28

---

## Purpose

The billing route is the project-scoped financial reporting surface for time tracking. It answers:

1. How much revenue and billable time has this project produced?
2. How much of the project budget has already been consumed?
3. Which team members are contributing billable time and revenue?
4. Can I export the current billing snapshot for external reporting?

This is not the organization-wide time dashboard. It is the project-level report reached from a
specific project shell.

---

## Permissions & Access

- The route depends on project access through `useProjectByKey(key)`.
- Missing or inaccessible projects render the shared `PageError` state instead of a partial report.
- The page is read-only reporting UI; there are no inline billing edits on this route.

---

## Screenshot Matrix

### Canonical route captures

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

### Reviewed route states

- Canonical screenshots capture the report with populated summary tiles, team breakdown, and quick
  stats across all supported viewports.
- Empty-team and loading branches are currently verified by unit tests rather than dedicated
  screenshot states.

---

## Route Anatomy

```text
+----------------------------------------------------------------------------------+
| Project shell                                                                    |
| sidebar + project navigation                                                     |
+----------------------------------------------------------------------------------+
| Billing route                                                                    |
|                                                                                  |
|  Header                                                                          |
|  "Billing Report"  project name + optional client name  [Date Range] [Export]   |
|                                                                                  |
|  Summary metric grid                                                             |
|  [Revenue] [Billable Hours] [Utilization Rate] [Avg Hourly Rate]                |
|                                                                                  |
|  Team Breakdown                                                                  |
|  Alex Rivera      24.00 / 30.00 hours (80% billable)        $1,800.00          |
|  [========================------]                                                |
|                                                                                  |
|  Sam Lee          16.00 / 20.00 hours (80% billable)        $1,400.00          |
|  [========================------]                                                |
|                                                                                  |
|  Quick stats                                                                     |
|  [Time Entries] [Team Members] [Blended Rate]                                   |
|                                                                                  |
+----------------------------------------------------------------------------------+
```

---

## Primary Flow

1. User opens the billing route from a specific project.
2. The route resolves the project by key and passes the project id into `BillingReport`.
3. `BillingReport` loads project metadata and `getProjectBilling` stats for the default 30-day
   window.
4. The user reads the summary tiles, scans the team breakdown sorted by total cost, and checks the
   quick stats row.
5. The user changes the date range or exports the current view as CSV or PDF.

---

## Alternate / Failure Flows

- The date-range selector supports `Last 7 days`, `Last 30 days`, and `All time`.
- CSV export is synchronous and immediately triggers a browser download plus success toast.
- PDF export is async and surfaces a shared error toast if the PDF library path fails.
- A project without a client name still renders correctly; the subtitle simply omits the client
  suffix.

---

## Empty / Loading / Error States

- While either the project query or billing query is unresolved, the component renders the shared
  loading spinner instead of partial cards.
- If the billing data resolves with no team members or no time entries, the report keeps the shell
  visible and shows `No time entries recorded yet` plus `N/A` for blended rate.
- If the project key is invalid or inaccessible, the route renders the shared `PageError` state
  before `BillingReport` mounts.

---

## Current Composition

### 1. Route wrapper

- `src/routes/_auth/_app/$orgSlug/projects/$key/billing.tsx`
- Resolves the project from the route key.
- Shows loading via `PageContent`.
- Shows `PageError` when the key does not resolve.

### 2. Billing report shell

- `BillingReport` owns the date-range state (`week`, `month`, `all`).
- Loads project metadata and billing stats separately.
- Computes utilization rate, blended rate, and sorted per-user breakdown on the client from the
  resolved report payload.

### 3. Summary surfaces

- `SummaryMetricCard` renders revenue, billable hours, utilization, and average hourly rate.
- Supporting text includes project budget coverage, total hours, and non-billable hours.
- `QuickStatCard` renders time entry count, team member count, and blended rate.

### 4. Team breakdown

- `TeamMemberBillingCard` renders member-level billed hours, total hours, revenue, and utilization
  progress.
- Rows are sorted by descending `totalCost`.

### 5. Export path

- CSV export is browser-generated via blob download.
- PDF export uses `jspdf` and `jspdf-autotable` at click time rather than loading them up front.

---

## Source Map

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/projects/$key/billing.tsx` | Route-level project resolution, loading, and error state |
| `src/components/TimeTracker/BillingReport.tsx` | Main billing reporting surface |
| `src/components/TimeTracker/BillingReport.test.tsx` | Loading, populated, export, date-range, and empty-team coverage |
| `src/hooks/useProjectByKey.ts` | Project lookup from route params |
| `convex/timeTracking.ts` (`getProjectBilling`) | Billing query source |
| `convex/projects.ts` (`getProject`) | Project metadata source |
| `docs/design/specs/pages/37-billing/screenshots/` | Canonical reviewed route captures |

---

## Acceptance Criteria

- The route documents project access, loading, and missing-project behavior explicitly.
- Canonical screenshots are listed for all supported review viewports.
- Export behavior, empty-team behavior, and date-range switching are documented alongside the main
  report shell.
- A contributor can find the route, component, query, and test files without opening the source
  tree blindly.

---

## Known Gaps

- The route still renders its own header instead of the shared `PageHeader` shell.
- The date-range trigger remains compact and unlabeled beyond its visible selected value.
- Export remains client-generated rather than server-generated for very large report payloads.
