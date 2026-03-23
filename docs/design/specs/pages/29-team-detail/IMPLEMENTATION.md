# Team Detail Page - Implementation

> **Route**: `/:orgSlug/workspaces/:workspaceSlug/teams/:teamSlug` (layout + 4 child routes)

---

## Queries

### Layout Shell

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.workspaces.getBySlug` | `convex/workspaces.ts` | `{ organizationId, slug: workspaceSlug }` | Resolve workspace for breadcrumbs and team lookup |
| `api.teams.getBySlug` | `convex/teams.ts` | `{ workspaceId, slug: teamSlug }` | Resolve team for header display (skip until workspace loads) |

### Board Tab

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.workspaces.getBySlug` | `convex/workspaces.ts` | `{ organizationId, slug }` | Workspace ID (duplicate of shell) |
| `api.teams.getBySlug` | `convex/teams.ts` | `{ workspaceId, slug }` | Team ID (duplicate of shell) |
| (KanbanBoard internal queries) | Various | `{ teamId }` | Board data, issues, workflow states, etc. |

### Calendar Tab

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.workspaces.getBySlug` | `convex/workspaces.ts` | `{ organizationId, slug }` | Workspace ID (duplicate) |
| `api.teams.getBySlug` | `convex/teams.ts` | `{ workspaceId, slug }` | Team ID (duplicate) |
| `api.calendarEvents.listByDateRange` | `convex/calendarEvents.ts` | `{ teamId, startDate, endDate }` | Team events (inside CalendarView) |

### Wiki Tab

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.workspaces.getBySlug` | `convex/workspaces.ts` | `{ organizationId, slug }` | Workspace ID (duplicate) |
| `api.teams.getBySlug` | `convex/teams.ts` | `{ workspaceId, slug }` | Team ID (duplicate) |
| `api.documents.listByTeam` | `convex/documents.ts` | `{ teamId, limit: 50 }` | Team-scoped documents |

### Settings Tab

No queries. Static placeholder.

---

## Mutations

| Mutation | Source | Tab | Purpose |
|----------|--------|-----|---------|
| `api.calendarEvents.create` | `convex/calendarEvents.ts` | Calendar | Create events (via CalendarView) |
| `api.calendarEvents.update` | `convex/calendarEvents.ts` | Calendar | Update events (via CalendarView) |
| `api.calendarEvents.remove` | `convex/calendarEvents.ts` | Calendar | Delete events (via CalendarView) |
| (KanbanBoard mutations) | Various | Board | Issue status changes, drag-and-drop reorder, issue creation |

---

## State Management

### Layout Shell

No local state. Workspace and team data come from queries.

### Board Tab

The `KanbanBoard` component manages extensive internal state:

| State | Type | Purpose |
|-------|------|---------|
| Board filters | `BoardFilters` | Filter issues by assignee, type, priority, etc. |
| Swimlane config | `SwimlanGroupBy` | Group issues by priority, assignee, type, etc. |
| Card display options | `CardDisplayOptions` | Show/hide issue fields on cards |
| Collapsed swimlanes | `CollapsedSwimlanes` | Track which swimlane rows are collapsed |
| Selected issues | `Set<string>` | Multi-select for bulk operations |
| Board history | Undo/redo stack | Track issue moves for undo functionality |

### Calendar Tab

Managed inside CalendarView (mode, date, modals, selected event).

### Wiki Tab

No local state beyond query results.

### Settings Tab

No state (placeholder).

---

## Component Tree

```
TeamLayout (route.tsx - shell)
├── PageLayout → PageStack
│   ├── PageHeader (3-level breadcrumbs, team name, description)
│   ├── PageControls → RouteNav (4 tabs: Projects, Calendar, Wiki, Settings)
│   └── Outlet
│       │
│       ├── [/board] TeamBoardPage
│       │   └── KanbanBoard
│       │       ├── BoardToolbar
│       │       │   ├── FilterBar
│       │       │   ├── Swimlane controls
│       │       │   └── Display options
│       │       ├── KanbanColumn[] (per workflow state)
│       │       │   └── IssueCard[] (draggable)
│       │       ├── SwimlanRow[] (optional grouping)
│       │       ├── BulkOperationsBar (conditional)
│       │       ├── CreateIssueModal
│       │       └── IssueDetailViewer (slide-over)
│       │
│       ├── [/calendar] TeamCalendarPage
│       │   └── CalendarView (teamId)
│       │       ├── ShadcnCalendar
│       │       ├── CreateEventModal
│       │       └── EventDetailsModal
│       │
│       ├── [/wiki] TeamWikiPage
│       │   └── Grid → doc card[]
│       │       ├── IconCircle + Typography (title)
│       │       ├── Globe/Lock icon (visibility)
│       │       └── Metadata (creator, timestamp)
│       │
│       └── [/settings] TeamSettings (placeholder)
│           └── Card ("Coming Soon")
```

---

## Permissions

- **Authentication**: Required. All routes under `_auth` layout guard.
- **Organization membership**: Required for workspace/team resolution queries.
- **Team membership**: Board data queries within `KanbanBoard` validate team/project membership.
- **Issue modification**: Drag-and-drop status changes and issue creation require project membership with appropriate role.
- **Calendar events**: Create/edit requires project or team membership.
- **Settings**: Currently placeholder. Will require team lead/admin role.

---

## Data Flow

1. Layout shell loads workspace by slug, then team by slug (chained query -- team depends on workspace ID).
2. Tab content renders based on active child route.
3. **Board flow**: `KanbanBoard` takes `teamId`, loads team projects, issues, and workflow states. User drags issues between columns, board history tracks moves for undo.
4. **Calendar flow**: `CalendarView` takes `teamId`, queries events for the visible date range. User creates/edits events via modals.
5. **Wiki flow**: `listByTeam` returns up to 50 documents. User clicks a card to navigate to the document editor.
6. **Settings flow**: Static placeholder. No data flow.
