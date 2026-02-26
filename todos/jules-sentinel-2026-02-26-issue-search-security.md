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
