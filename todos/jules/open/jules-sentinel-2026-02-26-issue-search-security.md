# Security Vulnerability in Issue Search

## Discovery
While investigating `convex/issues/queries.ts`, I noticed the `search` query might be vulnerable to IDOR / unauthorized access.

## Details
The `search` query uses `args.query` to perform a full-text search. If `args.projectId` or `args.organizationId` are NOT provided, the search is performed globally across all issues (filtered by `notDeleted`).

The results are then filtered in-memory using `matchesSearchFilters`. However, `matchesSearchFilters` only checks if the issue matches the *provided filters*, it does **not** check if the user has permission to view the issue's project.

## Impact
A user could search for generic terms (e.g., "password", "secret", "key") and potentially retrieve issues from projects they do not have access to, leaking sensitive information (title, description, etc.).

## Remediation
The `search` query should:
1.  Enforce that `projectId` or `organizationId` MUST be provided, OR
2.  If global search is allowed, it must filter results by checking `canAccessProject` for each result (similar to the fix applied to `listByUser`).
3.  Alternatively, use a search index that includes `organizationId` and enforce filtering by the user's organizations.

## Priority
High

## Audit (2026-03-02)

- `convex/issues/queries.ts` now returns empty results when no `query`, `projectId`, or `organizationId` is provided.
- Search with free-text query still does not explicitly enforce per-project access checks in this query path.
- Keep this item open until search results are guaranteed to be scoped by membership/organization at query time.

## Execution Plan (Updated 2026-03-02)

**Owner:** `@unassigned`  
**Sprint Tag:** `S1`  
**Effort:** Medium

### Steps

- [x] Enforce tenant/project scope in search query path before returning any issue docs
- [x] Add explicit membership authorization checks for global/free-text search
- [x] Add regression tests proving cross-project/org leakage is impossible

## Progress Log

### 2026-03-02 - Batch A (scope enforcement + regression coverage complete)

- Decision:
  - close the IDOR gap by enforcing project access in `issues.search` for all query paths (query-text, project-scoped, org-scoped), not only caller-provided filters.
- Change:
  - updated `convex/issues/queries.ts`:
    - added early deny path for unauthorized `projectId` search (`{ page: [], total: 0 }`).
    - added per-project access scoping for all fetched search candidates using `canAccessProject(...)` before applying `matchesSearchFilters(...)`.
  - updated `convex/issues.test.ts`:
    - added regression test that global search cannot return issues from inaccessible projects.
    - added regression test that `projectId`-scoped and `organizationId`-scoped search return empty for unauthorized tenant scope.
- Validation:
  - `pnpm exec biome check convex/issues/queries.ts convex/issues.test.ts` => pass
  - `pnpm test convex/issues.test.ts` => pass (`28 passed`)
- Blockers:
  - none in code path; follow-up is optional performance tuning if access checks become expensive at higher search limits.
- Next Step:
  - if desired, optimize access-scoping with a single membership-derived project set to avoid repeated `canAccessProject(...)` checks at larger result windows.

### 2026-03-02 - Batch B (resolution confirmation)

- Decision:
  - close this issue as resolved; current search paths are access-scoped and regression-covered.
- Validation:
  - `pnpm test convex/issues.test.ts` => pass (`28 passed`)
  - verified `issues.search` path in `convex/issues/queries.ts` keeps per-project access checks (`canAccessProject(...)`) and unauthorized scope early-deny behavior.
- Blockers:
  - none.
- Next Step:
  - move to Priority `03` (`jules-scribe-2024-05-22-fix-cascade-delete-limit.md`).

### 2026-03-02 - Batch C (strict-order revalidation checkpoint)

- Decision:
  - keep this item resolved; no code changes required after fresh regression revalidation.
- Validation:
  - `pnpm test convex/issues.test.ts` => pass (`28 passed`)
  - confirmed `issues.search` remains access-scoped with per-project authorization checks and unauthorized scope denial behavior.
- Blockers:
  - none.
- Next Step:
  - continue strict order with Priority `03` (`jules-scribe-2024-05-22-fix-cascade-delete-limit.md`).
