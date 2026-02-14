# Dashboard Page - Current State

> **Route**: `/:slug/dashboard`
> **Status**: 🟡 NEEDS POLISH
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
| 1 | Card borders too visible | All cards | HIGH |
| 2 | Background not dark enough | Page bg in dark mode | HIGH |
| 3 | Stats cards lack visual depth | `OverviewStats.tsx` | MEDIUM |
| 4 | Empty states not delightful | Various | MEDIUM |
| 5 | Right sidebar cards blend together | Right sidebar | MEDIUM |
| 6 | Tab styling could be more refined | `DashboardFeed.tsx` | MEDIUM |
| 7 | Greeting typography could use more hierarchy | `DashboardGreeting.tsx` | LOW |

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
- Card borders are too prominent (should be nearly invisible in dark mode)
- Background uses gray-900 instead of near-black (#08090a)
- Stats cards lack visual depth
- Empty states are functional but not delightful
- Tab indicator could be smoother
