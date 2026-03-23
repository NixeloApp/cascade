# Project Inbox Page - Implementation

> **Route file**: `src/routes/_auth/_app/$orgSlug/projects/$key/inbox.tsx`

## Data

- `api.inboxIssues.list` — paginated inbox issues by project
- `api.inboxIssues.accept` / `decline` / `snooze` / `markDuplicate` / `reopen` / `remove`
- Issues arrive via `api.intake.createExternal` (public HTTP endpoint)

## Components

| Component | Location |
|-----------|----------|
| InboxPage | `src/routes/.../inbox.tsx` |
| InboxList | `src/components/InboxList.tsx` (551 lines) |

## Related: External Intake

- Intake token management: `src/components/ProjectSettings/IntakeSettings.tsx`
- HTTP endpoint: `convex/http/intake.ts` (`POST /api/intake`)
- Token CRUD: `convex/intake.ts` (createToken, revokeToken, getTokenStatus)

## Permissions

- Requires project access (viewer+ to view, editor+ to triage)
