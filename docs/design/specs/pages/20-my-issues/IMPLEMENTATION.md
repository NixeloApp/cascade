# My Issues Page - Implementation

> **Route file**: `src/routes/_auth/_app/$orgSlug/my-issues.tsx`
> **Last Updated**: 2026-03-23

---

## Data Flow

### Queries

| Query | Source | Purpose |
|-------|--------|---------|
| `api.dashboard.getMyIssues` | `usePaginatedQuery` | Issues assigned to or created by current user, 100 initial |

### State

```text
+-- groupBy: "status" | "project"   # Client-side grouping key
```

### Grouping Logic

Client-side: iterates results, buckets by `issue.status` or `issue.projectKey`.
Groups sorted by count descending (largest group first).

## Component Tree

```text
MyIssuesBoardPage
+-- PageLayout
    +-- PageHeader (title + group-by select + "View Board" link)
    +-- Group columns (Map entries)
    |   +-- Group header (key + count badge)
    |   +-- IssueCard[] (linked to /:slug/issues/:key)
    +-- "Load More" button (when CanLoadMore)
```

## Permissions

Any authenticated org member sees their own issues only.

## Testing

| Test File | Coverage |
|-----------|----------|
| `e2e/screenshot-pages.ts` | `empty-my-issues` + `filled-my-issues` specs |
