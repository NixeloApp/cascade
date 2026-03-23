# Billing Page - Implementation

> **Route**: `/:slug/projects/:key/billing`

---

## Queries

| Query | Args | Purpose |
|-------|------|---------|
| `api.projects.getByKey` | `{ key, organizationId }` | Resolve project by URL key (via `useProjectByKey`) |
| `api.projects.getProject` | `{ id: projectId }` | Fetch project name, client name, budget |
| `api.timeTracking.getProjectBilling` | `{ projectId, startDate?, endDate? }` | Aggregate billing data |

`getProjectBilling` returns:
- `totalRevenue`, `totalHours`, `billableHours`, `nonBillableHours`, `entries` (count).
- `byUser`: a map of `userId -> { name, hours, billableHours, cost, revenue, totalCost }`.

Date range is computed client-side using `WEEK` and `MONTH` constants from `convex/lib/timeUtils`.

---

## Mutations

None. This is a read-only report. CSV export runs entirely client-side.

---

## State

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `key` | `string` | URL param | Project key for lookup |
| `dateRange` | `"week" \| "month" \| "all"` | `"month"` | Controls the billing query time window |

Derived values computed inline:
- `utilizationRate` = billableHours / totalHours * 100
- `averageRate` = totalRevenue / billableHours
- `sortedUsers` = Object.entries(billing.byUser) sorted by totalCost descending

---

## Component Tree

```text
BillingPage
├── [project === undefined]  PageContent (isLoading)
├── [project === null]       PageError "Project Not Found"
└── [project found]
    └── PageLayout
        └── BillingReport  projectId={project._id}
            ├── [loading]  LoadingSpinner (centered)
            └── [loaded]   Stack (gap="xl")
                ├── Flex (header row)
                │   ├── Typography h2 "Billing Report"
                │   ├── Typography small (project name + client)
                │   ├── Select (date range)
                │   └── Button (Export CSV)
                ├── Grid (cols=4, summary metrics)
                │   ├── SummaryMetricCard  "Total Revenue"
                │   ├── SummaryMetricCard  "Billable Hours"
                │   ├── SummaryMetricCard  "Utilization Rate"
                │   └── SummaryMetricCard  "Avg Hourly Rate"
                ├── Card (Team Breakdown)
                │   └── Stack
                │       └── TeamMemberBillingCard (per user)
                │           ├── Typography (name, hours, %)
                │           ├── Typography (revenue)
                │           └── Progress (utilization bar)
                └── Grid (cols=3, quick stats)
                    ├── QuickStatCard  "Time Entries"
                    ├── QuickStatCard  "Team Members"
                    └── QuickStatCard  "Blended Rate"
```

---

## Permissions

- Requires authentication (route is under `_auth` layout).
- Requires organization membership (route is under `_app/$orgSlug` layout).
- `getProjectBilling` calls `assertIsProjectAdmin(ctx, projectId, userId)` -- only
  project admins can access billing data. Non-admins will see an error.
- The route itself does not check role before rendering; the query-level permission
  check handles access control.
