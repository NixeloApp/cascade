# Roadmap Page - Current State

> **Route**: `/:slug/projects/:key/roadmap`
> **Status**: REVIEWED
> **Last Updated**: 2026-03-26

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

## Permissions & Access

- Route requires authenticated access to the selected project.
- `canEdit` is granted to editor-and-up roles and removes drag/resize writes for viewers.
- The route resolves the project key before rendering the roadmap shell, so inaccessible or missing
  projects never show a partial timeline.

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
| Grouped by status | `desktop-dark-grouped.png` | `desktop-light-grouped.png` | `tablet-light-grouped.png` | `mobile-light-grouped.png` |
| Issue detail open | `desktop-dark-detail.png` | `desktop-light-detail.png` | `tablet-light-detail.png` | `mobile-light-detail.png` |
| Empty roadmap | `desktop-dark-empty.png` | `desktop-light-empty.png` | `tablet-light-empty.png` | `mobile-light-empty.png` |
| Milestone marker | `desktop-dark-milestone.png` | `desktop-light-milestone.png` | `tablet-light-milestone.png` | `mobile-light-milestone.png` |

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
- `RoadmapView` is lazy-loaded (791 lines).
- `canEdit` is true for editor+ roles, false for viewers.

### 2. Toolbar controls

The toolbar is dense with controls, organized in rows:

On narrow screens, the title and control rail now stack vertically so the route keeps the
timeline context visible instead of pinning a desktop-width toolbar beside the heading.

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

## Primary Flow

1. User opens the project roadmap route.
2. The route resolves the project, active sprint context, and edit permissions.
3. `RoadmapView` renders the default timeline window with dependency arrows enabled.
4. The user scans the left issue rail and timeline bars, then adjusts the view with span, grouping,
   zoom, and epic-filter controls.
5. Clicking a bar opens issue detail in-context; users with edit access can also drag or resize bars
   to save new dates directly.

---

## Alternate / Failure Flows

- Grouped mode collapses the roadmap into group headers with nested issue rows.
- The timeline selector, milestone state, and detail-open state are all part of the reviewed
  screenshot matrix, not just ad hoc local testing.
- Viewers can still inspect the roadmap and open issue details, but they do not get drag/resize
  timeline writes.
- Dense dependency graphs are still functional, but the current route does not attempt advanced
  collision avoidance for overlapping SVG arrows.

---

## Empty / Loading / Error States

- While the lazy route and project context resolve, the route wrapper keeps the standard app shell
  loading behavior rather than rendering an incomplete timeline.
- If no dated issues are available, the route renders the explicit empty-roadmap state that is
  captured across all reviewed viewports.
- Missing or inaccessible projects are handled at the route layer before `RoadmapView` renders.

---

## State Coverage

### States the current spec explicitly covers

- Filled timeline with dependency arrows across multiple months (4 viewports)
- Timeline span selector open (4 viewports)
- Grouped-by-status timeline (4 viewports)
- Issue detail modal open from roadmap click (4 viewports)
- Empty state with no dated issues (4 viewports)
- Milestone marker rendering (4 viewports)

### Follow-up states still worth review

- Drag-in-progress and resize-in-progress snapshots, if we want transient interaction review beyond the existing unit coverage
- Week-view, compact zoom, and expanded zoom variants if screenshot review starts surfacing timeline-density drift there
- Epic-filter-specific review if a future product pass changes the grouping/filter shell significantly

---

## Current Strengths

| Area | Current Read |
|------|--------------|
| Feature completeness | Drag-resize, dependency arrows, zoom, grouping, epic filter, keyboard nav, milestones. Full Gantt. |
| Date math | Clean percentage-based positioning. No pixel rounding issues. |
| Toolbar density | Many controls but well-organized in two rows. |
| Screenshot trust | Strong. The reviewed matrix now covers dependency-linked, grouped, detail-open, empty, milestone, and selector-open states across the full viewport set. |
| Performance | Lazy-loaded component (791 lines). Uses `useRef` for timeline container. |
| Dependency visualization | SVG overlay with opacity dimming and active highlighting. |

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| ~~1~~ | ~~2671 lines in a single file~~ **Fixed** — decomposed into `src/components/Roadmap/` support modules. Main file is now 791 lines and the reviewed screenshot matrix covers the route's real operating states instead of a shallow canonical-only baseline. | ~~architecture~~ | ~~MEDIUM~~ |
| 2 | Mobile/tablet roadmap chrome now fits the viewport, but direct drag/resize interactions are still designed for mouse rather than touch. | responsive | MEDIUM |
| 3 | No undo for drag/resize operations. Accidental drags save immediately. | UX | LOW |
| 4 | Dependency arrows can overlap and become hard to trace in dense timelines. | visualization | LOW |

---

## Source Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/routes/_auth/_app/$orgSlug/projects/$key/roadmap.tsx` | 51 | Route: project resolution, canEdit, lazy load |
| `src/components/RoadmapView.tsx` | 791 | Main Gantt shell: toolbar, timeline container, dependency overlay, and interactions |
| `src/components/Roadmap/` | split | Header controls, rows, dependency panel, today marker, types, and timeline utilities |
| `src/components/RoadmapView.test.tsx` | ~600 | Timeline rendering, dependency lines, issue detail viewer |
| `convex/issues/queries.ts` | — | `listRoadmapIssues` query with filters |
| `convex/issueLinks.ts` | — | `getForProject` dependency query |
| `convex/e2e.ts` | — | E2E-only roadmap state controller for deterministic default, empty, and milestone seeded variants |
| `e2e/screenshot-pages.ts` | — | Canonical plus grouped, detail, empty, milestone, and selector states |

---

## Acceptance Criteria

- The route documents both the canonical timeline and the reviewed grouped, detail-open, empty,
  milestone, and selector-open states.
- A reviewer can tell which behavior is viewer-safe vs editor-only without reading the route code.
- Empty and missing-resource behavior is described explicitly instead of being implied by
  screenshots alone.
- The current doc points to the route wrapper, roadmap modules, backend queries, and screenshot
  entry points that define the surface.

---

## Review Guidance

- Do not simplify the toolbar by removing controls. The Gantt chart needs all of them.
- If the component is split, keep all interaction state in a single parent to avoid prop drilling.
- Touch support for drag/resize would be valuable but should not break mouse interactions.
- Do not replace dependency SVG arrows with CSS-only lines. SVG paths handle arbitrary routing.
- The "Fit" button (auto-fit to issue date range) is an important UX shortcut. Do not remove it.

---

## Summary

The roadmap is still one of the densest product surfaces, but it is no longer a shallow
reviewed route. The current spec now covers the dependency-linked canonical timeline plus
grouped, detail-open, empty, milestone, and selector-open states across desktop/tablet/mobile.
The remaining roadmap work is mostly targeted UX polish rather than missing review coverage.
