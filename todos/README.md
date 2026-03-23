# Nixelo Todo — MVP

> **Last Updated:** 2026-03-23

---

## Remaining Work

### Phase 0: Docs

| Item | Detail |
|------|--------|
| [feature-docs-expansion.md](./feature-docs-expansion.md) | 21 page specs missing CURRENT/IMPLEMENTATION/TARGET docs |

### Phase 1: Code Quality & Consistency

| Item | Detail |
|------|--------|
| AI slop cleanup | Nested cards, redundant shells, panel-in-panel layouts, inconsistent control groupings |
| Mobile/tablet coverage | Backfill responsive gaps — many pages are desktop-first only |
| Icon consistency | Sizing, stroke-weight rhythm, tone/color drift across surfaces |
| Raw TW cleanup | 102 files / 261 violations baselined — fix padding/margin utilities |
| Shell discipline | Stop accidental card nesting and composition pattern drift |

### Phase 2: Screenshot Baselines

| Item | Detail |
|------|--------|
| [visual-consistency-hardening.md](./visual-consistency-hardening.md) | Capture, review, fix broken states, approve baselines |
| Screenshot matrix gaps | Empty/loading/error, modals, create/edit flows, permission states |
| Screenshot drift sync | Keep baselines in sync with visual changes |

### Phase 3+: Features & Evaluation

| Item | Detail |
|------|--------|
| [meeting-intelligence.md](./meeting-intelligence.md) | Meetings visual QA, meeting-to-doc flow, capture strategy |
| [cal-com-features.md](./cal-com-features.md) | AI agents/MCP, cancellation UI, workflow translation |
| [tech-debt-billing-export.md](./tech-debt-billing-export.md) | PDF export (CSV shipped, no PDF library) |
| [plane-features.md](./plane-features.md) | Remaining evaluation items from Plane feature review |
| Offline push safety | Verify push subscriptions survive SW replacement |

---

## Shipped

- **PR review backlog:** 32/32 resolved
- **Phase 1 (Styling & Validators):** 7/7 items
- **Phase 3 (Feature Gaps):** 11/11 features
- **Offline track:** complete (4 mutations, retry, reconnect toast, docs)
- **Package upgrades:** Convex 1.34, Storybook 10, all Radix/Plate/Mantine/TanStack
- **Docs reorg:** 220MB stale content removed, 8 clean directories
- **Backwards compat:** all shims removed

---

## Current Health

| Metric | Value |
|--------|-------|
| Validators | 53/53 pass |
| Raw TW violations | 102 files / 261 violations (was 148 / 436) |
| Backend query debt | 0 |
| Unresolved PR comments | 0 |
| Unit tests | 4431 pass |
| E2E tests | 164 pass |
