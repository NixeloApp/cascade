# Calendar Page - Current State

> **Route**: `/:slug/projects/:key/calendar` and `/:slug/workspaces/:workspaceSlug/teams/:teamSlug/calendar`
> **Status**: 🟡 NEEDS POLISH
> **Last Updated**: 2026-03-21

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
- The core calendar surface is now both functional and reviewable across day, week, and month, with timed day/week captures anchored onto actual event content instead of empty early-hours whitespace.
- Calendar interaction captures now deterministically cover quick add, create-event, event detail, and desktop/tablet drag state without the earlier flaky modal-open path.

---

## Recent Improvements

- Screenshot readiness around the project shell and modal states is materially more reliable than the earlier baseline.
- Project-level calendar screenshots now align with the current project header/navigation treatment.
- Day and week screenshots now center real timed events instead of approving blank early-hours columns as if they were valid content.
- Month view now stays a real month grid at mobile sizes and uses compact event indicators instead of reading as an empty list.
- The shared calendar header is lighter on small screens, so the grid starts earlier in the viewport.
- Create-event coverage is now first-class across desktop, tablet, and mobile instead of being a flaky soft-skipped modal state.

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| Mobile project chrome is improved but still uses more height than ideal before the calendar work surface begins | Shared project shell | MEDIUM |
| Day/week event blocks and header pills still need stronger light-mode refinement to feel intentional rather than merely valid | Calendar internals | MEDIUM |
| Mobile month uses compact dot indicators, so drag state is intentionally not part of the mobile screenshot matrix | Interaction coverage contract | LOW |

---

## Source Files

- `src/routes/_auth/_app/$orgSlug/projects/$key/calendar.tsx`
- `src/routes/_auth/_app/$orgSlug/projects/$key/route.tsx`
- `src/components/Calendar/CalendarView.tsx`
- `src/components/Calendar/shadcn-calendar/header/calendar-header.tsx`
- `src/components/Calendar/shadcn-calendar/body/month/calendar-body-month.tsx`
- `src/components/Calendar/shadcn-calendar/body/week/calendar-body-week.tsx`
- `src/components/Calendar/shadcn-calendar/body/use-calendar-initial-scroll.ts`
