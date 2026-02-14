# Calendar Page - Implementation

> **Priority**: MEDIUM (Phase 3 - Enhancement)
> **Scope**: Event cards, day cells, drag interactions, mini calendar
> **Estimated Complexity**: Medium-High

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/Calendar/CalendarView.tsx` | ENHANCE | Add drag state management |
| `src/components/Calendar/shadcn-calendar/calendar.tsx` | ENHANCE | Add context for drag operations |
| `src/components/Calendar/shadcn-calendar/calendar-event.tsx` | ENHANCE | Add accent stripe, drag handlers |
| `src/components/Calendar/shadcn-calendar/body/month/calendar-body-month.tsx` | POLISH | Cell styling, drop targets |
| `src/components/Calendar/shadcn-calendar/body/week/calendar-body-week.tsx` | ENHANCE | All-day section, polish |
| `src/components/Calendar/shadcn-calendar/body/day/calendar-body-day.tsx` | POLISH | Time grid polish |
| `src/components/Calendar/shadcn-calendar/header/calendar-header.tsx` | ENHANCE | Mini calendar, today button |
| `src/components/Calendar/CreateEventModal.tsx` | ENHANCE | Recurring options |

## New Components to Create

| Component | Purpose |
|-----------|---------|
| `src/components/Calendar/MiniCalendar.tsx` | Date picker popover |
| `src/components/Calendar/TodayButton.tsx` | Jump to today |
| `src/components/Calendar/AllDaySection.tsx` | All-day events row |
| `src/components/Calendar/EventPopover.tsx` | Quick event preview |
| `src/components/Calendar/RecurringBadge.tsx` | Repeat indicator |
| `src/components/Calendar/DragLayer.tsx` | Custom drag preview |

---

## Functionality Breakdown

### Event Display
- [x] Basic event cards with colors
- [x] Event positioning for overlapping
- [x] Click to open details modal
- [ ] **Enhancement**: Left accent stripe
- [ ] **Enhancement**: Event popover on hover
- [ ] **Enhancement**: Recurring event badge
- [ ] **Enhancement**: Multi-day event spanning

### Calendar Navigation
- [x] Previous/next navigation
- [x] Mode switching (day/week/month)
- [ ] **Enhancement**: Today button
- [ ] **Enhancement**: Mini calendar date picker
- [ ] **Enhancement**: Slide animation on navigate
- [ ] **Enhancement**: Keyboard shortcuts

### Day Cells
- [x] Basic grid layout
- [x] Day numbers
- [ ] **Polish**: Cell hover states
- [ ] **Polish**: Today highlight with subtle bg
- [ ] **Polish**: Adjacent month day styling
- [ ] **Enhancement**: Click to create event

### Drag Interactions
- [ ] Drag event to reschedule
- [ ] Drag to resize event (week/day view)
- [ ] Drag to create event (week/day view)
- [ ] Drop target highlighting
- [ ] Optimistic updates

---

## Verification Checklist

### Phase 1: Event Card Polish

- [ ] Add left accent stripe (4px, event color)
- [ ] Implement hover lift effect
- [ ] Add active state (scale down)
- [ ] Add recurring badge icon
- [ ] Style event time display
- [ ] Handle truncation for long titles

### Phase 2: Day Cell Polish

- [ ] Add subtle border to cells
- [ ] Implement hover background
- [ ] Enhance today indicator
  - [ ] Circle around day number
  - [ ] Subtle background on cell
  - [ ] Optional: pulse animation
- [ ] Style adjacent month days (dimmed)
- [ ] Add click-to-create on empty cell

### Phase 3: Header Enhancements

- [ ] Create TodayButton component
- [ ] Create MiniCalendar component
  - [ ] Popover trigger (calendar icon)
  - [ ] Month grid with day selection
  - [ ] Navigation within popover
  - [ ] Click to jump to date
- [ ] Add navigation slide animation
- [ ] Implement keyboard shortcuts

### Phase 4: All-Day Events

- [ ] Create AllDaySection component
- [ ] Position at top of week/day view
- [ ] Support multi-day events spanning
- [ ] Collapsible if many events
- [ ] "Show more" overflow handling

### Phase 5: Drag to Reschedule

- [ ] Add drag handlers to EventCard
- [ ] Create custom DragLayer component
- [ ] Style dragging state (opacity, rotation)
- [ ] Add drop targets to day cells
- [ ] Highlight valid drop zones
- [ ] Implement drop handler
- [ ] Add optimistic update
- [ ] Handle error with rollback

### Phase 6: Drag to Create

- [ ] Add mousedown handler to time slots
- [ ] Track drag selection range
- [ ] Show ghost preview during drag
- [ ] Calculate start/end time from position
- [ ] Open create modal on release
- [ ] Pre-fill time from drag range

### Phase 7: Event Popover

- [ ] Create EventPopover component
- [ ] Show on hover with delay (300ms)
- [ ] Display event details
- [ ] Quick actions (edit, delete)
- [ ] Position smart (avoid edges)
- [ ] Keyboard accessible

### Phase 8: Responsive & A11y

- [ ] Mobile: Default to day view
- [ ] Mobile: Swipe navigation
- [ ] Tablet: Narrow columns
- [ ] Arrow key navigation
- [ ] Focus management
- [ ] Screen reader labels
- [ ] Reduced motion support

---

## Component Implementation

### EventCard with Accent Stripe

```tsx
export function CalendarEvent({ event, month = false }: Props) {
  const colors = getEventColorClasses(event.color);

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden cursor-pointer rounded-md",
        month ? "px-2 py-0.5" : "px-3 py-1.5",
        colors.bg,
        "hover:shadow-md hover:-translate-y-0.5",
        "active:scale-[0.98]",
        "transition-all duration-150"
      )}
      style={!month ? calculateEventPosition(event, allEvents) : {}}
      onClick={() => onEventClick(event)}
      draggable
      onDragStart={(e) => handleDragStart(e, event)}
    >
      {/* Left accent stripe */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          colors.accent
        )}
      />

      <div className={cn("pl-2", colors.text)}>
        <Typography variant="small" className="font-medium truncate">
          {event.title}
        </Typography>
        <Flex align="center" gap="xs" className="text-xs opacity-80">
          <time>{format(event.start, "h:mm a")}</time>
          {event.isRecurring && <RecurringBadge />}
        </Flex>
      </div>
    </motion.div>
  );
}
```

### MiniCalendar

```tsx
export function MiniCalendar({ value, onChange }: Props) {
  const [month, setMonth] = useState(startOfMonth(value));
  const days = eachDayOfInterval({
    start: startOfWeek(month, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <CalendarIcon className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        {/* Month navigation */}
        <Flex justify="between" align="center" className="mb-2">
          <Button variant="ghost" size="icon-sm" onClick={() => setMonth(subMonths(month, 1))}>
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          <Typography variant="small" className="font-medium">
            {format(month, "MMMM yyyy")}
          </Typography>
          <Button variant="ghost" size="icon-sm" onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </Flex>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0 mb-1">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
            <Typography key={i} variant="caption" className="text-center text-ui-text-tertiary">
              {day}
            </Typography>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-0">
          {days.map((day) => (
            <button
              key={day.toISOString()}
              onClick={() => {
                onChange(day);
                setMonth(startOfMonth(day));
              }}
              className={cn(
                "w-8 h-8 rounded-full text-sm",
                "hover:bg-ui-bg-secondary",
                !isSameMonth(day, month) && "text-ui-text-tertiary",
                isSameDay(day, value) && "bg-brand text-white",
                isToday(day) && !isSameDay(day, value) && "ring-1 ring-brand"
              )}
            >
              {format(day, "d")}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### TodayButton

```tsx
export function TodayButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="text-xs"
    >
      Today
    </Button>
  );
}
```

### AllDaySection

```tsx
interface AllDaySectionProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  days: Date[];
}

export function AllDaySection({ events, onEventClick, days }: AllDaySectionProps) {
  const [expanded, setExpanded] = useState(false);
  const maxVisible = 2;
  const hasMore = events.length > maxVisible;

  const visibleEvents = expanded ? events : events.slice(0, maxVisible);

  return (
    <div className="border-b border-ui-border bg-ui-bg-secondary">
      <Flex align="center" className="h-8 px-2">
        <Typography variant="caption" className="text-ui-text-tertiary w-16">
          All day
        </Typography>

        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
          {visibleEvents.map((event) => (
            <AllDayEventCard
              key={event.id}
              event={event}
              days={days}
              onClick={() => onEventClick(event)}
            />
          ))}
        </div>
      </Flex>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-brand hover:underline px-2 pb-1"
        >
          {expanded ? "Show less" : `+${events.length - maxVisible} more`}
        </button>
      )}
    </div>
  );
}
```

### RecurringBadge

```tsx
export function RecurringBadge() {
  return (
    <Tooltip content="Recurring event">
      <RepeatIcon className="w-3 h-3 text-current opacity-70" />
    </Tooltip>
  );
}
```

### DragLayer

```tsx
export function CalendarDragLayer() {
  const { item, isDragging, currentOffset } = useDragLayer();

  if (!isDragging || !currentOffset) {
    return null;
  }

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: currentOffset.x,
        top: currentOffset.y,
        transform: "rotate(-2deg) scale(1.02)",
      }}
    >
      <div className={cn(
        "px-3 py-1.5 rounded-md shadow-lg",
        "bg-brand text-white opacity-90"
      )}>
        <Typography variant="small" className="font-medium">
          {item.title}
        </Typography>
      </div>
    </div>
  );
}
```

---

## CSS Additions

```css
/* Event card accent stripe */
.event-card-accent {
  position: relative;
  overflow: hidden;
}

.event-card-accent::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: var(--event-accent-color);
}

/* Day cell hover */
.calendar-day-cell {
  transition: background-color 0.15s ease;
}

.calendar-day-cell:hover {
  background-color: var(--color-ui-bg-secondary);
}

/* Today cell */
.calendar-day-cell[data-today="true"] {
  background-color: var(--color-brand-subtle);
}

.today-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--color-brand);
  color: white;
  font-weight: 600;
}

/* Navigation slide */
@keyframes slideOutLeft {
  to {
    opacity: 0;
    transform: translateX(-20px);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
}

.calendar-animate-prev {
  animation: slideOutLeft 0.15s ease-out forwards;
}

.calendar-animate-next-enter {
  animation: slideInRight 0.15s ease-out forwards;
}

.calendar-animate-prev,
.calendar-animate-next-enter,
.calendar-day-cell,
.event-card,
.folder-content,
.chevron-icon,
.row-actions {
  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
}

/* Drag states */
.event-card[data-dragging="true"] {
  opacity: 0.5;
}

.calendar-day-cell[data-drop-target="true"] {
  background-color: var(--color-brand-subtle);
  outline: 2px dashed var(--color-brand);
  outline-offset: -2px;
}

/* All-day event spanning */
.all-day-event {
  position: relative;
  z-index: 1;
}

.all-day-event[data-spans-start="true"] {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}

.all-day-event[data-spans-end="true"] {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

/* Hour grid polish */
.hour-marker {
  color: var(--color-ui-text-tertiary);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.hour-line {
  border-top: 1px solid var(--color-ui-border-subtle);
}

.current-time-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--color-status-error);
}

.current-time-line::before {
  content: '';
  position: absolute;
  left: -4px;
  top: -3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-status-error);
}
```

---

## After Implementation

1. Run `pnpm screenshots` to regenerate
2. Test all view modes (day/week/month)
3. Test drag interactions
4. Test keyboard navigation
5. Test on mobile (day view default)
6. Run `pnpm fixme` to verify no errors
7. Run `node scripts/validate.js` for design tokens
8. Update status in `DIRECTOR.md`

---

## Visual Reference Files

| File | Description |
|------|-------------|
| `screenshots/desktop-dark.png` | Current state |
| `screenshots/reference-google-calendar.png` | Google Calendar reference |
| `screenshots/reference-linear-calendar.png` | Linear calendar reference |
