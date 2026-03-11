# Calendar Page - Current State

> **Route**: `/:slug/projects/:key/calendar` and `/:slug/workspaces/:workspaceSlug/teams/:teamSlug/calendar`
> **Status**: 🟡 NEEDS POLISH
> **Last Updated**: 2026-03-09

---

## Screenshots

| Viewport | State | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |
| Desktop | Event Modal | ![](screenshots/desktop-light-event-modal.png) |

---

## Current UI

- Calendar now sits under the same compact shared project shell as board and backlog when viewed in project context.
- The screenshot matrix captures the main calendar plus day/week/month and event-modal variants.
- The core calendar surface is functional and reviewable, but mobile still inherits too much shell before the actual calendar content starts.

---

## Recent Improvements

- Screenshot readiness around the project shell and modal states is materially more reliable than the earlier baseline.
- Project-level calendar screenshots now align with the current project header/navigation treatment.

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| Mobile project chrome still steals too much vertical space before the calendar grid | Shared project shell | HIGH |
| Day cells and event cards still need stronger visual refinement in light mode | Calendar internals | MEDIUM |
| Header controls are functional but still a little crowded on small screens | Calendar header | MEDIUM |

---

## Source Files

- `src/routes/_auth/_app/$orgSlug/projects/$key/calendar.tsx`
- `src/routes/_auth/_app/$orgSlug/projects/$key/route.tsx`
- `src/components/Calendar/CalendarView.tsx`
- `src/components/Calendar/shadcn-calendar/header/calendar-header.tsx`
