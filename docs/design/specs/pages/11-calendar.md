# Calendar

> **Page**: Calendar (Day, Week, Month views + Event Modal)
> **Route**: `/:slug/calendar`
> **Priority**: MEDIUM
> **Status**: ANALYSIS COMPLETE

---

## Current State

### Screenshots
- Day View: `e2e/screenshots/20-filled-calendar-day.png`
- Week View: `e2e/screenshots/21-filled-calendar-week.png`
- Month View: `e2e/screenshots/22-filled-calendar-month.png`
- Event Modal: `e2e/screenshots/23-filled-calendar-event-modal.png`

### Current Implementation Analysis

#### Header Section
- Date badge with indigo background showing "FEB 03"
- "Today" button for quick navigation
- Left/right chevron arrows for date navigation
- Current date displayed as "February 3, 2026"
- View toggle (Day/Week/Month) with segmented control
- "+ Add Event" button with brand styling

#### Day View
- Single column layout spanning full width
- Time labels on left gutter (12 AM through 11 PM)
- Horizontal grid lines every hour
- Column header shows "Tue 03" with brand color highlight
- Mini calendar widget on right sidebar showing February 2026
- "No events today..." message in sidebar when empty

#### Week View
- 7-column grid (Mon-Sun)
- Column headers show abbreviated day + date number
- Current day (Tue 03) highlighted in brand color
- Time labels on left gutter (same as day view)
- Event cards displayed with:
  - Colored background (blue, orange, pink based on event type)
  - White text for event title
  - Time range below title
  - Height proportional to duration
- Events visible in current implementation:
  - "Sprint Planning" (3:00-4:00 AM, blue)
  - "Design Review" (4:30-5:30 AM, blue)
  - "Client Demo" (5:00-6:00 AM, orange)
  - "Code Review Session" (4:00-5:00 AM, blue)
  - "Gym & Wellness" (6:00-7:00 AM, pink)

#### Month View
- 7-column grid (Mon-Sun)
- Column headers show full day names
- Previous/next month dates shown in lighter color
- Current date (3) highlighted with brand circle
- Cell height uniform across all rows
- No event previews visible in current implementation

#### Event Modal
- White card with subtle shadow
- Event title "Sprint Planning" as header
- Type badge "Meeting" + status badge "Confirmed" (green)
- Date/time with calendar icon
- Organizer section with avatar, name, email
- Description text area
- Attendance tracker showing "0/3 marked"
- Attendee list with dropdown status (Not marked)
- "Delete Event" button (red/destructive)
- "Close" button (neutral)

### Issues Identified

1. **Grid density**: Time slots feel cramped, especially for 24-hour view
2. **Event cards**: Basic styling, no hover states visible
3. **Month view**: Missing event dots/previews for days with events
4. **Color palette**: Event colors feel arbitrary, not using semantic tokens
5. **Mini calendar**: Functional but lacks premium polish
6. **Modal**: Good structure but borders feel heavy
7. **Empty state**: "No events today..." is plain text, could be more engaging
8. **View toggle**: Segmented control works but could be more refined
9. **Time gutter**: Text is small and low contrast

---

## Target State

### Key Improvements

1. **Refined grid system**: Softer grid lines, better time slot spacing
2. **Premium event cards**: Subtle shadows, smooth hover states, left-accent bars
3. **Month view events**: Show event dots or mini-previews
4. **Semantic event colors**: Map to calendar event types consistently
5. **Elevated mini calendar**: Subtle border, hover states on dates
6. **Refined modal**: Reduced border weight, better spacing
7. **Empty states**: Add illustration or icon with helpful message
8. **Smooth transitions**: Animate between view changes
9. **Better typography**: Improved contrast for time labels

### Premium Polish Targets

- Grid lines: Use `border-ui-border` (subtle) instead of solid borders
- Event cards: 2px left accent bar, shadow on hover, scale micro-interaction
- View transitions: Crossfade between Day/Week/Month views
- Time labels: Use `text-ui-text-secondary` with better font weight
- Current time indicator: Red line across grid showing "now"

---

## ASCII Wireframes

### Calendar Header

```
+-----------------------------------------------------------------------------------+
|  +-------+                                                                        |
|  | FEB   |  February 2026   (9 events)                                            |
|  |  03   |                                                                        |
|  +-------+                                                                        |
|                                                                                   |
|  [Today]  < February 3, 2026 >              [Day] [Week] [Month]   [+ Add Event]  |
|                                              ^^^^^^^^^^^^^^^^^^^^                 |
|                                              Segmented control                    |
+-----------------------------------------------------------------------------------+
```

### Day View Layout

```
+-----------------------------------------------------------------------------------+
| HEADER (as above)                                                                 |
+-----------------------------------------------------------------------------------+
|         |                                        |  +-------------------+         |
|         |          Tue 03                        |  | February 2026     |         |
|         |          ======                        |  +-------------------+         |
|         |                                        |  | Su Mo Tu We Th Fr |         |
|  12 AM  |----------------------------------------|  |              1  2 |         |
|         |                                        |  |  3  4  5  6  7  8 |         |
|   1 AM  |----------------------------------------|  |  9 10 11 12 13 14 |         |
|         |                                        |  | 15 16 17 18 19 20 |         |
|   2 AM  |----------------------------------------|  | 21 22 23 24 25 26 |         |
|         |                                        |  | 27 28             |         |
|   3 AM  |----------------------------------------|  +-------------------+         |
|         |                                        |                                |
|   4 AM  |----------------------------------------|  No events today...           |
|         |                                        |  [Or event list here]          |
|   5 AM  |----------------------------------------|                                |
|         |                                        |                                |
|   ...   |          (continues to 11 PM)          |                                |
+-----------------------------------------------------------------------------------+
```

### Week View Layout

```
+-----------------------------------------------------------------------------------+
| HEADER                                                                            |
+-----------------------------------------------------------------------------------+
|         | Mon 02   | Tue 03   | Wed 04   | Thu 05   | Fri 06   | Sat 07 | Sun 08  |
|         |          |  (*)     |          |          |          |        |         |
+---------+----------+----------+----------+----------+----------+--------+---------+
|         |          |          |          |          |          |        |         |
|  12 AM  |          |          |          |          |          |        |         |
|         |          |          |          |          |          |        |         |
+---------+----------+----------+----------+----------+----------+--------+---------+
|         |          |          |          |          |          |        |         |
|   1 AM  |          |          |          |          |          |        |         |
|         |          |          |          |          |          |        |         |
+---------+----------+----------+----------+----------+----------+--------+---------+
|         |          |          |          |          |          |        |         |
|   2 AM  |          |          |          |          |          |        |         |
|         |          |          |          |          |          |        |         |
+---------+----------+----------+----------+----------+----------+--------+---------+
|         |          |+--------+|          |          |          |        |         |
|   3 AM  |          || Sprint ||          |          |          |        |         |
|         |          ||Planning||          |          |          |        |         |
|         |          ||3-4 AM  ||          |          |          |        |         |
+---------+----------++--------++----------+----------+----------+--------+---------+
|         |          |          |          |          |+--------+|        |         |
|   4 AM  |          |          |          |          || Code   ||        |         |
|         |          |+--------+|          |          || Review ||        |         |
|         |          || Design ||          |          || 4-5 AM ||        |         |
+---------+----------+| Review |+----------+----------++--------++--------+---------+
|         |          ||4:30-   ||+--------+|          |          |        |+-------+|
|   5 AM  |          ||5:30 AM ||| Client ||          |          |        || Gym & ||
|         |          |+--------+|| Demo   ||          |          |        ||Wellnes||
|         |          |          || 5-6 AM ||          |          |        || 6-7AM ||
+---------+----------+----------++--------++----------+----------+--------++-------++

(*) = Current day indicator (brand color circle on date)
```

### Event Card Detail

```
+------------------------+
|#| Sprint Planning      |   <- # = 3px left accent bar (event color)
|#| 3:00 AM - 4:00 AM    |   <- Time in smaller, muted text
+------------------------+

Hover state:
+------------------------+
|#| Sprint Planning      |   shadow-card-hover
|#| 3:00 AM - 4:00 AM    |   scale(1.02)
+------------------------+   cursor: pointer
```

### Month View Layout

```
+-----------------------------------------------------------------------------------+
| HEADER                                                                            |
+-----------------------------------------------------------------------------------+
|    Mon      |    Tue      |    Wed      |    Thu      |    Fri      |    Sat/Sun  |
+-------------+-------------+-------------+-------------+-------------+-------------+
|     26      |     27      |     28      |     29      |     30      |    31 |  1  |
|   (gray)    |   (gray)    |   (gray)    |   (gray)    |   (gray)    | (gray)|(wht)|
|             |             |             |             |             |       |     |
+-------------+-------------+-------------+-------------+-------------+-------------+
|      2      |    ( 3 )    |      4      |      5      |      6      |     7 |  8  |
|             |   *brand*   |   * * *     |             |   *         |       |     |
|             |   circle    |  (3 dots)   |             |  (1 dot)    |       |     |
+-------------+-------------+-------------+-------------+-------------+-------------+
|      9      |     10      |     11      |     12      |     13      |    14 | 15  |
|             |             |             |             |             |       |     |
|             |             |             |             |             |       |     |
+-------------+-------------+-------------+-------------+-------------+-------------+
|     16      |     17      |     18      |     19      |     20      |    21 | 22  |
|             |             |             |             |             |       |     |
|             |             |             |             |             |       |     |
+-------------+-------------+-------------+-------------+-------------+-------------+
|     23      |     24      |     25      |     26      |     27      |    28 |  1  |
|             |             |             |             |             |       |(gry)|
|             |             |             |             |             |       |     |
+-------------+-------------+-------------+-------------+-------------+-------------+

Legend:
- ( 3 ) = Current day with brand circle
- * * * = Event dots (colored by event type)
- (gray) = Adjacent month dates
```

### Event Modal

```
+--------------------------------------------------+
|                                           [X]    |
|  Sprint Planning                                 |
|                                                  |
|  [Meeting]  [Confirmed]                          |
|   ^badge     ^status badge (green)               |
|                                                  |
|  +--------------------------------------------+  |
|  | [cal] Wednesday, February 4, 2026          |  |
|  |       3:00 AM - 4:00 AM                    |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  | [avatar] Organizer                         |  |
|  |          Emily Chen                        |  |
|  |          e2e-teamlead-s0-...@mailtrap.io   |  |
|  +--------------------------------------------+  |
|                                                  |
|  Description                                     |
|  +--------------------------------------------+  |
|  | Review sprint goals and assign tasks       |  |
|  +--------------------------------------------+  |
|                                                  |
|  Attendance (0/3 marked)                         |
|  +--------------------------------------------+  |
|  | Emily Chen        [Not marked       v]     |  |
|  | Alex Rivera       [Not marked       v]     |  |
|  | Sarah Kim         [Not marked       v]     |  |
|  +--------------------------------------------+  |
|                                                  |
|  [Delete Event]                      [Close]     |
|   ^destructive                        ^neutral   |
+--------------------------------------------------+
```

---

## Functionality Breakdown

### View Switching
- [ ] Day view: Single day, full 24-hour timeline
- [ ] Week view: 7 days, scrollable time grid
- [ ] Month view: Full month grid with event indicators
- [ ] Seamless transitions between views
- [ ] Preserve scroll position when switching views
- [ ] URL reflects current view (`?view=day|week|month`)

### Navigation
- [ ] Today button: Jump to current date
- [ ] Prev/Next arrows: Navigate by day/week/month
- [ ] Mini calendar click: Jump to specific date
- [ ] Keyboard shortcuts: Arrow keys for navigation

### Event Creation
- [ ] Click on empty time slot to create event
- [ ] Drag to select time range
- [ ] Quick-add modal with minimal fields
- [ ] Full event form for detailed entry
- [ ] Recurring event support

### Event Interaction
- [ ] Click event to open detail modal
- [ ] Drag event to reschedule (day/time)
- [ ] Resize event to change duration
- [ ] Hover preview with key details
- [ ] Right-click context menu

### Event Modal
- [ ] View event details
- [ ] Edit event (inline or separate form)
- [ ] Delete event with confirmation
- [ ] RSVP/attendance tracking
- [ ] Add to external calendar

---

## Component Inventory

| Component | Current State | Target State | Notes |
|-----------|---------------|--------------|-------|
| `CalendarHeader` | Basic date badge + controls | Refined typography, better spacing | Add event count badge |
| `ViewToggle` | Segmented button group | Animated pill indicator | Smooth transition |
| `DayView` | Basic time grid | Refined grid, current time line | Add "now" indicator |
| `WeekView` | 7-column grid | Better column sizing, softer grid | Responsive columns |
| `MonthView` | Basic date grid | Event dots, hover previews | Show event count |
| `EventCard` | Colored rectangles | Left accent, shadow, hover scale | Type-based colors |
| `MiniCalendar` | Basic date picker | Refined borders, hover states | Better spacing |
| `EventModal` | Dialog with form | Refined spacing, sections | Better attendee UX |
| `TimeGutter` | Plain time labels | Better typography, contrast | Add half-hour marks |
| `DateCell` | Basic date number | Hover state, event indicators | Click to navigate |
| `EmptyState` | Plain text | Icon + message + CTA | Encourage event creation |

---

## Design Tokens Used

### Colors

| Purpose | Token | Usage |
|---------|-------|-------|
| Grid lines | `border-ui-border` | Hour/day separators |
| Time labels | `text-ui-text-secondary` | Time gutter text |
| Day headers | `text-ui-text` | Column headers |
| Current day | `bg-brand` | Circle on current date |
| Current day text | `text-brand-foreground` | White on brand circle |
| Adjacent month | `text-ui-text-tertiary` | Grayed out dates |
| Event blue | `bg-palette-blue-solid` | Meeting events |
| Event orange | `bg-palette-orange-solid` | Client events |
| Event pink | `bg-palette-pink-solid` | Personal events |
| Event purple | `bg-palette-purple-solid` | Planning events |
| Event teal | `bg-palette-teal-solid` | Review events |
| Event text | `text-ui-text-inverse` | White text on events |
| Modal background | `bg-ui-bg-elevated` | Event modal |
| Modal border | `border-ui-border` | Modal outline |

### Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Month/year header | `text-xl` | `font-semibold` | `text-ui-text` |
| Date badge day | `text-2xl` | `font-bold` | `text-brand-foreground` |
| Date badge month | `text-caption` | `font-medium` | `text-brand-foreground` |
| Day column headers | `text-sm` | `font-medium` | `text-ui-text-secondary` |
| Time gutter | `text-calendar-weekday` | `font-normal` | `text-ui-text-tertiary` |
| Event title | `text-sm` | `font-medium` | `text-ui-text-inverse` |
| Event time | `text-xs` | `font-normal` | `text-ui-text-inverse/70` |
| Modal title | `text-lg` | `font-semibold` | `text-ui-text` |

### Spacing

| Element | Value | Token |
|---------|-------|-------|
| Header padding | `16px` | `p-4` |
| Grid cell padding | `4px` | `p-1` |
| Event card padding | `8px 12px` | `px-3 py-2` |
| Modal padding | `24px` | `p-6` |
| Time gutter width | `60px` | Custom |
| Day cell height (month) | `33px` | `--spacing-calendar-day-margin` |

### Shadows

| Element | Token |
|---------|-------|
| Event card (default) | None or `shadow-soft` |
| Event card (hover) | `shadow-card-hover` |
| Modal | `shadow-elevated` |

---

## Animations

### View Transitions

```css
/* Crossfade between views */
.calendar-view-enter {
  opacity: 0;
  transform: translateY(8px);
}

.calendar-view-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}

.calendar-view-exit {
  opacity: 1;
}

.calendar-view-exit-active {
  opacity: 0;
  transition: opacity 150ms ease-in;
}
```

### Event Card Hover

```css
.event-card {
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}

.event-card:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-card-hover);
}
```

### Modal Open/Close

```css
/* Modal backdrop */
.modal-backdrop-enter {
  opacity: 0;
}

.modal-backdrop-enter-active {
  opacity: 1;
  transition: opacity 200ms ease-out;
}

/* Modal content */
.modal-content-enter {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

.modal-content-enter-active {
  opacity: 1;
  transform: scale(1) translateY(0);
  transition: all 200ms ease-out;
}

.modal-content-exit-active {
  opacity: 0;
  transform: scale(0.95);
  transition: all 150ms ease-in;
}
```

### Current Time Indicator

```css
/* Red line showing current time */
.current-time-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-status-error);
  z-index: 10;
}

.current-time-line::before {
  content: '';
  position: absolute;
  left: -4px;
  top: -3px;
  width: 8px;
  height: 8px;
  background: var(--color-status-error);
  border-radius: 50%;
}
```

### Date Navigation

```css
/* Slide animation when changing dates */
.calendar-content-prev {
  animation: slideFromLeft 200ms ease-out;
}

.calendar-content-next {
  animation: slideFromRight 200ms ease-out;
}

@keyframes slideFromLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slideFromRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
```

---

## Implementation Checklist

### Phase 1: Grid Polish
- [ ] Soften grid line colors (`border-ui-border`)
- [ ] Add subtle background alternation for even/odd hours
- [ ] Improve time gutter typography (size, weight, color)
- [ ] Add half-hour tick marks
- [ ] Implement current time indicator (red line)

### Phase 2: Event Cards
- [ ] Add 3px left accent bar based on event type
- [ ] Map event types to semantic color tokens
- [ ] Implement hover state (scale + shadow)
- [ ] Add transition animations
- [ ] Improve text hierarchy (title bold, time muted)

### Phase 3: Month View
- [ ] Add event dots below date numbers
- [ ] Implement "+N more" for days with many events
- [ ] Add hover preview tooltip
- [ ] Improve date cell hover states
- [ ] Better current day indicator

### Phase 4: Navigation & Controls
- [ ] Refine view toggle with pill indicator
- [ ] Add animation between Day/Week/Month
- [ ] Improve mini calendar styling
- [ ] Add keyboard navigation support
- [ ] Implement swipe gestures (mobile)

### Phase 5: Modal Refinement
- [ ] Reduce border weight throughout
- [ ] Improve section spacing
- [ ] Add subtle separator lines
- [ ] Refine attendee dropdown UI
- [ ] Add animation for open/close

### Phase 6: Empty States
- [ ] Design calendar icon illustration
- [ ] Add "No events" empty state with CTA
- [ ] Add "Create your first event" onboarding hint
- [ ] Subtle animation on empty state

### Phase 7: Interactions
- [ ] Implement drag to create event
- [ ] Implement drag to reschedule
- [ ] Implement resize to change duration
- [ ] Add right-click context menu
- [ ] Add undo for drag operations

### Phase 8: Accessibility
- [ ] Ensure ARIA labels on all interactive elements
- [ ] Keyboard navigation for grid cells
- [ ] Screen reader announcements for date changes
- [ ] High contrast mode support
- [ ] Focus indicators on events

---

## Related Components

- `src/components/calendar/CalendarView.tsx` - Main calendar component
- `src/components/calendar/EventCard.tsx` - Event display card
- `src/components/calendar/EventModal.tsx` - Event detail modal
- `src/components/ui/Calendar.tsx` - Mini calendar picker (shadcn)

---

## References

- Current implementation: `e2e/screenshots/20-23-*.png`
- Design tokens: `src/index.css` (see `--spacing-calendar-day-margin`, `--text-calendar-weekday`)
- Route config: `src/config/routes.ts` -> `ROUTES.calendar(slug)`

---

*Last Updated: 2026-02-05*
*Status: Analysis Complete - Ready for Implementation*
