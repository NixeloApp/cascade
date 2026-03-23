# Issues Page - Implementation

> **Route file**: `src/routes/_auth/_app/$orgSlug/issues/index.tsx`

## Data

- `api.issues.list` — paginated org-wide issue query
- Filters applied at query level (status, search term)
- `usePaginatedQuery` for load-more pagination

## Components

| Component | Location |
|-----------|----------|
| AllIssuesPage | `src/routes/_auth/_app/$orgSlug/issues/index.tsx` |
| IssueCard | `src/components/IssueDetail/IssueCard.tsx` |
| CreateIssueModal | `src/components/IssueDetail/CreateIssueModal.tsx` |
| IssueDetailViewer | `src/components/IssueDetail/IssueDetailContent.tsx` |

## Permissions

- Requires authentication
- Shows issues from all projects user has access to (viewer+)
