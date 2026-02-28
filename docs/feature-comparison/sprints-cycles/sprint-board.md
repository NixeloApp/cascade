# Sprint/Cycle Board View

## Overview

The sprint board is where teams visualize and manage issues within an active sprint/cycle. This includes viewing issues by status, dragging between columns, and tracking progress.

---

## plane

### Views Available

plane offers multiple layout options for viewing cycle issues:

| View | Icon | Description |
|------|------|-------------|
| List | List icon | Traditional list with rows |
| Kanban | Columns icon | Status-based columns |
| Calendar | Calendar icon | Date-based calendar view |
| Spreadsheet | Table icon | Excel-like grid |
| Gantt | Timeline icon | Timeline/Gantt chart |

### Cycle List View

**Structure** (`CyclesList`):
```
├── ActiveCycleRoot (current active cycle)
├── Upcoming Cycles (collapsible disclosure)
│   └── CyclesListMap (cycle cards)
├── Completed Cycles (collapsible disclosure)
│   └── CyclesListMap (cycle cards)
└── CyclePeekOverview (sidebar panel)
```

**Cycle Card** (`CyclesListItem`):
- Circular progress indicator (30px, shows %)
- Cycle name (linked to detail page)
- Date range display
- Assignees (avatar group)
- Quick actions menu
- Favorite toggle

### Cycle Detail Page

**Layout**:
```
┌────────────────────────────────────────────────┬─────────────────────┐
│  Header: Layout toggles, filters, add item     │                     │
├────────────────────────────────────────────────┤  Analytics Sidebar  │
│                                                │  (collapsible)      │
│  Main Content Area                             │  - Progress chart   │
│  (List/Kanban/Calendar/Spreadsheet/Gantt)      │  - Stats tabs       │
│                                                │  - Details          │
│                                                │                     │
└────────────────────────────────────────────────┴─────────────────────┘
```

**Header Actions**:
- Layout view toggles (5 options)
- Display filters (sliders icon)
- Add Work Item button (disabled for completed cycles)
- Analytics sidebar toggle
- Quick actions menu

### Progress Indicators

- **Circular indicator**: Shows completion % in cycle list
- **Checkmark**: Displayed when 100% complete
- **Progress bar**: In analytics sidebar

### Filtering & Search

**Search**:
- Expandable search input in header
- Real-time filtering via `updateSearchQuery()`
- Escape to clear/close

**Filters**:
- Status filter via `CycleFiltersSelection`
- Active filter count badge
- Clear all filters option

### Issue Assignment

- Drag issues into cycle from backlog
- Issues show cycle badge
- Transfer issues modal for completed cycles

---

## Cascade

### Views Available

| View | Location | Description |
|------|----------|-------------|
| Board | `/projects/[key]/board` | Kanban with sprint selector |
| Sprints | `/projects/[key]/sprints` | Sprint management view |
| Backlog | `/projects/[key]/backlog` | Unassigned issues |

### Sprint Selector

**Location**: Board page header (`/board?sprint=sprintId`)

**UI**:
- Select dropdown in board header
- Options:
  - "Active Sprint" (auto-selects current active)
  - All sprints listed with status badges
- Changing selection filters board to that sprint

### Sprint Manager View

**Structure** (`SprintManager`):
```
├── "New Sprint" button (if canEdit)
├── Create form (when expanded)
└── Sprint Cards (mapped from sprints list)
    ├── Header: Name + Status badge + Issue count
    ├── Goal (if present)
    ├── Progress bar (active sprints only)
    ├── Date range
    └── Action buttons (Start/Complete)
```

**Sprint Card Details**:
- Name with Typography h5
- Status badge: future (gray), active (blue), completed (green)
- Issue count badge
- Progress bar with "X of Y completed (Z%)"
- Date range formatted
- Action buttons based on status

### Kanban Board

**Features** (`KanbanBoard`):
- Workflow state columns (sorted by order)
- Drag-and-drop between columns
- Swimlane grouping options:
  - None (default)
  - Assignee
  - Priority
  - Type
  - Epic
- Column collapse/expand
- WIP limit indicators
- Bulk selection mode

**Column Structure** (`KanbanColumn`):
```
├── Header
│   ├── State name + issue count
│   ├── WIP limit (if set)
│   └── Collapse/Add buttons
├── Issue Cards (draggable)
└── Load More (for done columns)
```

### Progress Indicators

- **Sprint card progress bar**: Visual bar with percentage
- **Text**: "X of Y completed"
- **Column count badges**: Issue count per status

### Filtering

**Client-side filters** (in board header):
- Type filter
- Priority filter
- Assignee filter
- Labels filter (OR condition)

**No sprint-specific search** — sprint selected via dropdown

### Issue Assignment to Sprints

**Methods**:
1. **Bulk Operations Bar**: Select issues → choose sprint from dropdown
2. **Create Issue Modal**: Pass `sprintId` prop
3. **Drag from backlog**: Move issues between views

**Bulk Move API**: `bulkMoveToSprint({ issueIds, sprintId })`
- `sprintId: null` removes from sprint (to backlog)

---

## Comparison Table

| Aspect | plane | Cascade | Best |
|--------|-------|---------|------|
| View options | 5 (List, Kanban, Calendar, Spreadsheet, Gantt) | 1 (Kanban only) | plane |
| Sprint selector | N/A (cycle is route) | Dropdown in header | Cascade |
| Analytics sidebar | Yes (collapsible) | No (separate page) | plane |
| Progress indicator | Circular % | Progress bar | tie |
| Swimlane grouping | Yes | Yes | tie |
| Column collapse | Yes | Yes | tie |
| WIP limits | Yes | Yes | tie |
| Drag-drop | Yes | Yes | tie |
| Bulk operations | Yes | Yes | tie |
| Search in view | Yes (real-time) | No | plane |
| Filter persistence | Via store | Client-side | plane |
| Issue transfer (completed) | Yes (modal) | No | plane |
| Peek/quick view | Yes (sidebar) | No | plane |

---

## Recommendations

1. **Priority 1**: Add List view option for sprint issues (table format)
2. **Priority 2**: Add real-time search within sprint board
3. **Priority 3**: Implement analytics sidebar in board view (not separate page)
4. **Priority 4**: Add Calendar view for sprint issues
5. **Priority 5**: Add issue peek/quick view sidebar (click to expand without navigation)
6. **Priority 6**: Add "Transfer remaining issues" modal when completing sprints
7. **Priority 7**: Consider Gantt/timeline view for sprint planning

---

## Screenshots/References

### plane
- Cycle list: `~/Desktop/plane/apps/web/core/components/cycles/list/root.tsx`
- Cycle detail: `~/Desktop/plane/apps/web/app/.../cycles/(detail)/[cycleId]/page.tsx`
- Analytics sidebar: `~/Desktop/plane/apps/web/core/components/cycles/analytics-sidebar/`
- Quick actions: `~/Desktop/plane/apps/web/core/components/cycles/quick-actions.tsx`

### Cascade
- Board route: `~/Desktop/cascade/src/routes/_auth/_app/$orgSlug/projects/$key/board.tsx`
- Sprint manager: `~/Desktop/cascade/src/components/SprintManager.tsx`
- Kanban board: `~/Desktop/cascade/src/components/KanbanBoard.tsx`
- Kanban column: `~/Desktop/cascade/src/components/Kanban/KanbanColumn.tsx`
- Bulk ops: `~/Desktop/cascade/src/components/BulkOperationsBar.tsx`
