# Analytics Page - Current State

> **Route**: `/:slug/projects/:key/analytics`
> **Status**: REVIEWED, with routine follow-up polish only
> **Last Updated**: 2026-03-21

> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

---

## Scope

This page spec covers the **project analytics** route. Organization analytics now has its own
separate screenshot route and should be reviewed through the org analytics spec folder, not folded
into this one.

The project analytics route is supposed to do three things:

1. summarize current delivery flow
2. expose ownership and sprint signal without leaving the project shell
3. keep charts and recent activity inside one contextual project workspace

---

## Screenshot Matrix

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

The current spec folder only tracks the canonical project analytics route across the standard
viewport matrix. Org analytics is reviewed separately.

---

## Route Anatomy

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Shared project shell                                                                        │
│ compact project header + section nav                                                        │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Project analytics route                                                                     │
│                                                                                             │
│  PageHeader                                                                                 │
│  "{projectName} analytics"                                                                  │
│  Delivery, workload, and ownership signals for {projectKey}                                 │
│                                                                                             │
│  Insight band                                                                               │
│  [Flow Snapshot] [Ownership] [Sprint Signal]                                                │
│                                                                                             │
│  Metric band                                                                                │
│  [Total Issues] [Unassigned] [Avg Velocity] [Completed Sprints]                             │
│                                                                                             │
│  Chart grid                                                                                 │
│  [Issues by Status] [Issues by Type]                                                        │
│  [Issues by Priority] [Team Velocity]                                                       │
│                                                                                             │
│  Lower row                                                                                  │
│  [Issues by Assignee] [Recent Activity]                                                     │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Current Composition

### 1. Contextual project framing

- The route receives real `projectId`, `projectName`, and `projectKey` context from the project
  route instead of pretending analytics is route-agnostic.
- The header copy names the actual project and keeps the page inside the shared project shell.

### 2. Insight band

- `AnalyticsInsightCard` provides the top interpretation layer:
  - `Flow Snapshot`
  - `Ownership`
  - `Sprint Signal`
- This is the "what should I conclude from the charts?" layer that the older generic dashboard
  lacked.

### 3. Metrics band

- Standard stat cards still exist, but they are now secondary to the contextual insight band.
- The route is no longer "four metrics, then charts"; it is "context first, metrics second."

### 4. Breakdown charts

- Status
- Type
- Priority
- Velocity
- Assignee

Each chart now has explicit empty-state handling instead of silently disappearing when data is
thin.

### 5. Recent activity

- The route keeps recent project activity inside the same analytics shell rather than bolting on a
  generic feed card.

---

## State Coverage

### Route states currently covered

- Filled project analytics route across desktop/tablet/mobile
- Loading skeleton state in code
- Explicit empty-state paths inside charts and recent activity

### Route states not yet called out by dedicated screenshots

- sparse-data project with minimal assignee/velocity information
- truly no-activity project
- project shell navigation interactions beyond the canonical route capture

Those are not broken, but they are not yet separate reviewed screenshot artifacts.

---

## Current Strengths

| Area | Current Read |
|------|--------------|
| Project context | Strong. The route now feels tied to the active project instead of being a generic analytics demo. |
| Section rhythm | Good. Insight cards, metrics, charts, and activity now read as one workspace. |
| Empty-state honesty | Better than the earlier route because missing data produces explicit sections instead of silently dropped panels. |
| Screenshot trust | High for the canonical route. The reviewed captures match the current contextual layout. |

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | The canonical screenshot matrix is current, but it still only covers the main route; sparse-data or low-history states remain implicit | screenshot coverage | MEDIUM |
| 2 | Desktop light mode is valid, but the chart grid still reads a bit flatter than the top insight band | surface hierarchy | LOW |
| 3 | The route is contextual now, but there is still no explicit date-range or comparison control when the user wants analysis beyond the default view | product depth | LOW |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/projects/$key/analytics.tsx` | Project analytics route and project context wiring |
| `src/components/AnalyticsDashboard.tsx` | Main project analytics composition |
| `src/components/Analytics/AnalyticsInsightCard.tsx` | Top-level insight band |
| `src/components/Analytics/ChartCard.tsx` | Shared chart section shell |
| `src/components/Analytics/MetricCard.tsx` | Metric cards |
| `src/components/Analytics/RecentActivity.tsx` | Activity section |
| `e2e/screenshot-pages.ts` | Project analytics screenshot capture |

---

## Review Guidance

- Keep project analytics contextual. Do not regress it into a generic stats wall.
- If screenshot coverage grows, prioritize:
  - sparse-history project
  - no recent activity
  - low-assignment / high-unassigned project
- Org analytics belongs in the org analytics spec, not blended back into this page doc.

---

## Summary

Project analytics is current and materially better than the old generic dashboard version. The
remaining work is about screenshot depth and low-data-state review, not route identity or major
layout problems.
