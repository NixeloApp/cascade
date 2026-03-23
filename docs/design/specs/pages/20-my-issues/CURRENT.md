# My Issues Page - Current State

> **Route**: `/:slug/my-issues`
> **Status**: REVIEWED
> **Last Updated**: 2026-03-23

---

## Purpose

Personal issue board showing only issues assigned to or created by the current user. Answers: "What's on my plate right now?" Groups issues by status or project for quick scanning.

---

## Route Anatomy

```text
+------------------------------------------------------------------------------+
| PageHeader: "My Issues"                                                      |
|                                         [Group By: Status v] [View Board]    |
+------------------------------------------------------------------------------+
| Grouped columns (when groupBy = "status")                                    |
|                                                                              |
|  In Progress (3)    |  Todo (5)          |  Done (8)                         |
|  +--------------+   |  +--------------+  |  +--------------+                |
|  | PROJ-1 Bug   |   |  | PROJ-4 Task  |  |  | PROJ-7 Story |                |
|  +--------------+   |  +--------------+  |  +--------------+                |
|  | PROJ-2 Task  |   |  | PROJ-5 Story |  |  | ...          |                |
|  +--------------+   |  +--------------+  |  +--------------+                |
|                     |                    |                                    |
+------------------------------------------------------------------------------+
```

---

## Current Composition

- `usePaginatedQuery(api.dashboard.getMyIssues)` with 100 initial items
- Client-side grouping by status or project key
- Groups sorted by count (largest first)
- Each issue links to `/:slug/issues/:key` detail page
- "View Board" link navigates to the project board for that issue
- Load more pagination at bottom

## Screenshot Matrix

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

## Current Problems

| # | Problem | Severity |
|---|---------|----------|
| 1 | Client-side grouping on 100 items only. No server-side group query. | MEDIUM |
| 2 | No priority or date filters. Only group-by toggle. | LOW |

## Source Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/routes/_auth/_app/$orgSlug/my-issues.tsx` | 109 | Route with grouping logic |
| `src/components/IssueDetail/IssueCard.tsx` | 565 | Shared issue card |
