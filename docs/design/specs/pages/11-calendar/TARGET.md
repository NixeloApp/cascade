# Calendar Page - Target State

> **Route**: `/:slug/projects/:key/calendar`
> **Reference**: Google Calendar, Linear, Notion Calendar
> **Goal**: Clean calendar, smooth interactions, easy event management

---

## Reference Screenshots

| Source | Preview |
|--------|---------|
| Google Calendar | ![](screenshots/reference-google-calendar.png) |
| Linear Calendar | ![](screenshots/reference-linear-calendar.png) |

---

## Key Differences from Current

| Aspect | Current | Target |
|--------|---------|--------|
| Day cells | Basic grid | Polished with subtle borders, hover |
| Today indicator | Circle only | Circle + subtle background |
| Event cards | Basic colors | Refined with left accent stripe |
| Month navigation | Instant switch | Smooth slide animation |
| Drag interactions | None | Drag to create/reschedule |
| Mini calendar | None | Date picker in header |
| All-day events | None | Separate top section |
| Recurring events | No indicator | Repeat icon badge |

---

## Target Layout

### Month View

```
+-------------------------------------------------------------------------------------------+
|                                                                                           |
|  +---------------------------------------------------------------------------------+      |
|  | [<]  January 2026  [>]  [📅]    [Today]         [Day] [Week] [Month]   [+ Event] |      |
|  +---------------------------------------------------------------------------------+      |
|  |                                                                                 |      |
|  |  Mon        Tue        Wed        Thu        Fri        Sat        Sun          |      |
|  +-----------+-----------+-----------+-----------+-----------+-----------+---------+      |
|  |           |           |           |           |           |           |         |      |
|  |    29     |    30     |    31     |     1     |     2     |     3     |    4    |      |
|  |           |           |           |           |           |           |         |      |
|  +-----------+-----------+-----------+-----------+-----------+-----------+---------+      |
|  |           |           |           |           |           |           |         |      |
|  |     5     |     6     |     7     |     8     |     9     |    10     |   11    |      |
|  |           |  [█ Mtg]  |           |           |           |           |         |      |
|  +-----------+-----------+-----------+-----------+-----------+-----------+---------+      |
|  |           |           |           |  ┌──────────────────────────────┐ |         |      |
|  |    12     |    13     |    14     |  │ Sprint Planning (3 days)    │ |   18    |      |
|  |           |           |  [█Team]  |  └──────────────────────────────┘ |         |      |
|  +-----------+-----------+-----------+-----------+-----------+-----------+---------+      |
|  |           |           |           |           |           |           |         |      |
|  |    19     |    20     |  ⬤ 21    |    22     |    23     |    24     |   25    |      |
|  |           |           | (today)   |           |           |           |         |      |
|  +-----------+-----------+-----------+-----------+-----------+-----------+---------+      |
|  |           |           |           |           |           |           |         |      |
|  |    26     |    27     |    28     |    29     |    30     |    31     |    1    |      |
|  |           |           |           |           |           |           | (gray)  |      |
|  +-----------+-----------+-----------+-----------+-----------+-----------+---------+      |
|                                                                                           |
+-------------------------------------------------------------------------------------------+

Legend:
[█ Mtg] = Event card with left accent stripe
⬤ 21   = Today indicator (filled circle + day number)
(gray)  = Adjacent month days (dimmed)
```

### Week View

```
+-------------------------------------------------------------------------------------------+
|  [<]  Jan 19 - 25, 2026  [>]  [📅]    [Today]     [Day] [Week] [Month]   [+ Event]        |
+-------------------------------------------------------------------------------------------+
|         | Mon 19  | Tue 20  | Wed 21  | Thu 22  | Fri 23  | Sat 24  | Sun 25  |           |
|         |         |         | (today) |         |         |         |         |           |
+---------+---------+---------+---------+---------+---------+---------+---------+-----------+
| All Day |         |         |         | [████ Company Offsite ████████████] |             |
+---------+---------+---------+---------+---------+---------+---------+---------+-----------+
|  8 AM   |         |         |         |         |         |         |         |           |
|         |         |         |         |         |         |         |         |           |
+---------+---------+---------+---------+---------+---------+---------+---------+-----------+
|  9 AM   | +-------+         |         |         |         |         |         |           |
|         | |Standup|         |         |         |         |         |         |           |
|         | | 9-9:30|         |         |         |         |         |         |           |
|         | +-------+         |         |         |         |         |         |           |
+---------+---------+---------+---------+---------+---------+---------+---------+-----------+
| 10 AM   |         |         | +-------+         |         |         |         |           |
|         |         |         | |1:1    |         |         |         |         |           |
|         |         |         | |10-11  |         |         |         |         |           |
|         |         |         | +-------+         |         |         |         |           |
+---------+---------+---------+---------+---------+---------+---------+---------+-----------+
| 11 AM   |         |         |         |         |         |         |         |           |
|         |         |         |         |         |         |         |         |           |
```

### Day View

```
+-------------------------------------------------------------------------------------------+
|  [<]  Wednesday, January 21, 2026  [>]  [📅]    [Today]   [Day] [Week] [Month]   [+ Event]|
+-------------------------------------------------------------------------------------------+
|         |  Wednesday, Jan 21 (Today)                                                      |
+---------+---------------------------------------------------------------------------------+
| All Day |  [████ Company Offsite ████]                                                    |
+---------+---------------------------------------------------------------------------------+
|  8 AM   |                                                                                 |
|         |                                                                                 |
+---------+---------------------------------------------------------------------------------+
|  9 AM   |  +----------------------------------------------------------------------+       |
|         |  |  Daily Standup                                               9:00 AM |       |
|         |  |  🔄 Repeats weekly                                                   |       |
|         |  +----------------------------------------------------------------------+       |
+---------+---------------------------------------------------------------------------------+
| 10 AM   |  +----------------------------------------------------------------------+       |
|         |  |  1:1 with Sarah                                           10:00 AM  |       |
|         |  |  📍 Zoom                                                             |       |
|         |  |                                                                      |       |
|         |  +----------------------------------------------------------------------+       |
+---------+---------------------------------------------------------------------------------+
```

---

## Design Tokens

### Background Colors

| Element | Token | Notes |
|---------|-------|-------|
| Calendar bg | `bg-ui-bg` | Main background |
| Header bg | `bg-ui-bg-secondary` | Subtle header |
| Day cell bg | `bg-ui-bg` | Default cell |
| Day cell hover | `bg-ui-bg-secondary` | Hover state |
| Today bg | `bg-brand-subtle` | Subtle highlight |
| Adjacent month | `bg-ui-bg` | Same bg, dimmed text |
| Event card bg | Per event color | See event colors |

### Border Colors

| Element | Token |
|---------|-------|
| Grid lines | `border-ui-border` |
| Day cell | `border-ui-border-subtle` |
| Event card | `border-transparent` |
| Today cell | `border-brand` |

### Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Header month/year | `text-lg` | 600 | `text-ui-text` |
| Day of week | `text-xs` | 500 | `text-ui-text-secondary` |
| Day number | `text-sm` | 500 | `text-ui-text` |
| Day number (adjacent) | `text-sm` | 400 | `text-ui-text-tertiary` |
| Event title | `text-xs` | 500 | Event text color |
| Event time | `text-xs` | 400 | Event text color (dimmed) |
| Hour marker | `text-xs` | 400 | `text-ui-text-tertiary` |

### Spacing

| Element | Value | Token |
|---------|-------|-------|
| Day cell min-height | 100px | `min-h-[100px]` |
| Day cell padding | 8px | `p-2` |
| Event card padding | 4px 8px | `px-2 py-1` |
| Event gap | 2px | `gap-0.5` |
| Hour row height | 64px | `h-16` |
| Grid gap | 0 | Borders only |

---

## Animations

### Month Navigation Slide

```css
@keyframes slideOutLeft {
  from {
    opacity: 1;
    transform: translateX(0);
  }
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
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.calendar-body[data-direction="prev"] {
  animation: slideOutLeft 0.2s ease-out, slideInRight 0.2s ease-out 0.2s;
}

.calendar-body[data-direction="next"] {
  animation: slideOutRight 0.2s ease-out, slideInLeft 0.2s ease-out 0.2s;
}
```

### Event Card Hover

```css
.event-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.event-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.event-card:active {
  transform: scale(0.98);
}
```

### Day Cell Hover

```css
.day-cell {
  transition: background-color 0.15s ease;
}

.day-cell:hover {
  background-color: var(--color-ui-bg-secondary);
}

.day-cell[data-today="true"] {
  background-color: var(--color-brand-subtle);
}
```

### Drag Preview

```css
.event-card[data-dragging="true"] {
  opacity: 0.7;
  transform: rotate(-2deg) scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 100;
}

.day-cell[data-drop-target="true"] {
  background-color: var(--color-brand-subtle);
  outline: 2px dashed var(--color-brand);
  outline-offset: -2px;
}
```

### Today Pulse

```css
@keyframes today-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(var(--color-brand-rgb), 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(var(--color-brand-rgb), 0); }
}

.today-indicator {
  animation: today-pulse 2s ease-in-out infinite;
}
```

---

## Event Card Variants

### Month View Event

```
+---------------------------+
| █ Team Meeting  9:00 AM   |
+---------------------------+
   ↑ Left accent stripe (4px)
```

### Week/Day View Event

```
+-----------------------------+
| █                           |
| █  Sprint Planning          |
| █  10:00 AM - 11:00 AM      |
| █  🔄  📍 Room 204          |
| █                           |
+-----------------------------+
```

### Multi-day Event (spans cells)

```
+--------------------------------------------------+
| ████ Company Offsite (Jan 22-24) ████████████████ |
+--------------------------------------------------+
```

---

## Component Inventory

### New Components Needed

| Component | Purpose |
|-----------|---------|
| `MiniCalendar.tsx` | Date picker popover |
| `TodayButton.tsx` | Jump to today button |
| `AllDaySection.tsx` | All-day events row |
| `DragPreview.tsx` | Event drag ghost |
| `DropIndicator.tsx` | Drop target highlight |
| `EventPopover.tsx` | Quick event preview |
| `RecurringBadge.tsx` | Repeat icon indicator |

### Existing to Enhance

| Component | Changes |
|-----------|---------|
| `calendar-event.tsx` | Add accent stripe, drag handlers |
| `calendar-body-month.tsx` | Add drop targets, cell polish |
| `calendar-body-week.tsx` | Add all-day section, time polish |
| `calendar-header.tsx` | Add mini calendar, today button |
| `CreateEventModal.tsx` | Add recurring options |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` / `→` | Previous/next period |
| `T` | Jump to today |
| `D` | Day view |
| `W` | Week view |
| `M` | Month view |
| `N` | New event |
| `Enter` | Open selected event |
| `Delete` | Delete selected event |

---

## Drag Interactions

### Drag to Create (Day/Week view)

1. Click and drag on empty time slot
2. Shows ghost event preview
3. Release to open create modal with prefilled time

### Drag to Reschedule

1. Drag existing event
2. Shows drag preview (rotated, elevated)
3. Drop on new day/time
4. Updates event via mutation
5. Optimistic update with rollback on error

### Drag to Resize (Day/Week view)

1. Drag bottom edge of event
2. Shows resize cursor
3. Updates duration on release

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Day view default, swipe navigation |
| Tablet (768-1024px) | Week view with narrow columns |
| Desktop (>1024px) | Full layout, all features |

---

## Accessibility

- Arrow key navigation between days
- Screen reader announces event details
- Focus visible on all interactive elements
- Drag operations have keyboard alternatives
- Color not sole indicator (icons/text too)
- High contrast mode support
