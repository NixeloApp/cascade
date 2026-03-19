# Plane Features To Evaluate

> **Priority:** P2
> **Status:** Partial
> **Last Updated:** 2026-03-18
> **Source:** Plane repo at `github.com/makeplane/plane` (pulled 2026-03-18)

Only unfinished items remain here. Completed roadmap/Gantt slices and org analytics are kept as shipped notes, not as open backlog.

## High Priority

### Gantt Chart / Timeline View

- [ ] **Finish the dedicated Gantt polish** — The roadmap has shipped core Gantt behavior, but it still needs the remaining deeper timeline-management and dedicated-Gantt polish.

### Intake / Triage System

- [ ] **Evaluate intake vs our inbox** — Our project inbox is still skeletal next to Plane’s triage workflow.
- [ ] **External request capture** — Client-submitted requests still need a first-class triage path before backlog entry.

### Deploy Boards (Public Sharing)

- [ ] **Enhance client portal permissions** — Our token portal is still much simpler than Plane’s deploy-board model.
- [ ] **Public issue boards** — We still do not expose a shareable public board surface.

### Stickies / Quick Notes

- [ ] **Evaluate dashboard stickies** — Quick-capture notes are still missing.

## Medium Priority

### Advanced Analytics

- [ ] **Enhance project analytics** — Org analytics shipped, but Plane-style trend/insight depth is still open at the project level.

### Automation Workflows

- [ ] **Enhance automation scheduling** — `AutomationRulesManager.tsx` still lacks Plane-style scheduled workflows.
- [ ] **Auto-archive stale issues** — Done-state cleanup automation is still open.

### Multi-Provider AI

- [ ] **Add provider selection** — Admin-configurable model/provider choice is still missing.
- [ ] **Model fallbacks** — Resilience/fallback behavior remains open.

### Page Version Control

- [ ] **Version history for documents/pages** — Real restoreable version history is still not a confirmed shipped surface.

## Low Priority

### Rich Filters

- [ ] **Compare with Plane’s richer filtering model** — Our filter surface is still simpler.

### Home Dashboard Widgets

- [ ] **Evaluate customizable dashboard widgets** — Current dashboard is fixed-layout, not Plane-style widgetized.

## Already Shipped From This Review

- [x] Roadmap/Gantt core upgrade across drag, resize, milestones, zoom, navigation, grouping, hierarchy, progress rollups, sticky sidebar, and dependency interaction
- [x] Org-level analytics

## Reference Paths

| Feature | Plane Path |
|---------|------------|
| Gantt | `apps/web/core/components/gantt-chart/` |
| Intake | `apps/web/core/components/inbox/`, `apps/api/plane/app/views/intake.py` |
| Deploy boards | `apps/api/plane/db/models/deploy_board.py` |
| Stickies | `apps/web/core/components/stickies/` |
| Analytics | `apps/web/core/components/analytics/` |
| Automation | `apps/web/core/components/automation/` |
| AI | `apps/api/plane/app/views/external/base.py` |
| Page versions | `apps/web/core/components/pages/version/` |
| Propel UI | `packages/propel/src/` |
