# Org Analytics Page - Implementation

> **Route**: `/:orgSlug/analytics`

---

## Queries

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.analytics.getOrgAnalytics` | `convex/analytics.ts` | `{ organizationId }` | Fetch aggregate metrics: total issues, completed count, unassigned count, project count, issues by type, issues by priority, project breakdown |

### Query Return Shape

```typescript
interface OrganizationAnalyticsData {
  totalIssues: number;
  completedCount: number;
  unassignedCount: number;
  projectCount: number;
  issuesByType: { task: number; bug: number; story: number; epic: number; subtask: number };
  issuesByPriority: { highest: number; high: number; medium: number; low: number; lowest: number };
  projectBreakdown: Array<{ projectId: string; name: string; key: string; issueCount: number }>;
  isProjectsTruncated: boolean;
}
```

---

## Mutations

None. This page is read-only.

---

## State Management

| State | Type | Location | Purpose |
|-------|------|----------|---------|
| (none) | -- | -- | The page has no local state. All data comes from a single query. |

---

## Component Tree

```
AnalyticsPage (route)
└── OrganizationAnalyticsDashboard (presentational)
    ├── PageLayout (maxWidth="xl")
    │   └── PageStack
    │       ├── PageHeader
    │       ├── InsetPanel (truncation warning, conditional)
    │       ├── Grid (MetricCards)
    │       │   ├── MetricCard (Total Issues, highlight)
    │       │   ├── MetricCard (Completed)
    │       │   ├── MetricCard (Unassigned)
    │       │   └── MetricCard (Projects)
    │       ├── Grid (ChartCards)
    │       │   ├── ChartCard → BarChart (Issues by Type)
    │       │   └── ChartCard → BarChart (Issues by Priority)
    │       ├── ChartCard → BarChart (Issues by Project, conditional)
    │       └── ProjectBreakdownSection
    │           └── AnalyticsSection
    │               └── InsetPanel[] (per project)
```

---

## Permissions

- **Authentication**: Required. Route is under `_auth` layout guard.
- **Organization membership**: Required. `getOrgAnalytics` is an organization-scoped query that validates membership.
- **Role restrictions**: None -- all org members can view analytics. No admin-only data is exposed.

---

## Data Flow

1. Route mounts, calls `getOrgAnalytics` with `organizationId`.
2. Backend iterates all projects in the org, aggregates issue counts by type, priority, and status.
3. Results are capped at 100 projects to prevent query timeouts; `isProjectsTruncated` flag is set.
4. Frontend receives the full payload and renders it as metric cards, bar charts, and a project breakdown list.
5. No user interactions mutate data -- this is a pure read-only dashboard.
