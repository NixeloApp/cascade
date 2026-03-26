# Team Detail Page - Current State

> **Route**: `/:orgSlug/workspaces/:workspaceSlug/teams/:teamSlug` (layout shell) with child tabs
> **Status**: IMPLEMENTED and reviewed across all team tabs
> **Last Updated**: 2026-03-26

---

## Purpose

The team detail page is the working surface for a single team within a workspace. It provides board, calendar, wiki, and settings views. It answers:

- What does this team's Kanban board look like (issues by workflow state)?
- What events are on this team's calendar?
- What wiki documents are scoped to this team?
- What projects does this team own?
- How do I configure team settings?

---

## Route Anatomy

```
/:orgSlug/workspaces/:workspaceSlug/teams/:teamSlug  (layout shell)
│
├── TeamLayout (route.tsx)
│   ├── PageLayout
│   │   └── PageStack
│   │       ├── PageHeader
│   │       │   ├── title = team.name
│   │       │   ├── description = team.description
│   │       │   └── breadcrumbs = [
│   │       │       "Workspaces" → workspaces list,
│   │       │       workspace.name → workspace detail,
│   │       │       team.name
│   │       │   ]
│   │       │
│   │       ├── PageControls → RouteNav (section tabs)
│   │       │   ├── "Board" → /:orgSlug/workspaces/:ws/teams/:team/board
│   │       │   ├── "Calendar" → /.../teams/:team/calendar
│   │       │   ├── "Wiki" → /.../teams/:team/wiki
│   │       │   └── "Settings" → /.../teams/:team/settings
│   │       │
│   │       └── <Outlet /> (child route renders here)
│
├── index.tsx → Redirects to /board (via beforeLoad + redirect)
│
├── board.tsx → TeamBoardPage
│   └── KanbanBoard (teamId)
│       ├── BoardToolbar (filters, swimlanes, display options)
│       └── KanbanColumn[] (per workflow state)
│           └── IssueCard[] (draggable)
│
├── calendar.tsx → TeamCalendarPage
│   └── CalendarView (teamId)
│
├── wiki.tsx → TeamWikiPage
│   ├── EmptyState ("No team wiki docs yet")
│   └── Grid → doc card[] (identical to workspace wiki cards)
│
└── settings.tsx → TeamSettings
    ├── GeneralSection (name, description, privacy)
    ├── MembersSection (roles, removal)
    └── DangerSection (delete team)
```

---

## Current Composition Walkthrough

1. **Inherited workspace context** (`../route.tsx`): When the team route is active, the parent workspace layout no longer renders its own full header. It now collapses to a compact workspace-sections strip so users can still jump back to workspace-level sections without spending a full extra header block on nested chrome. On mobile that parent strip now wraps instead of clipping the later tabs off the right edge.
2. **Layout shell** (`route.tsx`): Loads workspace via `api.workspaces.getBySlug`, then team via `api.teams.getBySlug` (using workspace ID as parent). Shows loading spinner while pending, "Team not found" if either is null. Renders 3-level breadcrumbs, a lighter shared header with the member summary folded into the header actions, and a compact `PageControls` strip with 4 tabs (Board, Calendar, Wiki, Settings), then `<Outlet />`.
3. **Index redirect** (`index.tsx`): Uses TanStack Router `beforeLoad` with `redirect()` so the team root never renders a transient blank shell before landing on the board route.
4. **Board** (`board.tsx`): Reads `teamId` from `useTeamLayout()` and renders `<KanbanBoard teamId={teamId} />`. The `KanbanBoard` component is a feature-rich Kanban board with drag-and-drop (Atlaskit pragmatic-drag-and-drop), swimlanes, board history (undo/redo), bulk operations, filtering, and issue detail viewer. On mobile it now uses the same single-column workflow selector as the project board instead of clipping multiple columns off-screen.
5. **Calendar** (`calendar.tsx`): Reads `teamId` from `useTeamLayout()` and renders `<CalendarView teamId={teamId} />`.
6. **Wiki** (`wiki.tsx`): Reads `teamId` from `useTeamLayout()`, then queries `api.documents.listByTeam` scoped to the team. Renders the same card layout as workspace wiki (doc icon, title, visibility badge, creator metadata). Empty state directs users to create team-scoped docs.
7. **Settings** (`settings.tsx`): Reads `teamId` and `workspaceSlug` from `useTeamLayout()`, then renders editable team settings: general info, member role management, and a delete-team danger zone for leads/admins.

---

## Screenshot Matrix

| Viewport | Theme | Tab | Preview |
|----------|-------|-----|---------|
| Desktop | Dark | Board | ![Team detail board - desktop dark](screenshots/desktop-dark-board.png) |
| Desktop | Light | Board | ![Team detail board - desktop light](screenshots/desktop-light-board.png) |
| Tablet | Light | Board | ![Team detail board - tablet light](screenshots/tablet-light-board.png) |
| Mobile | Light | Board | ![Team detail board - mobile light](screenshots/mobile-light-board.png) |
| Desktop | Dark | Calendar | ![Team detail calendar - desktop dark](screenshots/desktop-dark-calendar.png) |
| Desktop | Light | Calendar | ![Team detail calendar - desktop light](screenshots/desktop-light-calendar.png) |
| Tablet | Light | Calendar | ![Team detail calendar - tablet light](screenshots/tablet-light-calendar.png) |
| Mobile | Light | Calendar | ![Team detail calendar - mobile light](screenshots/mobile-light-calendar.png) |
| Desktop | Dark | Wiki | ![Team detail wiki - desktop dark](screenshots/desktop-dark-wiki.png) |
| Desktop | Light | Wiki | ![Team detail wiki - desktop light](screenshots/desktop-light-wiki.png) |
| Tablet | Light | Wiki | ![Team detail wiki - tablet light](screenshots/tablet-light-wiki.png) |
| Mobile | Light | Wiki | ![Team detail wiki - mobile light](screenshots/mobile-light-wiki.png) |
| Desktop | Dark | Settings | ![Team detail settings - desktop dark](screenshots/desktop-dark-settings.png) |
| Desktop | Light | Settings | ![Team detail settings - desktop light](screenshots/desktop-light-settings.png) |
| Tablet | Light | Settings | ![Team detail settings - tablet light](screenshots/tablet-light-settings.png) |
| Mobile | Light | Settings | ![Team detail settings - mobile light](screenshots/mobile-light-settings.png) |
| Desktop | Dark | Project tree | ![Team detail project tree - desktop dark](screenshots/desktop-dark-project-tree.png) |
| Desktop | Light | Project tree | ![Team detail project tree - desktop light](screenshots/desktop-light-project-tree.png) |
| Tablet | Light | Project tree | ![Team detail project tree - tablet light](screenshots/tablet-light-project-tree.png) |
| Mobile | Light | Project tree | ![Team detail project tree - mobile light](screenshots/mobile-light-project-tree.png) |

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| ~~1~~ | ~~Settings tab is a static "Coming Soon" placeholder~~ **Fixed** — settings now includes general info, member management, and a lead-only danger zone | functionality | ~~HIGH~~ |
| ~~2~~ | ~~"Projects" tab label mismatch~~ **Fixed** — renamed to "Board" to match actual content (team index redirects to board view) | ~~naming~~ | ~~MEDIUM~~ |
| ~~3~~ | ~~Duplicate workspace+team queries in child routes~~ **Fixed** — TeamLayoutContext provides teamId/workspaceId from parent; board/calendar/wiki/settings use useTeamLayout() | ~~performance~~ | ~~MEDIUM~~ |
| ~~4~~ | ~~useEffect redirect in index route~~ **Fixed** — replaced with TanStack Router `beforeLoad` + `redirect()`. No component renders, no query fires. | ~~architecture~~ | ~~LOW~~ |
| ~~5~~ | ~~Wiki page shares identical card markup with workspace wiki~~ **Fixed** — extracted `WikiDocumentGrid` to `src/components/Documents/WikiDocumentGrid.tsx`, used by both team and workspace wiki | ~~code duplication~~ | ~~MEDIUM~~ |
| ~~6~~ | ~~Board route loads workspace + team just to pass `team._id` to KanbanBoard~~ **Fixed** — board, calendar, wiki, and settings read layout context via `useTeamLayout()` | efficiency | ~~LOW~~ |
| ~~7~~ | ~~No team member list visible~~ **Fixed** — team layout header now keeps the member summary inside the shared header actions (avatars, overflow badge, count) instead of spending a separate row on chrome | ~~functionality~~ | ~~MEDIUM~~ |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/route.tsx` | Layout shell with header, breadcrumbs, RouteNav tabs |
| `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/index.tsx` | Redirect to /board |
| `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/board.tsx` | Kanban board tab |
| `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/calendar.tsx` | Team calendar tab |
| `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/wiki.tsx` | Team wiki tab |
| `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/settings.tsx` | Editable team settings surface |
| `src/components/KanbanBoard.tsx` | Full Kanban board component |
| `src/components/Calendar/CalendarView.tsx` | Shared calendar component |
| `convex/workspaces.ts` | `getBySlug` for workspace resolution |
| `convex/teams.ts` | `getBySlug` for team resolution |
| `convex/documents.ts` | `listByTeam` for wiki documents |
