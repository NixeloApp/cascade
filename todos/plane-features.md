# Plane Feature Snapshot

> **Priority:** Archived
> **Status:** Historical reference only
> **Last Updated:** 2026-03-18
> **Source:** Plane preview repo at `github.com/makeplane/plane` (pulled 2026-03-18)

This file is no longer an active todo list. It preserves the Plane benchmark that informed the roadmap/Gantt and PM-surface work completed during MVP.

## Shipped From This Review

- Roadmap evolved into a real Gantt-style planning surface:
  - draggable range bars
  - resize handles
  - milestone markers
  - month/week buckets
  - range-aware timeline navigation
  - fit-to-issues and zoom controls
  - sticky metadata sidebar
  - today marker
  - epic/status/assignee/priority grouping
  - collapsible swimlanes
  - collapsible parent/subtask tree
  - epic summary bars and parent rollups with progress
  - interactive dependency highlighting and inline dependency management groundwork
- Org-level analytics shipped

## Not Tracked As Active MVP Work

- Intake / triage system expansion
- Deploy boards / richer public sharing
- Stickies / quick notes
- Advanced analytics beyond current shipped dashboards
- Scheduled automation / auto-archive
- Multi-provider AI admin controls
- Document/page version history
- Remaining non-essential Gantt polish beyond current shipped roadmap experience

If any of these reopen later, move them into `todos-post-mvp/` or a dedicated feature doc instead of using this file as a live queue again.

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
