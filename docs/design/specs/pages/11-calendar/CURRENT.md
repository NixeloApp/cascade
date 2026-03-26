# Calendar Page - Current State

> **Route**: `/:slug/projects/:key/calendar` and `/:slug/workspaces/:workspaceSlug/teams/:teamSlug/calendar`
> **Status**: REVIEWED, with routine light-mode refinement still open
> **Last Updated**: 2026-03-25

> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

---

## Screenshot Matrix

### Canonical route captures

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

### Additional state captures

| State | Desktop Dark | Desktop Light | Tablet Light | Mobile Light |
|------|---------------|---------------|--------------|--------------|
| Day view | `desktop-dark-day.png` | `desktop-light-day.png` | `tablet-light-day.png` | `mobile-light-day.png` |
| Week view | `desktop-dark-week.png` | `desktop-light-week.png` | `tablet-light-week.png` | `mobile-light-week.png` |
| Month view | `desktop-dark-month.png` | `desktop-light-month.png` | `tablet-light-month.png` | `mobile-light-month.png` |
| Quick add | `desktop-dark-quick-add.png` | `desktop-light-quick-add.png` | `tablet-light-quick-add.png` | `mobile-light-quick-add.png` |
| Create event modal | `desktop-dark-create-event-modal.png` | `desktop-light-create-event-modal.png` | `tablet-light-create-event-modal.png` | `mobile-light-create-event-modal.png` |
| Event modal | `desktop-dark-event-modal.png` | `desktop-light-event-modal.png` | `tablet-light-event-modal.png` | `mobile-light-event-modal.png` |
| Drag and drop | `desktop-dark-drag-and-drop.png` | `desktop-light-drag-and-drop.png` | `tablet-light-drag-and-drop.png` | n/a |

---

## Current Read

- The screenshot harness now lands on real timed content for day/week views instead of visually
  empty slots.
- Week-mode centering no longer destroys vertical scroll position.
- View switching is verified against explicit calendar-view markers.
- Create-event modal capture is deterministic.
- Mobile month/week states now show useful event content rather than offscreen or collapsed noise.
- Project and team calendar routes now inherit the lighter shared detail chrome, so small screens spend less vertical space on header/tab framing before the grid begins.

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | The route is reliable now, but desktop light mode still wants slightly more surface depth around the month grid | composition | LOW |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/projects/$key/calendar.tsx` | Project calendar route |
| `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/calendar.tsx` | Team calendar route |
| `src/components/Calendar/CalendarView.tsx` | Calendar composition |
| `src/components/Calendar/shadcn-calendar/body/use-calendar-initial-scroll.ts` | Initial scroll / view landing |
| `src/components/Calendar/shadcn-calendar/body/week/calendar-body-week.tsx` | Week-view body |
| `e2e/screenshot-pages.ts` | Calendar screenshot capture and readiness |

---

## Summary

Calendar is current and screenshot-stable. The meaningful work left is light-mode surface depth and
other route-local refinement, not shared-shell cleanup, route correctness, or harness repair.
