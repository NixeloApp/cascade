# Calendar Page - Current State

> **Route**: `/:slug/projects/:key/calendar` and `/:slug/workspaces/:workspaceSlug/teams/:teamSlug/calendar`
> **Status**: 🟡 NEEDS POLISH
> **Last Updated**: Run `pnpm screenshots` to regenerate

---

## Screenshots

| Viewport | Preview |
|----------|---------|
| Desktop | ![](screenshots/desktop-dark.png) |

---

## Structure

Calendar with day/week/month views:

```
+-------------------------------------------------------------------------------------------+
| [=] Nixelo E2E                      [Commands Cmd+K] [?] [> Timer] [Search Cmd+K] [N] [AV]|
+-------------------------------------------------------------------------------------------+
| [< Projects]                                                                              |
+-------------------------------------------------------------------------------------------+
|                                                                                           |
|  +---------------------------------------------------------------------------------+      |
|  |  [< Prev]    January 2026    [Next >]           [Day] [Week] [Month]   [+ Add]  |      |
|  +---------------------------------------------------------------------------------+      |
|  |                                                                                 |      |
|  |  Mon      Tue      Wed      Thu      Fri      Sat      Sun                      |      |
|  +------+--------+--------+--------+--------+--------+--------+                    |      |
|  |      |        |        |        |        |        |        |                    |      |
|  |  29  |   30   |   31   |   1    |   2    |   3    |   4    |                    |      |
|  |      |        |        |        |        |        |        |                    |      |
|  +------+--------+--------+--------+--------+--------+--------+                    |      |
|  |      |        |        |        |        |        |        |                    |      |
|  |  5   |   6    |   7    |   8    |   9    |   10   |   11   |                    |      |
|  |      | [Evt]  |        |        |        |        |        |                    |      |
|  +------+--------+--------+--------+--------+--------+--------+                    |      |
|  |      |        |        |        |        |        |        |                    |      |
|  |  12  |   13   |   14   |   15   |   16   |   17   |   18   |                    |      |
|  |      |        |[Team]  |        |        |        |        |                    |      |
|  +------+--------+--------+--------+--------+--------+--------+                    |      |
|  |      |        |        |        |        |        |        |                    |      |
|  |  19  |   20   |   21   |   22   |   23   |   24   |   25   |                    |      |
|  |      |        |        |        |        |        |        |                    |      |
|  +------+--------+--------+--------+--------+--------+--------+                    |      |
|  |      |        |        |        |        |        |        |                    |      |
|  |  26  |   27   |   28   |   29   |   30   |   31   |   1    |                    |      |
|  |      |        |        |        |        |        |        |                    |      |
|  +------+--------+--------+--------+--------+--------+--------+                    |      |
|                                                                                           |
+-------------------------------------------------------------------------------------------+
```

---

## Current Elements

### Header Controls
- **Previous/Next buttons**: Navigate months/weeks/days
- **Date display**: Current month/week/day label
- **Mode switcher**: Day, Week, Month view toggles
- **Add event button**: Opens create event modal

### Calendar Grid
- **Day cells**: Individual day containers
- **Event cards**: Colored event indicators
- **Week header**: Day of week labels (Mon-Sun)
- **Month overflow**: Shows adjacent month days (grayed)

### Event Cards
- **Colors**: Color-coded by event type
- **Title**: Truncated event title
- **Time**: Start time (in month view), start-end (in day/week)
- **Click action**: Opens event details modal

### Week/Day Views
- **Time grid**: 24-hour vertical timeline
- **Hour markers**: Hourly time labels
- **Event positioning**: Calculated based on time/duration
- **Overlapping events**: Side-by-side layout

---

## Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/routes/_auth/_app/$orgSlug/projects/$key/calendar.tsx` | Route definition | ~30 |
| `src/components/Calendar/CalendarView.tsx` | Main calendar wrapper | ~90 |
| `src/components/Calendar/ProjectCalendar.tsx` | Project-specific wrapper | ~15 |
| `src/components/Calendar/shadcn-calendar/calendar.tsx` | Core calendar component | ~100 |
| `src/components/Calendar/shadcn-calendar/calendar-event.tsx` | Event card component | ~160 |
| `src/components/Calendar/shadcn-calendar/header/calendar-header.tsx` | Header with controls | ~80 |
| `src/components/Calendar/shadcn-calendar/body/month/calendar-body-month.tsx` | Month view grid | ~120 |
| `src/components/Calendar/shadcn-calendar/body/week/calendar-body-week.tsx` | Week view grid | ~100 |
| `src/components/Calendar/shadcn-calendar/body/day/calendar-body-day.tsx` | Day view | ~90 |
| `src/components/Calendar/CreateEventModal.tsx` | Event creation form | ~150 |
| `src/components/Calendar/EventDetailsModal.tsx` | Event detail view | ~100 |

---

## Problems

| # | Problem | Location | Severity |
|---|---------|----------|----------|
| 1 | Day cells lack visual polish | calendar-body-month.tsx | MEDIUM |
| 2 | Event cards need refinement | calendar-event.tsx | MEDIUM |
| 3 | Today indicator could be stronger | calendar-body-month.tsx | MEDIUM |
| 4 | Month navigation lacks animation | calendar-header.tsx | LOW |
| 5 | No drag-to-create events | calendar-body-*.tsx | LOW |
| 6 | No event drag-to-reschedule | calendar-event.tsx | LOW |
| 7 | Week view hour markers need polish | calendar-body-week.tsx | LOW |
| 8 | Missing mini calendar in header | calendar-header.tsx | LOW |
| 9 | No recurring event indicators | calendar-event.tsx | LOW |
| 10 | No all-day event section | calendar-body-week.tsx | LOW |

---

## Event Colors

Current color mapping (from `calendar-colors.ts`):

| Color | Background | Hover | Border | Usage |
|-------|------------|-------|--------|-------|
| blue | `bg-status-info-bg` | `hover:bg-status-info-bg/80` | `border-status-info` | Meetings |
| green | `bg-status-success-bg` | `hover:bg-status-success-bg/80` | `border-status-success` | Complete |
| yellow | `bg-status-warning-bg` | `hover:bg-status-warning-bg/80` | `border-status-warning` | Pending |
| red | `bg-status-error-bg` | `hover:bg-status-error-bg/80` | `border-status-error` | Urgent |
| purple | `bg-brand-subtle` | `hover:bg-brand-subtle/80` | `border-brand` | Default |

---

## Summary

The calendar is functional with day/week/month views and event management:
- Good foundation with shadcn-calendar base
- Event positioning works for overlapping events
- Framer Motion animations on events
- Create/edit modals functional
- Needs visual polish on day cells and events
- Could add drag interactions for creating/moving events
- Missing mini calendar date picker
