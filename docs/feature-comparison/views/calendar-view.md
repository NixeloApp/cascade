# Calendar View

## Overview

The calendar view displays issues based on their due dates, allowing teams to see work scheduled across days, weeks, or months. This helps with capacity planning and deadline visibility.

---

## plane

### Component Structure

```
BaseCalendarRoot
├── IssueLayoutHOC
└── CalendarChart
    ├── CalendarHeader (controls)
    │   ├── Layout toggle (month/week)
    │   └── Show weekends toggle
    ├── CalendarWeekDays (day headers)
    └── CalendarDayTile[] (day cells)
        ├── Day number
        ├── CalendarIssueBlocks (issue list)
        │   └── Issue cards (draggable)
        └── Quick add button
```

**File Locations**:
- Base: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/calendar/base-calendar-root.tsx`
- Calendar: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/calendar/calendar.tsx`
- Day tile: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/calendar/day-tile.tsx`
- Issue blocks: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/calendar/issue-blocks.tsx`

### Layout Modes

| Mode | Issues per Day | Description |
|------|----------------|-------------|
| Month | 4 | Full month grid (35/42 days) |
| Week | 30 | Single week row |

### Features

**Drag & Drop**:
- Drag issues between day tiles
- Updates `target_date` on drop
- Visual drag indicator
- Auto-scroll during drag

**Quick Add**:
- Create issue for specific date
- Pre-populated with selected date
- Modal for full create form

**Display Options**:
- Show/hide weekends toggle
- Month/week layout toggle
- Issues grouped by `target_date`

**Data Fetching**:
- Queries with `before` and `after` date params
- Grouped by target_date
- Load more per date: `loadMoreIssues(dateString)`

### Interactions

- Click issue to open peek preview
- Drag to reschedule
- Click day to quick-add
- Arrow navigation between days

---

## Cascade

### Issues Calendar View

**File Locations**:
- Component: `~/Desktop/cascade/src/components/IssuesCalendarView.tsx`
- Route: `~/Desktop/cascade/src/routes/_auth/_app/$orgSlug/projects/$key/calendar.tsx`
- Wrapper: `~/Desktop/cascade/src/components/Calendar/ProjectCalendar.tsx`

**Layout Structure**:
```
IssuesCalendarView
├── Header
│   ├── Title ("Issues Calendar")
│   ├── Previous month button
│   ├── Month/Year display
│   ├── Next month button
│   └── "Today" button
├── Card (calendar container)
│   ├── Weekday headers (Sun-Sat)
│   └── Grid (7 columns)
│       ├── Day cells
│       │   ├── Day number (highlighted if today)
│       │   ├── Issue count badge
│       │   └── Issue list (max 3)
│       │       └── Issue button
│       │           ├── Priority dot
│       │           ├── Type icon
│       │           └── Title (truncated)
│       └── Overflow cells (prev/next month)
└── Legend (priority colors)
```

### Features

**Month Navigation**:
- Previous/Next month buttons
- "Today" button to jump to current month
- Current day highlighted in brand color

**Issue Display**:
- Up to 3 issues shown per day
- "+N more" indicator for overflow
- Priority color dots (5 levels)
- Issue type icons
- Tooltips for full title

**Interactions**:
- Click issue to open detail modal
- Click priority legend for reference
- No drag-and-drop (read-only positioning)

**Data Fetching**:
```typescript
api.issues.listIssuesByDateRange({
  projectId,
  sprintId, // optional
  from: startOfMonth,
  to: endOfMonth
})
```

### Unified Calendar View

Cascade also has a `UnifiedCalendarView` component that provides tabs to switch between:
- Calendar (issues by due date)
- Roadmap (timeline bars)

---

## Comparison Table

| Aspect | plane | Cascade | Best |
|--------|-------|---------|------|
| Layout modes | Month + Week | Month only | plane |
| Drag-and-drop | Yes | No | plane |
| Quick add on day | Yes | No | plane |
| Show weekends toggle | Yes | Always show | plane |
| Issues per day (month) | 4 | 3 | tie |
| "More" indicator | Yes | Yes | tie |
| Priority indicators | Yes (display props) | Yes (color dots) | Cascade |
| Type indicators | Yes (display props) | Yes (icons) | Cascade |
| Today highlight | Yes | Yes | tie |
| Month navigation | Yes | Yes | tie |
| "Today" button | Implied | Yes | Cascade |
| Click to detail | Yes (peek) | Yes (modal) | tie |
| Load more per day | Yes | No | plane |
| Sprint filter | Via cycle filter | Yes (selector) | tie |
| Legend | No | Yes (priority colors) | Cascade |

---

## Recommendations

1. **Priority 1**: Add drag-and-drop to reschedule issues
   - Drag issue from one day to another
   - Update `dueDate` via mutation
   - Visual feedback during drag

2. **Priority 2**: Add week view mode
   - Show single week with more issues per day
   - Useful for focused weekly planning

3. **Priority 3**: Add quick create on day click
   - Click empty area of day to create issue
   - Pre-populate due date

4. **Priority 4**: Add show/hide weekends toggle
   - 5-day view for work-week focus
   - Saves horizontal space

5. **Priority 5**: Add load more per day
   - When >3 issues, show "+N more" button
   - Click to expand or load additional issues

---

## Implementation: Drag-and-Drop for Calendar

```tsx
// Day tile with drop target
function CalendarDayTile({ date, issues }) {
  const ref = useRef(null);

  useEffect(() => {
    return dropTargetForElements({
      element: ref.current,
      getData: () => ({ date: date.toISOString() }),
      onDrop: ({ source }) => {
        const issueData = source.data;
        updateIssueDueDate(issueData.id, date);
      },
    });
  }, [date]);

  return (
    <div ref={ref} className="calendar-day">
      <div className="day-number">{date.getDate()}</div>
      {issues.map(issue => (
        <DraggableIssue key={issue._id} issue={issue} />
      ))}
    </div>
  );
}
```

---

## Screenshots/References

### plane
- Calendar layout: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/calendar/`
- Day tile: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/calendar/day-tile.tsx`

### Cascade
- Issues calendar: `~/Desktop/cascade/src/components/IssuesCalendarView.tsx`
- Project calendar: `~/Desktop/cascade/src/components/Calendar/ProjectCalendar.tsx`
- Query: `~/Desktop/cascade/convex/issues/queries.ts` (listIssuesByDateRange)
