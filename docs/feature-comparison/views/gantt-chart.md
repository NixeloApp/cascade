# Gantt Chart / Timeline View

## Overview

The Gantt chart provides a timeline view of issues with horizontal bars representing duration (start date to due date). This helps teams visualize schedules, dependencies, and overlapping work.

---

## plane

### Component Structure

```
BaseGanttRoot
├── IssueLayoutHOC
└── GanttChartRoot
    ├── IssueGanttSidebar (left panel)
    │   └── Issue titles, keys, metadata
    ├── GanttChartView (right panel)
    │   ├── Timeline header (dates)
    │   └── IssueGanttBlock[] (bars)
    │       ├── Left resize handle
    │       ├── Bar content
    │       └── Right resize handle
    └── QuickAddIssue (bottom sticky)
```

**File Locations**:
- Base: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx`
- Blocks: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/gantt/blocks.tsx`
- Chart system: `~/Desktop/plane/apps/web/core/components/gantt-chart/root.tsx`
- Sidebar: `~/Desktop/plane/apps/web/core/components/gantt-chart/sidebar/`

### Features

**Block Operations**:
| Action | Effect |
|--------|--------|
| Left resize | Adjust start date |
| Right resize | Adjust due date |
| Drag block | Move both dates proportionally |
| Reorder (drag vertically) | Change sort order |

**Display Options**:
- `enableBlockLeftResize` — start date editing
- `enableBlockRightResize` — due date editing
- `enableBlockMove` — drag to move
- `enableReorder` — vertical reordering (when sorted by `sort_order`)
- `enableAddBlock` — quick add
- `enableSelection` — bulk operations
- `enableDependency` — show dependency lines

**Data Fetching**:
- No grouping (flat list)
- 100 items per page
- `loadMoreBlocks()` for pagination
- `updateBlockDates()` for batch updates

**Timeline Controls**:
- Zoom in/out (day, week, month granularity)
- Horizontal scroll with pan
- Today indicator line

**Dependency Lines**:
- Visual lines connecting related issues
- Shows blocking/blocked relationships

---

## Cascade

### Roadmap View (Timeline)

**File Locations**:
- Component: `~/Desktop/cascade/src/components/RoadmapView.tsx`
- Unified: `~/Desktop/cascade/src/components/Calendar/UnifiedCalendarView.tsx`

**Layout Structure**:
```
RoadmapView
├── Header
│   ├── Title + subtitle
│   └── Controls
│       ├── Epic filter dropdown
│       └── View mode toggle (Months/Weeks)
├── Card (timeline container)
│   ├── Fixed header row
│   │   ├── "Issue" label (left fixed)
│   │   └── Month/week column headers
│   └── Virtualized body (react-window)
│       └── Row[] (per issue)
│           ├── Left panel (w-64)
│           │   ├── Type icon
│           │   ├── Issue key link
│           │   └── Title (truncated)
│           └── Timeline area
│               ├── Position bar
│               │   ├── Priority color background
│               │   └── Assignee first name
│               └── Today indicator (red line)
```

### Features

**Display**:
- 6-month timeline span from current month
- Horizontal bars positioned by due date
- Priority color-coded bars
- Assignee name displayed in bar
- Today indicator (vertical red line)

**Controls**:
- Epic filter dropdown (filter by parent epic)
- View mode: "Months" vs "Weeks"
- Keyboard navigation (arrow keys, Enter)

**Virtual Scrolling**:
- `react-window` List component
- Handles large issue counts efficiently
- Fixed height: 600px

**Interactions**:
- Click issue to open detail modal
- Arrow keys to navigate
- Enter to open selected issue
- No drag-and-drop (read-only positioning)

**Data Fetching**:
```typescript
api.issues.listRoadmapIssues({
  projectId,
  sprintId,        // optional
  excludeEpics,    // whether to hide epic issues
  hasDueDate: true,
  epicId           // optional filter
})
```

### Position Calculation

```typescript
// Bar position = % across 6-month timeline
position = (daysSinceStart / totalDays) * 100
totalDays = 180 // 6 months
daysSinceStart = (issueDate - startOfMonth) / msPerDay
```

---

## Comparison Table

| Aspect | plane | Cascade | Best |
|--------|-------|---------|------|
| Left resize (start date) | Yes | No | plane |
| Right resize (due date) | Yes | No | plane |
| Drag to move | Yes | No | plane |
| Vertical reorder | Yes (if sort_order) | No | plane |
| Dependency lines | Yes | No | plane |
| Virtual scrolling | No | Yes (react-window) | Cascade |
| Timeline span | Configurable | 6 months fixed | plane |
| Zoom control | Yes | Months/Weeks toggle | plane |
| Today indicator | Yes | Yes | tie |
| Epic filter | Via filters | Yes (dropdown) | Cascade |
| Bulk selection | Yes | No | plane |
| Quick add | Yes (sticky bar) | No | plane |
| Assignee in bar | Via properties | Yes | Cascade |
| Priority colors | Via properties | Yes (bar color) | Cascade |
| Keyboard navigation | Limited | Arrow keys, Enter | Cascade |
| Left sidebar | Issue info | Issue key + title | plane |

---

## Recommendations

1. **Priority 1**: Add block resizing
   - Left handle to adjust start date
   - Right handle to adjust due date
   - Cursor changes on hover

2. **Priority 2**: Add drag-to-move blocks
   - Horizontal drag moves both dates
   - Visual feedback during drag

3. **Priority 3**: Add dependency lines
   - Query issue relations (blocking/blocked_by)
   - Draw SVG lines between related blocks

4. **Priority 4**: Add configurable timeline span
   - Dropdown: 1 month, 3 months, 6 months, 1 year
   - Auto-adjust based on issue date range

5. **Priority 5**: Add zoom controls
   - Day/Week/Month granularity
   - Pinch-to-zoom support

6. **Priority 6**: Add quick add from timeline
   - Click timeline area to create issue
   - Pre-populate dates based on click position

---

## Implementation: Block Resizing

```tsx
function GanttBlock({ issue, onUpdate }) {
  const blockRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeEdge, setResizeEdge] = useState<'left' | 'right' | null>(null);

  const handleMouseDown = (edge: 'left' | 'right') => (e: MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeEdge(edge);

    const startX = e.clientX;
    const startWidth = blockRef.current.offsetWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const daysDelta = Math.round(deltaX / PIXELS_PER_DAY);

      if (edge === 'left') {
        const newStartDate = addDays(issue.startDate, daysDelta);
        onUpdate({ startDate: newStartDate });
      } else {
        const newDueDate = addDays(issue.dueDate, daysDelta);
        onUpdate({ dueDate: newDueDate });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeEdge(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div ref={blockRef} className="gantt-block">
      <div
        className="resize-handle left"
        onMouseDown={handleMouseDown('left')}
      />
      <div className="block-content">
        {issue.title}
      </div>
      <div
        className="resize-handle right"
        onMouseDown={handleMouseDown('right')}
      />
    </div>
  );
}
```

---

## Implementation: Dependency Lines

```tsx
function DependencyLines({ issues, dependencies }) {
  return (
    <svg className="absolute inset-0 pointer-events-none">
      {dependencies.map(dep => {
        const fromBlock = getBlockPosition(dep.fromIssueId);
        const toBlock = getBlockPosition(dep.toIssueId);

        if (!fromBlock || !toBlock) return null;

        // Draw curved line from end of "from" to start of "to"
        return (
          <path
            key={`${dep.fromIssueId}-${dep.toIssueId}`}
            d={`M ${fromBlock.right} ${fromBlock.centerY}
                C ${fromBlock.right + 20} ${fromBlock.centerY},
                  ${toBlock.left - 20} ${toBlock.centerY},
                  ${toBlock.left} ${toBlock.centerY}`}
            stroke="currentColor"
            strokeWidth={2}
            fill="none"
            markerEnd="url(#arrowhead)"
          />
        );
      })}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
        </marker>
      </defs>
    </svg>
  );
}
```

---

## Cascade Strengths

- **Virtual scrolling**: Handles hundreds of issues smoothly
- **Epic filter**: Quick filter by parent epic
- **Keyboard navigation**: Full arrow key support
- **Simple UX**: Easy to understand at a glance

---

## Screenshots/References

### plane
- Gantt layout: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/gantt/`
- Chart components: `~/Desktop/plane/apps/web/core/components/gantt-chart/`
- Block rendering: `~/Desktop/plane/apps/web/core/components/gantt-chart/chart/`

### Cascade
- Roadmap view: `~/Desktop/cascade/src/components/RoadmapView.tsx`
- Unified view: `~/Desktop/cascade/src/components/Calendar/UnifiedCalendarView.tsx`
- Query: `~/Desktop/cascade/convex/issues/queries.ts` (listRoadmapIssues)
