# Dashboard Page - Current State

> **Route**: `/:slug/dashboard`
> **Status**: REVIEWED, with follow-up shell simplification still worth doing
> **Last Updated**: 2026-03-21

> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

---

## Purpose

The dashboard is the authenticated landing workspace. It is supposed to answer four questions
immediately:

1. What should I focus on first?
2. How much pressure is currently on me or my team?
3. Which issues need attention right now?
4. Which workspaces and recent activity matter enough to jump into next?

This route is no longer a generic hero card plus filler panels. It now behaves like an actual
workspace surface, but some local shell treatment is still heavier than the content really needs.

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
|------|---------------|---------------|--------------|--------------|
| Advanced search modal | `desktop-dark-advanced-search-modal.png` | `desktop-light-advanced-search-modal.png` | `tablet-light-advanced-search-modal.png` | `mobile-light-advanced-search-modal.png` |
| Customize modal | `desktop-dark-customize-modal.png` | `desktop-light-customize-modal.png` | `tablet-light-customize-modal.png` | `mobile-light-customize-modal.png` |
| Loading skeletons | `desktop-dark-loading-skeletons.png` | `desktop-light-loading-skeletons.png` | `tablet-light-loading-skeletons.png` | `mobile-light-loading-skeletons.png` |
| Omnibox | `desktop-dark-omnibox.png` | `desktop-light-omnibox.png` | `tablet-light-omnibox.png` | `mobile-light-omnibox.png` |
| Shortcuts modal | `desktop-dark-shortcuts-modal.png` | `desktop-light-shortcuts-modal.png` | `tablet-light-shortcuts-modal.png` | n/a |
| Time entry modal | `desktop-dark-time-entry-modal.png` | `desktop-light-time-entry-modal.png` | `tablet-light-time-entry-modal.png` | `mobile-light-time-entry-modal.png` |
| Mobile hamburger / nav reveal | n/a | n/a | `tablet-light-mobile-hamburger.png` | `mobile-light-mobile-hamburger.png` |

The screenshot harness also has a dedicated loading override for this route, so the skeleton
capture is intentional rather than a race condition.

---

## Route Anatomy

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Global app shell                                                                            │
│ sidebar + top utility bar                                                                   │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Dashboard route                                                                             │
│                                                                                             │
│  Greeting row                                           [Customize]                         │
│  "Good evening, ..." + short weekly context                                              │
│                                                                                             │
│  ┌──────────────────── main overview grid ────────────────────┬──────── right panel ─────┐ │
│  │ FocusZone                                                  │ Overview                   │ │
│  │ one current priority task                                  │ weekly pulse stats         │ │
│  └────────────────────────────────────────────────────────────┴────────────────────────────┘ │
│                                                                                             │
│  ┌──────────────────── primary work list ─────────────────────┬──────── side rail ────────┐ │
│  │ MyIssuesList                                               │ WorkspacesList             │ │
│  │ assigned / created / all                                   │ recent projects            │ │
│  │ load more                                                  │                            │ │
│  │                                                            │ RecentActivity             │ │
│  │                                                            │ latest org/project actions │ │
│  └────────────────────────────────────────────────────────────┴────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Current Composition

### 1. Route shell

- The route lives under the authenticated app shell and inherits the standard top nav, search,
  shortcuts, timer, notifications, and avatar controls.
- The dashboard surface itself is built inside `PageLayout` discipline instead of inventing a
  route-only layout system.

### 2. Greeting and top-level framing

- `Greeting` carries the user-specific opening line and short weekly context.
- `DashboardCustomizeModal` is the only top-right control at the route level; it toggles the
  route's optional sections rather than adding another toolbar row.

### 3. Priority / pulse band

- `FocusZone` is the first workload artifact. It is not decorative; it is the route's answer to
  "what should I look at first?"
- `QuickStats` sits beside it inside a shared `DashboardPanel`, which makes capacity, throughput,
  and pressure visible without making the route feel like a metrics-only dashboard.

### 4. Main work surface

- `MyIssuesList` is the real primary work area.
- The filter axis is `assigned`, `created`, or `all`; the route does not attempt secondary sort
  systems or dashboard-only task semantics.
- Pagination is explicit through the list's `loadMore` behavior.

### 5. Secondary side rail

- `WorkspacesList` is the jump surface for active projects.
- `RecentActivity` gives a compact cross-project activity rail.
- The side rail is optional and route-configurable through dashboard layout settings.

---

## State Coverage

### Route states the current spec explicitly covers

- Filled dashboard with real seeded issues and projects
- Loading skeleton state
- Customize modal open
- Global omnibox over the route
- Global advanced search modal over the route
- Global shortcuts modal over the route
- Manual time-entry modal over the route
- Responsive nav reveal on tablet/mobile

### Route states intentionally not over-specified here

- Empty organization / no projects
- Every dashboard layout-toggle combination
- Deep issue-row interactions that belong to issue routes rather than dashboard review

Those cases still need to work, but they are not the canonical visual review baseline.

---

## Current Strengths

| Area | Current Read |
|------|--------------|
| Work surface hierarchy | Much stronger than the old hero-ish dashboard. The route now reads like a workspace, not a marketing overview card. |
| Screenshot trustworthiness | High. The route and overlay captures now represent real seeded content and deterministic loading behavior. |
| Shared shell discipline | Better than earlier branch state because the route uses the same page rhythm as other authenticated surfaces. |
| Responsive behavior | Mobile and tablet no longer collapse into unusable chrome-first captures. |

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | The main dashboard shell still leans too hard on decorative gradients, blur blobs, and local shell overrides layered on top of `dashboardShell` | `src/components/Dashboard.tsx` | MEDIUM |
| 2 | The route is calmer than before, but the first card stack still carries more visual treatment than the content volume requires | overview shell / `DashboardPanel` usage | MEDIUM |
| 3 | Desktop light mode is structurally valid, but the right rail can still look slightly detached from the primary work list | overall composition | LOW |

This is now a real product-surface critique, not a harness failure or missing-content problem.

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/dashboard.tsx` | Route wrapper and header actions |
| `src/components/Dashboard.tsx` | Route composition, layout settings, query wiring |
| `src/components/Dashboard/Greeting.tsx` | Greeting block |
| `src/components/Dashboard/FocusZone.tsx` | First-priority task surface |
| `src/components/Dashboard/QuickStats.tsx` | Weekly pulse stats |
| `src/components/Dashboard/MyIssuesList.tsx` | Primary issues list |
| `src/components/Dashboard/WorkspacesList.tsx` | Workspace/project rail |
| `src/components/Dashboard/RecentActivity.tsx` | Recent activity rail |
| `src/components/Dashboard/DashboardPanel.tsx` | Shared dashboard section chrome |
| `src/components/DashboardCustomizeModal.tsx` | Layout customization modal |
| `e2e/screenshot-pages.ts` | Dashboard readiness, overlay states, loading override |

---

## Review Guidance

- Do not regress this route back toward a "hero card plus stats" composition.
- Do not solve dashboard polish by adding more decorative shell layers.
- If the shell still feels too art-directed, simplify ownership:
  - either `dashboardShell` owns the treatment
  - or the route should use a simpler shared shell
  - but not `recipe + large local shell overrides + multiple absolute decorative layers`

---

## Summary

The dashboard is current, reviewable, and structurally sound. The remaining work is not about
missing content or broken screenshots. It is about simplifying shell ownership so the route keeps
reading like an operational workspace instead of a slightly over-styled dashboard showcase.
