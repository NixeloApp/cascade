# Plane Features To Evaluate

> **Priority:** P3
> **Status:** Evaluation only
> **Source:** Plane repo at `github.com/makeplane/plane` (pulled 2026-03-18)

Remaining evaluation items. Core features (stickies, auto-archive, offline, version history, Gantt, intake, deploy boards, automation, multi-provider AI, bulk ops) are all shipped.

## Medium Priority

### Advanced Analytics

- [ ] **Velocity trends** — project-level velocity, burndown comparison across sprints
- [x] ~~**Cycle/lead time depth**~~ — **Shipped** (getTimeMetricsBreakdown query with per-assignee and per-label grouping)

### Notification Channels

- [ ] **External notification routing** — Slack/Pumble/webhook notifications wired to the notification preference system

## Low Priority

- [ ] **Model fallbacks** — AI provider resilience/fallback when primary is down
- [x] ~~**Bulk label operations**~~ — **Shipped** (bulkAddLabels + bulkRemoveLabels)
