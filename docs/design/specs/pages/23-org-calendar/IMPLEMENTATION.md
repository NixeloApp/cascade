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
| `workspace` | `string \| undefined` | Route search params | Workspace filter persistence and deep linking |
| `team` | `string \| undefined` | Route search params | Team filter persistence and deep linking |
| `selection` | derived object | Route helper (`getCalendarSelectionState`) | Validated workspace/team scope, disabled state, and workspace-scoped team options |
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
│   │   └── OrganizationCalendarFilterControls
│   │       ├── Select (workspace filter)
│   │       │   ├── SelectTrigger
│   │       │   └── SelectContent → SelectItem[]
│   │       └── Select (team filter)
│   │           ├── SelectTrigger
│   │           └── SelectContent → SelectItem[]
│   └── div[data-testid=TEST_IDS.ORG_CALENDAR.CONTENT]
│       └── Suspense (fallback: OrganizationCalendarLoadingBody)
│           └── CalendarView
│               ├── ShadcnCalendar (calendar grid engine)
│               │   ├── CalendarHeader (mode switching, navigation)
│               │   └── CalendarBody (day/week/month grid)
│               ├── CreateEventModal
│               └── EventDetailsModal
```

---

## Permissions

- **Authentication**: Required. Route is under `_auth` layout guard.
- **Organization membership**: Required. `useOrganization()` throws if user is not a member.
- **Calendar events**: Visible to all organization members. Create/edit/delete requires membership in the associated project or team.
- **Workspace/team data**: `workspaces.list` and `teams.getOrganizationTeams` are organization-scoped queries requiring org membership.

---

## Data Flow

1. Route mounts, validates `workspace` and `team` from URL search params, then fetches workspace and team data in parallel.
2. Route derives a normalized selection with `getCalendarSelectionState`, dropping stale workspace/team ids that no longer exist or no longer match the chosen workspace.
3. If the URL contains an invalid combination, the route rewrites search params with `replace: true` so the visible state and deep link stay aligned.
4. User selects filters -> route updates search params -> derived selection changes -> `CalendarView` receives the new scope props.
5. `CalendarView` computes date range from `(date, mode)` and queries `calendarEvents.listByDateRange` with the active org/workspace/team scope.
6. Events render in the calendar grid, color-coded by `colorByScope` setting.
7. User interactions (click, drag, create) trigger mutations through CalendarView's internal state.
