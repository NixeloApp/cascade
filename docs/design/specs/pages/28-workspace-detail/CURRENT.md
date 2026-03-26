# Workspace Detail Page - Current State

> **Route**: `/:orgSlug/workspaces/:workspaceSlug` (layout shell) with child tabs
> **Status**: IMPLEMENTED
> **Last Updated**: 2026-03-26

---

## Purpose

The workspace detail page is the primary operating surface for a single workspace (department). It provides a shared shell with tabbed navigation across workspace sub-views. It answers:

- What teams belong to this workspace?
- What issues are in the workspace backlog (unsprinted)?
- What sprints are currently active across workspace projects?
- What cross-team dependencies (blockers) exist?
- What events are on the workspace calendar?
- What wiki documents are scoped to this workspace?
- How do I configure workspace settings (name, icon, visibility)?

---

## Route Anatomy

```
/:orgSlug/workspaces/:workspaceSlug  (layout shell)
│
├── WorkspaceLayout (route.tsx)
│   ├── PageLayout
│   │   └── PageStack
│   │       ├── PageHeader
│   │       │   ├── title = workspace.name
│   │       │   ├── description = workspace.description
│   │       │   └── breadcrumbs = ["Workspaces" → list, workspace.name]
│   │       │
│   │       ├── PageControls → RouteNav (section tabs)
│   │       │   ├── "Teams" → /:orgSlug/workspaces/:ws/ (exact)
│   │       │   ├── "Backlog" → /:orgSlug/workspaces/:ws/backlog
│   │       │   ├── "Sprints" → /:orgSlug/workspaces/:ws/sprints
│   │       │   ├── "Dependencies" → /:orgSlug/workspaces/:ws/dependencies
│   │       │   ├── "Calendar" → /:orgSlug/workspaces/:ws/calendar
│   │       │   ├── "Wiki" → /:orgSlug/workspaces/:ws/wiki
│   │       │   └── "Settings" → /:orgSlug/workspaces/:ws/settings
│   │       │
│   │       └── <Outlet /> (child route renders here)
│
├── index.tsx → beforeLoad redirect to /teams/ (team list)
│
├── teams/index.tsx → TeamsList
│   ├── Section intro row ("Teams" + compact supporting copy + create action)
│   ├── Grid → TeamCard[] (per team, linked to team detail)
│   ├── PageContent empty state ("No teams yet")
│   ├── CreateTeamModal (opened from header or empty state)
│   └── Load More button (paginated via usePaginatedQuery)
│
├── backlog.tsx → WorkspaceBacklogPage
│   ├── PageContent (empty state: "Backlog is empty")
│   └── Card[] (per issue: key, title, status, priority)
│
├── sprints.tsx → WorkspaceSprintsPage
│   ├── PageContent (empty state: "No active sprints")
│   └── Card[] (per sprint: project key/name, sprint name, issue count, end date)
│
├── dependencies.tsx → WorkspaceDependenciesPage
│   ├── DependencyFilters (team, status, priority dropdowns)
│   ├── EmptyState ("No cross-team blockers")
│   └── Card[] (per dependency: "Blocks" badge, from/to issue keys and titles)
│
├── calendar.tsx → WorkspaceCalendarPage
│   ├── Header bar (scope label + team filter dropdown)
│   └── CalendarView (workspace-scoped, optional team filter)
│
├── wiki.tsx → WorkspaceWikiPage
│   ├── EmptyState ("No workspace docs yet")
│   └── Grid → doc card[] (icon, title, visibility badge, creator, timestamp)
│
└── settings.tsx → WorkspaceSettings
    ├── Card "General" (icon picker, name, description)
    ├── Card "Visibility & Sharing" (default project visibility toggle, external sharing toggle)
    └── Button "Save Changes"
```

---

## Current Composition Walkthrough

1. **Layout shell** (`route.tsx`): Loads workspace via `api.workspaces.getBySlug`. Shows loading spinner while pending, "Workspace not found" if null. Renders a lighter `PageHeader` with breadcrumbs plus a compact `PageControls` strip with 7 tabs, then an `<Outlet />` for child routes.
2. **Index redirect** (`index.tsx`): Immediately redirects to the teams list sub-route in `beforeLoad` using TanStack Router `redirect()`. No component renders and no child query fires first.
3. **Teams list** (`teams/index.tsx`): Uses `usePaginatedQuery` with `api.teams.getTeams` filtered by `workspaceId`. Renders a lightweight section intro instead of a second hero shell, shows team cards with icon, name, description, member count, and project count, and opens a real `CreateTeamModal` from both the populated header action and the empty state.
4. **Backlog** (`backlog.tsx`): Queries `api.workspaces.getBacklogIssues` (workspace-scoped). Renders a flat card list with issue key, title, status, and priority.
5. **Sprints** (`sprints.tsx`): Queries `api.workspaces.getActiveSprints` (workspace-scoped). Shows cards with project key/name, sprint name, issue count, and end date.
6. **Dependencies** (`dependencies.tsx`): Queries `api.workspaces.getCrossTeamDependencies` with optional team/status/priority filters. `DependencyFilters` component provides three filter dropdowns. Each dependency card shows a "Blocks" badge with from-issue and to-issue details.
7. **Calendar** (`calendar.tsx`): Renders `CalendarView` scoped to the workspace. Adds a team filter dropdown above the calendar. Color-codes events by team when no specific team is selected.
8. **Wiki** (`wiki.tsx`): Queries `api.documents.listByWorkspace`. Renders document cards with title, visibility icon (Globe/Lock), creator name, and timestamp using `Metadata` components.
9. **Settings** (`settings.tsx`): Full settings form with emoji icon picker (12 preset emojis), name/description inputs, and two toggle switches (default project visibility, external sharing). Tracks dirty state via `hasChanges` comparison. Calls `api.workspaces.updateWorkspace` on save.

---

## Screenshot Matrix

| Viewport | Theme | Tab | Preview |
|----------|-------|-----|---------|
| Desktop | Dark | Teams (default) | ![](screenshots/desktop-dark.png) |
| Desktop | Light | Teams (default) | ![](screenshots/desktop-light.png) |
| Tablet | Light | Teams (default) | ![](screenshots/tablet-light.png) |
| Mobile | Light | Teams (default) | ![](screenshots/mobile-light.png) |
| Desktop | Dark | Backlog | ![](screenshots/desktop-dark-backlog.png) |
| Desktop | Light | Backlog | ![](screenshots/desktop-light-backlog.png) |
| Tablet | Light | Backlog | ![](screenshots/tablet-light-backlog.png) |
| Mobile | Light | Backlog | ![](screenshots/mobile-light-backlog.png) |
| Desktop | Dark | Sprints | ![](screenshots/desktop-dark-sprints.png) |
| Desktop | Light | Sprints | ![](screenshots/desktop-light-sprints.png) |
| Tablet | Light | Sprints | ![](screenshots/tablet-light-sprints.png) |
| Mobile | Light | Sprints | ![](screenshots/mobile-light-sprints.png) |
| Desktop | Dark | Dependencies | ![](screenshots/desktop-dark-dependencies.png) |
| Desktop | Light | Dependencies | ![](screenshots/desktop-light-dependencies.png) |
| Tablet | Light | Dependencies | ![](screenshots/tablet-light-dependencies.png) |
| Mobile | Light | Dependencies | ![](screenshots/mobile-light-dependencies.png) |
| Desktop | Dark | Calendar | ![](screenshots/desktop-dark-calendar.png) |
| Desktop | Light | Calendar | ![](screenshots/desktop-light-calendar.png) |
| Tablet | Light | Calendar | ![](screenshots/tablet-light-calendar.png) |
| Mobile | Light | Calendar | ![](screenshots/mobile-light-calendar.png) |
| Desktop | Dark | Wiki | ![](screenshots/desktop-dark-wiki.png) |
| Desktop | Light | Wiki | ![](screenshots/desktop-light-wiki.png) |
| Tablet | Light | Wiki | ![](screenshots/tablet-light-wiki.png) |
| Mobile | Light | Wiki | ![](screenshots/mobile-light-wiki.png) |
| Desktop | Dark | Settings | ![](screenshots/desktop-dark-settings.png) |
| Desktop | Light | Settings | ![](screenshots/desktop-light-settings.png) |
| Tablet | Light | Settings | ![](screenshots/tablet-light-settings.png) |
| Mobile | Light | Settings | ![](screenshots/mobile-light-settings.png) |
| Desktop | Dark | Create team modal | ![](screenshots/desktop-dark-create-team-modal.png) |
| Desktop | Light | Create team modal | ![](screenshots/desktop-light-create-team-modal.png) |
| Tablet | Light | Create team modal | ![](screenshots/tablet-light-create-team-modal.png) |
| Mobile | Light | Create team modal | ![](screenshots/mobile-light-create-team-modal.png) |

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| ~~1~~ | ~~Teams list uses org-wide query~~ **Fixed** — `getTeams` accepts optional `workspaceId`, uses `by_workspace` index for admins | ~~correctness~~ | ~~HIGH~~ |
| ~~2~~ | ~~useEffect redirect in index route~~ **Fixed** — replaced with TanStack Router `beforeLoad` + `redirect()`. No component renders, no Convex query fires, instant redirect. | ~~architecture~~ | ~~LOW~~ |
| 3 | Settings form initializes state with a `if (workspace && !initialized)` pattern inside render -- should use `useEffect` or form library | architecture | LOW |
| ~~4~~ | ~~Flat card lists without sorting/filtering~~ **Fixed** — backlog has priority filter + sort (priority/updated/created) with issue type icons and status/priority badges; sprints has status filter with sprint status badges and date metadata | ~~functionality~~ | ~~MEDIUM~~ |
| ~~5~~ | ~~Wiki page uses raw div instead of Card~~ **Fixed** — wiki pages now use shared `WikiDocumentGrid` with `Card variant="subtle" hoverable` | ~~consistency~~ | ~~LOW~~ |
| 6 | Dependencies page has no visual graph or timeline -- only a flat list of blocker relationships | functionality | MEDIUM |
| 7 | Settings has no "Archive workspace" or "Delete workspace" action | functionality | LOW |
| ~~8~~ | ~~Duplicate workspace queries~~ **Fixed** — added `WorkspaceLayoutContext` in parent route. Child routes use `useWorkspaceLayout()` for `workspaceId` instead of re-querying `getBySlug`. Eliminates 7 duplicate queries. | ~~performance~~ | ~~LOW~~ |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/route.tsx` | Layout shell with header, breadcrumbs, RouteNav tabs |
| `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/index.tsx` | Redirect to /teams/ |
| `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/index.tsx` | Teams list |
| `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/backlog.tsx` | Workspace backlog issues |
| `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/sprints.tsx` | Active sprints across workspace projects |
| `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/dependencies.tsx` | Cross-team dependency list |
| `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/calendar.tsx` | Workspace calendar view |
| `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/wiki.tsx` | Workspace wiki documents |
| `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/settings.tsx` | Workspace settings form |
| `convex/workspaces.ts` | Backend: getBySlug, list, create, update, getBacklogIssues, getActiveSprints, getCrossTeamDependencies |
| `convex/teams.ts` | Backend: getTeams, getOrganizationTeams |
| `convex/documents.ts` | Backend: listByWorkspace |
| `convex/calendarEvents.ts` | Backend: listByDateRange |
| `src/components/Calendar/CalendarView.tsx` | Shared calendar component |
