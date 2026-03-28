# My Issues Page - Implementation

> **Route file**: `src/routes/_auth/_app/$orgSlug/my-issues.tsx`
> **Last Updated**: 2026-03-25

---

## Data Flow

### Queries

| Query | Source | Purpose |
|-------|--------|---------|
| `api.dashboard.getMyIssues` | `usePaginatedQuery` | First page of issues assigned to the current user |
| `api.dashboard.getMyIssueGroupCounts` | `useAuthenticatedQuery` | Full-dataset status or project totals for column badges |

### Client State

```text
MyIssuesBoardPage
+-- groupBy: "status" | "project"
+-- priorityFilter: "all" | ISSUE_PRIORITIES
+-- dueDateFilter: "all" | "has-date" | "overdue" | "this-week" | "no-date"
```

### Derivation

1. Load assigned issues with pagination.
2. Apply client-side priority and due-date filters.
3. Group filtered issues by status or project key.
4. Prefer server-backed group counts for column order and total badges.
5. Render one of four route states:
   - loading
   - true empty
   - filtered empty
   - grouped board

---

## Component Tree

```text
MyIssuesBoardPage
+-- PageLayout
    +-- PageHeader
    |   +-- Select (priority)
    |   +-- Select (due date)
    |   +-- Button ("Clear filters") [conditional]
    |   +-- SegmentedControl (status/project)
    +-- PageContent
        +-- EmptyState [true empty]
        +-- EmptyState [filtered empty]
        +-- filter summary [conditional]
        +-- grouped columns
        |   +-- Card
        |   |   +-- column label + count badge
        |   |   +-- Link → CardSection per issue
        +-- Load More button [conditional]
```

---

## Screenshot Support

- `empty-my-issues` now routes to `20-my-issues/*-empty.png` instead of being overwritten by the filled canonical shot.
- `filled-my-issues-filter-active` captures a real high-priority filtered board through the reusable `MyIssuesPage` filter interaction.
- `filled-my-issues-filtered-empty` captures a real empty-filter state by selecting the lowest priority option in the shared seeded dataset.
- `filled-my-issues-loading` uses an E2E-side Convex connection block so the route naturally stays in `LoadingFirstPage` without any production hook.

---

## Permissions

Any authenticated org member only sees issues assigned to them. Column counts come from the same
identity-scoped backend query path.

---

## Testing

| Test File | Coverage |
|-----------|----------|
| `src/routes/_auth/_app/$orgSlug/__tests__/my-issues.test.tsx` | true empty, filtered empty recovery, project grouping, first-page loading |
| `e2e/pages/my-issues.page.ts` | page-object readiness, filter interactions, and loading-state assertions |
| `e2e/screenshot-lib/interactive-captures.ts` | filter-active, filtered-empty, and loading screenshots |
| `e2e/screenshot-pages.ts` | canonical + state screenshot registration for spec `20-my-issues` |
