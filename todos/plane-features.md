# Plane Features To Evaluate

> **Priority:** P2
> **Status:** Partial
> **Last Updated:** 2026-03-22
> **Source:** Plane repo at `github.com/makeplane/plane` (pulled 2026-03-18)

Completed items are marked as shipped below. Remaining items are under evaluation.

## Shipped

- [x] **Stickies / Quick Notes** — Dashboard stickies panel shipped (PR #912). Schema, CRUD backend, colored notes with inline editing.
- [x] **Auto-archive stale issues** — Daily cron with per-project `autoArchiveDays` setting (PR #911).
- [x] **Offline replay** — 4 mutation families with header indicators (PRs #907-#910).
- [x] **Version history** — `convex/documentVersions.ts` (155 lines) + `VersionHistory.tsx` (304 lines) exist with list/restore functionality.

## High Priority

### Gantt Chart / Timeline View

- [ ] **Finish the dedicated Gantt polish** — `RoadmapView.tsx` (2671 lines) has core Gantt behavior. Remaining: drag-to-resize duration, dependency arrows, critical path highlighting, zoom controls.

### Intake / Triage System

- [ ] **Enhance external request capture** — `InboxList.tsx` (551 lines) has internal triage (accept/decline/snooze/duplicate). Missing: external submission form, email-to-inbox pipeline, public request portal.

### Deploy Boards (Public Sharing)

- [ ] **Public issue boards** — Token-based client portal exists. Missing: shareable public board surface without authentication, configurable field visibility.

## Medium Priority

### Advanced Analytics

- [ ] **Project-level trend depth** — Org analytics shipped. Project analytics has basic charts. Missing: velocity trends, cycle time, lead time, burndown comparison across sprints.

### Automation Workflows

- [ ] **Scheduled triggers** — Current triggers are event-based only (status_changed, issue_created). Missing: time-based triggers ("if in status X for N days, do Y"), recurring automation schedules.

### Multi-Provider AI

- [ ] **Provider selection** — Admin-configurable model/provider choice. Currently hardcoded.
- [ ] **Model fallbacks** — Resilience/fallback when primary provider is down.

## Low Priority

### Notification Channels

- [ ] **Slack/Pumble/webhook notifications** — Backend integration exists but notification routing to external channels is not wired to the notification preference system.

### ~~Bulk Operations~~ ✅ SHIPPED

`BulkOperationsBar.tsx` (379 lines) already supports: bulk status, priority, assignee, sprint, start date, due date, archive, and delete. Only bulk label operations remain.
