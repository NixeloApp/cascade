# Org Calendar Page - Implementation

> **Route**: `/:orgSlug/calendar`

---

## Queries

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.workspaces.list` | `convex/workspaces.ts` | `{ organizationId }` | Populate workspace filter dropdown |
| `api.teams.getOrganizationTeams` | `convex/teams.ts` | `{ organizationId }` | Populate team filter dropdown |
| `api.calendarEvents.listByDateRange` | `convex/calendarEvents.ts` | `{ organizationId?, workspaceId?, teamId?, startDate, endDate }` | Fetch events for visible date range (called inside CalendarView) |

---

## Mutations

| Mutation | Source | Purpose |
|----------|--------|---------|
| `api.calendarEvents.create` | `convex/calendarEvents.ts` | Create new event (via CreateEventModal inside CalendarView) |
| `api.calendarEvents.update` | `convex/calendarEvents.ts` | Update event time/details (via drag-to-reschedule or EventDetailsModal) |
| `api.calendarEvents.remove` | `convex/calendarEvents.ts` | Delete event (via EventDetailsModal) |

---

## State Management

| State | Type | Location | Purpose |
|-------|------|----------|---------|
| `selectedWorkspaceId` | `Id<"workspaces"> \| "all"` | Route component `useState` | Workspace filter |
| `selectedTeamId` | `Id<"teams"> \| "all"` | Route component `useState` | Team filter (cascaded by workspace) |
| `mode` | `"day" \| "week" \| "month"` | CalendarView `useState` | Active calendar view mode |
| `date` | `Date` | CalendarView `useState` | Currently visible date |
| `showCreateModal` | `boolean` | CalendarView `useState` | Create event modal visibility |
| `selectedEventId` | `Id<"calendarEvents"> \| null` | CalendarView `useState` | Event details modal target |

---

## Component Tree

```
OrganizationCalendarPage
├── PageLayout (fullHeight)
│   ├── PageHeader
│   │   ├── title (dynamic scope label)
│   │   └── actions
│   │       ├── Select (workspace filter)
│   │       │   ├── SelectTrigger
│   │       │   └── SelectContent → SelectItem[]
│   │       └── Select (team filter)
│   │           ├── SelectTrigger
│   │           └── SelectContent → SelectItem[]
│   └── Suspense (fallback: PageContent isLoading)
│       └── CalendarView
│           ├── ShadcnCalendar (calendar grid engine)
│           │   ├── CalendarHeader (mode switching, navigation)
│           │   └── CalendarBody (day/week/month grid)
│           ├── CreateEventModal
│           └── EventDetailsModal
```

---

## Permissions

- **Authentication**: Required. Route is under `_auth` layout guard.
- **Organization membership**: Required. `useOrganization()` throws if user is not a member.
- **Calendar events**: Visible to all organization members. Create/edit/delete requires membership in the associated project or team.
- **Workspace/team data**: `workspaces.list` and `teams.getOrganizationTeams` are organization-scoped queries requiring org membership.

---

## Data Flow

1. Route mounts, fetches workspace list and team list in parallel.
2. User selects filters -> local state updates -> CalendarView receives new scope props.
3. CalendarView computes date range from `(date, mode)` and queries `calendarEvents.listByDateRange` with the active scope.
4. Events render in the calendar grid, color-coded by `colorByScope` setting.
5. User interactions (click, drag, create) trigger mutations through CalendarView's internal state.
