# Calendar Access Control Issue

> **Priority:** P1
> **Status:** Complete
> **Last Updated:** 2026-03-12
> **Verification:** `convex/calendarEvents.ts` now calls `canAccessProject()` before deriving calendar scope from a referenced project or issue.

## Resolution

- Verified fixed in the current repository on `2026-03-12`.
- Keep this doc as historical record until defect docs are archived.

## Historical Issue

### P1 - Enforce project access before deriving calendar scope

**File:** `convex/calendarEvents.ts:141`

`resolveScopeFromProjectOrIssue` only checks that the referenced project/issue exists, then copies its `organizationId/workspaceId/teamId` without verifying caller can access that project.

Since `create`/`update` use this helper and scoped calendar queries return all events in those scopes, any authenticated user who supplies a foreign `projectId` can inject events into another team/workspace/org calendar.

**Fix:** Call `canAccessProject()` in `resolveScopeFromProjectOrIssue` and throw if user lacks access.

## Outcome

Resolved. This access-control bypass is no longer present in the current code.
