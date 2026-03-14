# Query Filter Ordering Issues

> **Priority:** P0
> **Status:** Active
> **Last Updated:** 2026-03-13
> **Verification Summary:** `1` verified unresolved query-shape issue remains.

## Remaining Queries

### workspaces.ts - Cross-team dependencies

- Takes a limit before evaluating link type and cross-team conditions.
- Fix: filter before limit or add an appropriate index.

## Validation Requirement

- [ ] Add tests with datasets larger than the active limit so the corrected query paths prove they do not truncate results.
