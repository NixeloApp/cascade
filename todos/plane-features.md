# Plane Features to Evaluate

> **Priority:** P2
> **Status:** New
> **Last Updated:** 2026-03-18
> **Source:** Plane repo at `github.com/makeplane/plane` (pulled 2026-03-18, 45 new commits on preview)

## High Priority (We're Missing These)

### Gantt Chart / Timeline View
Plane has a full Gantt chart at `apps/web/core/components/gantt-chart/`. We have a roadmap view but no Gantt with drag-and-drop.

- [~] **Evaluate Gantt implementation** — Our roadmap now supports draggable bars, resize handles, milestone-style markers for due-date-only items, dependency lines, real month/week timeline buckets, range-aware timeline window navigation, a fit-to-issues control, zoom controls, a sticky issue sidebar with richer row metadata, a unified today marker, progress-aware epic summary and parent rollup bars, epic/status/assignee/priority grouping, collapsible swimlanes, and a collapsible parent/subtask tree, but still needs fuller Gantt affordances (sidebar polish/deeper timeline controls).
- [~] **Decide: enhance roadmap or add Gantt** — Current direction is enhancing `RoadmapView.tsx` incrementally toward a fuller Gantt.

### Intake/Triage System
Plane has a dedicated intake system (`apps/api/plane/app/views/intake.py`, `apps/web/core/components/inbox/`) for capturing external requests separately from issues.

- [ ] **Evaluate intake vs our inbox** — Our project inbox (`/projects/$key/inbox`) shows "No pending items". Plane's intake has filtering, status management, dedicated triage workflow.
- [ ] **External request capture** — Client-submitted issues that need triage before entering the backlog.

### Deploy Boards (Public Sharing)
Plane has per-entity public sharing with granular controls (comments, reactions, votes, activity) via `apps/api/plane/db/models/deploy_board.py`.

- [ ] **Enhance client portal** — Our portal is token-based with fixed permissions. Plane's approach is more granular per entity type.
- [ ] **Public issue boards** — Share a project board publicly without auth. Useful for open-source projects or client visibility.

### Stickies / Quick Notes
Widget-based sticky notes at `apps/web/core/components/stickies/`. Quick capture for brainstorming.

- [ ] **Evaluate for dashboard** — Our dashboard has Focus Zone. Stickies could complement it for quick capture.

## Medium Priority (Enhancements to Existing Features)

### Advanced Analytics
Plane has priority charts, created-vs-resolved trends, customizable insights at `apps/web/core/components/analytics/`.

- [ ] **Enhance our analytics** — Our project analytics page has basic charts. Plane has trend analysis and custom insights.
- [x] **Org-level analytics** — Implemented: metrics (total/completed/unassigned/projects), charts (by type, priority, project). Backend query aggregates across all org projects.

### Automation Workflows
Auto-archive, auto-close, monthly scheduling at `apps/web/core/components/automation/`.

- [ ] **Enhance our automation** — We have `AutomationRulesManager.tsx` but it's basic. Plane has scheduled automations.
- [ ] **Auto-archive stale issues** — Common PM pattern. Issues in "Done" for N days get archived automatically.

### Multi-Provider AI
Plane supports OpenAI, Anthropic, Gemini with admin-panel config at `apps/api/plane/app/views/external/base.py`.

- [ ] **Add provider selection** — Our AI uses a single provider. Admin-configurable multi-provider would be more flexible.
- [ ] **Model fallbacks** — Plane has smart model selection with fallbacks. Good resilience pattern.

### Page Version Control
Version history with restore at `apps/web/core/components/pages/version/`.

- [ ] **Evaluate for documents** — We have ProseMirror Sync for real-time collab but no version history UI. Our `VersionHistory.tsx` exists — check if it's functional.

## Low Priority (Nice to Have)

### Rich Filters
Advanced filter system at `apps/web/core/components/rich-filters/`.

- [ ] **Compare with our FilterBar** — Our `FilterBar.tsx` handles basic filters. Plane's is more sophisticated with item-level filters.

### Home Dashboard Widgets
Customizable homepage at `apps/web/core/components/home/`.

- [ ] **Compare with our Dashboard** — We have `Dashboard.tsx` with Focus Zone, QuickStats, etc. Plane's is widget-based and customizable.

## Already Have (No Action)

- GitHub integration — We have `GitHubIntegration.tsx`
- Slack integration — We have Pumble (similar)
- API tokens — We have `ApiKeysManager.tsx`
- Webhooks — We have `WebhooksManager.tsx`
- Email notifications — We have React Email templates
- Search — We have `GlobalSearch.tsx` and `AdvancedSearchModal`

## Reference Paths

| Feature | Plane Path |
|---------|-----------|
| Gantt | `apps/web/core/components/gantt-chart/` |
| Intake | `apps/web/core/components/inbox/`, `apps/api/plane/app/views/intake.py` |
| Deploy boards | `apps/api/plane/db/models/deploy_board.py` |
| Stickies | `apps/web/core/components/stickies/` |
| Analytics | `apps/web/core/components/analytics/` |
| Automation | `apps/web/core/components/automation/` |
| AI | `apps/api/plane/app/views/external/base.py` |
| Page versions | `apps/web/core/components/pages/version/` |
| Propel UI | `packages/propel/src/` (40+ components) |
