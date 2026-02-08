# Analytics Dashboard Page

> **Status**: TODO - Awaiting Implementation
> **Priority**: MEDIUM (Phase 5 - Data Visualization Polish)

---

## Current State Analysis

**Screenshot**: `e2e/screenshots/16-filled-project-demo-analytics.png`

### Visual Description (Current Nixelo)

The current analytics dashboard features:

1. **Layout**: Project-scoped page under project tabs (Board, Backlog, Roadmap, Calendar, Activity, Analytics, Billing, Timesheet, Settings)
2. **Header**:
   - Page title: "Analytics Dashboard" (large, bold)
   - Subtitle: "Project insights, team velocity, and progress metrics" (muted gray)
3. **Stats Cards Row** (4 cards):
   - **Total Issues**: Value "6" with bar chart icon (teal/green gradient)
   - **Unassigned**: Value "2" with pushpin icon (pink), card has blue highlight border (selected state?)
   - **Avg Velocity**: Value "0" with lightning bolt icon (orange), "points/sprint" label below
   - **Completed Sprints**: Value "0" with green checkmark icon
4. **Charts Grid** (2x2 layout):
   - **Issues by Status**: Horizontal bar chart showing done (1), in-progress (2), in-review (1), todo (2) - blue bars
   - **Issues by Type**: Horizontal bar chart showing Task (2), Bug (1), Story (2), Epic (1) - green bars
   - **Issues by Priority**: Horizontal bar chart with Highest (1), High (2), Medium (2), Low (1), Lowest (0) - orange/amber bars
   - **Team Velocity (Last 10 Sprints)**: Empty state "No completed sprints yet"
5. **Card Styling**: White cards with subtle shadow, rounded corners (~8px)
6. **Chart Styling**: Simple horizontal bars with numeric labels at end, no grid lines

### Issues Identified

| Issue | Severity | Notes |
|-------|----------|-------|
| No date range selector | HIGH | Mintlify has prominent date picker |
| No traffic type filter | HIGH | Mintlify has All/AI/Human segmentation |
| Missing time-series chart | HIGH | No trend visualization over time |
| Stats cards lack trend indicators | MEDIUM | Mintlify shows % vs previous period |
| No chart interactivity | MEDIUM | Missing hover tooltips, drill-down |
| Missing secondary tables | MEDIUM | Mintlify has Top Pages, Referrals |
| Plain bar charts | LOW | Could use area/line charts for trends |
| No export functionality | LOW | Data export button missing |

---

## Target State

**Reference**:
- `docs/research/library/mintlify/dashboard/analytics.png` (Primary)

### Key Improvements from Mintlify

1. **Traffic type segmentation** - Toggle between "All Traffic", "AI", "Human" views
2. **Date range picker** - Calendar icon with "Jan 29 - Feb 5" dropdown in top right
3. **Trend indicators** - Each stat card shows "0% vs previous" with colored indicator
4. **Time-series visualization** - "Visitors Over Time" area chart with daily breakdown
5. **Secondary data tables** - "Top pages" with Views column, "Referrals" with Views column
6. **Cleaner stat cards** - Subtle borders, no heavy shadows, clear hierarchy

### Mintlify Analytics Anatomy

From `docs/research/library/mintlify/dashboard/analytics.png`:

- **Page Title**: "Analytics" (28px, bold)
- **Subtitle**: "Track performance across your documentation" (muted, 14px)
- **Filter Bar** (top right):
  - Traffic type toggle: [All Traffic] [AI] [Human] - pill buttons
  - Date range picker: Calendar icon + "Jan 29 - Feb 5" with dropdown chevron
- **Stats Cards Row** (4 cards, horizontal):
  - "Visitors" - Value "2", trend "0% vs previous" (green neutral)
  - "Assistant" - Value "0", trend "0% vs previous" (green neutral)
  - "Searches" - Value "0", trend "0% vs previous" (green neutral)
  - "Feedback" - Value "0", trend "0% vs previous" (green neutral)
- **Primary Chart**: "Visitors Over Time"
  - Subtitle: "Daily visitors count for the selected date range"
  - Area chart with green fill, diagonal stripe pattern for active data
  - X-axis: Date labels (Jan 29, Jan 31, Feb 2, Feb 5)
  - Responsive to date range selection
- **Bottom Tables** (2-column layout):
  - Left: "Top pages" table with Views column
  - Right: "Referrals" table with Views column

---

## ASCII Wireframe

### Target Layout

```
+--------------------------------------------------------------------------------+
|  [Sidebar]  |  Analytics                              [Filter Bar]             |
|             |  Track project performance and team metrics                      |
|             |                                                                   |
|             |  +------------------+ +------------------+ +------------------+   |
|             |  | Total Issues     | | Velocity        | | Sprint Progress  |   |
|             |  |       24         | |      8.5        | |      75%         |   |
|             |  | [chart] +12%     | | [bolt] +2.1     | | [check] +15%     |   |
|             |  | vs last period   | | pts/sprint      | | completion       |   |
|             |  +------------------+ +------------------+ +------------------+   |
|             |                                                                   |
|             |  +------------------+                                             |
|             |  | Completed        |                                             |
|             |  |       3          |                                             |
|             |  | [flag] sprints   |                                             |
|             |  +------------------+                                             |
|             |                                                                   |
|             |  +--------------------------------------------------------------+ |
|             |  | Velocity Over Time                                           | |
|             |  | Sprint-by-sprint velocity for the team                       | |
|             |  |                                                              | |
|             |  |     12 |                         ____                        | |
|             |  |        |                    ____/    \                       | |
|             |  |      8 |               ____/          \____                  | |
|             |  |        |          ____/                    \                 | |
|             |  |      4 |     ____/                          \____           | |
|             |  |        |____/                                    \          | |
|             |  |      0 +--------------------------------------------        | |
|             |  |        Sprint 1  Sprint 2  Sprint 3  Sprint 4  Sprint 5     | |
|             |  +--------------------------------------------------------------+ |
|             |                                                                   |
|             |  +----------------------------+ +----------------------------+   |
|             |  | Issues by Status           | | Issues by Type             |   |
|             |  |                            | |                            |   |
|             |  | Done        ========== 8   | | Task      ============ 12  |   |
|             |  | In Progress ======     5   | | Bug       =====        5   |   |
|             |  | In Review   ====       4   | | Story     =======      7   |   |
|             |  | Todo        =======    7   | | Epic      ==           2   |   |
|             |  +----------------------------+ +----------------------------+   |
|             |                                                                   |
|             |  +----------------------------+ +----------------------------+   |
|             |  | Issues by Priority         | | Top Assignees              |   |
|             |  |                            | |                            |   |
|             |  | Highest     ===        3   | | @alice      ========   8   |   |
|             |  | High        ======     6   | | @bob        ======     6   |   |
|             |  | Medium      ========   8   | | @charlie    =====      5   |   |
|             |  | Low         =====      5   | | @unassigned ====       4   |   |
|             |  | Lowest      ==         2   | |                            |   |
|             |  +----------------------------+ +----------------------------+   |
|             |                                                                   |
+--------------------------------------------------------------------------------+
```

### Filter Bar Detail

```
+--------------------------------------------------------------------------------+
|                                                                                |
|  [All Issues]  [Assigned]  [Unassigned]      [Calendar] Jan 15 - Feb 5  [v]   |
|     (active)    (toggle)    (toggle)           (date range picker)            |
|                                                                                |
+--------------------------------------------------------------------------------+
```

### Stats Card Anatomy

```
+---------------------------+
|  Total Issues      [icon] |  <- Label + decorative icon
|                           |
|       24                  |  <- Large numeric value
|                           |
|  [arrow] +12%             |  <- Trend indicator (green up, red down, gray neutral)
|  vs last sprint           |  <- Comparison period label
+---------------------------+
```

### Vertical Spacing Guide

```
Top of content area
    |
    | 24px (page padding)
    |
[Page Header - Title + Subtitle]
    |
    | 8px gap
    |
[Filter Bar]
    |
    | 24px gap
    |
[Stats Cards Row] - 4 cards, gap-4 (16px between)
    |
    | 32px gap
    |
[Primary Chart - Velocity Over Time] - Full width
    |
    | 24px gap
    |
[Charts Grid Row 1] - 2 cards side by side
    |
    | 16px gap
    |
[Charts Grid Row 2] - 2 cards side by side
    |
    | 32px (bottom padding)
    |
Bottom of scroll area
```

---

## Functionality Breakdown

### Date Range Selection

- [ ] **Preset ranges**: Last 7 days, Last 14 days, Last 30 days, Last 90 days, This sprint, Last sprint, Custom
- [ ] **Custom range**: Calendar picker with start/end date selection
- [ ] **Date format**: "Jan 15 - Feb 5" display format
- [ ] **URL sync**: Date range persisted in URL params for shareability
- [ ] **Default range**: Current sprint or last 30 days if no active sprint

### Filter Toggles

- [ ] **Issue scope**: All Issues / Assigned / Unassigned
- [ ] **Issue type filter**: Filter by Task, Bug, Story, Epic
- [ ] **Assignee filter**: Filter by specific team member
- [ ] **Sprint scope**: All sprints / Active sprint / Specific sprint

### Chart Interactions

- [ ] **Hover tooltips**: Show exact values on chart hover
- [ ] **Click to drill-down**: Click bar segment to filter issue list
- [ ] **Animation on load**: Charts animate in from zero
- [ ] **Responsive**: Charts resize smoothly on window resize

### Data Export

- [ ] **Export button**: Download CSV of current view
- [ ] **Export formats**: CSV, JSON (optional PDF)
- [ ] **Scope**: Exports respect current filters and date range

### Stats Card Behaviors

- [ ] **Trend calculation**: Compare to previous equivalent period
- [ ] **Trend colors**: Green for positive, red for negative, gray for neutral
- [ ] **Click to filter**: Click card to apply that filter to charts
- [ ] **Loading skeleton**: Show placeholder while data loads

### Chart Types

| Chart | Type | Data Source |
|-------|------|-------------|
| Velocity Over Time | Area/Line chart | Sprint completion data |
| Issues by Status | Horizontal bar | Issue status counts |
| Issues by Type | Horizontal bar | Issue type counts |
| Issues by Priority | Horizontal bar | Priority distribution |
| Top Assignees | Horizontal bar | Issues per assignee |

---

## Component Inventory

| Component | Current | Target | Notes |
|-----------|---------|--------|-------|
| **Page Container** | Basic layout | Consistent with other project pages | Reuse project page shell |
| **Page Header** | Title only | Title + subtitle + filter bar | Add filter controls |
| **Stats Card** | Icon + value | Value + trend + label | Add trend indicators |
| **Date Range Picker** | None | Calendar dropdown | New component needed |
| **Filter Toggle** | None | Pill button group | Segment control pattern |
| **Horizontal Bar Chart** | Basic bars | Animated bars + tooltips | Enhance existing |
| **Area Chart** | None | Velocity line/area | New chart type |
| **Data Table** | None | Top assignees list | Simple ranked list |
| **Empty State** | Text only | Icon + text + action | "No data" illustration |
| **Export Button** | None | Icon button | Download action |

### New Components Needed

1. **DateRangePicker**: Calendar-based range selector with presets
2. **FilterToggleGroup**: Pill-style segment control
3. **StatCardWithTrend**: Value + trend indicator + label
4. **AreaChart**: Time-series visualization (Recharts or similar)
5. **ChartTooltip**: Hover state for chart data points
6. **ExportDropdown**: Download options menu

---

## Design Tokens Used

### Colors

| Element | Token | Notes |
|---------|-------|-------|
| Page background | `--color-ui-bg` | Main content area |
| Card background | `--color-ui-bg-elevated` | Stats cards, chart containers |
| Card border | `--color-ui-border` | Subtle borders |
| Card shadow | `--shadow-card` | Elevation cue |
| Card shadow (hover) | `--shadow-card-hover` | Interactive feedback |
| Title text | `--color-ui-text` | Page title |
| Subtitle text | `--color-ui-text-secondary` | Descriptions |
| Stat value | `--color-ui-text` | Large numbers |
| Stat label | `--color-ui-text-tertiary` | "vs last period" |
| Trend positive | `--color-status-success` | Green arrow up |
| Trend negative | `--color-status-error` | Red arrow down |
| Trend neutral | `--color-ui-text-tertiary` | Gray, no change |
| Chart - Status bars | `--color-palette-blue` | Issues by status |
| Chart - Type bars | `--color-palette-green` | Issues by type |
| Chart - Priority highest | `--color-palette-red` | Highest priority |
| Chart - Priority high | `--color-palette-orange` | High priority |
| Chart - Priority medium | `--color-palette-amber` | Medium priority |
| Chart - Priority low | `--color-palette-blue` | Low priority |
| Chart - Priority lowest | `--color-palette-gray` | Lowest priority |
| Velocity line | `--color-brand` | Indigo for velocity trend |
| Velocity area fill | `--color-brand-subtle` | Light indigo fill |
| Chart axis | `--color-ui-text-tertiary` | Axis labels |
| Chart grid | `--color-ui-border` | Grid lines (subtle) |
| Filter active | `--color-brand` | Selected filter button |
| Filter inactive | `--color-ui-bg-secondary` | Unselected filter |

### Typography

| Element | Size | Weight | Token |
|---------|------|--------|-------|
| Page title | 24px | 600 | `text-2xl font-semibold` |
| Page subtitle | 14px | 400 | `text-sm text-ui-text-secondary` |
| Card label | 14px | 500 | `text-sm font-medium` |
| Card value | 32px | 700 | `text-3xl font-bold` |
| Trend text | 12px | 500 | `text-xs font-medium` |
| Chart title | 16px | 600 | `text-base font-semibold` |
| Chart subtitle | 12px | 400 | `text-xs text-ui-text-secondary` |
| Axis labels | 12px | 400 | `text-xs` |
| Bar labels | 14px | 500 | `text-sm font-medium` |
| Filter button | 14px | 500 | `text-sm font-medium` |

### Spacing

| Element | Value | Token |
|---------|-------|-------|
| Page padding | 24px | `p-6` |
| Cards gap | 16px | `gap-4` |
| Card padding | 20px | `p-5` |
| Section gap | 32px | `gap-8` |
| Chart internal padding | 16px | `p-4` |
| Stats row to charts | 32px | `mb-8` |
| Filter bar gap | 12px | `gap-3` |

### Border Radius

| Element | Value | Token |
|---------|-------|-------|
| Stats card | 12px | `rounded-container` |
| Chart container | 12px | `rounded-container` |
| Filter button | 6px | `rounded-md` |
| Date picker | 8px | `rounded-lg` |
| Bar chart bars | 4px | `rounded-secondary` |

---

## Animations

### Chart Load Animation

```css
/* Bar chart - bars grow from left */
@keyframes bar-grow {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: var(--bar-width);
    opacity: 1;
  }
}

.analytics-bar {
  animation: bar-grow 0.5s ease-out forwards;
  animation-delay: calc(var(--bar-index) * 50ms);
}
```

### Number Counter Animation

```css
/* Stat card value counts up from 0 */
@keyframes count-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-value {
  animation: count-up 0.4s ease-out;
}

/* JS handles the actual number interpolation */
```

### Area Chart Draw Animation

```css
/* Velocity chart line draws from left to right */
@keyframes line-draw {
  from {
    stroke-dashoffset: var(--path-length);
  }
  to {
    stroke-dashoffset: 0;
  }
}

.velocity-line {
  stroke-dasharray: var(--path-length);
  animation: line-draw 1s ease-out forwards;
}

/* Area fill fades in after line */
.velocity-area {
  opacity: 0;
  animation: fade-in 0.3s ease-out 0.8s forwards;
}
```

### Hover Tooltip

```css
/* Chart tooltip appears on hover */
@keyframes tooltip-appear {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.chart-tooltip {
  animation: tooltip-appear 0.15s ease-out;
}
```

### Card Hover Effects

```css
.stat-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}
```

### Filter Toggle Transition

```css
.filter-toggle {
  transition: background-color 0.15s ease, color 0.15s ease;
}

.filter-toggle[data-active="true"] {
  background-color: var(--color-brand);
  color: var(--color-brand-foreground);
}
```

### Trend Indicator Pulse

```css
/* Subtle pulse on positive trends */
@keyframes trend-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.trend-positive {
  animation: trend-pulse 2s ease-in-out infinite;
}
```

### Loading Skeleton

```css
@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.analytics-skeleton {
  background: linear-gradient(
    90deg,
    var(--color-ui-bg-secondary) 25%,
    var(--color-ui-bg-tertiary) 50%,
    var(--color-ui-bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
}
```

---

## Implementation Checklist

### Phase 1: Filter Bar & Controls

- [ ] Add filter bar container below page header
- [ ] Create `DateRangePicker` component
  - [ ] Preset options dropdown (Last 7/14/30/90 days, This sprint, etc.)
  - [ ] Custom range calendar picker
  - [ ] Display selected range in button
- [ ] Create `FilterToggleGroup` component
  - [ ] Pill-style buttons
  - [ ] Active/inactive states
  - [ ] Keyboard navigation
- [ ] Wire filters to URL params for persistence
- [ ] Connect filters to data queries

### Phase 2: Stats Cards Enhancement

- [ ] Update `StatCard` component with trend indicator
  - [ ] Add trend arrow icon (up/down/neutral)
  - [ ] Add trend percentage text
  - [ ] Add comparison label ("vs last sprint")
  - [ ] Color coding for trend direction
- [ ] Implement trend calculation logic in Convex
  - [ ] Compare current period to previous equivalent
  - [ ] Handle edge cases (no previous data)
- [ ] Add loading skeleton state
- [ ] Add click-to-filter interaction

### Phase 3: Chart Improvements

- [ ] Install/configure charting library (Recharts recommended)
- [ ] Create `AreaChart` component for velocity
  - [ ] Line path animation
  - [ ] Gradient fill
  - [ ] X-axis date labels
  - [ ] Y-axis value labels
  - [ ] Hover tooltip
- [ ] Enhance `HorizontalBarChart` component
  - [ ] Animated bar growth
  - [ ] Hover state
  - [ ] Click to filter
  - [ ] Proper spacing and labels
- [ ] Add empty state component for charts with no data
- [ ] Ensure all charts respect date range filter

### Phase 4: Additional Data Views

- [ ] Create "Top Assignees" chart/list
  - [ ] Ranked by issue count
  - [ ] Avatar + name + count
  - [ ] Bar visualization
- [ ] Add burndown chart option (for active sprints)
  - [ ] Ideal line
  - [ ] Actual line
  - [ ] Remaining scope
- [ ] Consider cumulative flow diagram (stretch goal)

### Phase 5: Data Export

- [ ] Add export button to page header
- [ ] Create export dropdown menu
  - [ ] "Export as CSV"
  - [ ] "Export as JSON"
- [ ] Implement server-side data export
  - [ ] Respect current filters
  - [ ] Include metadata (date range, filters applied)
- [ ] Handle large datasets gracefully

### Phase 6: Animations & Polish

- [ ] Add bar chart entry animations
- [ ] Add number counter animation for stat values
- [ ] Add area chart line draw animation
- [ ] Implement tooltip animations
- [ ] Add card hover effects
- [ ] Add filter toggle transitions
- [ ] Add loading skeleton shimmer
- [ ] Verify all animations are smooth (60fps)

### Phase 7: Accessibility & Testing

- [ ] Add ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation for filters
- [ ] Add chart descriptions for screen readers
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Verify color contrast ratios
- [ ] Add unit tests for trend calculations
- [ ] Add E2E tests for filter interactions
- [ ] Responsive testing (mobile, tablet)

### Phase 8: Performance Optimization

- [ ] Lazy load chart library
- [ ] Memoize expensive calculations
- [ ] Add query caching for analytics data
- [ ] Implement pagination for large datasets
- [ ] Consider data aggregation for long time ranges

---

## Related Files

### Source References
- Mintlify analytics: `docs/research/library/mintlify/dashboard/analytics.png`
- Current Nixelo: `e2e/screenshots/16-filled-project-demo-analytics.png`

### Implementation Files
- Route: `src/routes/_authenticated/$slug/projects/$key/analytics.tsx` (or similar)
- Analytics queries: `convex/analytics.ts` (to be created/extended)
- Theme tokens: `src/index.css`
- UI components: `src/components/ui/`
- Chart components: `src/components/charts/` (to be created)

### Related Pages
- Project Board: `pages/08-board.md`
- Project Settings: `pages/14-project-settings.md`
- Dashboard Overview: `pages/04-dashboard.md`

---

*Last Updated: 2026-02-05*
*Status: Specification Complete - Awaiting Implementation*
