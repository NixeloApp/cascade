# Analytics Page - Implementation

> **Priority**: LOW (Phase 4 - Enhancement)
> **Scope**: Date filtering, trend indicators, chart interactivity, export
> **Estimated Complexity**: Medium-High

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/AnalyticsDashboard.tsx` | ENHANCE | Add date filter, comparison mode |
| `src/components/Analytics/MetricCard.tsx` | ENHANCE | Add trend indicator |
| `src/components/Analytics/BarChart.tsx` | ENHANCE | Add tooltips, hover states |
| `src/components/Analytics/ChartCard.tsx` | ENHANCE | Add menu (export, fullscreen) |
| `src/components/Analytics/RecentActivity.tsx` | ENHANCE | Add pagination, filters |

## New Components to Create

| Component | Purpose |
|-----------|---------|
| `src/components/Analytics/DateRangePicker.tsx` | Date range filter |
| `src/components/Analytics/CompareSelector.tsx` | Period comparison |
| `src/components/Analytics/ExportButton.tsx` | Export menu |
| `src/components/Analytics/TrendIndicator.tsx` | Up/down change |
| `src/components/Analytics/LineChart.tsx` | Time series chart |
| `src/components/Analytics/DonutChart.tsx` | Distribution chart |
| `src/components/Analytics/ChartTooltip.tsx` | Data hover display |
| `src/components/Analytics/ActivityStream.tsx` | Paginated activity |

---

## Functionality Breakdown

### Data Filtering
- [x] Basic analytics queries
- [ ] **Enhancement**: Date range filtering
- [ ] **Enhancement**: Period comparison
- [ ] **Enhancement**: Project/team filtering

### Metric Cards
- [x] Basic value display
- [x] Icon display
- [x] Warning highlight
- [ ] **Enhancement**: Trend indicator
- [ ] **Enhancement**: Comparison value
- [ ] **Enhancement**: Animated counter

### Charts
- [x] Horizontal bar chart
- [ ] **Enhancement**: Line chart for trends
- [ ] **Enhancement**: Donut chart for distribution
- [ ] **Enhancement**: Tooltips on hover
- [ ] **Enhancement**: Click to filter
- [ ] **Enhancement**: Animated entry

### Export
- [ ] CSV export
- [ ] PNG chart export
- [ ] PDF report generation

### Activity Stream
- [x] Basic activity list
- [ ] **Enhancement**: Pagination
- [ ] **Enhancement**: Type filter
- [ ] **Enhancement**: User filter

---

## Verification Checklist

### Phase 1: Date Range Picker

- [ ] Create DateRangePicker component
  - [ ] Preset options (7d, 30d, 90d)
  - [ ] Custom date selection
  - [ ] Sprint-based option
- [ ] Add to dashboard header
- [ ] Update queries with date params
- [ ] Persist selection in URL params

### Phase 2: Trend Indicators

- [ ] Create TrendIndicator component
  - [ ] Positive trend (green, up arrow)
  - [ ] Negative trend (red, down arrow)
  - [ ] Neutral (gray, dash)
  - [ ] Percentage formatting
- [ ] Add comparison data to API
- [ ] Update MetricCard to show trend
- [ ] Add pulse animation for negative trends

### Phase 3: Chart Enhancements

- [ ] Add ChartTooltip component
- [ ] Update BarChart with hover states
  - [ ] Darken bar on hover
  - [ ] Show tooltip with details
  - [ ] Add staggered entry animation
- [ ] Create LineChart component
  - [ ] SVG-based line rendering
  - [ ] Data points with hover
  - [ ] Grid lines
  - [ ] Axis labels
- [ ] Create DonutChart component
  - [ ] SVG arc segments
  - [ ] Interactive hover expansion
  - [ ] Center total label
  - [ ] Legend below

### Phase 4: Export Functionality

- [ ] Create ExportButton component
- [ ] Implement CSV export
  - [ ] Format data as CSV
  - [ ] Download trigger
- [ ] Implement PNG export
  - [ ] html2canvas for chart capture
  - [ ] Download trigger
- [ ] Add export menu to ChartCard

### Phase 5: Activity Stream

- [ ] Create ActivityStream component
- [ ] Add pagination support
- [ ] Add type filter (created, moved, commented)
- [ ] Add "Load more" button
- [ ] Show page indicator

### Phase 6: Comparison Mode

- [ ] Create CompareSelector component
- [ ] Add previous period data to API
- [ ] Show comparison values in cards
- [ ] Optional: side-by-side charts

### Phase 7: Polish & Animation

- [ ] Animated number counters
- [ ] Chart entry animations
- [ ] Skeleton loading improvements
- [ ] Empty state for no data

---

## Component Implementation

### DateRangePicker

```tsx
interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

type DateRange = {
  start: Date;
  end: Date;
  preset?: 'today' | '7d' | '30d' | '90d' | 'sprint' | 'custom';
};

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const presets = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'This sprint', value: 'sprint' },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarIcon className="w-4 h-4 mr-2" />
          {value.preset === 'custom'
            ? `${format(value.start, 'MMM d')} - ${format(value.end, 'MMM d')}`
            : presets.find(p => p.value === value.preset)?.label}
          <ChevronDownIcon className="w-4 h-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-2 space-y-1">
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onChange(getDateRangeFromPreset(preset.value))}
              className={cn(
                "w-full px-3 py-2 text-left text-sm rounded-md",
                "hover:bg-ui-bg-secondary",
                value.preset === preset.value && "bg-brand-subtle text-brand"
              )}
            >
              {preset.label}
            </button>
          ))}
          <div className="border-t border-ui-border mt-2 pt-2">
            <Calendar
              mode="range"
              selected={{ from: value.start, to: value.end }}
              onSelect={(range) => range && onChange({
                start: range.from!,
                end: range.to || range.from!,
                preset: 'custom',
              })}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### TrendIndicator

```tsx
interface TrendIndicatorProps {
  value: number;
  previousValue: number;
  format?: 'percent' | 'absolute' | 'points';
}

export function TrendIndicator({ value, previousValue, format = 'percent' }: TrendIndicatorProps) {
  const change = value - previousValue;
  const percentChange = previousValue !== 0 ? (change / previousValue) * 100 : 0;
  const isPositive = change > 0;
  const isNeutral = change === 0;

  const formatChange = () => {
    switch (format) {
      case 'percent':
        return `${isPositive ? '+' : ''}${percentChange.toFixed(1)}%`;
      case 'absolute':
        return `${isPositive ? '+' : ''}${change}`;
      case 'points':
        return `${isPositive ? '+' : ''}${change.toFixed(1)} pts`;
    }
  };

  return (
    <Flex
      align="center"
      gap="xs"
      className={cn(
        "text-xs font-medium",
        isPositive && "text-status-success",
        !isPositive && !isNeutral && "text-status-error",
        isNeutral && "text-ui-text-tertiary"
      )}
      data-positive={isPositive}
      data-negative={!isPositive && !isNeutral}
    >
      {isPositive && <TrendingUpIcon className="w-3 h-3" />}
      {!isPositive && !isNeutral && <TrendingDownIcon className="w-3 h-3" />}
      {isNeutral && <MinusIcon className="w-3 h-3" />}
      <span>{formatChange()}</span>
      <span className="text-ui-text-tertiary">vs last period</span>
    </Flex>
  );
}
```

### ChartTooltip

```tsx
interface ChartTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  value: number;
  subtitle?: string;
}

export function ChartTooltip({ visible, x, y, label, value, subtitle }: ChartTooltipProps) {
  return (
    <div
      className={cn(
        "absolute z-50 px-3 py-2 rounded-md shadow-lg",
        "bg-ui-bg-elevated border border-ui-border",
        "transition-opacity duration-150",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -100%) translateY(-8px)',
      }}
    >
      <Typography variant="small" className="font-medium">
        {label}
      </Typography>
      <Typography variant="h4" className="text-brand">
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" className="text-ui-text-secondary">
          {subtitle}
        </Typography>
      )}
    </div>
  );
}
```

### LineChart

```tsx
interface LineChartProps {
  data: Array<{ label: string; value: number }>;
  color?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
}

export function LineChart({ data, color = 'stroke-brand', showGrid = true, showTooltip = true }: LineChartProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  const width = 400;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const xScale = (i: number) => padding.left + (i / (data.length - 1)) * (width - padding.left - padding.right);
  const yScale = (v: number) => height - padding.bottom - (v / maxValue) * (height - padding.top - padding.bottom);

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.value)}`).join(' ');

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Grid lines */}
        {showGrid && (
          <g className="text-ui-border-subtle">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1={padding.left}
                x2={width - padding.right}
                y1={yScale(ratio * maxValue)}
                y2={yScale(ratio * maxValue)}
                stroke="currentColor"
                strokeDasharray="2 2"
              />
            ))}
          </g>
        )}

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          className={cn(color, "transition-all duration-500")}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={xScale(i)}
            cy={yScale(d.value)}
            r={4}
            className={cn(
              "fill-ui-bg stroke-2",
              color,
              "cursor-pointer hover:r-6 transition-all"
            )}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltip({ x: rect.left + rect.width / 2, y: rect.top, label: d.label, value: d.value });
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={xScale(i)}
            y={height - 10}
            textAnchor="middle"
            className="text-xs fill-ui-text-tertiary"
          >
            {d.label}
          </text>
        ))}
      </svg>

      {showTooltip && tooltip && (
        <ChartTooltip
          visible={true}
          x={tooltip.x}
          y={tooltip.y}
          label={tooltip.label}
          value={tooltip.value}
        />
      )}
    </div>
  );
}
```

### ExportButton

```tsx
interface ExportButtonProps {
  onExportCSV: () => void;
  onExportPNG: () => void;
}

export function ExportButton({ onExportCSV, onExportPNG }: ExportButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <DownloadIcon className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onExportCSV}>
          <FileTextIcon className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportPNG}>
          <ImageIcon className="w-4 h-4 mr-2" />
          Export as PNG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### DonutChart

```tsx
interface DonutChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  total?: string;
  showLegend?: boolean;
}

export function DonutChart({ data, total, showLegend = true }: DonutChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);
  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {data.map((d, i) => {
          const segmentLength = (d.value / totalValue) * circumference;
          const offset = currentOffset;
          currentOffset += segmentLength;

          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              className={cn(
                d.color,
                "transition-all duration-300 cursor-pointer",
                hovered === i && "stroke-[28px] opacity-90"
              )}
              strokeWidth={hovered === i ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={`${segmentLength} ${circumference}`}
              strokeDashoffset={-offset}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold fill-ui-text transform rotate-90"
        >
          {total || totalValue}
        </text>
      </svg>

      {showLegend && (
        <Flex wrap="wrap" gap="md" justify="center" className="mt-4">
          {data.map((d, i) => (
            <Flex key={i} align="center" gap="xs" className="text-sm">
              <div className={cn("w-3 h-3 rounded-full", d.color)} />
              <span className="text-ui-text-secondary">{d.label}</span>
              <span className="font-medium">{d.value}</span>
            </Flex>
          ))}
        </Flex>
      )}
    </div>
  );
}
```

---

## CSS Additions

```css
/* Chart bar animation */
@keyframes chartGrow {
  from {
    transform: scaleX(0);
    transform-origin: left;
  }
  to {
    transform: scaleX(1);
  }
}

.chart-bar-animated {
  animation: chartGrow 0.5s ease-out forwards;
  animation-delay: calc(var(--bar-index) * 0.05s);
}

/* Trend pulse for negative values */
@keyframes trendPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.trend-indicator[data-negative="true"] {
  animation: trendPulse 2s ease-in-out infinite;
}

/* Metric value counter */
@keyframes countUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.metric-value-animated {
  animation: countUp 0.4s ease-out forwards;
}

/* Chart tooltip */
.chart-tooltip {
  pointer-events: none;
}

/* Bar hover state */
.bar-segment:hover {
  filter: brightness(1.1);
}

/* Donut segment hover */
.donut-segment:hover {
  stroke-width: 28px;
}
```

---

## After Implementation

1. Run `pnpm screenshots` to regenerate
2. Test date range filtering
3. Test chart interactions
4. Test export functionality
5. Test responsive layouts
6. Run `pnpm fixme` to verify no errors
7. Run `node scripts/validate.js` for design tokens
8. Update status in `DIRECTOR.md`

---

## Visual Reference Files

| File | Description |
|------|-------------|
| `screenshots/desktop-dark.png` | Current state |
| `screenshots/reference-linear-insights.png` | Linear reference |
| `screenshots/reference-jira-reports.png` | Jira reference |
