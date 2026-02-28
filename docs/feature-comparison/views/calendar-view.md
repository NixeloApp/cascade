# Calendar View - Deep UX Comparison

## Overview
The calendar view displays issues by due date on a monthly/weekly grid. This analysis compares Plane vs Cascade across navigation, drag-drop, and issue display.

---

## Entry Points Comparison

| Entry Point | Plane | Cascade | Winner |
|-------------|-------|---------|--------|
| **Tab selection** | "Calendar" tab | "Calendar" tab/route | Tie |
| **URL direct** | `/project/calendar` | `/:org/projects/:key/calendar` | Tie |
| **Sprint context** | Via cycle filter | Sprint selector | Tie |

---

## Layout Comparison

### Plane Calendar
```
┌─────────────────────────────────────────────────────────────────────┐
│ [Board] [List] [Calendar] [Spreadsheet] [Gantt]                     │
├─────────────────────────────────────────────────────────────────────┤
│ [Filters ▼] [Display ▼]  [◀] February 2026 [▶]  [Month|Week]       │
│                                              [☐ Show weekends]      │
├─────────────────────────────────────────────────────────────────────┤
│  Sun    │  Mon    │  Tue    │  Wed    │  Thu    │  Fri    │  Sat   │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ 1       │ 2       │ 3       │ 4       │ 5       │ 6       │ 7      │
│ ┌─────┐ │         │ ┌─────┐ │         │         │ ┌─────┐ │        │
│ │PROJ │ │         │ │PROJ │ │         │         │ │PROJ │ │        │
│ │-123 │ │         │ │-456 │ │         │         │ │-789 │ │        │
│ └─────┘ │         │ └─────┘ │         │         │ └─────┘ │        │
│ ┌─────┐ │         │         │         │         │         │        │
│ │PROJ │ │         │         │         │         │         │        │
│ │-124 │ │         │         │         │         │         │        │
│ └─────┘ │         │         │         │         │         │        │
│ +2 more │         │         │         │         │         │        │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ 8       │ 9       │ ...     │         │         │         │        │
│         │         │         │         │         │         │        │
│ [+]     │ [+]     │ [+]     │ [+]     │ [+]     │ [+]     │ [+]    │
│  ↑ quick add button per day                                         │
└─────────────────────────────────────────────────────────────────────┘

Week View:
┌─────────────────────────────────────────────────────────────────────┐
│  Mon 9  │  Tue 10 │  Wed 11 │  Thu 12 │  Fri 13 │  Sat 14 │ Sun 15│
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ ┌─────┐ │ ┌─────┐ │         │         │ ┌─────┐ │         │        │
│ │Issue│ │ │Issue│ │         │         │ │Issue│ │         │        │
│ │ 1   │ │ │ 2   │ │         │         │ │ 3   │ │         │        │
│ └─────┘ │ └─────┘ │         │         │ └─────┘ │         │        │
│ ┌─────┐ │         │         │         │         │         │        │
│ │Issue│ │ up to   │         │         │         │         │        │
│ │ 4   │ │ 30/day  │         │         │         │         │        │
│ └─────┘ │         │         │         │         │         │        │
│ ...     │         │         │         │         │         │        │
└─────────────────────────────────────────────────────────────────────┘
```

### Cascade Calendar
```
┌─────────────────────────────────────────────────────────────────────┐
│ Issues Calendar                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ [◀ Prev]        February 2026        [Next ▶]  [Today]              │
├─────────────────────────────────────────────────────────────────────┤
│  Sun    │  Mon    │  Tue    │  Wed    │  Thu    │  Fri    │  Sat   │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ 1       │ 2       │ 3       │ 4       │ 5       │ 6       │ 7      │
│ ● 🐛 Fix│         │ ● 🔧 Add│         │         │ ● 📖 Doc│        │
│   auth  │         │   feat  │         │         │   update│        │
│ ● 🔧 Re-│         │         │         │         │         │        │
│   factor│         │         │         │         │         │        │
│ +3 more │         │         │         │         │         │        │
│    (5)  │         │  (1)    │         │         │  (1)    │        │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ 8       │ 9       │ 10      │ 11 ████ │ 12      │ 13      │ 14     │
│         │         │         │ (today) │         │         │        │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

Legend (bottom):
● Highest  ● High  ● Medium  ● Low  ● Lowest
```

---

## Feature Comparison

### Layout Modes

| Mode | Plane | Cascade |
|------|-------|---------|
| **Month view** | Yes (4 issues/day) | Yes (3 issues/day) |
| **Week view** | Yes (30 issues/day) | No |
| **Day view** | No | No |

### Day Cell Features

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Max issues shown** | 4 (month), 30 (week) | 3 |
| **Overflow indicator** | "+N more" | "+N more (total)" |
| **Quick add button** | Per day | No |
| **Today highlight** | Yes | Yes (brand color) |
| **Weekends toggle** | Show/hide | Always show |
| **Priority display** | Via display props | Color dots |
| **Type icons** | Via display props | Yes |

---

## Click Analysis

| Action | Plane | Cascade | Notes |
|--------|-------|---------|-------|
| **Navigate month** | 1 click (arrows) | 1 click (arrows) | Tie |
| **Jump to today** | Implicit | 1 click (Today btn) | **Cascade** |
| **Open issue** | 1 click (peek) | 1 click (modal) | Tie |
| **Create issue** | 2 clicks (+ on day) | 2+ clicks (header) | **Plane** |
| **Reschedule issue** | 1 drag | N/A | **Plane** |
| **Switch to week** | 1 click | N/A | Plane only |
| **Hide weekends** | 1 click toggle | N/A | Plane only |
| **Load more on day** | 1 click | N/A | Plane only |

---

## Drag & Drop

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Drag to reschedule** | Yes | No |
| **Visual feedback** | Drop indicator | N/A |
| **Auto-scroll** | Yes | N/A |
| **Multi-select drag** | No | N/A |
| **Cross-month drag** | Within visible | N/A |

---

## Navigation & Controls

### Plane Controls
```
[◀] [Month Year] [▶]     [Month | Week]    [☐ Show weekends]
```

### Cascade Controls
```
[◀ Prev]  [Month Year]  [Next ▶]  [Today]
```

| Control | Plane | Cascade |
|---------|-------|---------|
| **Month arrows** | Yes | Yes |
| **Today button** | Implicit | Explicit |
| **View toggle** | Month/Week | N/A |
| **Weekends toggle** | Yes | N/A |
| **Year picker** | Via month dropdown | N/A |

---

## Issue Display on Day

### Plane Issue Block
```
┌─────────────────────────┐
│ PROJ-123               │
│ Fix authentication bug │
│ ● High   @user         │
│ [bug] [security]       │
└─────────────────────────┘
(toggleable properties)
```

### Cascade Issue Button
```
┌─────────────────────────┐
│ ● 🐛 Fix authentication │
│   ↑  ↑  (truncated)     │
│ color type              │
└─────────────────────────┘
+ tooltip on hover
```

---

## Summary Scorecard

| Category | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| View modes | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Plane has week view |
| Drag-drop | ⭐⭐⭐⭐⭐ | ⭐ | Plane only |
| Quick add | ⭐⭐⭐⭐⭐ | ⭐ | Plane per-day button |
| Today button | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade explicit |
| Priority display | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade color dots |
| Type icons | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade always shows |
| Legend | ⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade has legend |
| Weekends toggle | ⭐⭐⭐⭐⭐ | ⭐ | Plane only |
| Load more | ⭐⭐⭐⭐⭐ | ⭐⭐ | Plane per-day |
| Responsiveness | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Both good |

---

## Priority Recommendations for Cascade

### P0 - Critical
1. **Drag-and-drop reschedule** - Drag issues between days to update due date
   ```tsx
   useEffect(() => {
     return dropTargetForElements({
       element: dayRef.current,
       getData: () => ({ date }),
       onDrop: ({ source }) => {
         updateIssueDueDate(source.data.issueId, date);
       },
     });
   }, [date]);
   ```

### P1 - High
2. **Week view mode** - Show single week with more issues per day
3. **Quick add per day** - Click day to create issue with pre-filled date
4. **Show/hide weekends** - 5-day work week view

### P2 - Medium
5. **Load more per day** - When >3 issues, expand to show all
6. **Keyboard navigation** - Arrow keys to move between days
7. **Issue preview on hover** - Tooltip with more details

### P3 - Nice to Have
8. **Day view** - Full day schedule view
9. **Multi-select drag** - Drag multiple issues at once
10. **Export to calendar** - ICS export

---

## Code References

### Plane
- Calendar layout: `apps/web/core/components/issues/issue-layouts/calendar/`
- Day tile: `apps/web/core/components/issues/issue-layouts/calendar/day-tile.tsx`
- Issue blocks: `apps/web/core/components/issues/issue-layouts/calendar/issue-blocks.tsx`

### Cascade
- Issues calendar: `src/components/IssuesCalendarView.tsx`
- Project calendar: `src/components/Calendar/ProjectCalendar.tsx`
- Query: `convex/issues/queries.ts` → `listIssuesByDateRange`
