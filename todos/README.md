# Nixelo Todo — MVP

> **Last Updated:** 2026-03-23

---

## Remaining Work

### Phase 0: Page Spec Docs *(complete)*

All 21 page specs rewritten to production quality — ASCII diagrams, screenshot matrices, composition walkthroughs, problems analysis, source file maps, review guidance.

### Phase 1: Code Quality & Consistency

| Item | Detail |
|------|--------|
| AI slop cleanup | Nested cards, redundant shells, panel-in-panel layouts, inconsistent control groupings |
| Mobile/tablet coverage | Backfill responsive gaps — many pages are desktop-first only |
| Icon consistency | Sizing, stroke-weight rhythm, tone/color drift across surfaces |
| Shell discipline | Stop accidental card nesting and composition pattern drift |
| Divider unification | 4 competing divider patterns (border-b ×48, raw h-px/w-px ×13, `<Separator>` ×13, DropdownMenuSeparator ×9). Decide one approach per context, migrate. |
| Token migration completeness | Partial token migrations are worse than none — `w-sidebar` used in 1 file, `w-64` still in 8 others. Either migrate all or revert the token. Same for `min-h-content-block`, `max-h-dropdown`. |
| Raw styling cleanup | 105 files / 214 violations baselined. Many are legitimate structural patterns (positioned timelines, responsive visibility). Need to tighten allowlist for genuine structural concerns and focus remaining fixes on actual inconsistencies. |

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
| ~~[tech-debt-billing-export.md](./tech-debt-billing-export.md)~~ | ~~PDF export~~ **Shipped** — jsPDF + jspdf-autotable |
| [plane-features.md](./plane-features.md) | Remaining evaluation items from Plane feature review |
| Offline push safety | Verify push subscriptions survive SW replacement |

---

## Shipped

- **PR review backlog:** 32/32 resolved
- **Phase 0 (Page Spec Docs):** 21/21 at production quality
- **Phase 1 (Styling & Validators):** 7/7 items
- **Phase 3 (Feature Gaps):** 11/11 features
- **Offline track:** complete (4 mutations, retry, reconnect toast, docs)
- **Package upgrades:** Convex 1.34, Storybook 10, all Radix/Plate/Mantine/TanStack
- **Docs reorg:** 220MB stale content removed, 8 clean directories
- **Backwards compat:** all shims removed
- **PDF export:** billing reports via jsPDF
- **Bulk label ops:** bulkAddLabels + bulkRemoveLabels
- **Raw styling validator:** renamed from raw Tailwind, now catches inline style props too
- **Animation allowlist:** project-defined animations (animate-fade-in, etc.) recognized as design tokens

---

## Current Health

| Metric | Value |
|--------|-------|
| Validators | 53/53 pass (18 ratcheted, 35 binary) |
| Raw styling violations | 105 files / 214 baselined (276 → 214, but includes partial token migrations that need completing) |
| Fixed size drift | 47 files / 82 violations baselined |
| Ratcheted query debt | 43 issues across client filters + post-fetch filters |
| E2E hard rules debt | 8 hardcoded timeouts (all in screenshot-pages.ts) |
| Backend query debt | 0 |
| Unresolved PR comments | 0 |
| Unit tests | 4433 pass |
| E2E tests | 164 pass |
| Page spec docs | 21/21 complete |

### Consistency Scorecard

| Layer | Score | Notes |
|-------|-------|-------|
| Spacing (Stack/Flex gap) | 95% | 1,191 gap props vs 180 raw margin/padding |
| Card padding | 98% | Strict size variants, nearly zero raw padding on Cards |
| Colors | 100% | All semantic tokens |
| Typography | 95%+ | Typography component dominant |
| Dividers | 60% | 4 competing patterns, needs unification |
| Width/height tokens | 40% | Tokens defined but partially migrated |
| Animations | 95% | All allowlisted as design tokens |
