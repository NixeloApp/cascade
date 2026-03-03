# Slack Integration Issues

Security and functionality issues with Slack slash commands, OAuth, and unfurls.

## P1 - Restrict slash-command assignee lookup to project members

**File:** `convex/slackCommandsCore.ts`

`/nixelo assign` resolves assignees by scanning global users and matching on display name without project/organization membership check. Name collisions can assign issues to wrong/unauthorized users.

**Fix:** Scope user lookup to project members only.

## P1 - Accept Slack OAuth messages from the popup origin

**File:** `src/components/Settings/SlackIntegration.tsx:43`

OAuth popup opens on Convex `.site` origin, but listener only accepts messages from `window.location.origin`. When frontend and Convex differ (common in local dev), `slack-connected` postMessage is discarded.

**Fix:** Accept messages from the Convex site origin, not just `window.location.origin`.

## P1 - Pass Slack caller identity into slash-command execution

**File:** `convex/http/slackCommands.ts:110`

HTTP handler forwards only `teamId` and command text to `executeCommand`. Authorization runs as the workspace connector, not the Slack user who issued `/nixelo`. Users with broader Slack access can perform actions with elevated Nixelo permissions.

**Fix:** Forward Slack user identity and validate their Nixelo permissions.

## P1 - Authorize unfurls with the requesting Slack user

**File:** `convex/slackUnfurl.ts:57`

Access is checked against `activeConnection.userId` (installer) instead of the Slack user who triggered the unfurl. Posting an issue URL can expose data to users who wouldn't pass `canAccessProject`.

**Fix:** Resolve Nixelo user from Slack user ID and check their access.

## P1 - Scope Slack connections to organization context

**File:** `convex/slack.ts:347`

`connectSlack` stores one connection per user (`by_user`) without organization key. A user connected in org A causes org B notifications to go to org A's Slack workspace (cross-tenant leak).

**Fix:** Add `organizationId` to connection lookup and storage.

## P2 - Pick a writable project for `/nixelo create`

**File:** `convex/slackCommandsCore.ts:282`

`pickProjectForUser` returns first membership project. For users in multiple projects, this fails if first membership is viewer-only, even when editable projects exist.

**Fix:** Filter to projects where user has editor role.

## P2 - Don't sample only first 20 Slack team connections

**File:** `convex/slackCommandsCore.ts:102`

`resolveTeamContext` limits `by_team` lookup to 20 rows. Teams with more than 20 connection records may incorrectly report "workspace not connected" or resolve to stale context.

**Fix:** Remove arbitrary limit or scan until active connection found.

## Priority

P1 issues are security/access-control problems. P2 are functionality bugs.
