# Org Calendar Page - Target State

> **Route**: `/:orgSlug/calendar`

---

## Priority Improvements

| # | Improvement | Priority | Rationale |
|---|-------------|----------|-----------|
| 1 | Persist filter selections in URL search params (`?workspace=X&team=Y`) | HIGH | Filter state is lost on navigation; deep-linking and sharing are impossible |
| 2 | Add skeleton layout for CalendarView Suspense fallback instead of generic spinner | MEDIUM | The calendar grid shape is predictable; a skeleton would reduce perceived load time |
| 3 | Disable team dropdown when workspace is "all" or show a "Select a workspace first" placeholder | LOW | All-org team list can be long and confusing without workspace context |
| 4 | Add `aria-label` to filter selects for accessibility | LOW | Screen readers cannot distinguish the two dropdowns |

---

## Not Planned

- **Org-level event creation from this page**: Events are created within CalendarView already, scoped to the user's projects. No additional org-level creation flow is needed.
- **Export/import calendar feeds**: Out of scope for this page. Google Calendar sync exists as a separate feature.
- **Agenda/list view**: The CalendarView already supports day/week/month. An agenda list would be a CalendarView enhancement, not an org-calendar-specific change.

---

## Acceptance Criteria

- [ ] Filter selections survive page refresh via URL search params
- [ ] Suspense fallback shows a calendar-shaped skeleton (header bar + grid outline)
- [ ] Both filter dropdowns have distinct `aria-label` attributes
- [ ] Team dropdown shows "Select workspace first" when workspace is "all"
- [ ] Screenshots pass visual diff after changes (`pnpm screenshots -- --spec org-calendar`)
