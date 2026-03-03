# Calendar Access Control Issue

## P1 - Enforce project access before deriving calendar scope

**File:** `convex/calendarEvents.ts:141`

`resolveScopeFromProjectOrIssue` only checks that the referenced project/issue exists, then copies its `organizationId/workspaceId/teamId` without verifying caller can access that project.

Since `create`/`update` use this helper and scoped calendar queries return all events in those scopes, any authenticated user who supplies a foreign `projectId` can inject events into another team/workspace/org calendar.

**Fix:** Call `canAccessProject()` in `resolveScopeFromProjectOrIssue` and throw if user lacks access.

## Priority

P1 - This is an access control bypass allowing cross-tenant data injection.
