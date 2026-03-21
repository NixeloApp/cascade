# Calendar Page - Current State

> **Route**: `/:slug/projects/:key/calendar` and `/:slug/workspaces/:workspaceSlug/teams/:teamSlug/calendar`
> **Status**: 🟡 NEEDS POLISH
> **Last Updated**: 2026-03-12


> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

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
- The core calendar surface is now both functional and reviewable across day, week, and month, including mobile month/week states that previously failed to show useful event content.

---

## Recent Improvements

- Screenshot readiness around the project shell and modal states is materially more reliable than the earlier baseline.
- Project-level calendar screenshots now align with the current project header/navigation treatment.
- Mobile week/day now anchor onto the active event column instead of rendering events offscreen.
- Month view now stays a real month grid at mobile sizes and uses compact event indicators instead of reading as an empty list.
- The shared calendar header is lighter on small screens, so the grid starts earlier in the viewport.

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| Mobile project chrome is improved but still uses more height than ideal before the calendar work surface begins | Shared project shell | MEDIUM |
| Day cells and event cards still need stronger light-mode refinement to feel intentional rather than merely valid | Calendar internals | MEDIUM |
| Desktop light-mode month view still wants a little more depth and contrast in the surrounding shell | Calendar composition | LOW |

---

## Source Files

- `src/routes/_auth/_app/$orgSlug/projects/$key/calendar.tsx`
- `src/routes/_auth/_app/$orgSlug/projects/$key/route.tsx`
- `src/components/Calendar/CalendarView.tsx`
- `src/components/Calendar/shadcn-calendar/header/calendar-header.tsx`
- `src/components/Calendar/shadcn-calendar/body/month/calendar-body-month.tsx`
- `src/components/Calendar/shadcn-calendar/body/week/calendar-body-week.tsx`
- `src/components/Calendar/shadcn-calendar/body/use-calendar-initial-scroll.ts`
