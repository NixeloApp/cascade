# Activity Page - Implementation

> **Route**: `/:slug/projects/:key/activity`

---

## Queries

| Query | Args | Purpose |
|-------|------|---------|
| `api.projects.getByKey` | `{ key, organizationId }` | Resolve project by URL key (via `useProjectByKey`) |
| `api.analytics.getRecentActivity` | `{ projectId, limit? }` | Fetch recent issue activity entries for the project |

`getRecentActivity` is a `projectQuery` that:
- Fetches the most recently updated issues using the `by_project_updated` index.
- For each issue, fetches its `issueActivity` entries using the `by_issue` index.
- Merges and sorts activities by creation time, returning the top `limit` entries.
- Each entry includes `action`, `field`, `oldValue`, `newValue`, `issueKey`, `userName`.

---

## Mutations

None. This is a read-only view.

---

## State

| Variable | Type | Source | Purpose |
|----------|------|--------|---------|
| `key` | `string` | URL param (`Route.useParams()`) | Project key for lookup |
| `project` | `Project \| null \| undefined` | `useProjectByKey` | Loading / not-found / resolved |

No local `useState`. The `limit` prop defaults to 50; `compact` defaults to false.

---

## Component Tree

```text
ActivityPage
├── [project === undefined]  PageContent (isLoading)
├── [project === null]       PageError "Project Not Found"
└── [project found]
    └── PageLayout (maxWidth="lg")
        ├── PageHeader  title="Project Activity"
        └── ActivityFeed  projectId={project._id}
            ├── [loading]      SkeletonList (5)
            ├── [empty]        EmptyState icon={Clock}
            └── [populated]    Flex (column, timeline)
                └── Card (per entry, recipe="activityFeedEntry")
                    ├── Icon (action-specific)
                    ├── Typography  "UserName action ISSUE-KEY"
                    ├── Typography  relative timestamp
                    └── Typography  field detail (optional)
```

---

## Permissions

- Requires authentication (route is under `_auth` layout).
- Requires organization membership (route is under `_app/$orgSlug` layout).
- `useProjectByKey` returns `null` if the user has no access to the project.
- `getRecentActivity` is a `projectQuery`, so it enforces project membership server-side.
- No role-based gating -- all project members (admin, editor, viewer) can view activity.
