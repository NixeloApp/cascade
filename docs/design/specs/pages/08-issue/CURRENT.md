# Issue Detail Page - Current State

> **Route**: `/:slug/issues/:key`
> **Status**: 🟡 NEEDS POLISH
> **Last Updated**: Run `pnpm screenshots` to regenerate

---

## Screenshots

| Viewport | Preview |
|----------|---------|
| Desktop | ![](screenshots/desktop-dark.png) |

---

## Structure

Two-column layout with main content and properties sidebar:

```
+-------------------------------------------------------------------------------------------+
| [=] Nixelo E2E                      [Commands Cmd+K] [?] [> Timer] [Search Cmd+K] [N] [AV]|
+-------------------------------------------------------------------------------------------+
| Demo Project / Issues / DEMO-2                                             [Close] [...]  |
+-------------------------------------------------------------------------------------------+
|                                                                                           |
|  +------------------------------------------------------------------+  +---------------+ |
|  |                                                                  |  |               | |
|  |  [BUG] DEMO-2                                                    |  |  Details      | |
|  |                                                                  |  |  ------------ | |
|  |  Fix login timeout on mobile                                     |  |               | |
|  |  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~                                    |  |  Status       | |
|  |                                                                  |  |  [IN PROGRESS]| |
|  |  +-----------------------------------------------------------+  |  |               | |
|  |  | Description                                     [Edit]    |  |  |  Priority     | |
|  |  |                                                           |  |  |  [HIGH]       | |
|  |  | When users attempt to login on mobile devices, the        |  |  |               | |
|  |  | session times out after 30 seconds, which is too short... |  |  |  Assignee     | |
|  |  |                                                           |  |  |  [Emily Chen] | |
|  |  +-----------------------------------------------------------+  |  |               | |
|  |                                                                  |  |  Reporter     | |
|  |  Activity                                                        |  |  [Alex Rivera]| |
|  |  ~~~~~~~~                                                        |  |               | |
|  |                                                                  |  |  Sprint       | |
|  |  • Emily Chen changed status to IN PROGRESS                      |  |  [Sprint 1]   | |
|  |    2 hours ago                                                   |  |               | |
|  |                                                                  |  |  Labels       | |
|  |  • Alex Rivera created this issue                                |  |  [mobile]     | |
|  |    1 day ago                                                     |  |  [auth]       | |
|  |                                                                  |  |               | |
|  |  Comments                                                        |  |  Due Date     | |
|  |  ~~~~~~~~                                                        |  |  [Jan 29]     | |
|  |                                                                  |  |               | |
|  |  +-----------------------------------------------------------+  |  |  Estimate     | |
|  |  | [Avatar] Add a comment...                                 |  |  |  [3 points]   | |
|  |  +-----------------------------------------------------------+  |  |               | |
|  |                                                                  |  +---------------+ |
|  +------------------------------------------------------------------+                    |
|                                                                                           |
+-------------------------------------------------------------------------------------------+
```

---

## Current Elements

### Breadcrumb Navigation
- Project name → Issues → Issue key
- Clickable links back to parent views

### Header Area
- Issue type icon (bug, task, story)
- Issue key (DEMO-2)
- Issue title (large heading)
- Close button and more options menu

### Description Section
- Editable rich text area
- Edit button to toggle editing mode
- Markdown/rich text support

### Activity Feed
- Timeline of changes
- Shows status changes, assignments, comments
- Timestamp display

### Comments Section
- Comment list (if any)
- Add comment input
- Avatar display

### Properties Sidebar
- **Status**: Dropdown with workflow states
- **Priority**: Dropdown (Highest, High, Medium, Low, Lowest)
- **Assignee**: User picker with avatar
- **Reporter**: Display only
- **Sprint**: Sprint picker
- **Labels**: Multi-select tag input
- **Due Date**: Date picker
- **Estimate**: Story point picker

---

## Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/routes/_auth/_app/$orgSlug/issues/$key.tsx` | Route definition | ~100 |
| `src/components/issues/IssueDetail.tsx` | Main layout | ~200 |
| `src/components/issues/IssueSidebar.tsx` | Properties sidebar | ~180 |
| `src/components/issues/IssueDescription.tsx` | Description editor | ~100 |
| `src/components/issues/ActivityFeed.tsx` | Activity timeline | ~150 |
| `src/components/issues/CommentSection.tsx` | Comments | ~120 |

---

## Problems

| # | Problem | Location | Severity |
|---|---------|----------|----------|
| 1 | Sidebar fields need consistent styling | IssueSidebar | MEDIUM |
| 2 | Activity feed lacks visual timeline | ActivityFeed | MEDIUM |
| 3 | Comment input needs better styling | CommentSection | LOW |
| 4 | No keyboard shortcuts for actions | IssueDetail | MEDIUM |
| 5 | Description editor polish needed | IssueDescription | LOW |
| 6 | Field labels inconsistent | IssueSidebar | LOW |
| 7 | No hover states on sidebar fields | IssueSidebar | LOW |
| 8 | Activity timestamps format | ActivityFeed | LOW |

---

## Sidebar Field Detail

```
+---------------------------+
|  Details                  |
+---------------------------+
|                           |
|  Status                   |   <- Label (muted text)
|  +---------------------+  |
|  | IN PROGRESS       ▼|  |   <- Dropdown field
|  +---------------------+  |
|                           |
|  Priority                 |
|  +---------------------+  |
|  | [!!] HIGH          ▼|  |
|  +---------------------+  |
|                           |
|  Assignee                 |
|  +---------------------+  |
|  | [AV] Emily Chen    ▼|  |
|  +---------------------+  |
|                           |
+---------------------------+
```

---

## Summary

The issue detail page is functional but needs polish:
- Sidebar fields need consistent styling and hover states
- Activity feed should have visual timeline (dots and lines)
- Comment input needs better styling
- Add keyboard shortcuts for common actions
- Description editor needs minor polish
