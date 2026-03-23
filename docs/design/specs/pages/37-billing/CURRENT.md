# Billing Page - Current State

> **Route**: `/:slug/projects/:key/billing`
> **Status**: IMPLEMENTED -- functional billing report with real data
> **Last Updated**: 2026-03-22

---

## Purpose

Project-level billing report for time tracking. Displays financial metrics
(total revenue, billable hours, utilization rate, average hourly rate),
a team breakdown with per-member billing stats and progress bars, and
quick-stat summary cards. Supports date-range filtering and CSV export.

---

## Route Anatomy

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppSidebar / ProjectShell      PageLayout                                   │
│ ┌─────────────────────────────────────────────────────────────────────────┐  │
│ │                                                                       │  │
│ │  BillingReport                                                        │  │
│ │                                                                       │  │
│ │  ┌─ Header ────────────────────────────────────────────────────────┐   │  │
│ │  │ "Billing Report"                [Date Range v]  [Export]        │   │  │
│ │  │ ProjectName  * ClientName                                       │   │  │
│ │  └─────────────────────────────────────────────────────────────────┘   │  │
│ │                                                                       │  │
│ │  ┌─ Summary Cards (4-column Grid) ────────────────────────────────┐   │  │
│ │  │ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │   │  │
│ │  │ │ $ Revenue │ │ Billable  │ │ Util Rate │ │ Avg Rate  │       │   │  │
│ │  │ │ $X,XXX    │ │ XX.XX hrs │ │ XX%       │ │ $XX.XX/hr │       │   │  │
│ │  │ │ of budget │ │ of total  │ │ non-bill  │ │ per bill  │       │   │  │
│ │  │ └───────────┘ └───────────┘ └───────────┘ └───────────┘       │   │  │
│ │  └─────────────────────────────────────────────────────────────────┘   │  │
│ │                                                                       │  │
│ │  ┌─ Team Breakdown Card ──────────────────────────────────────────┐   │  │
│ │  │ Users icon  "Team Breakdown"                                    │   │  │
│ │  │ ┌─────────────────────────────────────────────────────────────┐ │   │  │
│ │  │ │ MemberName  XX.XX / YY.YY hrs (ZZ% billable)   $revenue   │ │   │  │
│ │  │ │ [=============================------] Progress             │ │   │  │
│ │  │ └─────────────────────────────────────────────────────────────┘ │   │  │
│ │  │ ... (one card per team member, sorted by cost desc)            │   │  │
│ │  └─────────────────────────────────────────────────────────────────┘   │  │
│ │                                                                       │  │
│ │  ┌─ Quick Stats (3-column Grid) ──────────────────────────────────┐   │  │
│ │  │ ┌───────────┐ ┌───────────┐ ┌───────────┐                     │   │  │
│ │  │ │ Entries   │ │ Members   │ │ Blended   │                     │   │  │
│ │  │ │    42     │ │     5     │ │  $75.00   │                     │   │  │
│ │  │ └───────────┘ └───────────┘ └───────────┘                     │   │  │
│ │  └─────────────────────────────────────────────────────────────────┘   │  │
│ │                                                                       │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Composition Walkthrough

1. **Route** extracts `key`, calls `useProjectByKey(key)`. Shows loading or error states.
2. **PageLayout** with no `maxWidth` (default width).
3. **BillingReport** receives `projectId` and contains all billing UI:
   - **Header row**: `Typography` h2 title, project name + optional client name,
     `Select` for date range (Last 7 days / Last 30 days / All time),
     `Button` with download icon for CSV export.
   - **Summary metric cards**: 4-column `Grid` of `SummaryMetricCard` components.
     Each uses a `Card` with a recipe variant (metricTile, metricTileSuccess, etc.),
     an icon, label, large value, and supporting text.
   - **Team breakdown**: A `Card` containing a `Stack` of `TeamMemberBillingCard`
     components. Each shows member name, hours breakdown, utilization percentage,
     revenue, and a `Progress` bar.
   - **Quick stats**: 3-column `Grid` of `QuickStatCard` components (time entries
     count, team member count, blended rate).

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
| 1 | No PageHeader -- BillingReport renders its own h2 title, skipping the shared PageHeader pattern | Route / `BillingReport` | LOW |
| 2 | Date range select uses generic `SelectTrigger` with no label -- slightly unclear on mobile | `BillingReport` | LOW |
| 3 | CSV export is client-side only -- no server-generated report for large datasets | `exportBillingCsv` | LOW |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/projects/$key/billing.tsx` | Route definition (32 lines) |
| `src/components/TimeTracker/BillingReport.tsx` | Main billing report component (348 lines) |
| `src/hooks/useProjectByKey.ts` | Resolves project by key param |
| `convex/timeTracking.ts` (`getProjectBilling`) | Backend billing query |
| `convex/projects.ts` (`getProject`) | Project details query |
| `src/components/ui/Card.tsx` | Card + metric card recipes |
| `src/components/ui/Progress.tsx` | Utilization progress bar |
| `src/components/ui/Grid.tsx` | Responsive grid layout |
| `src/components/ui/Select.tsx` | Date range dropdown |
