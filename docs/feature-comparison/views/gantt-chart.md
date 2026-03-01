# Gantt Chart / Timeline View - Deep UX Comparison

## Overview
The Gantt chart displays issues as horizontal bars on a timeline, showing duration (start to due date). This analysis compares Plane vs Cascade across interactions, dependencies, and timeline controls.

---

## Entry Points Comparison

| Entry Point | Plane | Cascade | Winner |
|-------------|-------|---------|--------|
| **Tab selection** | "Gantt" tab | Via unified calendar | Plane |
| **URL direct** | `/project/gantt` | Part of calendar route | Plane |
| **Unified view** | Separate view | Tab in UnifiedCalendarView | Cascade |

---

## Layout Comparison

### Plane Gantt Chart
```
┌─────────────────────────────────────────────────────────────────────┐
│ [Board] [List] [Calendar] [Spreadsheet] [Gantt]                     │
├─────────────────────────────────────────────────────────────────────┤
│ [Filters ▼] [Display ▼]        [Zoom: Week ▼]  [◀] Feb 2026 [▶]   │
├────────────────────────────────┬────────────────────────────────────┤
│ Sidebar (Issue Info)           │ Timeline                           │
│ 300px fixed                    │ Scrollable                         │
├────────────────────────────────┼────────────────────────────────────┤
│ PROJ-123  Fix auth bug         │     ┌══════════════════┐           │
│ ● High  @user                  │     │████████████████│←→│         │
│                                │     └══════════════════┘           │
│ PROJ-124  Add feature          │          ┌═══════════════════┐     │
│ ● Med   @user                  │          │█████████████████│←→│   │
│                                │          └═══════════════════┘     │
│ PROJ-125  Update API           │   ┌══════════┐                     │
│ ● Low   @user                  │   │██████████│←→│                 │
│                                │   └══════════┘                     │
├────────────────────────────────┼────────────────────────────────────┤
│ [+ Add Issue]                  │ Today ↓                            │
│                                │       │                            │
│                                │       ▼ (red line)                 │
└────────────────────────────────┴────────────────────────────────────┘

With dependencies:
        ┌══════════┐
        │ PROJ-123 │─────────→┌══════════┐
        └══════════┘          │ PROJ-456 │
                              └══════════┘
                              (blocks arrow)
```

### Cascade Roadmap View
```
┌─────────────────────────────────────────────────────────────────────┐
│ Roadmap                                                              │
│ Timeline view of issues organized by due date                        │
├─────────────────────────────────────────────────────────────────────┤
│ Epic: [All Epics ▼]                View: [Months ▼] / [Weeks]       │
├────────────────────────────────────┬────────────────────────────────┤
│ Issue (w-64 fixed)                 │ Feb    Mar    Apr    May   Jun │
├────────────────────────────────────┼────────────────────────────────┤
│ 🐛 PROJ-123  Fix auth bug          │    ┌════════════┐              │
│                                    │    │  ● High    │              │
│                                    │    │  @Alice    │              │
│                                    │    └════════════┘              │
│ 🔧 PROJ-456  Add feature           │         ┌═══════════════┐      │
│                                    │         │  ● Medium     │      │
│                                    │         │  @Bob         │      │
│                                    │         └═══════════════┘      │
│ 📖 PROJ-789  Update docs           │              ┌════════┐        │
│                                    │              │ ● Low  │        │
│                                    │              │ @Carol │        │
├────────────────────────────────────┼────────────────────────────────┤
│ virtualized via react-window       │        ↓ Today (red line)      │
└────────────────────────────────────┴────────────────────────────────┘
```

---

## Feature Comparison

### Block Interactions

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Left resize (start date)** | Yes | No |
| **Right resize (due date)** | Yes | No |
| **Drag to move** | Yes | No |
| **Vertical reorder** | Yes (if sort_order) | No |
| **Click to open** | Yes (peek) | Yes (modal) |

### Timeline Controls

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Zoom levels** | Day/Week/Month | Months/Weeks toggle |
| **Timeline span** | Configurable | 6 months fixed |
| **Horizontal scroll** | Pan + scroll | Scroll |
| **Today indicator** | Red line | Red line |
| **Quick add** | Sticky bar | No |

### Display Options

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Dependency lines** | Yes (SVG arrows) | No |
| **Priority in bar** | Via display props | Color-coded bar |
| **Assignee in bar** | Via display props | First name in bar |
| **Sidebar info** | Rich (key, title, props) | Key + title only |
| **Virtual scrolling** | No | Yes (react-window) |

---

## Click Analysis

| Action | Plane | Cascade | Notes |
|--------|-------|---------|-------|
| **Open issue** | 1 click | 1 click | Tie |
| **Change start date** | 1 drag (left handle) | N/A | Plane only |
| **Change due date** | 1 drag (right handle) | N/A | Plane only |
| **Move both dates** | 1 drag (bar) | N/A | Plane only |
| **Reorder** | 1 drag (vertical) | N/A | Plane only |
| **Filter by epic** | 3+ clicks (filters) | 2 clicks (dropdown) | **Cascade** |
| **Change zoom** | 1 click (dropdown) | 1 click (toggle) | Tie |
| **Navigate timeline** | Scroll/pan | Scroll | Tie |
| **Create issue** | 1 click (+ bar) | Header button | Plane faster |

---

## Block Display

### Plane Block (Resizable)
```
┌──●══════════════════════════════●──┐
│  │ PROJ-123  Fix auth bug        │  │
│  │ ● High  @user  [bug]          │  │
└──●══════════════════════════════●──┘
   ↑ left handle                  ↑ right handle
```

### Cascade Bar (Read-only)
```
┌════════════════════════════════════┐
│  ● High    @Alice                  │  ← priority color background
└════════════════════════════════════┘
   positioned by due date only
```

---

## Dependency Visualization

### Plane Dependencies
```
┌══════════┐
│ PROJ-123 │───────────────────▶┌══════════┐
└══════════┘                    │ PROJ-456 │
    ↑ "blocks" arrow with       └══════════┘
      curved SVG path
```

### Cascade
```
(No dependency visualization)
Issues show as independent bars
```

---

## Keyboard Support

| Shortcut | Plane | Cascade |
|----------|-------|---------|
| **Arrow up/down** | Limited | Navigate issues |
| **Enter** | N/A | Open selected |
| **Escape** | Close peek | Close modal |
| **+/-** | Zoom | N/A |

---

## Performance

### Plane
- Pagination (100 items/page)
- `loadMoreBlocks()` for infinite scroll
- No virtualization

### Cascade
- **react-window** virtualization
- Fixed height (600px)
- Handles 100+ issues smoothly

---

## Summary Scorecard

| Category | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| Block interactions | ⭐⭐⭐⭐⭐ | ⭐ | Plane full control |
| Resize handles | ⭐⭐⭐⭐⭐ | ⭐ | Plane only |
| Drag to move | ⭐⭐⭐⭐⭐ | ⭐ | Plane only |
| Dependencies | ⭐⭐⭐⭐⭐ | ⭐ | Plane only |
| Virtual scroll | ⭐⭐ | ⭐⭐⭐⭐⭐ | **Cascade** |
| Epic filter | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade dropdown |
| Keyboard nav | ⭐⭐ | ⭐⭐⭐⭐ | Cascade arrows |
| Priority colors | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade bar color |
| Assignee display | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade in bar |
| Zoom controls | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Plane more options |
| Quick add | ⭐⭐⭐⭐⭐ | ⭐⭐ | Plane sticky bar |
| Timeline config | ⭐⭐⭐⭐⭐ | ⭐⭐ | Plane flexible |

---

## Priority Recommendations for Cascade

### P0 - Critical
1. **Block resizing** - Drag left/right handles to adjust dates
   ```tsx
   <div className="resize-handle left" onMouseDown={handleLeftResize} />
   <div className="bar-content">{issue.title}</div>
   <div className="resize-handle right" onMouseDown={handleRightResize} />
   ```

2. **Drag to move** - Drag bar horizontally to shift both dates

### P1 - High
3. **Dependency lines** - SVG arrows showing blocking relationships
4. **Configurable timeline** - Dropdown for 1/3/6/12 month spans
5. **More zoom levels** - Day/Week/Month granularity

### P2 - Medium
6. **Vertical reorder** - Drag issues to change display order
7. **Quick add** - Click timeline to create issue at position
8. **Sidebar expansion** - Show more issue properties

### P3 - Nice to Have
9. **Critical path** - Highlight dependency chain
10. **Milestone markers** - Show milestone dates
11. **Export** - PNG/PDF export of timeline

---

## Code References

### Plane
- Gantt layout: `apps/web/core/components/issues/issue-layouts/gantt/`
- Chart components: `apps/web/core/components/gantt-chart/`
- Block rendering: `apps/web/core/components/gantt-chart/chart/`
- Sidebar: `apps/web/core/components/gantt-chart/sidebar/`

### Cascade
- Roadmap view: `src/components/RoadmapView.tsx`
- Unified view: `src/components/Calendar/UnifiedCalendarView.tsx`
- Query: `convex/issues/queries.ts` → `listRoadmapIssues`
