# Project Inbox Page - Implementation

> **Route file**: `src/routes/_auth/_app/$orgSlug/projects/$key/inbox.tsx`
> **Last Updated**: 2026-03-23

---

## Data Flow

### Queries

| Query | Source | Purpose |
|-------|--------|---------|
| `api.inbox.list` | `useAuthenticatedQuery` | Inbox issues with enriched details (issue, submitter, triage user) |
| `api.inbox.getCounts` | `useAuthenticatedQuery` | Count per status for tab badges |

### Mutations

| Mutation | Purpose | Bulk |
|----------|---------|------|
| `api.inbox.accept` | Move to project backlog | `bulkAccept` |
| `api.inbox.decline` | Mark declined with optional reason | `bulkDecline` |
| `api.inbox.snooze` | Defer for duration (1d/3d/1w) | `bulkSnooze` |
| `api.inbox.markDuplicate` | Link to existing issue | No |
| `api.inbox.reopen` | Return to pending | No |
| `api.inbox.remove` | Soft-delete | No |

### State Management

```text
Route state (useState):
+-- activeTab: "open" | "closed"
+-- selectedIds: Set<Id<"inboxIssues">>   # Bulk selection
```

### Enriched Data Shape

Each inbox issue comes with:
- `issue` — full issue document (key, title, status, priority)
- `createdByUser` — who created the intake token (admin context)
- `triagedByUser` — who accepted/declined/snoozed
- `duplicateOfIssue` — linked duplicate target (key + title)
- Submitter info from triage notes (name, email)

---

## Component Tree

```text
InboxPage (route)
+-- InboxList (551 lines)
    +-- Tabs (open | closed)
    |   +-- TabsList with count badges
    +-- Bulk action bar (conditional on selection)
    |   +-- Checkbox "Select all"
    |   +-- Button "Accept All"
    |   +-- Button "Decline All"
    |   +-- Button "Snooze 1 Week"
    +-- TabsContent "open"
    |   +-- InboxIssueRow[] (pending + snoozed)
    |       +-- Checkbox
    |       +-- Status icon
    |       +-- Issue key + title
    |       +-- Submitter info
    |       +-- Timestamp
    |       +-- Status badge
    |       +-- DropdownMenu (Accept, Decline, Snooze, Duplicate)
    +-- TabsContent "closed"
    |   +-- InboxIssueRow[] (accepted + declined + duplicate)
    |       +-- Status icon
    |       +-- Issue key + title
    |       +-- Triage info (who, when)
    |       +-- DropdownMenu (Reopen, Remove)
    +-- EmptyState (per tab)
```

---

## External Intake Pipeline

```text
External user/service
  |
  | POST /api/intake  (Bearer token)
  | { title, description, submitterEmail, submitterName }
  v
convex/http/intake.ts  (extractBearerToken, validate)
  |
  | ctx.runMutation(api.intake.createExternal)
  v
convex/intake.ts  (validate token, create issue + inbox item)
  |
  | Creates: issues record + inboxIssues record (status: "pending")
  v
Project Inbox UI  (real-time via Convex reactive query)
  |
  | Admin triages: accept / decline / snooze / duplicate
  v
Issue moves to project backlog (on accept) or stays resolved
```

Token management: `ProjectSettings > IntakeSettings` (create/revoke/copy token + endpoint URL).

---

## Permissions

| Action | Required Role |
|--------|---------------|
| View inbox | Project viewer+ |
| Triage (accept/decline/snooze) | Project editor+ |
| Bulk actions | Project editor+ |
| Remove items | Project editor+ |

---

## Testing

| Test File | Coverage |
|-----------|----------|
| `convex/inbox.test.ts` | Backend: list, accept, decline, snooze, counts |
| `convex/intake.test.ts` | External submission, token validation |
| `convex/http/intake.test.ts` | Bearer token parsing (10 tests) |
| `e2e/screenshot-pages.ts` | `filled-project-inbox` spec |
