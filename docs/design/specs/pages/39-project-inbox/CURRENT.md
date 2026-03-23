# Project Inbox Page - Current State

> **Route**: `/:slug/projects/:key/inbox`
> **Status**: REVIEWED
> **Last Updated**: 2026-03-23

> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

---

## Purpose

The project inbox is the triage queue for incoming issues. It answers:

1. What external submissions are waiting for review?
2. Can I quickly accept, decline, or snooze items in bulk?
3. What did I already resolve, and can I reopen something?
4. Who submitted this and when?

Issues arrive via the external intake API (`POST /api/intake` with a Bearer token)
or are created directly as inbox items by the system. The inbox is the gate between
"submitted" and "in the project backlog."

---

## Screenshot Matrix

### Canonical route captures

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

### Missing captures (should be added)

- Empty open tab ("No issues awaiting triage")
- Empty closed tab ("No resolved inbox items")
- Bulk action bar visible with checkboxes selected
- Snooze duration dropdown open
- Decline reason dialog
- Mark-as-duplicate linking UI

---

## Route Anatomy

```text
+------------------------------------------------------------------------------+
| Global app shell                                                             |
| sidebar + top utility bar                                                    |
+------------------------------------------------------------------------------+
| Project Inbox route                                                          |
|                                                                              |
|  Tabs                                                                        |
|  +--------------------+---------------------+                                |
|  | Open (5)           | Closed (12)         |                                |
|  +--------------------+---------------------+                                |
|                                                                              |
|  Bulk action bar (visible when items selected)                               |
|  +------------------------------------------------------------------------+ |
|  | [x] 3 selected    [Accept All]  [Decline All]  [Snooze 1 Week]         | |
|  +------------------------------------------------------------------------+ |
|                                                                              |
|  Issue rows                                                                  |
|  +------------------------------------------------------------------------+ |
|  | [x] ! PROJ-42  Bug report from customer       pending   2h ago   [...] | |
|  |     Submitted by Jane (jane@example.com)                               | |
|  +------------------------------------------------------------------------+ |
|  | [ ] ! PROJ-43  Login page broken               snoozed   1d ago  [...] | |
|  |     Snoozed until Mar 28                                               | |
|  +------------------------------------------------------------------------+ |
|  | [ ]   PROJ-44  Feature request: dark mode      pending   3d ago  [...] | |
|  |     Submitted via API                                                  | |
|  +------------------------------------------------------------------------+ |
|                                                                              |
|  [...] = overflow menu: Accept, Decline, Snooze, Mark Duplicate, Delete     |
|  On closed tab: Reopen, Remove                                              |
+------------------------------------------------------------------------------+
```

---

## Current Composition

### 1. Route wrapper (29 lines)

- Thin route: resolves project by key, passes `projectId` to `InboxList`.
- Loading and error states handled at route level.

### 2. InboxList component (551 lines)

The entire inbox UI lives in a single component with:

**Tabs:**
- **Open** — pending + snoozed items (triageable)
- **Closed** — accepted + declined + duplicate items (resolved)
- Each tab shows a count badge from `api.inbox.getCounts`

**Bulk actions:**
- Selection checkboxes on each triageable row
- "Select all" checkbox in the header
- Bulk Accept / Bulk Decline / Bulk Snooze (1 week) buttons
- Only visible when at least one item is selected
- Actions clear selection and show success toast with count

**Per-issue row:**
- Checkbox (open tab only, triageable items)
- Status icon (color-coded: pending=warning, accepted=success, declined=error, snoozed=clock, duplicate=copy)
- Issue key and title
- Submitter info (name + email from triage notes)
- Relative timestamp
- Status badge
- Overflow menu with context-appropriate actions

**Per-issue actions (open tab):**
- Accept — moves issue to project backlog
- Decline — marks as declined (with optional reason)
- Snooze — defers for 1 day, 3 days, or 1 week
- Mark as Duplicate — links to an existing issue

**Per-issue actions (closed tab):**
- Reopen — returns to pending status
- Remove — soft-deletes the inbox item

### 3. Status configuration

```text
pending   -> AlertTriangle (warning)   "Pending"
accepted  -> CheckCircle2 (success)    "Accepted"
declined  -> XCircle (error)           "Declined"
snoozed   -> Clock (info)              "Snoozed"
duplicate -> Copy (secondary)          "Duplicate"
```

---

## State Coverage

### States the current spec explicitly covers

- Filled inbox with mixed-status items (4 viewports)

### States that should be captured

- Empty open tab
- Empty closed tab
- Bulk selection active with action bar
- Snooze duration dropdown
- Closed tab showing accepted/declined/duplicate items
- Row with submitter metadata (email, name, triage notes)

---

## Current Strengths

| Area | Current Read |
|------|--------------|
| Triage flow | Clear accept/decline/snooze workflow. Bulk actions make high-volume triage fast. |
| Status visibility | Color-coded icons and badges make status instantly scannable. |
| External intake integration | Issues from the public API surface naturally in this queue. |
| Tab separation | Open vs closed is clean. No mixing of actionable and resolved items. |
| Submitter context | Triage notes show who submitted and how (API, email). |

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | No search or filter within the inbox. Users must scan visually. | UX | MEDIUM |
| 2 | Snooze durations are hardcoded (1d, 3d, 1w). No custom date picker. | flexibility | LOW |
| 3 | Decline reason is optional and not prominently surfaced in the UI. | accountability | LOW |
| 4 | Mark-as-duplicate requires knowing the target issue key. No search picker. | UX | LOW |

---

## Source Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/routes/.../inbox.tsx` | 29 | Route: project resolution |
| `src/components/InboxList.tsx` | 551 | Full inbox UI: tabs, bulk actions, rows, actions |
| `convex/inbox.ts` | -- | Backend: list, accept, decline, snooze, duplicate, reopen, remove, counts |
| `convex/intake.ts` | -- | External submission: createExternal, token management |
| `convex/http/intake.ts` | -- | HTTP endpoint: POST /api/intake |
| `src/components/ProjectSettings/IntakeSettings.tsx` | -- | Admin UI: create/revoke intake tokens |

---

## Review Guidance

- The triage flow (accept/decline/snooze) is the core value. Do not add complexity.
- Bulk actions are critical for high-volume intake. Do not hide them behind a menu.
- The closed tab is for auditability. Do not auto-purge resolved items.
- If search is added, keep it simple (title/key filter, not a full query builder).
- The external intake API + admin token UI is the primary inflow. Keep them linked.

---

## Summary

The project inbox is a focused triage queue. It has clear accept/decline/snooze workflows,
bulk operations for volume, tab separation for open vs resolved, and integration with the
external intake API. The main UX gap is the lack of search within the inbox. The component
is a single 551-line file that could benefit from splitting but is functionally complete.
