# Workspaces Page - Implementation

> **Route**: `/:orgSlug/workspaces`

---

## Queries

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.workspaces.list` | `convex/workspaces.ts` | `{ organizationId }` | Fetch all workspaces with enriched `teamCount` and `projectCount` |

### Query Return Shape

```typescript
Array<{
  _id: Id<"workspaces">;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  teamCount: number;
  projectCount: number;
}>
```

---

## Mutations

| Mutation | Source | Args | Purpose |
|----------|--------|------|---------|
| `api.workspaces.create` | `convex/workspaces.ts` | `{ name, slug, description?, icon?, organizationId }` | Create a new workspace (via CreateWorkspaceModal) |

---

## State Management

| State | Type | Location | Purpose |
|-------|------|----------|---------|
| `isCreateModalOpen` | `boolean` | Route `useState` | Controls create workspace modal visibility |
| `name` | `string` | CreateWorkspaceModal `useState` | Modal form: workspace name |
| `description` | `string` | CreateWorkspaceModal `useState` | Modal form: workspace description |
| `isSubmitting` | `boolean` | CreateWorkspaceModal `useState` | Loading state during creation |

### Computed Values (derived, not state)

| Value | Derivation | Purpose |
|-------|------------|---------|
| `workspaceCount` | `workspaces?.length ?? 0` | Total workspace count for metrics |
| `totalTeams` | `workspaces?.reduce(sum teamCount)` | Aggregate team count |
| `totalProjects` | `workspaces?.reduce(sum projectCount)` | Aggregate project count |
| `overviewCopy` | `getWorkspaceOverviewCopy({ workspaceCount, totalTeams, totalProjects })` | Concrete copy for the structure summary band |
| `hasSearch` / `showSearch` | query + workspace count | Search control visibility |
| `filteredWorkspaces` | `filterWorkspaces(workspaces, deferredQuery)` | Search result set |

---

## Component Tree

```
WorkspacesList (route)
├── PageLayout
│   ├── PageHeader
│   │   └── actions → Button ("+ Create Workspace")
│   ├── CreateWorkspaceModal
│   │   └── Dialog form (name, description, icon, slug helper)
│   └── PageContent
│       ├── [loading] shared page loading shell
│       ├── [empty] shared page EmptyState
│       └── Stack
│           ├── OverviewBand
│           │   ├── literal structure summary copy
│           │   └── metrics: Workspaces / Teams / Projects
│           ├── [showSearch] search row + clear button
│           ├── [hasSearch] match summary
│           ├── [search miss] EmptyState with clear-search action
│           └── Grid → WorkspaceCard[]
│               ├── Link (to workspace detail)
│               └── Card (hoverable)
│                   ├── IconCircle (optional emoji icon)
│                   ├── Typography (name, description)
│                   ├── metric sections (Teams, Projects)
│                   └── footer metadata + "Open workspace" badge
```

---

## Permissions

- **Authentication**: Required. Route is under `_auth` layout guard.
- **Organization membership**: Required. `workspaces.list` is an `organizationQuery`.
- **Create workspace**: `workspaces.create` (called `createWorkspace`) uses `organizationAdminMutation` -- only org admins can create workspaces.
- **View**: All org members can see the workspace list.

---

## Data Flow

1. Route mounts, queries `workspaces.list` with `organizationId`.
2. Workspace list populates, computed metrics (totalTeams, totalProjects) derive from the response.
3. The route derives `overviewCopy` from the loaded counts so the summary band always reflects the actual org structure.
4. Search filters the loaded list client-side across name, slug, and description.
5. User clicks "+ Create Workspace" -> modal opens -> user fills form -> `workspaces.create` mutation -> on success, navigates to the workspace detail route.
6. Clicking a workspace card navigates to `ROUTES.workspaces.detail` with the workspace slug.
