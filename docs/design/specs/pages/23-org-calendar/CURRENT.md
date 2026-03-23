# Org Calendar Page - Current State

> **Route**: `/:orgSlug/calendar`
> **Status**: IMPLEMENTED
> **Last Updated**: 2026-03-22

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
│   │       ├── Select (Workspace filter: "All workspaces" | per-workspace)
│   │       └── Select (Team filter: "All teams" | per-team, filtered by workspace)
│   │
│   └── Suspense
│       └── CalendarView (lazy-loaded)
│           ├── organizationId (when no workspace selected)
│           ├── workspaceId (when workspace selected)
│           ├── teamId (when team selected)
│           └── colorByScope ("workspace" | "team" | undefined)
```

---

## Current Composition Walkthrough

1. **Route bootstrap**: `OrganizationCalendarPage` calls `useOrganization()` to get `organizationId`, then fires two queries in parallel: `api.workspaces.list` and `api.teams.getOrganizationTeams`.
2. **Loading gate**: While either query is `undefined`, renders `<PageContent isLoading>`.
3. **Filter state**: Two `useState` hooks manage `selectedWorkspaceId` and `selectedTeamId`, both defaulting to `"all"`.
4. **Team cascading**: When a workspace is selected, the team dropdown is filtered to only show teams belonging to that workspace. Selecting a workspace resets `selectedTeamId` to `"all"`.
5. **Scope label**: The `PageHeader` title dynamically reflects the filter state -- "Team scope", "Workspace scope", or "Organization scope".
6. **Color scope**: Events are color-coded by workspace when viewing the full org, by team when viewing a single workspace, and use default colors when viewing a single team.
7. **CalendarView**: Lazy-loaded via `React.lazy`. Renders the shared calendar component with day/week/month modes, event CRUD modals, and drag-to-reschedule.

---

## Screenshot Matrix

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | Filter dropdowns use `className="w-full sm:w-56"` -- arbitrary width may not align with design tokens | styling | LOW |
| 2 | CalendarView is lazy-loaded but the Suspense fallback is a generic loading spinner with no skeleton layout | loading UX | LOW |
| 3 | No URL-based persistence of filter selections -- workspace/team resets on navigation | state | MEDIUM |
| 4 | Team filter is not disabled when no workspace is selected (it shows all org teams, which can be a long list) | UX | LOW |
| 5 | Scope label in header changes dynamically but there is no visual transition | polish | LOW |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/calendar.tsx` | Route component (104 lines) |
| `src/components/Calendar/CalendarView.tsx` | Shared calendar view with day/week/month modes |
| `src/components/Calendar/CreateEventModal.tsx` | Event creation modal |
| `src/components/Calendar/EventDetailsModal.tsx` | Event details/edit modal |
| `src/components/Calendar/shadcn-calendar/calendar.tsx` | Calendar grid engine |
| `convex/calendarEvents.ts` | Calendar event queries and mutations |
| `convex/workspaces.ts` | Workspace list query |
| `convex/teams.ts` | Team list query (`getOrganizationTeams`) |
