# Analytics Page - Target State

> **Route**: `/:slug/projects/:key/analytics`
> **Reference**: Linear insights, Jira reports, Plausible analytics
> **Goal**: Clear data visualization, actionable insights, export options

---

## Reference Screenshots

| Source | Preview |
|--------|---------|
| Linear Insights | ![](screenshots/reference-linear-insights.png) |
| Jira Reports | ![](screenshots/reference-jira-reports.png) |

---

## Key Differences from Current

| Aspect | Current | Target |
|--------|---------|--------|
| Date filter | None | Date range picker |
| Metrics | Static values | Trend indicators (+/-%) |
| Charts | Basic bars | Interactive with tooltips |
| Comparison | None | Previous period comparison |
| Export | None | CSV/PNG download |
| Chart types | Horizontal bars only | Bars, lines, donut |
| Activity | Simple list | Paginated with filters |

---

## Target Layout

```
+-------------------------------------------------------------------------------------------+
| [=] Nixelo                          [Commands Cmd+K] [?] [> Timer] [Search Cmd+K] [N] [AV]|
+-------------------------------------------------------------------------------------------+
|                                                                                           |
|  Analytics                                        [Last 30 days ▼]  [Compare ▼]  [Export] |
|  Project insights and progress metrics                                                    |
|                                                                                           |
|  +----------------+ +----------------+ +----------------+ +----------------+               |
|  | Total Issues   | | Completed      | | Avg Velocity   | | Cycle Time     |               |
|  |                | |                | |                | |                |               |
|  |      142       | |       68       | |     14.2       | |    3.5 days    |               |
|  |   ▲ 12% vs     | |   ▲ 8% vs      | |   ▲ 2.1 pts    | |   ▼ 0.5 days   |               |
|  |   last month   | |   last month   | |   last month   | |   last month   |               |
|  +----------------+ +----------------+ +----------------+ +----------------+               |
|                                                                                           |
|  +------------------------------------+ +------------------------------------+             |
|  | Burndown Chart                  [⋮]| | Velocity Trend                  [⋮]|             |
|  +------------------------------------+ +------------------------------------+             |
|  |                                    | |                                    |             |
|  |   \                                | |      ___/\                         |             |
|  |    \___                            | |     /    \___                      |             |
|  |        \___                        | |    /         \                     |             |
|  |            \_____                  | |___/           \___                 |             |
|  |                  \____             | |                                    |             |
|  | [tooltip: 24 issues remaining]     | | [tooltip: Sprint 6: 14 points]     |             |
|  +------------------------------------+ +------------------------------------+             |
|                                                                                           |
|  +------------------------------------+ +------------------------------------+             |
|  | Issues by Status               [⋮] | | Issues by Type                 [⋮] |             |
|  +------------------------------------+ +------------------------------------+             |
|  |                                    | |                                    |             |
|  |  ┌─────────────────────────┐       | |  ┌──────────────────────────────┐  |             |
|  |  │    ●────● Backlog (32)  │       | |  │         Task (42)            │  |             |
|  |  │    │                    │       | |  │    ┌──────┬──────┐           │  |             |
|  |  │    ●────● In Prog (24)  │       | |  │    │ Bug  │Story │           │  |             |
|  |  │    │                    │       | |  │    │ (28) │ (18) │  Epic (8) │  |             |
|  |  │    ●────● Done (68)     │       | |  │    └──────┴──────┘           │  |             |
|  |  └─────────────────────────┘       | |  └──────────────────────────────┘  |             |
|  |     (Interactive donut)            | |     (Stacked bar or treemap)       |             |
|  +------------------------------------+ +------------------------------------+             |
|                                                                                           |
|  +--------------------------------------------------------------------------+             |
|  | Team Workload                                                         [⋮] |             |
|  +--------------------------------------------------------------------------+             |
|  |  Alice      ████████████████████  24   [▲ 4]                              |             |
|  |  Bob        ████████████████  20        [▼ 2]                             |             |
|  |  Charlie    ████████████  16            [─ 0]                             |             |
|  |  Diana      ████████  12                [▲ 3]                             |             |
|  |                                                                           |             |
|  |  [View all team members →]                                                |             |
|  +--------------------------------------------------------------------------+             |
|                                                                                           |
|  +--------------------------------------------------------------------------+             |
|  | Activity Stream                  [All ▼] [Filter ▼]               [1 of 5]|             |
|  +--------------------------------------------------------------------------+             |
|  | [AV] John moved PROJ-123 to Done                           2 hours ago    |             |
|  | [AV] Sarah created PROJ-124                                3 hours ago    |             |
|  | [AV] Mike commented on PROJ-100                            5 hours ago    |             |
|  |                                                                           |             |
|  |                           [Load more]                                     |             |
|  +--------------------------------------------------------------------------+             |
|                                                                                           |
+-------------------------------------------------------------------------------------------+
```

---

## Design Tokens

### Background Colors

| Element | Token | Notes |
|---------|-------|-------|
| Page bg | `bg-ui-bg-secondary` | Subtle background |
| Card bg | `bg-ui-bg` | White/dark card |
| Metric card bg | `bg-ui-bg` | Same as card |
| Chart bg | `bg-ui-bg` | Clean canvas |
| Hover state | `bg-ui-bg-tertiary` | Subtle highlight |

### Border Colors

| Element | Token |
|---------|-------|
| Card border | `border-ui-border` |
| Chart grid | `border-ui-border-subtle` |
| Dividers | `border-ui-border` |

### Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page title | `text-2xl` | 600 | `text-ui-text` |
| Card title | `text-sm` | 500 | `text-ui-text-secondary` |
| Metric value | `text-3xl` | 700 | `text-ui-text` |
| Trend indicator | `text-xs` | 500 | `text-status-success/error` |
| Chart label | `text-xs` | 400 | `text-ui-text-secondary` |
| Chart value | `text-sm` | 600 | `text-ui-text` |
| Tooltip text | `text-xs` | 400 | `text-white` |

### Spacing

| Element | Value | Token |
|---------|-------|-------|
| Page max-width | 1280px | `max-w-7xl` |
| Card padding | 24px | `p-6` |
| Grid gap | 24px | `gap-6` |
| Metric card padding | 24px | `p-6` |
| Chart height | 200-280px | `h-52` to `h-70` |

---

## Animations

### Chart Entry

```css
@keyframes chartGrow {
  from {
    opacity: 0;
    transform: scaleY(0);
    transform-origin: bottom;
  }
  to {
    opacity: 1;
    transform: scaleY(1);
  }
}

.chart-bar {
  animation: chartGrow 0.5s ease-out forwards;
  animation-delay: calc(var(--bar-index) * 0.05s);
}
```

### Trend Indicator

```css
@keyframes trendPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.trend-indicator[data-positive="true"] {
  color: var(--color-status-success);
}

.trend-indicator[data-negative="true"] {
  color: var(--color-status-error);
  animation: trendPulse 2s ease-in-out infinite;
}
```

### Tooltip Fade

```css
.chart-tooltip {
  opacity: 0;
  transition: opacity 0.15s ease, transform 0.15s ease;
  transform: translateY(4px);
}

.chart-tooltip.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Number Counter

```css
@keyframes countUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.metric-value {
  animation: countUp 0.4s ease-out forwards;
}
```

---

## Metric Card Variants

### Standard Metric

```
+---------------------------+
|  Total Issues             |
|                           |
|         142               |
|                           |
|  ▲ 12% vs last month      |
+---------------------------+
```

### Metric with Subtitle

```
+---------------------------+
|  Avg Velocity             |
|                           |
|        14.2               |
|     points/sprint         |
|                           |
|  ▲ 2.1 pts vs last month  |
+---------------------------+
```

### Metric with Warning

```
+---------------------------+ <- ring-2 ring-status-warning
|  Unassigned               |
|                           |
|          8                |
|   needs attention         |
|                           |
+---------------------------+
```

---

## Chart Types

### Line Chart (Burndown/Trend)

```
  ^
  |   \
  |    \___
  |        \___
  |            \_____
  |                  \____
  +-------------------------->
     Week 1  Week 2  Week 3

Features:
- Smooth curve interpolation
- Hover shows data point tooltip
- Grid lines at intervals
- Axis labels
```

### Horizontal Bar Chart (Status/Type)

```
  Backlog    ████████████████████████  32
  In Prog    ████████████████  24
  Review     ████████  12
  Done       ██████████████████████████████████████  68

Features:
- Animated entry
- Hover highlight (darken)
- Value labels
- Click to filter
```

### Donut Chart (Distribution)

```
     ┌─────────────────┐
     │     Done        │
     │     ┌───┐       │
     │   ┌─┤   ├─┐     │
     │   │ │   │ │     │
     │   └─┤   ├─┘     │
     │     └───┘       │
     │  Backlog  Prog  │
     └─────────────────┘

Features:
- Interactive segments
- Hover to expand segment
- Center label shows total
- Legend below
```

---

## Component Inventory

### New Components Needed

| Component | Purpose |
|-----------|---------|
| `DateRangePicker.tsx` | Filter by date range |
| `CompareSelector.tsx` | Previous period selector |
| `ExportButton.tsx` | Export menu (CSV, PNG) |
| `TrendIndicator.tsx` | Up/down percentage change |
| `LineChart.tsx` | Time series visualization |
| `DonutChart.tsx` | Distribution visualization |
| `ChartTooltip.tsx` | Hover data display |
| `ActivityStream.tsx` | Paginated activity list |

### Existing to Enhance

| Component | Changes |
|-----------|---------|
| `AnalyticsDashboard.tsx` | Add date filter, comparison |
| `MetricCard.tsx` | Add trend indicator |
| `BarChart.tsx` | Add tooltips, interactivity |
| `ChartCard.tsx` | Add menu (export, fullscreen) |
| `RecentActivity.tsx` | Add pagination, filters |

---

## Date Range Options

| Option | Value |
|--------|-------|
| Today | Current day |
| Last 7 days | Past week |
| Last 30 days | Past month (default) |
| Last 90 days | Past quarter |
| This sprint | Current sprint dates |
| Custom | Date picker |

---

## Export Options

| Format | Contents |
|--------|----------|
| CSV | Raw data table |
| PNG | Chart image |
| PDF | Full report |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `R` | Refresh data |
| `E` | Export menu |
| `←` / `→` | Change date range |
| `Escape` | Close tooltip/modal |

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Single column, stacked cards |
| Tablet (768-1024px) | 2-column grid |
| Desktop (>1024px) | Full 4-column metrics, 2-column charts |

---

## Accessibility

- Charts have screen reader descriptions
- Keyboard navigable data points
- Color not sole indicator (patterns/labels)
- High contrast mode support
- Focus visible on interactive elements
