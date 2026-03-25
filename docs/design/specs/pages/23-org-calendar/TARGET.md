# Org Calendar Page - Target State

> **Route**: `/:orgSlug/calendar`

---

No org-calendar-specific target deltas remain on this branch. The route now ships:

- search-param-backed workspace and team filters
- calendar-shaped loading fallback for query and lazy-load states
- accessible, distinct filter controls
- reviewed canonical, workspace-scope, team-scope, and loading screenshots across the supported viewport matrix

---

## Not Planned

- **Org-level event creation from this page**: Events are created within CalendarView already, scoped to the user's projects. No additional org-level creation flow is needed.
- **Export/import calendar feeds**: Out of scope for this page. Google Calendar sync exists as a separate feature.
- **Agenda/list view**: The CalendarView already supports day/week/month. An agenda list would be a CalendarView enhancement, not an org-calendar-specific change.
