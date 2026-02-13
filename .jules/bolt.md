# Performance Improvement: Project Access Caching

## Summary

Implemented a request-scoped cache for `computeProjectAccess` using a `WeakMap`.

## Problem

Operations like `bulkUpdateStatus` iterate over a list of issues and perform access checks (`assertCanEditProject`) for each issue.
`computeProjectAccess` involves multiple database queries:
1. `ctx.db.get(projectId)` (efficiently cached by Convex).
2. `isOrganizationAdmin` (query `organizationMembers`).
3. `ctx.db.query("projectMembers")...`.
4. `checkTeamBasedAccess` (query `teamMembers`).
5. `checkOrgPublicAccess` (query `organizationMembers`).

For a bulk update of N issues in the same project, this resulted in O(N) redundant database queries, significantly slowing down the mutation.

## Solution

We introduced a `WeakMap<QueryCtx | MutationCtx, Map<string, Promise<ProjectAccessResult>>>` to cache the result of `computeProjectAccess` keyed by the request context (`ctx`) and the arguments (`projectId`, `userId`).

```typescript
const projectAccessCache = new WeakMap<object, Map<string, Promise<ProjectAccessResult>>>();
```

Since `ctx` is unique per request but shared across function calls within that request, this effectively caches the access result for the duration of the request.

## Impact

- **Complexity**: Reduced database query complexity for bulk operations from O(N) to O(1) (per unique project).
- **Performance**: Significant reduction in latency for bulk mutations (e.g., updating 100 issues).
- **Correctness**: The cache is scoped to the request, ensuring fresh data for each new request while optimizing within-request redundancy.

## Code Changes

Modified `convex/projectAccess.ts` to wrap the `computeProjectAccess` logic with the caching mechanism.
