# Query Filter Ordering Issues

> **Priority:** P2
> **Status:** Queued
> **Last Updated:** 2026-03-13
> **Verification Summary:** `4` verified unresolved query-shape issues remain.

## Remaining Queries

### workspaces.ts - Backlog filter

- `getBacklogIssues` takes a limit, then filters `sprintId === undefined && status !== "done"`.
- Fix: add an index such as `by_workspace_sprint` or move the filter into the query path.

### workspaces.ts - Sprint issue count

- Uses `.take(BOUNDED_LIST_LIMIT).length` for a count.
- Fix: use `efficientCount` or a non-truncating bounded count path.

### workspaces.ts - Cross-team dependencies

- Takes a limit before evaluating link type and cross-team conditions.
- Fix: filter before limit or add an appropriate index.

### invoices.ts - Client filter

- `list` takes `BOUNDED_LIST_LIMIT`, then filters by `clientId`.
- Fix: add `by_client` or `by_org_client`.

## Validation Requirement

- [ ] Add tests with datasets larger than the active limit so the corrected query paths prove they do not truncate results.
