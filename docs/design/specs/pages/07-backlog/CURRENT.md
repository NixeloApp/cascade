# Backlog Page - Current State

> **Route**: `/:slug/projects/:key/backlog`
> **Status**: 🟡 NEEDS POLISH
> **Last Updated**: Run `pnpm screenshots` to regenerate

---

## Screenshots

| Viewport | State | Preview |
|----------|-------|---------|
| Desktop | Filled | ![](screenshots/desktop-dark-filled.png) |
| Desktop | Empty | ![](screenshots/desktop-dark-empty.png) |

---

## Structure

Sprint-based backlog with issue lists:

```
+-------------------------------------------------------------------------------------------+
| [=] Nixelo E2E                      [Commands Cmd+K] [?] [> Timer] [Search Cmd+K] [N] [AV]|
+-------------------------------------------------------------------------------------------+
| Board  Backlog  Roadmap  Calendar  Activity  Analytics  Billing  Timesheet  Settings      |
|        -------                                                                            |
+-------------------------------------------------------------------------------------------+
| Demo Project  [DEMO]  [scrum]                              [+ Create Sprint] [+ Add Issue]|
+-------------------------------------------------------------------------------------------+
|                                                                                           |
|  +-------------------------------------------------------------------------------------+ |
|  | CURRENT SPRINT                                                                       | |
|  | Sprint 1  (Jan 15 - Jan 29, 2026)                          [Start Sprint]            | |
|  +-------------------------------------------------------------------------------------+ |
|  | [ ] [BUG] DEMO-2   Fix login timeout on mobile       HIGH    Emily Chen   IN-PROGRESS | |
|  | [ ] [TSK] DEMO-3   Design dashboard layout          MEDIUM   Alex Rivera   TO-DO      | |
|  | [ ] [STY] DEMO-4   Update onboarding flow           LOW      Sarah Kim    TO-DO      | |
|  +-------------------------------------------------------------------------------------+ |
|                                                                                           |
|  +-------------------------------------------------------------------------------------+ |
|  | BACKLOG                                                                              | |
|  | 12 items                                                               [Expand/Coll] | |
|  +-------------------------------------------------------------------------------------+ |
|  | [ ] [BUG] DEMO-5   Database query optimization      HIGH    Unassigned   TO-DO      | |
|  | [ ] [TSK] DEMO-6   Add analytics dashboard          MEDIUM  Unassigned   TO-DO      | |
|  | ... (8 more items)                                                                  | |
|  +-------------------------------------------------------------------------------------+ |
|                                                                                           |
+-------------------------------------------------------------------------------------------+
```

---

## Current Elements

### Project Tab Navigation
- Horizontal tabs: Board, Backlog (active), Roadmap, Calendar, Activity, Analytics, Billing, Timesheet, Settings
- Active tab has subtle underline indicator

### Project Header
- Project title with key badge and board type badge (scrum)
- "+ Create Sprint" and "+ Add Issue" buttons

### Sprint Card (Current Sprint)
- Section label: "CURRENT SPRINT"
- Sprint name with date range
- "Start Sprint" action button
- Issue list within sprint

### Backlog Section
- Section label: "BACKLOG"
- Item count display
- Expand/Collapse toggle
- Issue list for unscheduled items

### Issue Row
- Checkbox for selection
- Type icon (bug, task, story)
- Issue key
- Title
- Priority badge
- Assignee name or "Unassigned"
- Status badge

---

## Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/backlog/BacklogView.tsx` | Main container | ~300 |
| `src/components/backlog/SprintCard.tsx` | Sprint section | ~150 |
| `src/components/backlog/SprintHeader.tsx` | Sprint header | ~80 |
| `src/components/backlog/BacklogIssueRow.tsx` | Issue row | ~100 |
| `src/components/backlog/BacklogSection.tsx` | Generic section | ~60 |

---

## Problems

| # | Problem | Location | Severity |
|---|---------|----------|----------|
| 1 | Sprint header needs more visual hierarchy | SprintCard | MEDIUM |
| 2 | Issue rows lack hover states | BacklogIssueRow | MEDIUM |
| 3 | Drag between sections has no visual feedback | SprintCard | MEDIUM |
| 4 | No progress indicator for sprints | SprintHeader | MEDIUM |
| 5 | Priority badges inconsistent styling | BacklogIssueRow | LOW |
| 6 | Empty backlog state needs improvement | BacklogSection | LOW |
| 7 | Sprint date formatting could be cleaner | SprintHeader | LOW |
| 8 | Section collapse animation jerky | BacklogSection | LOW |

---

## Issue Row Detail

```
+--------------------------------------------------------------------------------+
| [ ]  [BUG]  DEMO-2   Fix login timeout on mobile   [HIGH]  Emily Chen  IN-PROG |
|  ^     ^      ^              ^                       ^         ^          ^     |
| chk   type   key          title                   priority  assignee   status  |
+--------------------------------------------------------------------------------+
```

---

## Summary

The backlog is functional but needs polish:
- Sprint cards need better visual hierarchy and progress tracking
- Issue rows need hover states and better interaction feedback
- Drag and drop between sections needs visual feedback
- Section collapse/expand could be smoother
- Empty states need better guidance
