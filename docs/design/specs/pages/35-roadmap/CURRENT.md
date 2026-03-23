# Roadmap Page - Current State

> **Route**: `/:slug/projects/:key/roadmap`
> **Status**: REVIEWED
> **Last Updated**: 2026-03-23

> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

---

## Purpose

The roadmap is the project-level Gantt chart. It answers:

1. When are issues expected to start and finish?
2. Which issues overlap or depend on each other?
3. Where is the team's time currently allocated?
4. Can I adjust timelines by dragging bars directly?

This is a full interactive timeline, not a read-only view. It supports drag-to-move,
edge-resize, dependency arrows, zoom, grouping, and epic filtering.

---

## Screenshot Matrix

### Canonical route captures

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

### Additional state captures

| State | Desktop Dark | Desktop Light | Tablet Light | Mobile Light |
|-------|-------------|---------------|--------------|--------------|
| Timeline selector open | `desktop-dark-timeline-selector.png` | `desktop-light-timeline-selector.png` | `tablet-light-timeline-selector.png` | `mobile-light-timeline-selector.png` |

### Missing captures (should be added)

- Empty state (no issues with due dates)
- Drag-in-progress (bar being moved)
- Resize-in-progress (edge being dragged)
- Dependency arrows visible between linked issues
- Group-by active (by status, assignee, priority, or epic)
- Issue detail panel open from roadmap click
- Milestone marker (single-day issue)

---

## Route Anatomy

```text
+------------------------------------------------------------------------------+
| Global app shell                                                             |
| sidebar + top utility bar                                                    |
+------------------------------------------------------------------------------+
| Roadmap route                                                                |
|                                                                              |
|  Toolbar                                                                     |
|  +------------------------------------------------------------------------+ |
|  | [<] [>] Jan 2026 - Jun 2026  [1M][3M][6M][12M] [Mo][Wk]              | |
|  | [Grp: None v] [Epic: All v] [Deps] [Zoom: compact|std|expanded]       | |
|  | [Fit] [Today]                                                          | |
|  +------------------------------------------------------------------------+ |
|                                                                              |
|  +--- info col --+-------------- timeline grid ----------------------------+ |
|  | Issue         | Jan    | Feb    | Mar    | Apr    | May    | Jun    |    | |
|  +---------------+--------+--------+--------+--------+--------+--------+  | |
|  | PROJ-1 Bug    | [======###=========]                                |  | |
|  | PROJ-2 Task   |        [====###====]                                |  | |
|  | PROJ-3 Story  |                      [========###========]          |  | |
|  | PROJ-4 Epic   |   [===========================================]    |  | |
|  |               |        |        |   |    |        |        |        |  | |
|  |               |        |        | today  |        |        |        |  | |
|  |               |        |        | marker |        |        |        |  | |
|  +---------------+--------+--------+--------+--------+--------+--------+  | |
|                                                                              |
|  Dependency arrows (SVG overlay)                                             |
|  PROJ-1 -----> PROJ-3  (arrow from end of 1 to start of 3)                  |
|                                                                              |
+------------------------------------------------------------------------------+

  [===###===] = bar with left resize handle, body (draggable), right resize handle
  ### = resize grip zones (cursor: col-resize on hover)
  | today marker = red vertical line at current date
```

---

## Current Composition

### 1. Route wrapper (51 lines)

- Thin route: resolves project by key, finds active sprint, passes `canEdit` prop.
- `RoadmapView` is lazy-loaded (2671 lines).
- `canEdit` is true for editor+ roles, false for viewers.

### 2. Toolbar controls

The toolbar is dense with controls, organized in rows:

**Navigation row:**
- Previous/Next buttons to shift the timeline window
- Date range label (e.g., "Jan 2026 - Jun 2026")
- Timeline span selector: 1M, 3M, 6M, 12M
- View mode toggle: Months | Weeks

**Options row:**
- Group by dropdown: None, Status, Assignee, Priority, Epic
- Epic filter dropdown: All, or specific epic
- Dependencies toggle (show/hide SVG arrows)
- Zoom: Compact | Standard | Expanded
- Fit button (auto-fit to issue date range)
- Today button (jump to current date)

### 3. Issue info column (left side, 256px)

- Fixed-width column showing issue key, title, type badge, assignee avatar
- Collapsible group headers when grouping is active
- Collapsible parent issues (show/hide subtasks)
- Selected issue highlighted
- Keyboard navigation (arrow keys to move selection)

### 4. Timeline grid (right side, scrollable)

- Month or week columns with header cells
- Today marker: red vertical line at current date position
- Timeline bars positioned by percentage: `left = (daysSinceStart / totalDays) * 100%`
- Bar colors: priority-based (high=red, medium=yellow, low=blue), sprint=accent
- Milestone markers for single-day issues (diamond shape)

### 5. Bar interactions (canEdit=true only)

- **Drag to move**: mousedown on bar body, mousemove shifts both start+end dates
- **Resize left edge**: changes start date only
- **Resize right edge**: changes due date only
- Both operations call `api.issues.update` with new dates on mouseup
- Visual feedback: cursor changes, bar position updates during drag

### 6. Dependency arrows (SVG overlay)

- Fetched from `api.issueLinks.getForProject`
- Rendered as SVG paths between linked issue bars
- Three opacity levels: active (1.0), default (0.7), dimmed (0.18)
- Arrow from the end of the blocker to the start of the blocked issue
- Toggle visibility with the Dependencies button

### 7. Issue detail panel

- Clicking an issue opens `IssueDetailModal`
- Full editing: title, description, status, priority, assignee, dates
- Closing returns to the roadmap without losing timeline position

---

## State Coverage

### States the current spec explicitly covers

- Filled timeline with bars across multiple months (4 viewports)
- Timeline span selector open (4 viewports)

### States that should be captured

- Empty state (no issues with due dates)
- Drag and resize in progress
- Dependency arrows between linked issues
- Group-by with collapsed/expanded groups
- Epic filter applied
- Issue detail modal open from roadmap
- Milestone markers
- Week view mode
- Compact and expanded zoom levels

---

## Current Strengths

| Area | Current Read |
|------|--------------|
| Feature completeness | Drag-resize, dependency arrows, zoom, grouping, epic filter, keyboard nav, milestones. Full Gantt. |
| Date math | Clean percentage-based positioning. No pixel rounding issues. |
| Toolbar density | Many controls but well-organized in two rows. |
| Performance | Lazy-loaded component (2671 lines). Uses `useRef` for timeline container. |
| Dependency visualization | SVG overlay with opacity dimming and active highlighting. |

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| ~~1~~ | ~~2671 lines in a single file~~ **Fixed** — decomposed into 7 files in `src/components/Roadmap/` (types, utils, rows, header, dependency panel, loading state, today marker). Main file is 775 lines. | ~~architecture~~ | ~~MEDIUM~~ |
| 2 | Mobile/tablet experience is limited for a dense Gantt chart. Drag interactions are designed for mouse, not touch. | responsive | MEDIUM |
| 3 | No undo for drag/resize operations. Accidental drags save immediately. | UX | LOW |
| 4 | Dependency arrows can overlap and become hard to trace in dense timelines. | visualization | LOW |

---

## Source Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/routes/_auth/_app/$orgSlug/projects/$key/roadmap.tsx` | 51 | Route: project resolution, canEdit, lazy load |
| `src/components/RoadmapView.tsx` | 2671 | Full Gantt chart: toolbar, timeline, bars, dependencies, interactions |
| `src/components/RoadmapView.test.tsx` | ~600 | Timeline rendering, dependency lines, issue detail viewer |
| `convex/issues/queries.ts` | — | `listRoadmapIssues` query with filters |
| `convex/issueLinks.ts` | — | `getForProject` dependency query |
| `e2e/screenshot-pages.ts` | — | `filled-roadmap` + `filled-roadmap-timeline-selector` specs |

---

## Review Guidance

- Do not simplify the toolbar by removing controls. The Gantt chart needs all of them.
- If the component is split, keep all interaction state in a single parent to avoid prop drilling.
- Touch support for drag/resize would be valuable but should not break mouse interactions.
- Do not replace dependency SVG arrows with CSS-only lines. SVG paths handle arbitrary routing.
- The "Fit" button (auto-fit to issue date range) is an important UX shortcut. Do not remove it.

---

## Summary

The roadmap is the most complex single component in the application (2671 lines). It is a
fully interactive Gantt chart with drag-to-move, edge-resize, dependency arrows, zoom levels,
grouping, epic filtering, keyboard navigation, and milestone markers. The main architectural
concern is the single-file size. The feature set is complete and does not need additions.
