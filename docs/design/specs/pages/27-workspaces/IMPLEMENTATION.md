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
| `gridColumns` | `workspaceCount > 1 ? 2 : 1` | Dynamic grid column count |
| `isCompactOverview` | `workspaceCount <= 1` | Layout variant selector |
| `pageWidth` | `isCompactOverview ? "md" : "lg"` | PageLayout max-width |

---

## Component Tree

```
WorkspacesList (route)
├── PageLayout (maxWidth: dynamic)
│   ├── PageHeader
│   │   └── actions → Button ("+ Create Workspace")
│   │
│   ├── CreateWorkspaceModal
│   │   └── Dialog
│   │       └── form
│   │           ├── Input (workspace name)
│   │           ├── Textarea (description)
│   │           └── footer: Cancel + Create buttons
│   │
│   └── PageContent
│       ├── [loading] LoadingSpinner
│       ├── [empty] EmptyState
│       │
│       ├── [compact layout: <=1 workspace]
│       │   ├── OverviewBand (metrics: Workspaces, Teams, Projects)
│       │   └── Grid → WorkspaceCard[] (compact variant)
│       │       ├── Link (to workspace detail)
│       │       └── Card (hoverable)
│       │           ├── IconCircle (emoji icon)
│       │           ├── Typography (name, description)
│       │           ├── Badge[] (Workspace, slug)
│       │           ├── InsetPanel[] (Teams metric, Projects metric)
│       │           └── InsetPanel footer (Metadata + "Open workspace" badge)
│       │
│       └── [standard layout: 2+ workspaces]
│           ├── Grid area (7/12) → WorkspaceCard[] (standard variant)
│           │   ├── Link (to workspace detail)
│           │   └── Card (hoverable)
│           │       ├── IconCircle + Typography (name)
│           │       ├── Badge (team count)
│           │       ├── Typography (description)
│           │       ├── InsetPanel[] (Teams, Projects)
│           │       └── InsetPanel footer
│           │
│           └── Grid area (5/12) → OverviewBand (sidebar)
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
3. Layout variant is selected based on workspace count (compact vs standard).
4. User clicks "+ Create Workspace" -> modal opens -> user fills form -> `workspaces.create` mutation -> on success, navigates to new workspace's teams list.
5. Clicking a workspace card navigates to `ROUTES.workspaces.detail` with the workspace slug.
