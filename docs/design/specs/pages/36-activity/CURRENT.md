# Activity Page - Current State

> **Route**: `/:slug/projects/:key/activity`
> **Status**: IMPLEMENTED -- thin route delegating to `ActivityFeed` component
> **Last Updated**: 2026-03-22

---

## Purpose

Displays a chronological activity feed for a specific project. Shows issue
creation, updates, comments, assignments, link/unlink events, and watch
state changes. Each entry shows the user, action, affected issue key, and
a relative timestamp.

---

## Route Anatomy

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppSidebar / ProjectShell      PageLayout (maxWidth="lg")                   │
│ ┌─────────────────────────────────────────────────────────────────────────┐  │
│ │ PageHeader  title="Project Activity"                                  │  │
│ ├─────────────────────────────────────────────────────────────────────────┤  │
│ │                                                                       │  │
│ │  ActivityFeed                                                         │  │
│ │  ┌─ timeline line (vertical, left-aligned) ──────────────────────┐    │  │
│ │  │                                                               │    │  │
│ │  │  ┌─────────────────────────────────────────────────────────┐   │    │  │
│ │  │  │ [icon]  UserName  action text  PROJ-123     2h ago     │   │    │  │
│ │  │  │         field: newValue (detail line, if present)       │   │    │  │
│ │  │  └─────────────────────────────────────────────────────────┘   │    │  │
│ │  │                                                               │    │  │
│ │  │  ┌─────────────────────────────────────────────────────────┐   │    │  │
│ │  │  │ [icon]  UserName  action text  PROJ-456     5h ago     │   │    │  │
│ │  │  └─────────────────────────────────────────────────────────┘   │    │  │
│ │  │                                                               │    │  │
│ │  │  ... (up to limit entries)                                    │    │  │
│ │  └───────────────────────────────────────────────────────────────┘    │  │
│ │                                                                       │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Composition Walkthrough

1. **Route** extracts the `key` param and calls `useProjectByKey(key)`.
   - If `project === undefined` (loading), renders `PageContent isLoading`.
   - If `project` is `null` (not found / no access), renders `PageError`.
2. **PageLayout** with `maxWidth="lg"` constrains content width.
3. **PageHeader** renders "Project Activity" title.
4. **ActivityFeed** receives `projectId` and renders the timeline:
   - Queries `api.analytics.getRecentActivity` with `projectId` and `limit` (default 50).
   - While loading, shows `SkeletonList` (5 items).
   - If empty, shows `EmptyState` with clock icon and "No activity yet" message.
   - If populated, renders a `Flex` column with a vertical timeline line on the left
     and a `Card` per entry. Each entry has:
     - A timeline icon (colored per action type: Sparkles/created, Pencil/updated,
       MessageSquare/commented, User/assigned, etc.).
     - User name (bold), action message (color-coded), issue key (mono).
     - Relative timestamp (right-aligned, tertiary color).
     - Optional detail line showing field name and new value.

---

## Screenshot Matrix

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

---

## Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| ~~1~~ | ~~No pagination~~ **Fixed** — "Load More" button appears when results hit the limit, increments by 50 | ~~`ActivityFeed`~~ | ~~MEDIUM~~ |
| 2 | No filtering by action type, user, or date range | `ActivityFeed` | LOW |
| ~~3~~ | ~~No link on issue key~~ **Fixed** — issue keys are now `<Link>` elements that navigate to issue detail | ~~`ActivityFeed`~~ | ~~MEDIUM~~ |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/projects/$key/activity.tsx` | Route definition (33 lines) |
| `src/components/ActivityFeed.tsx` | Activity timeline component (240 lines) |
| `src/hooks/useProjectByKey.ts` | Resolves project by key param |
| `convex/analytics.ts` (`getRecentActivity`) | Backend query for activity data |
| `src/components/layout/PageLayout.tsx` | Page shell |
| `src/components/ui/EmptyState.tsx` | Empty state for no activity |
| `src/components/ui/Card.tsx` | Card used per timeline entry |
