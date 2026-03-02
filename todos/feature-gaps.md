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
- [ ] Add file attachment support inline with comments

### Current State

- Mentions with `@[name](id)` syntax work ✅
- Preview toggle in MentionInput ✅
- Inline markdown: **bold**, *italic*, `code`, ~~strikethrough~~, [links](url) ✅
- Emoji picker in comment input toolbar ✅
- No inline attachments (pending)

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
- [ ] Implement OAuth callback handler
- [ ] Create `convex/slack.ts` adapting Pumble patterns
- [ ] Add Slack workspace connection UI in settings

### Phase 2: Slash Commands

- [ ] Register `/nixelo` command with Slack
- [ ] Create `convex/http.ts` handler for slash commands
- [ ] Support `create`, `search`, `assign` subcommands

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

- [ ] `S1` Complete rich-text comment parity (emoji picker + inline attachments)
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
