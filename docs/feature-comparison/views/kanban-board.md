# Kanban Board View - Deep UX Comparison

## Overview
The Kanban board is the primary view for visualizing work items organized by status columns. This analysis compares Plane vs Cascade across layout, drag-drop, grouping, and UX efficiency.

---

## Entry Points Comparison

### How Users Access Kanban

| Entry Point | Plane | Cascade | Winner |
|-------------|-------|---------|--------|
| **Tab selection** | "Board" tab in view tabs | Tab in project view | Tie |
| **URL direct access** | `/project/board` | `/:org/projects/:key/board` | Tie |
| **Keyboard shortcut** | N/A | N/A | Tie |
| **Default view** | Configurable | Board is default | Cascade |

---

## Board Layout Comparison

### Plane Kanban Board
```
┌─────────────────────────────────────────────────────────────────────┐
│ Project Header                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ [Board] [List] [Calendar] [Spreadsheet] [Gantt]                     │
├─────────────────────────────────────────────────────────────────────┤
│ [Filters ▼] [Display ▼] [Group by: Status ▼] [Sub-group: None ▼]   │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─ Backlog (5) ──┐ ┌─ To Do (3) ────┐ ┌─ In Progress (4) ─┐        │
│ │ [+] Add issue  │ │ [+] Add issue  │ │ [+] Add issue      │        │
│ ├────────────────┤ ├────────────────┤ ├────────────────────┤        │
│ │ ┌────────────┐ │ │ ┌────────────┐ │ │ ┌────────────────┐ │        │
│ │ │ PROJ-123   │ │ │ │ PROJ-456   │ │ │ │ PROJ-789       │ │        │
│ │ │ Fix bug    │ │ │ │ Add feat   │ │ │ │ Update API     │ │        │
│ │ │ ● High     │ │ │ │ ● Medium   │ │ │ │ ● Low          │ │        │
│ │ │ [Labels]   │ │ │ │ [Labels]   │ │ │ │ [Labels]       │ │        │
│ │ │ @user [...]│ │ │ │ @user [...]│ │ │ │ @user [...]    │ │        │
│ │ └────────────┘ │ │ └────────────┘ │ │ └────────────────┘ │        │
│ │ ┌────────────┐ │ │ ┌────────────┐ │ │                    │        │
│ │ │ PROJ-124   │ │ │ │ PROJ-457   │ │ │                    │        │
│ │ │ Refactor   │ │ │ │ Review     │ │ │                    │        │
│ │ └────────────┘ │ │ └────────────┘ │ │                    │        │
│ │ ...            │ │                │ │                    │        │
│ └────────────────┘ └────────────────┘ └────────────────────┘        │
│                                                                      │
│ With sub-grouping (swimlanes):                                       │
│ ┌─ Priority: High ─────────────────────────────────────────────────┐│
│ │ [Backlog] [To Do] [In Progress] [Done]                           ││
│ └──────────────────────────────────────────────────────────────────┘│
│ ┌─ Priority: Medium ───────────────────────────────────────────────┐│
│ │ [Backlog] [To Do] [In Progress] [Done]                           ││
│ └──────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### Cascade Kanban Board
```
┌─────────────────────────────────────────────────────────────────────┐
│ Project Header                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ BoardToolbar:                                                        │
│ [⟲ Undo] [⟳ Redo] │ Swimlane: [Priority ▼] │ [☑ Selection Mode]    │
│                    │ Sprint: [Sprint 1 ▼]  │ (when Scrum)           │
├─────────────────────────────────────────────────────────────────────┤
│ FilterBar:                                                           │
│ [Type ▼] [Priority ▼] [Assignee ▼] [Labels ▼] [Clear] [Save]       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Standard Mode (no swimlanes):                                        │
│ ┌─ To Do ────────┐ ┌─ In Progress ──┐ ┌─ Done ───────────┐          │
│ │ 5 issues       │ │ 3/5 (WIP: 5)   │ │ 12 issues (14d)  │          │
│ │ [+]            │ │ [+]            │ │ Hidden: 45       │          │
│ ├────────────────┤ ├────────────────┤ ├──────────────────┤          │
│ │ ┌────────────┐ │ │ ┌────────────┐ │ │ ┌──────────────┐ │          │
│ │ │ ☐ PROJ-123 │ │ │ │ ☐ PROJ-456 │ │ │ │ ☐ PROJ-789   │ │          │
│ │ │ 🐛 Fix bug │ │ │ │ 🔧 Update  │ │ │ │ ✅ Completed │ │          │
│ │ │ ● High     │ │ │ │ ● Medium   │ │ │ │              │ │          │
│ │ │ [bug] @usr │ │ │ │ [feat] @usr│ │ │ │              │ │          │
│ │ └────────────┘ │ │ └────────────┘ │ │ └──────────────┘ │          │
│ │ ...            │ │                │ │ [Load More]      │          │
│ └────────────────┘ └────────────────┘ └──────────────────┘          │
│                                                                      │
│ With Swimlanes (Priority mode):                                      │
│ ┌─ 🔥 Highest ──────────────────────────────────────────────────┐   │
│ │ [To Do] [In Progress] [Done]                               [▼]│   │
│ └───────────────────────────────────────────────────────────────┘   │
│ ┌─ ⬆️ High ─────────────────────────────────────────────────────┐   │
│ │ [To Do] [In Progress] [Done]                               [▼]│   │
│ └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Grouping & Sub-grouping

### Primary Grouping Options

| Group By | Plane | Cascade |
|----------|-------|---------|
| **Status/State** | Yes | Yes (always) |
| **Priority** | Yes | Via swimlanes |
| **Assignee** | Yes | Via swimlanes |
| **Labels** | Yes | Via swimlanes |
| **Type** | Yes | Via swimlanes |
| **Cycle/Sprint** | Yes | Via sprint selector |
| **Created by** | Yes | N/A |
| **Module** | Yes | N/A |
| **Due date** | Yes | N/A |

### Sub-grouping (Swimlanes)

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Full dual grouping** | Any + any | Status + selected |
| **Collapse rows** | Yes | Yes |
| **Independent collapse** | Yes | Yes |
| **Swimlane options** | All group-by options | priority, assignee, type, label |

---

## Click Analysis

### Minimum Clicks for Common Actions

| Action | Plane | Cascade | Notes |
|--------|-------|---------|-------|
| **Move issue (drag)** | 1 drag | 1 drag | Tie |
| **Open issue detail** | 1 click | 1 click | Tie |
| **Create issue in column** | 2 clicks (+) | 2 clicks (+) | Tie |
| **Change grouping** | 2 clicks | N/A (fixed to status) | Plane |
| **Add swimlane** | 2 clicks | 2 clicks | Tie |
| **Toggle property display** | 3 clicks (Display) | N/A | Plane only |
| **Inline edit property** | 1 click on card | N/A | Plane only |
| **Undo move** | N/A | 1 click (Ctrl+Z) | **Cascade** |
| **Select multiple** | Click checkboxes | Click checkboxes | Tie |
| **Collapse column** | 1 click | 1 click | Tie |

---

## Drag & Drop Comparison

### Library & Features

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Library** | @atlaskit/pragmatic-drag-and-drop | @atlaskit/pragmatic-drag-and-drop |
| **Auto-scroll** | Yes | Yes |
| **Delete zone** | Top center (during drag) | N/A |
| **Cross-swimlane** | Yes | Yes |
| **Reorder in column** | Yes | Yes |
| **Visual feedback** | Drop indicators | Drop indicators |
| **Drag handle** | Full card | Full card |

### Drag Operations

| Operation | Plane | Cascade |
|-----------|-------|---------|
| **Change status** | Drag to column | Drag to column |
| **Change swimlane value** | Drag to row | Drag to row |
| **Reorder** | Drag within column | Drag within column |
| **Delete/Archive** | Drag to delete zone | N/A |
| **Undo** | N/A | Ctrl+Z |

---

## Card Display Properties

### Plane (Toggleable)
```
┌─────────────────────────────────────────┐
│ PROJ-123               ● High [@user]   │
│ Fix authentication bug                   │
│ [bug] [security]                         │
│ 📅 Jan 15    📎 2    🔗 1    📊 3pts    │
└─────────────────────────────────────────┘

Toggleable: key, title, priority, assignee, labels,
dates, attachments, links, estimate, created, updated,
modules, cycle, sub-issue count
```

### Cascade (Fixed)
```
┌─────────────────────────────────────────┐
│ ☐ 🐛 PROJ-123                ● High     │
│ Fix authentication bug                   │
│ [bug] [security]              [@user]   │
└─────────────────────────────────────────┘

Fixed: checkbox, type icon, key, title, priority,
labels, assignee avatar
```

---

## Column Features

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Issue count** | In header | In header (total/loaded/hidden) |
| **WIP limit** | Visual indicator | Color-coded indicator |
| **Collapse** | To vertical bar | To vertical bar |
| **Quick add (+)** | Top of column | Top of column |
| **Load more** | Bottom pagination | "Load More" for done |
| **Smart loading** | Load all | Done: 14-day window |

---

## Toolbar Features

### Plane Toolbar
```
[Filters (3)] [Display ▼] [Group by ▼] [Sub-group ▼] [+ Add Issue]
```

### Cascade BoardToolbar
```
[⟲ Undo] [⟳ Redo] │ Swimlane: [Select ▼] │ [☑ Selection Mode] │ Sprint: [Select ▼]
```

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Undo/Redo** | N/A | Yes (Ctrl+Z, Ctrl+Shift+Z) |
| **History stack** | N/A | Yes (via useBoardHistory) |
| **Swimlane selector** | Sub-group dropdown | Direct swimlane dropdown |
| **Selection mode** | Always available | Toggle button |
| **Sprint selector** | Via cycle dropdown | Direct (Scrum projects) |
| **View options** | Display dropdown | N/A |

---

## Keyboard Support

| Shortcut | Plane | Cascade |
|----------|-------|---------|
| **Undo** | N/A | Ctrl+Z |
| **Redo** | N/A | Ctrl+Shift+Z |
| **Navigate cards** | Limited | Arrow keys |
| **Open card** | N/A | Enter |
| **Select card** | Click checkbox | Space |
| **Create issue** | C (global) | C (global) |

---

## Performance Optimizations

### Plane
- Pagination with `fetchNextIssues()`
- Virtualization for large boards
- MobX reactive updates

### Cascade
- **Smart done loading**: Only 14-day window for done column
- **Separate counts**: Total vs visible vs hidden
- **Memoized cards**: KanbanIssueItem wrapped in memo
- **Cursor-based pagination**: For load more

---

## Summary Scorecard

| Category | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| Grouping flexibility | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Plane any field |
| Sub-grouping | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Both have swimlanes |
| Drag & drop | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Same library |
| Inline editing | ⭐⭐⭐⭐⭐ | ⭐ | Plane only |
| Display properties | ⭐⭐⭐⭐⭐ | ⭐⭐ | Plane toggleable |
| Undo/redo | ⭐ | ⭐⭐⭐⭐⭐ | **Cascade only** |
| Smart loading | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade 14-day done |
| WIP limits | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade color-coded |
| Keyboard support | ⭐⭐ | ⭐⭐⭐⭐ | Cascade more |
| Column collapse | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Both |
| Quick add | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Both |
| Saved filters | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade public/private |

---

## Priority Recommendations for Cascade

### P0 - Critical
1. **Inline property editing** - Click property on card to edit directly
2. **Display properties toggle** - Show/hide assignee, dates, labels on cards

### P1 - High
3. **More grouping options** - Group by assignee, priority, type (not just swimlanes)
4. **Delete zone** - Drag to archive during drag operation
5. **Drag preview** - Show issue preview while dragging

### P2 - Medium
6. **Full dual grouping** - Allow any field for both group and sub-group
7. **Virtual scrolling** - For columns with 100+ issues
8. **Card templates** - Different card layouts for different issue types

### P3 - Nice to Have
9. **Bulk drag** - Drag multiple selected issues at once
10. **Column reordering** - Drag columns to reorder workflow

---

## Code References

### Plane
- Base: `apps/web/core/components/issues/issue-layouts/kanban/base-kanban-root.tsx`
- Columns: `apps/web/core/components/issues/issue-layouts/kanban/kanban-group.tsx`
- Cards: `apps/web/core/components/issues/issue-layouts/kanban/block.tsx`
- Swimlanes: `apps/web/core/components/issues/issue-layouts/kanban/swimlanes.tsx`
- DnD hooks: `apps/web/core/hooks/use-group-dragndrop.ts`

### Cascade
- Board: `src/components/KanbanBoard.tsx`
- Column: `src/components/Kanban/KanbanColumn.tsx`
- Swimlane: `src/components/Kanban/SwimlanRow.tsx`
- Toolbar: `src/components/Kanban/BoardToolbar.tsx`
- DnD Utilities: `src/lib/kanban-dnd.ts`
- History hook: `src/hooks/useBoardHistory.ts`
- Smart data: `src/hooks/useSmartBoardData.ts`
