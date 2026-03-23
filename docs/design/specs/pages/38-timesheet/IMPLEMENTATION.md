# Timesheet Page - Implementation

> **Route**: `/:slug/projects/:key/timesheet`

---

## Queries

The route itself queries only the project. All other queries are issued by the
`TimeTrackingPage` component internally.

| Query | Args | Purpose |
|-------|------|---------|
| `api.projects.getByKey` | `{ key, organizationId }` | Resolve project by URL key (via `useProjectByKey`) |
| `api.timeTracking.getTimeEntries` | `{ projectId?, startDate?, endDate? }` | Fetch time entries for the list tab |
| `api.timeTracking.getTimeEntrySummary` | `{ projectId?, startDate?, endDate? }` | Aggregate stats for OverviewBand |
| `api.projects.getCurrentUserProjects` | (org-scoped) | Project list -- hidden here since projectId is pre-set |
| `api.timeTracking.getProjectBilling` | `{ projectId, ... }` | Burn rate dashboard data (admin only) |
| `api.timeTracking.getUserRates` | `{ organizationId }` | Hourly rates management (admin only) |

---

## Mutations

Mutations are issued by child components within `TimeTrackingPage`:

| Mutation | Purpose |
|----------|---------|
| `api.timeTracking.createTimeEntry` | Log a new time entry |
| `api.timeTracking.updateTimeEntry` | Edit an existing entry |
| `api.timeTracking.deleteTimeEntry` | Remove an entry |
| `api.timeTracking.setUserRate` | Set hourly rate for a team member (admin) |

---

## State

| Variable | Type | Source | Purpose |
|----------|------|--------|---------|
| `key` | `string` | URL param | Project key for lookup |
| `project` | `Project \| null \| undefined` | `useProjectByKey` | Loading / not-found / resolved |

State managed inside `TimeTrackingPage`:

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `activeTab` | `"entries" \| "burn-rate" \| "rates"` | `"entries"` | Active tab selection |
| `dateRange` | `"week" \| "month" \| "all"` | `"month"` | Date range filter |
| `selectedProject` | `Id<"projects"> \| "all"` | Pre-set to `projectId` | Locked to project |

---

## Component Tree

```text
TimesheetPage
├── [project === undefined]  PageContent (isLoading)
├── [project === null]       PageError "Project Not Found"
└── [project found]
    └── PageLayout
        └── React.Suspense (fallback: LoadingSpinner)
            └── ProjectTimesheet  projectId, userRole
                └── TimeTrackingPage  projectId, userRole
                    ├── OverviewBand (summary metrics)
                    ├── PageControls
                    │   ├── Tabs (entries, burn-rate*, rates*)
                    │   └── Select (date range)
                    └── TimeTrackingContent
                        ├── TimeEntriesList     (tab: entries)
                        ├── BurnRateDashboard   (tab: burn-rate, admin)
                        └── UserRatesManagement (tab: rates, admin)
```

---

## Permissions

- Requires authentication (route is under `_auth` layout).
- Requires organization membership (route is under `_app/$orgSlug` layout).
- `useProjectByKey` returns `null` if the user has no access to the project.
- `userRole` is passed from the project data to `TimeTrackingPage`:
  - **admin / editor**: sees all three tabs (Entries, Burn Rate, Rates).
  - **viewer**: sees only the Entries tab.
- Server-side queries for billing and rates also enforce admin-level access.
