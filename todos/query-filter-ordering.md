# Query Filter Ordering Issues

> **Priority:** P0
> **Status:** Complete
> **Last Updated:** 2026-03-13
> **Verification Summary:** `0` verified unresolved query-shape issues remain.

## Completed Query Fixes

- `workspaces.ts - Backlog filter` now paginates unsprinted workspace issues instead of truncating before backlog filtering.
- `workspaces.ts - Sprint issue count` now uses `efficientCount` instead of capped `.take(...).length`.
- `workspaces.ts - Cross-team dependencies` now evaluates all workspace issues in bounded batches before applying dependency filters.
- `invoices.ts - Client filter` now uses organization/client indexes instead of filtering after the bounded organization query.

## Validation Requirement

- [x] Added tests with datasets larger than the active limit so the corrected query paths prove they do not truncate results.
