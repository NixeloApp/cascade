# Project Inbox Page - Current State

> **Route**: `/:slug/projects/:key/inbox`
> **Status**: REVIEWED
> **Last Updated**: 2026-03-26

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

### Reviewed interaction captures

| State | Desktop Dark | Desktop Light | Tablet Light | Mobile Light |
|-------|--------------|---------------|--------------|--------------|
| Closed tab | ![](screenshots/desktop-dark-closed.png) | ![](screenshots/desktop-light-closed.png) | ![](screenshots/tablet-light-closed.png) | ![](screenshots/mobile-light-closed.png) |
| Bulk selection | ![](screenshots/desktop-dark-bulk-selection.png) | ![](screenshots/desktop-light-bulk-selection.png) | ![](screenshots/tablet-light-bulk-selection.png) | ![](screenshots/mobile-light-bulk-selection.png) |
| Snooze menu | ![](screenshots/desktop-dark-snooze-menu.png) | ![](screenshots/desktop-light-snooze-menu.png) | ![](screenshots/tablet-light-snooze-menu.png) | ![](screenshots/mobile-light-snooze-menu.png) |
| Decline dialog | ![](screenshots/desktop-dark-decline-dialog.png) | ![](screenshots/desktop-light-decline-dialog.png) | ![](screenshots/tablet-light-decline-dialog.png) | ![](screenshots/mobile-light-decline-dialog.png) |
| Duplicate dialog | ![](screenshots/desktop-dark-duplicate-dialog.png) | ![](screenshots/desktop-light-duplicate-dialog.png) | ![](screenshots/tablet-light-duplicate-dialog.png) | ![](screenshots/mobile-light-duplicate-dialog.png) |
| Empty open tab | ![](screenshots/desktop-dark-open-empty.png) | ![](screenshots/desktop-light-open-empty.png) | ![](screenshots/tablet-light-open-empty.png) | ![](screenshots/mobile-light-open-empty.png) |
| Empty closed tab | ![](screenshots/desktop-dark-closed-empty.png) | ![](screenshots/desktop-light-closed-empty.png) | ![](screenshots/tablet-light-closed-empty.png) | ![](screenshots/mobile-light-closed-empty.png) |

### Remaining gaps

No known screenshot gaps for this route on the reviewed matrix.

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

### 2. InboxList component (1515 lines)

The entire inbox UI lives in a single component with:

**Tabs:**
- **Open** — pending + snoozed items (triageable)
- **Closed** — accepted + declined + duplicate items (resolved)
- Each tab shows a count badge from `api.inbox.getCounts`

**Bulk actions:**
- Selection checkboxes on each triageable row
- "Select all" checkbox in the header
- Bulk Accept / Bulk Decline / Bulk Snooze buttons
- Bulk Snooze supports presets and a custom date dialog
- Only visible when at least one item is selected
- Actions clear selection and show success toast with count

**Per-issue row:**
- Checkbox (open tab only, triageable items)
- Status icon (color-coded: pending=warning, accepted=success, declined=error, snoozed=clock, duplicate=copy)
- Issue key and title
- Submitter info and intake source metadata
- Relative timestamp
- Status badge
- Closed-state context badges for snoozed, declined, and duplicate outcomes
- Overflow menu with context-appropriate actions

**Per-issue actions (open tab):**
- Accept — moves issue to project backlog
- Decline — opens a reason dialog before closing the item
- Snooze — defers for 1 day, 3 days, 1 week, or a custom date
- Mark as Duplicate — opens issue search within the project and links the item

**Per-issue actions (closed tab):**
- Reopen — returns to pending status
- Remove — soft-deletes the inbox item

**Empty-state actions:**
- Search-empty state offers a direct "Clear search" recovery action
- Open-empty state can jump directly to the closed tab when prior triage exists
- Closed-empty state can jump back to the open queue when items still need review

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
- Closed tab with resolved items (4 viewports)
- Bulk selection action bar (4 viewports)
- Snooze preset menu (4 viewports)
- Decline reason dialog (4 viewports)
- Duplicate search dialog (4 viewports)
- Empty open tab (4 viewports)
- Empty closed tab (4 viewports)

---

## Current Strengths

| Area | Current Read |
|------|--------------|
| Triage flow | Clear accept/decline/snooze workflow. Bulk actions make high-volume triage fast. |
| Status visibility | Color-coded icons and badges make status instantly scannable. |
| External intake integration | Issues from the public API surface naturally in this queue. |
| Tab separation | Open vs closed is clean. No mixing of actionable and resolved items. |
| Submitter context | Triage notes show who submitted and how (API, email). |
| Recovery UX | Empty states now point directly to the next useful action instead of dead-ending. |
| Mobile readability | Row actions now stack beneath the content on small screens, so titles, provenance, and badges keep usable width instead of collapsing into a narrow column. |

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | `InboxList` now covers more of the real triage surface, but it is still a 1515-line single component. | maintainability | MEDIUM |

---

## Source Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/routes/.../inbox.tsx` | 29 | Route: project resolution |
| `src/components/InboxList.tsx` | 1515 | Full inbox UI: tabs, bulk actions, rows, dialogs, duplicate search, empty-state recovery |
| `e2e/pages/inbox.page.ts` | 128 | Page object for inbox route screenshot and E2E interactions |
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

The project inbox is now a fuller triage surface with reviewed closed, bulk-selection,
snooze-menu, decline-dialog, duplicate-search, and both empty-tab states across
desktop/tablet/mobile. The main product-level visual bug on the route was the mobile
row collapse; that is now fixed. The main engineering debt is that the route still
lives in a 1515-line single component.
