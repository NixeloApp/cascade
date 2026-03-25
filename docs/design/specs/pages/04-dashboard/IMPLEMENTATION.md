# Dashboard Page - Implementation

> **Route**: `/:slug/dashboard`

---

## Core Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/dashboard.tsx` | Route wrapper with `PageHeader` and customize action |
| `src/components/Dashboard.tsx` | Query wiring, layout settings, root composition, and loading override handling |
| `src/components/Dashboard/DashboardPanel.tsx` | Shared panel anatomy used across the route |
| `src/components/Dashboard/Greeting.tsx` | Greeting and weekly context copy |
| `src/components/Dashboard/FocusZone.tsx` | Highest-priority task panel |
| `src/components/Dashboard/QuickStats.tsx` | Compact stats tiles |
| `src/components/Dashboard/MyIssuesList.tsx` | Main feed with assigned/created tabs and pagination |
| `src/components/Dashboard/WorkspacesList.tsx` | Workspace/project jump rail |
| `src/components/Dashboard/Stickies.tsx` | Quick notes rail panel |
| `src/components/Dashboard/RecentActivity.tsx` | Recent activity rail panel |
| `src/components/Dashboard/DashboardCustomizeModal.tsx` | User layout settings modal |

---

## Data Flow

1. The route renders `DashboardCustomizeModal` in the page header and mounts `Dashboard`.
2. `Dashboard` loads user/layout preferences plus dashboard queries through `useDashboardData`.
3. The route derives the visible issue feed from the active filter (`assigned`, `created`, `all`).
4. `useListNavigation` powers keyboardable issue and project selection without route-local ad hoc focus handling.
5. The dashboard loading override (`window.__NIXELO_E2E_DASHBOARD_LOADING__`) can force deterministic loading captures without changing runtime behavior for real users.

---

## Layout Contract

- The route no longer wraps the entire dashboard in a second decorative page shell.
- `Greeting` and `DashboardOverview` form the top band.
- `MyIssuesList` is the primary work column.
- `WorkspacesList`, `Stickies`, and `RecentActivity` form the supporting rail when enabled.
- Visual treatment is owned by `DashboardPanel` and its slots rather than a route-wide chrome layer plus nested panel chrome.

---

## State Handling

| Concern | Source | Notes |
|---------|--------|-------|
| Layout preferences | `api.userSettings.get` | Controls `showStats`, `showWorkspaces`, `showRecentActivity` |
| Assigned feed | `api.dashboard.getMyIssues` | Paginated; powers load-more footer |
| Created feed | `api.dashboard.getMyCreatedIssues` | Combined with assigned feed for filter switching |
| Workspace rail | `api.dashboard.getMyProjects` | Used for sidebar project navigation |
| Activity rail | `api.dashboard.getMyRecentActivity` | Compact recent-activity timeline |
| Stats | `api.dashboard.getMyStats` | Used in greeting and quick-stats tiles |
| Focus task | `api.dashboard.getFocusTask` | Drives `FocusZone` |

---

## Verified Behavior

- Route-level screenshot coverage exists for canonical, loading, customize modal, omnibox, advanced search, shortcuts, time-entry modal, and responsive nav reveal.
- The dashboard root remains keyboard-navigable through shared list-navigation helpers.
- Layout settings continue to hide/show optional rail sections without changing query ownership or panel contracts.
