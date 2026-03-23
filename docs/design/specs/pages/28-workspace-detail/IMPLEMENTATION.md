# Workspace Detail Page - Implementation

> **Route**: `/:orgSlug/workspaces/:workspaceSlug` (layout + 7 child routes)

---

## Queries

### Layout Shell

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.workspaces.getBySlug` | `convex/workspaces.ts` | `{ organizationId, slug }` | Fetch workspace data for header and existence check |

### Teams Tab

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.workspaces.getBySlug` | `convex/workspaces.ts` | `{ organizationId, slug }` | Workspace existence (duplicate of shell query) |
| `api.teams.getTeams` | `convex/teams.ts` | `{ organizationId }` | Paginated team list (note: org-wide, not workspace-filtered) |

### Backlog Tab

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.workspaces.getBySlug` | `convex/workspaces.ts` | `{ organizationId, slug }` | Workspace ID resolution |
| `api.workspaces.getBacklogIssues` | `convex/workspaces.ts` | `{ workspaceId }` | Unsprinted issues across workspace projects |

### Sprints Tab

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.workspaces.getBySlug` | `convex/workspaces.ts` | `{ organizationId, slug }` | Workspace ID resolution |
| `api.workspaces.getActiveSprints` | `convex/workspaces.ts` | `{ workspaceId }` | Active sprints with project context and issue counts |

### Dependencies Tab

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.workspaces.getBySlug` | `convex/workspaces.ts` | `{ organizationId, slug }` | Workspace ID resolution |
| `api.teams.getOrganizationTeams` | `convex/teams.ts` | `{ organizationId }` | Team list for filter dropdown |
| `api.workspaces.getCrossTeamDependencies` | `convex/workspaces.ts` | `{ workspaceId, teamId?, status?, priority? }` | Cross-team blocker relationships |

### Calendar Tab

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.workspaces.getBySlug` | `convex/workspaces.ts` | `{ organizationId, slug }` | Workspace ID resolution |
| `api.teams.getOrganizationTeams` | `convex/teams.ts` | `{ organizationId }` | Team list for filter dropdown |
| `api.calendarEvents.listByDateRange` | `convex/calendarEvents.ts` | `{ workspaceId?, teamId?, startDate, endDate }` | Events in visible date range (inside CalendarView) |

### Wiki Tab

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.workspaces.getBySlug` | `convex/workspaces.ts` | `{ organizationId, slug }` | Workspace ID resolution |
| `api.documents.listByWorkspace` | `convex/documents.ts` | `{ workspaceId, limit: 50 }` | Workspace-scoped documents |

### Settings Tab

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.workspaces.getBySlug` | `convex/workspaces.ts` | `{ organizationId, slug }` | Workspace data for form initialization |

---

## Mutations

| Mutation | Source | Tab | Purpose |
|----------|--------|-----|---------|
| `api.workspaces.updateWorkspace` | `convex/workspaces.ts` | Settings | Update workspace name, description, icon, and settings |
| `api.calendarEvents.create` | `convex/calendarEvents.ts` | Calendar | Create events (via CalendarView) |
| `api.calendarEvents.update` | `convex/calendarEvents.ts` | Calendar | Update events (via CalendarView) |

---

## State Management

### Layout Shell

| State | Type | Purpose |
|-------|------|---------|
| (none) | -- | Shell has no local state; workspace data comes from query |

### Dependencies Tab

| State | Type | Purpose |
|-------|------|---------|
| `teamId` | `Id<"teams"> \| "all"` | Team filter |
| `status` | `string` | Status filter |
| `priority` | `string` | Priority filter |

### Calendar Tab

| State | Type | Purpose |
|-------|------|---------|
| `selectedTeamId` | `Id<"teams"> \| "all"` | Team filter for calendar scope |

### Settings Tab

| State | Type | Purpose |
|-------|------|---------|
| `name` | `string` | Workspace name |
| `description` | `string` | Workspace description |
| `icon` | `string` | Selected emoji icon |
| `defaultProjectVisibility` | `boolean` | Default project visibility toggle |
| `allowExternalSharing` | `boolean` | External sharing toggle |
| `isSaving` | `boolean` | Save operation loading state |
| `initialized` | `boolean` | Form initialization flag |

---

## Component Tree

```
WorkspaceLayout (route.tsx - shell)
├── PageLayout → PageStack
│   ├── PageHeader (breadcrumbs, title, description)
│   ├── PageControls → RouteNav (7 tabs)
│   └── Outlet
│       │
│       ├── [/teams/] TeamsList
│       │   ├── PageHeader ("Teams")
│       │   └── PageContent → Grid
│       │       └── Card[] (team cards with icon, name, metadata)
│       │
│       ├── [/backlog] WorkspaceBacklogPage
│       │   └── PageContent → Flex
│       │       └── Card[] (issue key, title, status, priority)
│       │
│       ├── [/sprints] WorkspaceSprintsPage
│       │   └── PageContent → Flex
│       │       └── Card[] (project context, sprint name, issue count, date)
│       │
│       ├── [/dependencies] WorkspaceDependenciesPage
│       │   ├── DependencyFilters (3 Select dropdowns)
│       │   └── Flex → Card[] (from/to issue pairs with "Blocks" badge)
│       │
│       ├── [/calendar] WorkspaceCalendarPage
│       │   ├── Header bar (scope label + team filter)
│       │   └── CalendarView
│       │
│       ├── [/wiki] WorkspaceWikiPage
│       │   └── Grid → doc card[] (icon, title, visibility, metadata)
│       │
│       └── [/settings] WorkspaceSettings
│           ├── Card "General" (icon picker, name, description)
│           ├── Card "Visibility & Sharing" (switches)
│           └── Button "Save Changes"
```

---

## Permissions

- **Authentication**: Required. All routes are under `_auth` layout guard.
- **Organization membership**: Required for all queries (organization-scoped).
- **Workspace access**: `getBySlug` is an `organizationQuery`; any org member can view workspace details.
- **Settings modification**: `updateWorkspace` uses `workspaceAdminMutation` -- requires workspace admin role.
- **Team creation**: Teams tab shows a "+ Create Team" button, but the mutation requires appropriate role.
- **Calendar events**: Create/edit requires membership in the associated project or team.
