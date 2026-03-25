# Org Calendar Page - Current State

> **Route**: `/:orgSlug/calendar`
> **Status**: REVIEWED
> **Last Updated**: 2026-03-25

---

## Purpose

The org calendar provides a single unified view of calendar events across all workspaces and teams in the organization. It answers:

- What events are happening across the organization this week/month?
- What does a specific workspace or team have scheduled?
- How do events distribute across different scopes (org / workspace / team)?

---

## Route Anatomy

```
/:orgSlug/calendar
│
├── PageLayout (fullHeight)
│   ├── PageHeader
│   │   ├── title = dynamic scope label ("Organization scope" | "Workspace scope" | "Team scope")
│   │   └── actions
│   │       └── OrganizationCalendarFilterControls
│   │           ├── Select (Workspace filter: "All workspaces" | per-workspace)
│   │           └── Select (Team filter: "All teams" | per-team, filtered by workspace)
│   │
│   └── div[data-testid=TEST_IDS.ORG_CALENDAR.CONTENT]
│       └── Suspense
│           ├── fallback = OrganizationCalendarLoadingBody
│           └── CalendarView (lazy-loaded)
│               ├── organizationId
│               ├── workspaceId? (when workspace selected)
│               ├── teamId? (when team selected)
│               └── colorByScope ("workspace" | "team" | undefined)
```

---

## Current Composition Walkthrough

1. **Route bootstrap**: `OrganizationCalendarPage` calls `useOrganization()` for `organizationId`, then loads `api.workspaces.list` and `api.teams.getOrganizationTeams` in parallel.
2. **Search-backed filters**: The route validates `workspace` and `team` search params, derives the effective selection from those params, and rewrites stale combinations back to a valid URL state once workspace/team data resolves.
3. **Workspace-scoped team list**: The team query is already scoped by the selected workspace, so the team filter only offers teams that belong to the active workspace. With no workspace selected, the team filter is disabled and shows "Select workspace first".
4. **Calendar-shaped loading**: The route shows a calendar-specific skeleton for both initial query load and lazy `CalendarView` load instead of a generic spinner shell.
5. **Scope label and color behavior**: The header title reflects org/workspace/team scope, and `CalendarView` receives `colorByScope="workspace"` for org scope, `colorByScope="team"` for workspace scope, and default coloring for a single team.
6. **CalendarView**: Still lazy-loaded via `React.lazy`, keeping day/week/month modes, event CRUD modals, and drag-to-reschedule inside the shared calendar surface.

---

## Screenshot Matrix

| State | Desktop Dark | Desktop Light | Tablet Light | Mobile Light |
|-------|--------------|---------------|--------------|--------------|
| Canonical org scope | ![](screenshots/desktop-dark.png) | ![](screenshots/desktop-light.png) | ![](screenshots/tablet-light.png) | ![](screenshots/mobile-light.png) |
| Workspace scope | ![](screenshots/desktop-dark-workspace-scope.png) | ![](screenshots/desktop-light-workspace-scope.png) | ![](screenshots/tablet-light-workspace-scope.png) | ![](screenshots/mobile-light-workspace-scope.png) |
| Team scope | ![](screenshots/desktop-dark-team-scope.png) | ![](screenshots/desktop-light-team-scope.png) | ![](screenshots/tablet-light-team-scope.png) | ![](screenshots/mobile-light-team-scope.png) |
| Loading | ![](screenshots/desktop-dark-loading.png) | ![](screenshots/desktop-light-loading.png) | ![](screenshots/tablet-light-loading.png) | ![](screenshots/mobile-light-loading.png) |

---

## Current Problems

No route-specific defects are currently tracked for org calendar on this branch. Remaining work belongs to the broader cross-surface visual consistency pass.

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/calendar.tsx` | Route component (339 lines) with search-param normalization, scoped filters, and calendar-shaped loading state |
| `src/components/Calendar/CalendarView.tsx` | Shared calendar view with day/week/month modes |
| `src/components/Calendar/CreateEventModal.tsx` | Event creation modal |
| `src/components/Calendar/EventDetailsModal.tsx` | Event details/edit modal |
| `src/components/Calendar/shadcn-calendar/calendar.tsx` | Calendar grid engine |
| `convex/calendarEvents.ts` | Calendar event queries and mutations |
| `convex/workspaces.ts` | Workspace list query |
| `convex/teams.ts` | Team list query (`getOrganizationTeams`) |
| `src/routes/_auth/_app/$orgSlug/-calendar.test.tsx` | Route-level tests for loading, filter semantics, and stale-search normalization |
| `e2e/pages/calendar.page.ts` | Calendar page object for workspace/team scope interactions |
