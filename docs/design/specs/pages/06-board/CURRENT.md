# Board Page - Current State

> **Route**: `/:slug/projects/:key/board`
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

Kanban-style board with columns for workflow states:

```
+-------------------------------------------------------------------------------------------+
| [=] Nixelo E2E                      [Commands Cmd+K] [?] [> Timer] [Search Cmd+K] [N] [AV]|
+-------------------------------------------------------------------------------------------+
| Board  Backlog  Roadmap  Calendar  Activity  Analytics  Billing  Timesheet  Settings      |
| -----                                                                                     |
+-------------------------------------------------------------------------------------------+
| Demo Project  [DEMO]  [kanban]                                    [Import/Export]         |
+-------------------------------------------------------------------------------------------+
| [Type v]  [Priority v]  [Assignee v]  [Labels v]  |  [x Clear]  [Save Filter]            |
+-------------------------------------------------------------------------------------------+
|                                                                                           |
|  Sprint Board                                                   [<] [>]  Select Multiple  |
|                                                                                           |
|  +---------------------+  +---------------------+  +---------------------+  +-----------+ |
|  | ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ |  | ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ |  | ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ |  | ▬▬▬▬▬▬▬▬▬ | |
|  | (gray bar)          |  | (blue bar)          |  | (purple bar)        |  | (green)   | |
|  +---------------------+  +---------------------+  +---------------------+  +-----------+ |
|  | To Do          0 [+]|  | In Progress    1 [+]|  | In Review      1 [+]|  | Done   1  | |
|  +---------------------+  +---------------------+  +---------------------+  +-----------+ |
|  |                     |  | +------------------+|  | +------------------+|  | +---------+| |
|  |   (empty)           |  | |[BUG] DEMO-2   !!||  | |[TSK] DEMO-3    - ||  | |[OK] DEM|| |
|  |                     |  | |Fix login timeout ||  | |Design dashboard  ||  | |Set up C|| |
|  |                     |  | |on mobile         ||  | |layout            ||  | |pipeline|| |
|  |                     |  | |               [A]||  | |               [A]||  | |      [A]|| |
|  |                     |  | +------------------+|  | +------------------+|  | +---------+| |
|  +---------------------+  +---------------------+  +---------------------+  +-----------+ |
+-------------------------------------------------------------------------------------------+
```

---

## Current Elements

### Global Header
- **Logo**: "Nixelo E2E" with sidebar toggle icon
- **Top Bar**: Commands (Cmd+K), Help icon, Start Timer button, Search, Notifications, Avatar

### Project Tab Navigation
- Horizontal tabs: Board (active), Backlog, Roadmap, Calendar, Activity, Analytics, Billing, Timesheet, Settings
- Active tab has subtle underline indicator

### Project Header
- Project title with key badge and board type badge
- Import/Export button on right

### Filter Bar
- Four dropdown filters: Type, Priority, Assignee, Labels
- Clear filters button with active count
- Save filter configuration

### Sprint Board Section
- "Sprint Board" heading
- Undo/Redo navigation arrows
- "Select Multiple" button for bulk operations

### Kanban Columns (4 columns)
- **To Do** (gray status bar) - 0 issues
- **In Progress** (blue status bar) - 1 issue
- **In Review** (purple status bar) - 1 issue
- **Done** (green status bar) - 1 issue
- Each column has "+" button for adding issues

### Issue Cards
- White cards with subtle shadow
- Type icon (bug/task) with colored background
- Issue key (e.g., "DEMO-2")
- Priority indicator (!! for high, - for medium)
- Title text
- Assignee avatar (small circular)

---

## Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/KanbanBoard.tsx` | Main board container | ~250 |
| `src/components/Kanban/KanbanColumn.tsx` | Column wrapper | ~100 |
| `src/components/IssueCard.tsx` | Card component | ~150 |
| `src/components/FilterBar.tsx` | Filter controls | ~200 |
| `src/components/Kanban/BoardToolbar.tsx` | Sprint + actions | ~80 |

---

## Problems

| # | Problem | Location | Severity |
|---|---------|----------|----------|
| 1 | Column background too prominent | KanbanColumn | MEDIUM |
| 2 | Cards lack visual hierarchy | IssueCard | MEDIUM |
| 3 | Status bar colors not semantic | Column headers | LOW |
| 4 | Filter bar feels disconnected | FilterBar | MEDIUM |
| 5 | No visible drag affordance | IssueCard | LOW |
| 6 | Column headers wasted space | KanbanColumn | LOW |
| 7 | No empty state guidance | Empty columns | LOW |
| 8 | Drag feedback could be better | Drag preview | LOW |

---

## Issue Card Detail

```
+----------------------------------------+
|  [BUG]  DEMO-2                     [!!]|
|                                        |
|  Fix login timeout on mobile           |
|                                        |
|  [Label 1] [Label 2]             [AV]  |
+----------------------------------------+
   ^         ^           ^          ^
   Type     Key       Title     Assignee
```

---

## Summary

The board is functional but needs polish:
- Column backgrounds are too prominent (should blend more)
- Cards lack hover states and visual hierarchy
- No drag affordances visible
- Empty columns need better guidance
- Filter bar styling could be more integrated
