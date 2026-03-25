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
+-- e2e loading override: window.__NIXELO_E2E_MY_ISSUES_LOADING__
+-- e2e filtered-empty preset: sessionStorage["nixelo:e2e:my-issues-state"]
```

### Derivation

1. Load assigned issues with pagination.
2. Optionally apply the screenshot-only filtered-empty preset before regular filtering.
3. Apply client-side priority and due-date filters.
4. Group filtered issues by status or project key.
5. Prefer server-backed group counts for column order and total badges.
6. Render one of four route states:
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
- `filled-my-issues-filter-active` captures a real high-priority filtered board.
- `filled-my-issues-filtered-empty` uses a route-scoped `sessionStorage` preset so the reviewed empty-filter state stays deterministic even if the shared E2E org has unrelated assigned issues.
- `filled-my-issues-loading` uses a route-scoped window flag to hold the loading shell long enough for capture.

---

## Permissions

Any authenticated org member only sees issues assigned to them. Column counts come from the same
identity-scoped backend query path.

---

## Testing

| Test File | Coverage |
|-----------|----------|
| `src/routes/_auth/_app/$orgSlug/-my-issues.test.tsx` | true empty, filtered empty recovery, project grouping, loading override |
| `e2e/pages/my-issues.page.ts` | page-object readiness and filter interactions |
| `e2e/screenshot-lib/interactive-captures.ts` | filter-active, filtered-empty, and loading screenshots |
| `e2e/screenshot-pages.ts` | canonical + state screenshot registration for spec `20-my-issues` |
