# Dashboard Page - Current State

> **Route**: `/:slug/dashboard`
> **Status**: 🟡 Improved, with smaller remaining weighting issues
> **Last Updated**: Run `pnpm screenshots` to regenerate

---

## Screenshots

| Viewport | State | Preview |
|----------|-------|---------|
| Desktop | Filled | ![](screenshots/desktop-dark-filled.png) |
| Desktop | Empty | ![](screenshots/desktop-dark-empty.png) |

---

## Structure

Three-column layout:

```
+------------------+----------------------------------------+------------------+
|    SIDEBAR       |           MAIN CONTENT                 |  RIGHT SIDEBAR   |
|    (200px)       |           (flexible)                   |    (320px)       |
+------------------+----------------------------------------+------------------+
```

### Full Layout

```
+================================================================================+
|  HEADER BAR (64px)                                                             |
|  +--logo--+                      [Commands] [Timer] [Search] [Bell] [Avatar]   |
+================================================================================+
|          |                                                        |            |
| SIDEBAR  |  MAIN CONTENT                                          | RIGHT      |
| (200px)  |                                                        | SIDEBAR    |
|          |  Dashboard                                  [Customize]| (320px)    |
| +------+ |                                                        |            |
| |[Home]| |  +----------------------------------------------------+| +--------+ |
| |Dashbd| |  |                                                    || |Workspcs| |
| +------+ |  |  Good evening, Emily.                              || |1 active| |
| |Issues | |  |  1 task completed this week.                       || |        | |
| |Calend | |  |                                                    || |+------+| |
| |Docs  v| |  +----------------------------------------------------+| ||Demo  || |
| | Templ | |                                                        | ||Proj  || |
| |Worksp v| |  FOCUS ITEM                           OVERVIEW        | ||ADMIN || |
| | Produc| |  +------------------------+  +------------------------+| |+------+| |
| |Time Tk| |  | [HIGHEST]    DEMO-2    |  | ACTIVE     | VELOCITY  || +--------+ |
| |       | |  |                        |  | LOAD       |           || |        | |
| |       | |  | Fix login timeout on   |  | 4 Assigned | 1 Done    || | Feed   | |
| |       | |  | mobile                 |  | tasks      | this week || | Latest | |
| |       | |  |                        |  +------------+-----------+| |        | |
| |       | |  | In project: Demo Proj  |  | ATTENTION  | CONTRI-   || |+------+| |
| |       | |  |                        |  | NEEDED     | BUTION    || ||      || |
| |       | |  | View Task ->           |  | 3 High     | 6 Reported|| ||NoActy|| |
| |       | |  +------------------------+  | Priority   | issues    || ||      || |
| |       | |                              +------------+-----------+| |+------+| |
| |       | |                                                        | |        | |
| |       | |  Feed                                                  | |        | |
| |       | |  Track your active contributions                       | |        | |
| |       | |  +----------------------------------------------------+| |        | |
| |       | |  | [ASSIGNED (4)]  CREATED (6)                        || |        | |
| |       | |  +----------------------------------------------------+| |        | |
| |       | |  | DEMO-5  [HIGH]                                     || |        | |
| |       | |  | Database query optimization                        || |        | |
| |       | |  | DEMO PROJECT - IN-PROGRESS                         || |        | |
| |       | |  +----------------------------------------------------+| |        | |
| +------+ |  | ...                                                 || |        | |
| [Settngs]|  +----------------------------------------------------+| |        | |
+----------+--------------------------------------------------------+-+--------+-+
```

---

## Current Elements

### Header Area
- **Logo**: "Nixelo E2E" with sidebar toggle icon
- **Top Bar**: Commands (Cmd+K), Start Timer button, Search (Cmd+K), Notifications bell, User avatar

### Left Sidebar Navigation
- Dashboard (active - highlighted with indigo background)
- Issues
- Calendar
- Documents (expandable)
  - Templates
- Workspaces (expandable)
  - Product
- Time Tracking
- Settings (bottom)

### Main Content Area

**Greeting Section**:
- Large italic heading: "Good evening, **Emily**." (or "there" for anonymous)
- Subtext: "1 task completed this week." (or "Here's your overview for today.")
- Top right: "Customize" button with settings icon

**Focus Item Card** (when data exists):
- Section label: "FOCUS ITEM"
- Card with:
  - Priority badge (e.g., "HIGHEST" in orange)
  - Issue key (e.g., "DEMO-2")
  - Issue title: "Fix login timeout on mobile"
  - Project reference: "In project: Demo Project"
  - "View Task ->" link

**Overview Stats** (4-card grid):
- Section label: "OVERVIEW"
- **Active Load**: "4 Assigned tasks"
- **Velocity**: "1 Done this week" (with progress bar)
- **Attention Needed**: "3 High Priority" (orange text)
- **Contribution**: "6 Reported issues"

**Feed Section**:
- Title: "Feed"
- Subtitle: "Track your active contributions"
- Tab navigation: ASSIGNED (4) | CREATED (6)
- Issue list with:
  - Issue key + Priority badge
  - Issue title
  - Project name + Status badge

### Right Sidebar

**Workspaces Panel**:
- Title: "Workspaces"
- Subtitle: "1 active project"
- Project card: "Demo Project" with ADMIN badge, "4 ASSIGNED ISSUES"

**Feed Panel** (secondary):
- Title: "Feed"
- Subtitle: "Latest updates across all projects"
- Empty state: Chart icon, "No activity" message

---

## Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/routes/$slug/dashboard.tsx` | Route definition | ~150 |
| `src/components/dashboard/DashboardGreeting.tsx` | Greeting section | ~50 |
| `src/components/dashboard/FocusItem.tsx` | Focus item card | ~80 |
| `src/components/dashboard/OverviewStats.tsx` | Stats grid | ~120 |
| `src/components/dashboard/DashboardFeed.tsx` | Feed section | ~150 |
| `src/components/layout/AppLayout.tsx` | Three-column layout | ~200 |
| `src/components/layout/Sidebar.tsx` | Left navigation | ~180 |

---

## Problems

| # | Problem | Location | Severity |
|---|---------|----------|----------|
| 1 | Background still reads a little flatter than the rest of the authenticated product in dark mode | Page bg in dark mode | HIGH |
| 2 | Focus card still carries slightly more shell and glow than the rest of the dashboard earns | `FocusZone.tsx` | MEDIUM |
| 3 | Greeting + focus block still pulls a little too much emphasis versus the working lists beside it | `DashboardGreeting.tsx` / `FocusZone.tsx` | MEDIUM |
| 4 | Right sidebar panels are cleaner, but still want slightly stronger separation in light mode | `WorkspacesList.tsx` / `RecentActivity.tsx` | MEDIUM |
| 5 | Empty states now share the panel rhythm, but can still be more product-specific | Various dashboard panels | LOW |
| 6 | Metric tiles are cleaner, but still want a little more light-mode refinement | `QuickStats.tsx` | LOW |

---

## Component Details

### Focus Item Card

```
+----------------------------------------------------------+
|  FOCUS ITEM                                               |
+----------------------------------------------------------+
|                                                           |
|  +-----------------------------------------------------+ |
|  |  +----------+                          DEMO-2       | |
|  |  | HIGHEST  |                                       | |
|  |  +----------+                                       | |
|  |                                                     | |
|  |  Fix login timeout on mobile                        | |
|  |                                                     | |
|  |  In project: Demo Project                           | |
|  |                                                     | |
|  |                              View Task ->           | |
|  +-----------------------------------------------------+ |
|                                                           |
+----------------------------------------------------------+
```

### Overview Stats Grid

```
+----------------------------------------------------------+
|  OVERVIEW                                                 |
+----------------------------------------------------------+
|                                                           |
|  +-------------+  +-------------+  +-------------+  +---+ |
|  | ACTIVE LOAD |  | VELOCITY    |  | ATTENTION   |  |CON| |
|  |             |  |             |  | NEEDED      |  |TRI| |
|  |    4        |  |    1        |  |    3        |  | 6 | |
|  | Assigned    |  | Done this   |  | High        |  |Rep| |
|  | tasks       |  | week        |  | Priority    |  |ort| |
|  |             |  | [===-----]  |  |             |  |ed | |
|  +-------------+  +-------------+  +-------------+  +---+ |
|                                                           |
+----------------------------------------------------------+
```

### Feed List Item

```
+----------------------------------------------------------+
|  DEMO-5   [HIGH]                                          |
|  Database query optimization                              |
|  DEMO PROJECT - IN-PROGRESS                               |
+----------------------------------------------------------+
     ^         ^              ^              ^
     |         |              |              |
 Issue Key  Priority       Title         Project + Status
            Badge
```

### Empty State (No Projects)

```
+----------------------------------------------------------+
|                                                           |
|                      +--------+                           |
|                      |  [?]   |                           |
|                      +--------+                           |
|                                                           |
|                    No projects                            |
|          You're not a member of any projects yet          |
|                                                           |
|                  [Go to Workspaces]                       |
|                                                           |
+----------------------------------------------------------+
```

---

## Summary

The dashboard is functional but needs polish:
- Feed, stats, workspaces, and recent activity now share one section-shell contract instead of mixing header cards, inset wrappers, and ad hoc tab bars.
- The active feed rows now read as one queue instead of stacked mini-cards, which makes the dashboard feel more like the rest of the product.
- Remaining work is now mostly visual weighting: darker page grounding, a slightly calmer hero/focus balance, and lighter-mode refinement in the right rail and metric tiles.
