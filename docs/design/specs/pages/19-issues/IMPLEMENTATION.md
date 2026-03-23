# Issues Page - Implementation

> **Route file**: `src/routes/_auth/_app/$orgSlug/issues/index.tsx`
> **Last Updated**: 2026-03-23

---

## Data Flow

### Queries

| Query | Source | Purpose |
|-------|--------|---------|
| `api.issues.listOrganizationIssues` | `usePaginatedQuery` | Paginated org-wide issue list, server-side status filter |
| `api.projects.getOrganizationWorkflowStates` | `useAuthenticatedQuery` | Unique workflow states across all org projects for the filter dropdown |

### Pagination

- `usePaginatedQuery` with `initialNumItems: 20`
- Server returns pages with `continueCursor` for next-page loading
- "Load More" button triggers `loadMore(20)` — adds 20 more items
- Status filter is passed as a query arg (server-side filtering)
- Search is client-side only: `issues.filter(i => title.includes(q) || key.includes(q))`

### State Management

```text
Route state (useState):
├── showCreateModal: boolean        — controls CreateIssueModal visibility
├── selectedIssueId: Id | null      — controls IssueDetailViewer sheet
├── statusFilter: string | undefined — server-side workflow state filter
└── searchQuery: string             — client-side title/key search
```

No external state management (no Zustand, no context). All state is local to the route.

---

## Component Tree

```text
AllIssuesPage
├── PageLayout
│   └── PageStack
│       ├── PageHeader
│       │   └── actions: ViewModeToggle + Button("Create Issue")
│       ├── PageControls
│       │   └── PageControlsRow
│       │       ├── Input (search, variant="search")
│       │       └── Select (status filter)
│       ├── PageContent (isLoading, isEmpty, emptyState)
│       │   └── Grid (cols: 1/2/3/4 responsive)
│       │       └── IssueCard[] (read-only, onClick -> setSelectedIssueId)
│       └── Button ("Load More") — conditional on CanLoadMore
├── CreateIssueModal (overlay)
└── IssueDetailViewer (overlay sheet)
    └── IssueDetailSheet
        └── IssueDetailContent
            ├── IssueDetailHeader (key, title, type)
            ├── IssueDescriptionEditor (Plate.js)
            ├── IssueDetailSidebar (status, priority, assignee, labels, dates)
            ├── SubtasksList
            ├── IssueDependencies
            ├── IssueComments
            └── IssueMetadataSection
```

---

## Key Implementation Details

### IssueCard (565 lines)

The card is the primary visual unit. It renders:
- Issue key (`PROJ-123`) as a badge
- Title (truncated)
- Type badge (task/bug/story/epic with color variants)
- Priority indicator (icon + color)
- Assignee avatar (if assigned)
- Status pill
- Due date (if set, with overdue highlighting)
- Labels (if any, as small badges)
- Story points (if set)

The card supports both read-only mode (`canEdit={false}`, used here) and drag-enabled mode
(used on the Kanban board). In read-only mode, the only interaction is click-to-open.

### CreateIssueModal (1207 lines)

Full issue creation with:
- Project selector (required — this is an org-wide view)
- Title input (required)
- Description editor (Plate.js)
- Type selector (task/bug/story/epic)
- Priority selector
- Assignee picker (project members)
- Label multi-select
- Sprint selector
- Start date / due date pickers
- Estimated hours / story points

Uses `api.issues.createIssue` or `api.issues.create` mutation.

### IssueDetailViewer (47 lines)

Thin wrapper that passes `issueId` to `IssueDetailSheet` with `open`/`onOpenChange` props.
The sheet slides in from the right edge, dimming the background.

---

## Permissions

| Action | Required Role |
|--------|---------------|
| View issues | Any authenticated org member |
| Search/filter | Any authenticated org member |
| Open detail panel | Any authenticated org member |
| Edit issue fields | Project editor+ on the issue's project |
| Create issue | Project editor+ on the selected project |

The route does not do its own permission check — it relies on the query layer
(`listOrganizationIssues`) to return only issues the user can access.

---

## Responsive Behavior

| Breakpoint | Grid Columns | Controls Layout |
|------------|-------------|-----------------|
| Mobile (<640px) | 1 | Search full-width, status below |
| Tablet (640-1024px) | 2 | Search and status side-by-side |
| Desktop (1024-1280px) | 3 | Same as tablet |
| Wide (>1280px) | 4 | Same as tablet |

The detail panel sheet is full-width on mobile and a side panel on desktop.

---

## Testing

| Test File | Coverage |
|-----------|----------|
| `src/components/IssueDetail/IssueCard.test.tsx` | Card rendering, badges, click handler |
| `src/components/IssueDetail/CreateIssueModal.test.tsx` | Form validation, submission, error handling |
| `src/components/IssueDetail/IssueDetailContent.test.tsx` | Detail layout rendering |
| `e2e/screenshot-pages.ts` | `empty-issues` + `filled-issues` screenshot specs |
