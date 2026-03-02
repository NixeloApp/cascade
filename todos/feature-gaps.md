# Feature Gaps

> **Priority:** P2
> **Effort:** Medium
> **Status:** In Progress

---

## 1. Rich Text Comments

Improve comment editor to match document editor quality.

### Tasks

- [x] Add Markdown preview toggle to comment textarea ✅ 2026-02-24
- [x] Improve `CommentRenderer.tsx` Markdown rendering ✅ 2026-02-24
- [x] Add emoji picker to comments (can reuse from emoji-overhaul)
- [x] Add file attachment support inline with comments ✅ 2026-03-02

### Current State

- Mentions with `@[name](id)` syntax work ✅
- Preview toggle in MentionInput ✅
- Inline markdown: **bold**, *italic*, `code`, ~~strikethrough~~, [links](url) ✅
- Emoji picker in comment input toolbar ✅
- Inline comment attachments (upload + per-comment render) ✅

---

## 2. User Picker Custom Field

Add "user" type to custom fields for Reviewer, QA, Designer fields.

### Tasks

- [x] Add `v.literal("user")` to schema `fieldType` union ✅ 2026-02-24
- [x] Update `convex/customFields.ts` validation ✅ 2026-02-24
- [x] Create user picker UI in `CustomFieldValues.tsx` ✅ 2026-02-24
- [x] Update `CustomFieldsManager.tsx` to allow creating user fields ✅ 2026-02-24

### Current Types

```typescript
v.literal("text"),
v.literal("number"),
v.literal("select"),
v.literal("multiselect"),
v.literal("date"),
v.literal("checkbox"),
v.literal("url"),
v.literal("user"), // ✅ Added
```

---

## 3. Slack Integration

Extend webhook infrastructure to support Slack (currently only Pumble).

### Phase 1: Outbound Notifications

- [ ] Create Slack OAuth app in Slack API dashboard
- [x] Implement OAuth callback handler ✅ 2026-03-02
- [x] Create `convex/slack.ts` adapting Pumble patterns ✅ 2026-03-02
- [x] Add Slack workspace connection UI in settings ✅ 2026-03-02
- [x] Implement Slack outbound event delivery and issue-event triggers ✅ 2026-03-02

### Phase 2: Slash Commands

- [ ] Register `/nixelo` command with Slack
- [x] Create `convex/http.ts` handler for slash commands ✅ 2026-03-02
- [x] Support `create`, `search`, `assign` subcommands ✅ 2026-03-02

### Phase 3: Link Unfurling

- [ ] Register URL patterns with Slack
- [ ] Create unfurl handler returning issue details

---

## Related Files

- `convex/pumble.ts` - Reference webhook implementation
- `src/components/CustomFieldValues.tsx` - Custom field rendering
- `src/components/MentionInput.tsx` - Mention autocomplete
- `src/components/CommentRenderer.tsx` - Comment display

---

## Execution Plan (Updated 2026-03-02)

**Owner:** `@unassigned`  
**Target Window:** Sprint `S1-S3`  
**Effort:** Medium

### Milestones

- [x] `S1` Complete rich-text comment parity (emoji picker + inline attachments) ✅ 2026-03-02
- [ ] `S2` Slack outbound notifications MVP (workspace connect + event delivery)
- [ ] `S3` Slash command + link unfurling follow-up

### Dependencies

- OAuth app setup and secrets provisioning for Slack
- Attachment storage constraints and moderation/security policy

### Definition of Done

- Comment experience and Slack integration meet baseline production usability.

---

## Progress Log

### 2026-03-02 - Batch A (comment emoji picker)

- Decision:
  - complete the first `S1` rich-text parity gap by adding an inline emoji picker directly in `MentionInput` (comment composer), reusing lightweight existing UI primitives.
- Change:
  - updated `src/components/MentionInput.tsx`:
    - added emoji popover trigger in the write/preview toolbar.
    - added common emoji palette (`😀`, `👍`, `❤️`, `🔥`, `🎉`, `✅`, `🚀`, `👀`).
    - implemented cursor-aware emoji insertion into textarea content with focus/caret restoration.
    - kept mention parsing behavior intact after emoji insertion.
- Validation:
  - `pnpm run typecheck` => pass
  - `pnpm test src/components/CommentReactions.test.tsx` => pass (`2 passed`)
- Blockers:
  - none for this subtask.
- Next Step:
  - finish `S1` by adding inline file attachment support in comments.

### 2026-03-02 - Batch B (inline comment attachments)

- Decision:
  - complete the second `S1` rich-text parity gap by allowing comment-scoped file uploads directly in the comment composer and rendering attachments inline for each comment.
- Change:
  - updated `convex/schema.ts`:
    - added optional `attachments: Id<"_storage">[]` on `issueComments`.
  - updated `convex/issues/mutations.ts`:
    - extended `api.issues.addComment` with optional `attachments`.
    - added guard that rejects attachment IDs not already linked to the issue (`Attachment does not belong to this issue`).
    - persisted attachment IDs on comment records.
  - updated `src/components/IssueComments.tsx`:
    - added inline file upload action in comment composer via `api.attachments.generateUploadUrl` + `api.attachments.attachToIssue`.
    - added pending attachment list with per-file removal before submit.
    - submitted comment now includes attachment IDs.
    - rendered per-comment attachment links inline under comment content.
- Validation:
  - `pnpm exec biome check --write convex/schema.ts convex/issues/mutations.ts convex/issues/mutations.test.ts src/components/IssueComments.tsx` => pass (non-blocking complexity warning in `IssueComments` upload helper)
  - `pnpm run typecheck` => pass
  - `pnpm test convex/issues/mutations.test.ts` => pass (`24 passed`)
- Blockers:
  - `convex-test` cannot currently generate valid `_storage` IDs for direct unit tests of comment-attachment ID membership checks; backend guard remains covered by runtime logic and type validation but lacks a dedicated storage-backed unit test.
- Next Step:
  - start `S2` Slack outbound notifications MVP with OAuth app setup + callback handler scope definition.

### 2026-03-02 - Batch C (Slack OAuth + connection MVP)

- Decision:
  - ship the local product/code pieces for Slack `S2` first (OAuth callback, connection persistence, settings UI), and keep external Slack dashboard app provisioning as an explicit operator blocker.
- Change:
  - added backend connection module `convex/slack.ts`:
    - `connectSlack` (encrypted token upsert per user).
    - `getConnection` (sanitized metadata for UI, no token exposure).
    - `disconnectSlack`.
  - added schema table `slackConnections` with `by_user` / `by_team` indexes (`convex/schema.ts`).
  - added Slack OAuth HTTP handlers (`convex/http/slackOAuth.ts`):
    - `/slack/auth` stateful OAuth initiation.
    - `/slack/callback` code exchange + popup `postMessage` payload (`slack-connected`).
  - wired Slack routes in `convex/router.ts`.
  - added env helpers in `convex/lib/env.ts` for `SLACK_CLIENT_ID`/`SLACK_CLIENT_SECRET`.
  - added Settings integration UI `src/components/Settings/SlackIntegration.tsx` and mounted it in `src/components/Settings.tsx`.
  - added purge coverage for `slackConnections` in `convex/purge.ts`.
  - added backend tests in `convex/slack.test.ts` for connect/get/upsert/disconnect.
- Validation:
  - `pnpm exec biome check --write convex/slack.ts convex/slack.test.ts convex/http/slackOAuth.ts convex/router.ts convex/schema.ts convex/lib/env.ts convex/purge.ts src/components/Settings.tsx src/components/Settings/SlackIntegration.tsx` => pass
  - `pnpm run typecheck` => pass
  - `pnpm test convex/slack.test.ts` => pass (`3 passed`)
- Blockers:
  - Slack app creation/configuration in Slack API dashboard is still manual and not possible from this repository-only workflow.
  - Outbound event delivery to Slack channels is not fully wired yet (connection is now available; delivery path remains pending).
- Next Step:
  - implement Slack outbound delivery path (`sendMessage`/`sendIssueNotification`) using stored webhook/token and wire issue-event triggers.

### 2026-03-02 - Batch D (Slack outbound delivery + event triggers)

- Decision:
  - complete the remaining local `S2` work by wiring Slack event delivery end-to-end, but gate scheduler enqueue in issue mutations unless at least one Slack destination exists for the project to avoid unnecessary scheduled jobs.
- Change:
  - expanded `convex/slack.ts` with delivery pipeline:
    - added authenticated `sendMessage` action (owner-only delivery path).
    - added internal delivery action (`deliverMessageInternal`) for scheduler/internal flows.
    - added internal `sendIssueNotification` action for event fanout.
    - added internal queries for issue context and project Slack destinations.
    - added internal delivery stats mutation.
    - added Slack webhook URL validation in `connectSlack`.
  - updated `convex/schema.ts`:
    - extended `slackConnections` with optional delivery stats (`messagesSent`, `lastMessageAt`, `lastError`).
  - updated `convex/issues/mutations.ts`:
    - wired event triggers for `issue.created`, `issue.updated`, `issue.assigned`, and `comment.created`.
    - added pre-check (`hasSlackDestinationsForProject`) so scheduler jobs are enqueued only when Slack destinations exist.
  - expanded `convex/slack.test.ts`:
    - added send-message owner flow coverage.
    - added internal issue-notification fanout coverage.
    - added mutation-to-scheduler comment-trigger coverage.
- Validation:
  - `pnpm exec biome check --write convex/slack.ts convex/slack.test.ts convex/issues/mutations.ts convex/schema.ts` => pass
  - `pnpm run typecheck` => pass
  - `pnpm test convex/slack.test.ts` => pass (`6 passed`)
  - `pnpm test convex/issues/mutations.test.ts` => pass (`24 passed`)
- Blockers:
  - Slack app provisioning in Slack dashboard remains manual and is still required before real production delivery can be enabled.
- Next Step:
  - either (a) complete external Slack app provisioning and env setup to unblock real delivery, or (b) move to `S3` slash command work if provisioning stays blocked.

### 2026-03-02 - Batch E (slash command handler + core subcommands)

- Decision:
  - proceed with local slash-command implementation despite manual Slack command registration blocker, so backend/runtime support is ready once Slack dashboard registration is completed.
- Change:
  - added slash command HTTP handler `convex/http/slackCommands.ts`:
    - POST `/slack/commands` endpoint with Slack request-signature verification (`SLACK_SIGNING_SECRET`).
    - parses slash payload and returns Slack-compatible JSON responses.
  - added command execution core `convex/slackCommandsCore.ts`:
    - internal command execution for `create`, `search`, `assign`.
    - team-context resolution from `slackConnections`.
    - issue creation path (project selection, key generation, activity logging, stats sync).
    - issue search across user-accessible projects.
    - issue assignment by issue key + assignee name.
  - wired route in `convex/router.ts`:
    - `POST /slack/commands`.
  - extended env helpers (`convex/lib/env.ts`) for Slack signing-secret config checks.
  - added regression coverage in `convex/slackCommands.test.ts` for `create`, `search`, and `assign` command flows.
- Validation:
  - `pnpm exec biome check --write convex/slackCommandsCore.ts convex/slackCommands.test.ts convex/http/slackCommands.ts convex/router.ts convex/lib/env.ts` => pass
  - `pnpm run typecheck` => pass
  - `pnpm test convex/slackCommands.test.ts convex/slack.test.ts` => pass (`9 passed`)
  - `pnpm test convex/issues/mutations.test.ts` => pass (`24 passed`)
- Blockers:
  - Slack-side registration of `/nixelo` command is still manual and pending in Slack API dashboard.
  - Full command production enablement also depends on setting `SLACK_SIGNING_SECRET` in environment.
- Next Step:
  - complete manual `/nixelo` command registration + signing-secret env setup, then move to `S3` link unfurling implementation.
