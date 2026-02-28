# Sprint/Cycle Reports & Analytics

## Overview

Sprint reports provide insights into team velocity, burndown progress, and completion metrics. These help teams understand their capacity and improve estimation over time.

---

## plane

### Analytics Location

- **Sidebar**: Collapsible panel on cycle detail page
- **Header button**: "Analytics" opens WorkItemsModal for advanced analytics
- **Always visible**: When on cycle detail page

### Analytics Sidebar Structure

```
CycleDetailsSidebar
├── CycleSidebarHeader
│   ├── Cycle name
│   ├── Status badge
│   └── Cycle lead avatar
├── CycleSidebarDetails
│   ├── Work items count (completed/total)
│   ├── Estimate points (completed/total)
│   ├── Members (avatar group)
│   ├── Lead
│   └── Description
└── CycleAnalyticsProgress
    ├── SidebarChartRoot (burndown/burnup)
    └── CycleProgressStats (tabs)
```

### Metrics Displayed

| Metric | Location | Visualization |
|--------|----------|---------------|
| Progress % | Cycle list item | Circular indicator |
| Completed/Total Issues | Sidebar details | Text "3/5 work items" |
| Completed/Total Points | Sidebar details | Text "15/50 points" |
| State Distribution | Progress Stats tab | Breakdown by state group |
| Assignee Workload | Progress Stats tab | Per-user completion |
| Label Distribution | Progress Stats tab | Per-label breakdown |
| Burndown/Burnup | Chart | Line chart |

### Burndown/Burnup Chart

**Features**:
- Toggle between burndown and burnup views
- Estimate type selector: "Work Items" vs "Estimates" (points)
- Data source: `progress_snapshot` in cycle details
- `completion_chart` nested in distribution data
- Validates via `validateCycleSnapshot()`

### Progress Stats Tabs

**Tab 1: State Groups**
- Counts by: backlog, unstarted, started, completed, cancelled
- Filterable by state

**Tab 2: Assignees**
- Per-assignee metrics
- Avatar, name, completed/total
- Points or issues based on estimate type

**Tab 3: Labels**
- Per-label breakdown
- Label color, name, completed/total
- Filterable selection

### Active Cycle Statistics

**Location**: `ActiveCycleRoot` in cycle list

**Tabbed View**:
- Priority-Issues tab
- Assignees tab
- Labels tab

**Per-tab metrics**:
- Issue count
- Priority distribution (high/medium/low/none)
- User assignment breakdown
- Label distribution with colors

**Features**:
- Infinite scroll for issue lists
- Theme-aware empty state images

### Data Fetching

| Function | Purpose |
|----------|---------|
| `fetchActiveCycleProgress()` | TProgressSnapshot data |
| `fetchActiveCycleProgressPro()` | Enterprise analytics |
| `fetchActiveCycleAnalytics()` | Distribution breakdown |

---

## Cascade

### Analytics Location

- **Separate page**: `/projects/[key]/analytics`
- **Component**: `AnalyticsDashboard`
- **Not inline**: Requires navigation to view

### Metrics Displayed

| Metric | Location | Visualization |
|--------|----------|---------------|
| Total Issues | Metric card | Number |
| Unassigned | Metric card | Number (highlighted if > 0) |
| Avg Velocity | Metric card | Number + "points/sprint" |
| Completed Sprints | Metric card | Number |
| Velocity History | Bar chart | Last 10 sprints |
| Sprint Progress | Sprint card | Progress bar |

### Velocity Chart

**Display**: "Team Velocity (Last 10 Sprints)"

**Chart**:
- Bar chart component
- X-axis: Sprint names
- Y-axis: Story points completed
- Color: Brand accent

**Metrics**:
- Average velocity calculation
- Sprint count displayed
- Points per sprint breakdown

### Burndown Analytics

**Query**: `getSprintBurndown`

**Returned Metrics**:
```typescript
{
  totalPoints: number,           // sum of story points
  completedPoints: number,       // done issues points
  remainingPoints: number,       // total - completed
  progressPercentage: number,    // (completed / total) * 100
  totalIssues: number,
  completedIssues: number,
  idealBurndown: [               // linear ideal line
    { day: 0, points: totalPoints },
    { day: N, points: 0 }
  ],
  daysElapsed: number,
  totalDays: number
}
```

**Story Points Calculation**:
- Uses `storyPoints` field if available
- Falls back to `estimatedHours`

### Team Velocity Query

**Query**: `getTeamVelocity`

**Returns** (last 10 completed sprints):
```typescript
{
  sprintName: string,
  sprintId: Id<"sprints">,
  points: number,              // completed issues points
  issuesCompleted: number
}
```

**Average**: `sum(points) / sprints.length`

### Sprint Card Progress

**Location**: Sprint manager view

**Display**:
- Visual progress bar
- Text: "X of Y completed"
- Percentage: "(X/Y * 100)%"

### Additional Analytics

**Status Distribution**:
- Issues by workflow state
- Bar chart visualization

**Type Distribution**:
- Issues by type (bug, feature, task, etc.)
- Bar chart

**Priority Distribution**:
- Issues by priority level
- Bar chart

**Recent Activity**:
- Project activity feed
- Not sprint-specific

---

## Comparison Table

| Aspect | plane | Cascade | Best |
|--------|-------|---------|------|
| Analytics location | Inline sidebar | Separate page | plane |
| Burndown chart | Yes (interactive) | Yes (computed) | plane |
| Burnup chart | Yes (toggle) | No | plane |
| Velocity chart | Yes | Yes (bar chart) | tie |
| State distribution | Yes (tabs) | Yes | tie |
| Assignee breakdown | Yes (tab) | No | plane |
| Label breakdown | Yes (tab) | No | plane |
| Progress indicator | Circular + sidebar | Progress bar | plane |
| Estimate types | Work Items vs Points | Points only | plane |
| Real-time updates | Yes | Yes | tie |
| Historical snapshots | Yes (progress_snapshot) | No | plane |
| Enterprise analytics | Yes (Pro) | No | plane |
| Sprint comparison | Via list | Via velocity chart | Cascade |

---

## Recommendations

1. **Priority 1**: Add analytics sidebar to sprint board view (inline, not separate page)
2. **Priority 2**: Add burndown chart visualization to sprint view
3. **Priority 3**: Add assignee workload breakdown tab
4. **Priority 4**: Add label distribution breakdown tab
5. **Priority 5**: Implement burnup chart option (toggle with burndown)
6. **Priority 6**: Add progress snapshots for historical tracking
7. **Priority 7**: Add "Work Items" vs "Story Points" toggle for metrics
8. **Priority 8**: Show sprint analytics in cycle/sprint cards (not just active sprint)

---

## Data Model Comparison

### plane

```typescript
// Cycle with analytics
{
  ...cycle,
  progress_snapshot: TProgressSnapshot,
  distribution: {
    completion_chart: ChartData,
    state_distribution: StateBreakdown,
    assignee_distribution: AssigneeBreakdown,
    label_distribution: LabelBreakdown
  },
  estimate_distribution: EstimateBreakdown
}
```

### Cascade

```typescript
// Sprint (basic)
{
  ...sprint,
  issueCount: number,
  completedCount: number
}

// Burndown (separate query)
{
  totalPoints, completedPoints, remainingPoints,
  progressPercentage, totalIssues, completedIssues,
  idealBurndown: Array<{ day, points }>,
  daysElapsed, totalDays
}

// Velocity (separate query)
Array<{ sprintName, sprintId, points, issuesCompleted }>
```

---

## Screenshots/References

### plane
- Analytics sidebar: `~/Desktop/plane/apps/web/core/components/cycles/analytics-sidebar/`
- Progress chart: `~/Desktop/plane/apps/web/core/components/cycles/analytics-sidebar/issue-progress.tsx`
- Stats tabs: `~/Desktop/plane/apps/web/core/components/cycles/analytics-sidebar/progress-stats.tsx`
- Active cycle stats: `~/Desktop/plane/apps/web/core/components/cycles/active-cycle/cycle-stats.tsx`

### Cascade
- Analytics dashboard: `~/Desktop/cascade/src/components/AnalyticsDashboard.tsx`
- Metric card: `~/Desktop/cascade/src/components/Analytics/MetricCard.tsx`
- Bar chart: `~/Desktop/cascade/src/components/Analytics/BarChart.tsx`
- Burndown query: `~/Desktop/cascade/convex/analytics.ts` (getSprintBurndown)
- Velocity query: `~/Desktop/cascade/convex/analytics.ts` (getTeamVelocity)
