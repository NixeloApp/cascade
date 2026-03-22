# Nixelo Todo — MVP

> **Last Updated:** 2026-03-22

---

## PR Review Comments — All Resolved

All 32 unresolved comments from PRs #905-#918 have been fixed:
- **Critical (1):** Atomic issue key generation (race condition fix)
- **Major (9):** Export compound indexes, compliance truncation flag, deploy board rendering, validator per-token allowlist, const detection, offline E2E suite, typed test IDs
- **Minor (22):** Profile grid span, screenshot readiness, AI button test, auto-archive mutation args, Bearer token parsing, EmptyState imports, test magic numbers, stale doc counts

---

## Execution Pipeline

### Phase 1: Styling & Validators *(complete)*

All 7 items shipped: raw TW reduction (148→102 files), validator smartening, backend query fixes, icon sizing, margins→gaps, empty states.

### Phase 2: Visual Consistency

| Item | Status |
|------|--------|
| [visual-consistency-hardening.md](./visual-consistency-hardening.md) | Screenshot-driven cleanup, broken states, cross-surface drift |
| [meeting-intelligence.md](./meeting-intelligence.md) | Meetings visual QA, meeting-to-doc flow |

### Phase 3: Feature Gaps

| Feature | Status |
|---------|--------|
| Gantt chart polish | 🟡 RoadmapView exists. ✅ Zoom shipped. Remaining: drag-resize, dependency arrows. |
| Intake external capture | ✅ Shipped — backend + admin UI |
| Deploy boards | ✅ Shipped — backend, public page, assignee/dueDate, status-hidden fix |
| Auto-archive | ✅ Shipped |
| Scheduled automation | ✅ Shipped (stale_in_status triggers) |
| Stickies | ✅ Shipped |
| Bulk operations | ✅ Shipped (9 operation types) |
| Cycle/lead time | ✅ Shipped |
| Multi-provider AI | ✅ Shipped (Anthropic + OpenAI) |
| Version history | ✅ Shipped (list + restore) |
| Offline replay | ✅ Shipped (4 mutation families, retry policy, reconnect toast) |

### Phase 4: Docs & Low Priority

| Item | Status |
|------|--------|
| [feature-docs-expansion.md](./feature-docs-expansion.md) | 21 page specs missing CURRENT/IMPLEMENTATION/TARGET docs |
| [cal-com-features.md](./cal-com-features.md) | AI agents/MCP, cancellation UI, workflow translation |
| [tech-debt-billing-export.md](./tech-debt-billing-export.md) | PDF export (CSV shipped, no PDF library) |

### Parallel Tracks

| Track | Status |
|-------|--------|
| [offline-pwa.md](./offline-pwa.md) | ✅ Core complete. Push safety verification still pending. |
| [meeting-intelligence.md](./meeting-intelligence.md) | Editor dependency, capture strategy |

---

## Current Health

| Metric | Value |
|--------|-------|
| Validators | 53/53 pass |
| Raw TW violations | 103 files / 263 violations (was 148 / 436) |
| Backend query debt | 0 (was 11 post-fetch JS filters) |
| CVA boundaries | Clean — 0 feature CVAs outside ui/ |
| Unresolved PR comments | 0 — all resolved |
| Unit tests | 4439 pass |
| E2E tests | 164 pass (non-preview) |

---

## Visual Validation Workflow

- Capture current UI state with `pnpm screenshots`
- Audit route/spec screenshot coverage with `pnpm run validate`
- Detect screenshot drift with `pnpm screenshots:diff`
- Approve intentional visual changes with `pnpm screenshots:approve`

## Post-MVP

See [../todos-post-mvp/README.md](../todos-post-mvp/README.md) for blocked and post-MVP items.
