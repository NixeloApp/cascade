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
- [ ] Add emoji picker to comments (can reuse from emoji-overhaul)
- [ ] Add file attachment support inline with comments

### Current State

- Mentions with `@[name](id)` syntax work ✅
- Preview toggle in MentionInput ✅
- Inline markdown: **bold**, *italic*, `code`, ~~strikethrough~~, [links](url) ✅
- No emoji picker (pending)
- No inline attachments (pending)

---

## 2. User Picker Custom Field

Add "user" type to custom fields for Reviewer, QA, Designer fields.

### Tasks

- [ ] Add `v.literal("user")` to schema `fieldType` union
- [ ] Update `convex/customFields.ts` validation
- [ ] Create user picker UI in `CustomFieldValues.tsx`
- [ ] Update `CustomFieldsManager.tsx` to allow creating user fields

### Current Types

```typescript
v.literal("text"),
v.literal("number"),
v.literal("select"),
v.literal("multiselect"),
v.literal("date"),
v.literal("checkbox"),
v.literal("url"),
// Missing: v.literal("user")
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
