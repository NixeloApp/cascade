# Nixelo Todo — MVP

> **Last Updated:** 2026-03-22

---

## Remaining Work

### Visual Consistency (Phase 2)

Requires dev server + screenshots. Cannot be done blind.

| Item | Detail |
|------|--------|
| [visual-consistency-hardening.md](./visual-consistency-hardening.md) | Screenshot-driven cleanup, broken states, cross-surface drift |
| [meeting-intelligence.md](./meeting-intelligence.md) | Meetings visual QA, meeting-to-doc flow, capture strategy |

### Docs (Phase 4)

| Item | Detail |
|------|--------|
| [feature-docs-expansion.md](./feature-docs-expansion.md) | 21 page specs missing CURRENT/IMPLEMENTATION/TARGET docs |

### Low Priority / Evaluation

| Item | Detail |
|------|--------|
| [cal-com-features.md](./cal-com-features.md) | AI agents/MCP, cancellation UI, workflow translation |
| [tech-debt-billing-export.md](./tech-debt-billing-export.md) | PDF export (CSV shipped, no PDF library) |
| [plane-features.md](./plane-features.md) | Remaining evaluation items from Plane feature review |
| Offline push safety | Verify push subscriptions survive SW replacement (manual browser testing) |
| Raw TW cleanup | 102 files / 261 violations baselined — requires visual verification to fix |

---

## Shipped

All critical/major work is complete:

- **PR review backlog:** 32/32 resolved (1 critical, 9 major, 22 minor)
- **Phase 1 (Styling & Validators):** 7/7 items
- **Phase 3 (Feature Gaps):** 11/11 features (Gantt, intake, deploy boards, auto-archive, automation, stickies, bulk ops, cycle time, AI, version history, offline replay)
- **Offline track:** SW/manifest ownership, 4 mutation families, retry policy with backoff, reconnect toast, architecture docs, OfflineTab capabilities

---

## Current Health

| Metric | Value |
|--------|-------|
| Validators | 53/53 pass |
| Raw TW violations | 102 files / 261 violations (was 148 / 436) |
| Backend query debt | 0 |
| Unresolved PR comments | 0 |
| Unit tests | 4433 pass |
| E2E tests | 164 pass (non-preview) |
