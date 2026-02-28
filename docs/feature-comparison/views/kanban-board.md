# Kanban Board View

## Overview

The Kanban board is the primary view for visualizing work items organized by status columns. Teams drag issues between columns to update status and track progress at a glance.

---

## plane

### Component Structure

```
BaseKanbanRoot
├── IssueLayoutHOC (loading/empty wrapper)
├── KanBan (single grouping mode)
│   └── KanbanGroup[] (one per group value)
│       ├── HeaderGroupByCard (column header)
│       ├── KanbanIssueBlocksList (issue cards)
│       └── QuickAddIssueRoot
└── KanBanSwimLanes (dual grouping mode)
    └── Swimlane rows with nested columns
```

**File Locations**:
- Base: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/kanban/base-kanban-root.tsx`
- Columns: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/kanban/kanban-group.tsx`
- Cards: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/kanban/block.tsx`
- Swimlanes: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/kanban/swimlanes.tsx`

### Grouping System

**Primary Grouping (`group_by`)**:
- state (status)
- priority
- labels
- created_by
- state_detail.group
- project
- assignees
- cycle
- module
- target_date

**Secondary Grouping (`sub_group_by`)**:
- Same options as primary
- Creates nested swimlane rows
- Independent collapse state

### Drag & Drop

**Library**: `@atlaskit/pragmatic-drag-and-drop`

**Features**:
- Drag issues between columns
- Auto-scroll during drag
- Delete zone (top center) during drag
- Drag within/across sub-groups
- Validation per drop location

### Display Properties

Toggleable properties on cards:
- Assignee, Start date, Due date, Labels
- Key, Priority, State, Sub-issue count
- Link, Attachment count, Estimate
- Created on, Updated on, Modules, Cycle

### Inline Editing

- Click property to edit directly
- Permission-based via `canEditProperties()`
- Updates via `updateIssue()` action

### Quick Add

- Per-column "+" button
- Pre-populated with group context
- Optional "create more" mode

### Data Fetching

```typescript
fetchIssues("init-loader", { canGroup: true, perPageCount: 30 })
fetchNextIssues(groupId, subgroupId) // pagination
```

---

## Cascade

### Component Structure

```
KanbanBoard
├── BoardToolbar (controls, swimlane selector)
├── Standard Mode (no swimlanes)
│   └── KanbanColumn[] (per workflow state)
│       ├── Column header (status, count, WIP)
│       ├── KanbanIssueItem[] (memoized)
│       │   └── IssueCard (draggable)
│       └── Create/Load More
└── Swimlane Mode
    └── SwimlanRow[] (per swimlane config)
        ├── Collapsible header
        └── KanbanColumn[] (within swimlane)
```

**File Locations**:
- Board: `~/Desktop/cascade/src/components/KanbanBoard.tsx`
- Column: `~/Desktop/cascade/src/components/Kanban/KanbanColumn.tsx`
- Swimlane: `~/Desktop/cascade/src/components/Kanban/SwimlanRow.tsx`
- Toolbar: `~/Desktop/cascade/src/components/Kanban/BoardToolbar.tsx`
- DnD Utilities: `~/Desktop/cascade/src/lib/kanban-dnd.ts`

### Grouping System

**Primary Grouping**: By workflow state (always)

**Swimlane Options**:
- `"none"` — standard columns only
- `"priority"` — Highest to Lowest
- `"assignee"` — By user + Unassigned
- `"type"` — Epic, Story, Task, Bug, Subtask
- `"label"` — By first label + Unlabeled

### Drag & Drop

**Library**: `@atlaskit/pragmatic-drag-and-drop`

**Features**:
- Drag issues between columns
- Auto-scroll configured
- Type-safe payload system (`IssueCardData`, `ColumnData`)
- Reorder within columns
- Works across swimlanes

### Display on Cards

Fixed properties shown:
- Issue key and title
- Priority indicator (colored dot)
- Issue type icon
- Assignee avatar
- Labels as badges
- Selection checkbox (bulk mode)

### Toolbar Features

- Undo/Redo (Ctrl+Z, Ctrl+Shift+Z)
- Swimlane selector dropdown
- Selection mode toggle
- Sprint selector (Scrum projects)
- History stack via `useBoardHistory`

### Filtering

**FilterBar component**:
- Issue Type multi-select
- Priority multi-select
- Assignee multi-select
- Labels multi-select
- Saved filters (public/private)
- Active filter count badges

### Smart Data Loading

**Strategy**: Different loading for active vs done columns

```typescript
// Hook: useSmartBoardData
- Todo/In Progress: Load all up to BOUNDED_LIST_LIMIT
- Done Column: Load recent 14 days only
- Pagination: "Load More" with cursor-based loading
- Counts: Separate total/visible/hidden per status
```

**Queries**:
- `api.issues.listByProjectSmart`
- `api.issues.getIssueCounts`
- `api.issues.loadMoreDoneIssues`

### Column Features

- WIP limit indicators (color-coded)
- Collapse to vertical bar
- Issue counts (total/loaded/hidden)
- "+" create button
- "Load More" for done column

---

## Comparison Table

| Aspect | plane | Cascade | Best |
|--------|-------|---------|------|
| Primary grouping | Multiple options | By status only | plane |
| Sub-grouping | Full dual grouping | Swimlanes (5 options) | plane |
| DnD library | Pragmatic DnD | Pragmatic DnD | tie |
| Auto-scroll | Yes | Yes | tie |
| Inline editing | Yes (all properties) | No | plane |
| Display properties | Toggleable | Fixed | plane |
| Quick add | Per column | Per column | tie |
| Undo/redo | No | Yes | Cascade |
| Saved filters | Via views | Yes (public/private) | tie |
| WIP limits | Yes | Yes | tie |
| Column collapse | Yes | Yes | tie |
| Smart done loading | No | Yes (14-day window) | Cascade |
| Done pagination | Yes | Yes | tie |
| Selection mode | Yes | Yes | tie |
| Bulk operations | Yes | Yes | tie |
| History stack | No | Yes | Cascade |
| Keyboard shortcuts | Limited | Ctrl+Z, Arrows, Enter | Cascade |

---

## Recommendations

1. **Priority 1**: Add inline editing on issue cards (click property to edit)
2. **Priority 2**: Add display properties toggle (show/hide assignee, labels, etc.)
3. **Priority 3**: Add more primary grouping options (by assignee, by priority, by label)
4. **Priority 4**: Add sub-group support (dual grouping like plane)
5. **Priority 5**: Add delete zone during drag (for quick archive)

---

## Cascade Strengths

- **Smart done loading**: Only loads recent done issues, reducing bandwidth
- **Undo/redo history**: Can revert drag operations with Ctrl+Z
- **Keyboard navigation**: Arrow keys, Enter, selection shortcuts
- **Saved filters**: Named, shareable filter presets

---

## Screenshots/References

### plane
- Kanban root: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/kanban/`
- DnD hooks: `~/Desktop/plane/apps/web/core/hooks/use-group-dragndrop.ts`

### Cascade
- Board: `~/Desktop/cascade/src/components/KanbanBoard.tsx`
- Columns: `~/Desktop/cascade/src/components/Kanban/KanbanColumn.tsx`
- History hook: `~/Desktop/cascade/src/hooks/useBoardHistory.ts`
- Smart data: `~/Desktop/cascade/src/hooks/useSmartBoardData.ts`
