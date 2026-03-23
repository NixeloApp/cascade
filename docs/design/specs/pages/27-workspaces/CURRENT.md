# Workspaces Page - Current State

> **Route**: `/:orgSlug/workspaces`
> **Status**: IMPLEMENTED
> **Last Updated**: 2026-03-22

---

## Purpose

The workspaces list page is the top-level organizational view for departments and business units. It answers:

- What workspaces exist in this organization?
- How many teams and projects are in each workspace?
- How is the organization structured at the department level?
- How do I create a new workspace?

---

## Route Anatomy

```
/:orgSlug/workspaces
│
├── PageLayout (maxWidth = dynamic: "md" for <=1 workspace, "lg" for >1)
│   ├── PageHeader
│   │   ├── title = "Workspaces"
│   │   ├── description = "Organize your organization into departments and teams"
│   │   └── actions → Button ("+ Create Workspace")
│   │
│   ├── CreateWorkspaceModal (Dialog)
│   │
│   └── PageContent
│       ├── [loading] isLoading spinner
│       ├── [empty] EmptyState (icon=Building2, "No workspaces yet")
│       │
│       ├── [compact: <=1 workspace]
│       │   └── Stack (gap="xl")
│       │       ├── OverviewBand (eyebrow, title, description, metrics, aside)
│       │       └── Grid (1-2 cols) → WorkspaceCard[] (compact=true)
│       │
│       └── [standard: >1 workspaces]
│           └── Grid (12-col on lg)
│               ├── div (col-span-7) → Grid → WorkspaceCard[]
│               └── div (col-span-5) → OverviewBand (sidebar)
```

---

## Current Composition Walkthrough

1. **Route component**: `WorkspacesList` (305 lines) contains both the page composition and the `WorkspaceCard` inline component.
2. **Query**: `api.workspaces.list` returns workspaces with `teamCount` and `projectCount` enrichment.
3. **Computed metrics**: Total teams and projects are computed client-side via `.reduce()` over the workspace list.
4. **Layout adaptation**: The page uses two distinct layouts:
   - **Compact** (0-1 workspaces): Narrower max-width (`md`), `OverviewBand` above the card grid with onboarding guidance, cards use `compact=true` variant (12-col horizontal layout).
   - **Standard** (2+ workspaces): Wider max-width (`lg`), 7/5 column split with cards on the left and `OverviewBand` as a sidebar on the right.
5. **WorkspaceCard**: Two visual variants controlled by the `compact` prop:
   - **Compact**: Horizontal 12-col grid with workspace info on the left (7 cols) and metric panels + footer on the right (5 cols). Includes description, badges, and an `InsetPanel` footer.
   - **Standard**: Vertical card with icon, name, badge, description, metric panels, and a footer pushed to the bottom via `mt-auto`.
6. **Create modal**: `CreateWorkspaceModal` is a `Dialog` with name and description fields. On success, navigates to the new workspace's teams list page.
7. **Card elements**: Each card includes an `IconCircle` with the workspace emoji icon, `Badge` components for workspace slug and team count, `InsetPanel` metric panels for teams/projects, and a `Metadata` footer with counts.

---

## Screenshot Matrix

| Viewport | Theme | State | Preview |
|----------|-------|-------|---------|
| Desktop | Dark | Default | ![](screenshots/desktop-dark.png) |
| Desktop | Light | Default | ![](screenshots/desktop-light.png) |
| Tablet | Light | Default | ![](screenshots/tablet-light.png) |
| Mobile | Light | Default | ![](screenshots/mobile-light.png) |
| Desktop | Dark | Create modal | ![](screenshots/desktop-dark-create-workspace-modal.png) |
| Desktop | Light | Create modal | ![](screenshots/desktop-light-create-workspace-modal.png) |
| Tablet | Light | Create modal | ![](screenshots/tablet-light-create-workspace-modal.png) |

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| ~~1~~ | ~~`WorkspaceCard` is 146 lines inline in route~~ **Fixed** — extracted to `src/components/Workspaces/WorkspaceCard.tsx` with sub-components and tests | ~~architecture~~ | ~~MEDIUM~~ |
| 2 | The compact vs standard layout logic produces two different page structures | complexity | MEDIUM |
| ~~3~~ | ~~AI coaching copy in OverviewBand aside~~ **Fixed** — removed "Recommended next step" / "Design principle" AI filler text | ~~content~~ | ~~MEDIUM~~ |
| ~~4~~ | ~~Compact card over-designed with redundant badges~~ **Fixed** — removed "Workspace" badge, kept only slug badge and team count | ~~information density~~ | ~~MEDIUM~~ |
| 5 | `IconCircle` uses `className="h-12 w-12"` arbitrary sizing alongside `size="md"` prop -- mixed sizing approaches | styling | LOW |
| 6 | No search or filter for workspaces | scalability | LOW |
| 7 | `handleWorkspaceCreated` navigates to teams list, but the workspace was just created and has no teams yet | UX | LOW |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/workspaces/index.tsx` | Route component with inline WorkspaceCard (305 lines) |
| `src/components/CreateWorkspaceModal.tsx` | Create workspace dialog (name, description) |
| `convex/workspaces.ts` | Workspace CRUD and `list` query with team/project counts |
| `src/config/routes.ts` | `ROUTES.workspaces.*` for navigation |
