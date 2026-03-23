# Roadmap Page - Implementation

> **Route file**: `src/routes/_auth/_app/$orgSlug/projects/$key/roadmap.tsx`
> **Last Updated**: 2026-03-23

---

## Data Flow

### Queries

| Query | Source | Purpose |
|-------|--------|---------|
| `api.issues.listRoadmapIssues` | `useAuthenticatedQuery` | Issues with due dates, filtered by sprint/epic |
| `api.issues.listEpics` | `useAuthenticatedQuery` | Epic list for the filter dropdown |
| `api.issueLinks.getForProject` | `useAuthenticatedQuery` | Issue dependency links for arrow rendering |
| `api.sprints.listByProject` | `useAuthenticatedQuery` | Sprint list (route finds active sprint) |
| `api.projects.getProject` | `useAuthenticatedQuery` | Project workflow states |

### Mutations

| Mutation | Purpose | Trigger |
|----------|---------|---------|
| `api.issues.update` | Update start date and/or due date | Bar drag-release or resize-release |

### State Management

```text
Route state (useState):
+-- selectedIssue: Id | null             # Issue detail modal
+-- viewMode: "months" | "weeks"         # Timeline column granularity
+-- groupBy: "none" | "status" | "assignee" | "priority" | "epic"
+-- collapsedGroupKeys: string[]         # Which groups are collapsed
+-- collapsedParentIssueIds: string[]    # Which parent issues hide subtasks
+-- filterEpic: Id | "all"              # Epic filter
+-- timelineSpan: 1 | 3 | 6 | 12        # Months visible
+-- timelineZoom: "compact" | "standard" | "expanded"
+-- timelineAnchorDate: Date             # Left edge of timeline window
+-- showDependencies: boolean            # SVG arrows toggle

Interaction state (useRoadmapTimelineInteractions hook):
+-- dragging: DragState                  # Active bar drag
+-- resizing: ResizeState                # Active edge resize
```

---

## Timeline Math

### Bar positioning

```text
getPositionOnTimeline(date):
  daysSinceStart = floor((date - startOfMonth) / DAY)
  return (daysSinceStart / totalDays) * 100   // percentage

getBarLeft(issue): getPositionOnTimeline(issue.startDate)
getBarWidth(issue): getPositionOnTimeline(issue.dueDate) - getBarLeft(issue)
```

### Drag patch calculation

```text
buildDragPatch({ dragging, clientX, containerWidth, totalDays }):
  deltaX = clientX - dragging.startX
  deltaDays = round((deltaX / containerWidth) * totalDays)
  newStartDate = originalStartDate + deltaDays * DAY  (start of day)
  newDueDate = originalDueDate + deltaDays * DAY      (end of day)
```

### Resize patch calculation

```text
buildResizePatch({ resizing, clientX, ... }):
  if edge == "left":  only startDate changes
  if edge == "right": only dueDate changes
  same deltaX/deltaDays math as drag
```

### Timeline layout

```text
Column widths (px) by zoom level:
                compact  standard  expanded
  months view:    80       120       180
  weeks view:     40        64       100

Total layout width = ISSUE_INFO_COLUMN_WIDTH + cellCount * bucketWidth
```

---

## Dependency Arrow Rendering

```text
For each link in issueLinks:
  1. Find source and target issue row indices
  2. Get source bar right edge X position
  3. Get target bar left edge X position
  4. Build SVG path:
     - Horizontal from source right edge
     - Vertical to target row Y
     - Horizontal to target left edge
     - Arrowhead at end
  5. Apply opacity:
     - Active (hovered/selected): 1.0, stroke width 3
     - Default: 0.7, stroke width 2
     - Dimmed (unrelated): 0.18, stroke width 1.5
```

---

## Key Architecture

### Grouping

Issues can be grouped by status, assignee, priority, or epic. Each group:
- Has a collapsible header row
- Contains its issues sorted by start date
- Can be collapsed/expanded independently

### Milestones

Issues with no start date (only due date) render as diamond markers
instead of bars. Detected by `isRoadmapMilestone(issue)`.

### Keyboard Navigation

`useListNavigation` hook provides arrow key movement through the issue list.
Selected issue is highlighted in both the info column and the timeline.

### Virtualization

The component uses `react-window` List for rendering only visible rows,
critical for projects with hundreds of issues.

---

## Permissions

| Action | Required Role |
|--------|---------------|
| View roadmap | Project viewer+ |
| Drag/resize bars | Project editor+ |
| Open issue detail | Project viewer+ |
| Toggle controls | Project viewer+ |

`canEdit` prop gates all mouse interaction handlers. Viewers see the same
timeline but cannot move or resize bars.

---

## Testing

| Test File | Coverage |
|-----------|----------|
| `src/components/RoadmapView.test.tsx` | Timeline rendering, dependency lines, issue detail |
| `e2e/screenshot-pages.ts` | `filled-roadmap` + timeline selector specs |
