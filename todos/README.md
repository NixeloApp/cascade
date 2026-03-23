# Nixelo Todo — MVP

> **Last Updated:** 2026-03-23

---

## Remaining Work

### Phase 1: Code Quality & Consistency

| Item | Detail |
|------|--------|
| AI slop cleanup | Nested cards, redundant shells, panel-in-panel layouts |
| Mobile/tablet coverage | Backfill responsive gaps |
| Icon consistency | Sizing, stroke-weight rhythm, tone drift |
| Shell discipline | Card nesting, composition pattern drift |
| Raw styling cleanup | 100 files / 197 violations (structural patterns, diminishing returns) |

### Phase 2: Screenshot Baselines

| Item | Detail |
|------|--------|
| [visual-consistency-hardening.md](./visual-consistency-hardening.md) | Capture, review, fix broken states |
| Screenshot matrix gaps | Empty/loading/error, modals, create/edit flows |

### Phase 3+: Features & Evaluation

| Item | Detail |
|------|--------|
| [meeting-intelligence.md](./meeting-intelligence.md) | Meeting-to-doc flow, capture strategy (product design) |
| [plane-features.md](./plane-features.md) | Only external notification routing remains |
| ~44 MEDIUM page spec issues | Architecture extractions, pagination improvements, UX polish |

---

## Shipped

### Features
- **My Issues:** server-side group counts, priority/due date filters
- **Issues page:** server-side full-text search, priority/type filters
- **Org Analytics:** date range filtering (7d/30d/90d/all), period-over-period trend comparison
- **Analytics queries:** per-assignee/label cycle/lead time breakdowns, sprint burndown comparison
- **AI provider:** runtime fallback on transient errors (5xx, timeout, rate limit)
- **Push notifications:** auto-recovery after service worker replacement
- **Team settings:** full settings page (general, members, danger zone)
- **Team detail:** member avatar row in header
- **Workspace teams:** scoped to workspace via by_workspace index
- **Client portal:** user chooses project for portal link, typed mutations (anyApi removed)
- **Assistant page:** wired to real AI usage data (stats, conversations, provider breakdown)
- **Bulk operations:** bulkAddLabels + bulkRemoveLabels

### Code Quality
- **Raw styling:** 276 → 197 violations, 3 design tokens fully migrated
- **Fixed size drift:** 85 → 0 violations (all h-N w-N → size-N)
- **Card recipes:** 25 dead definitions removed (668 → 623 lines)
- **Query debt:** redundant post-fetch filters removed, baselines ratcheted
- **Validator:** raw Tailwind → raw styling (catches inline style props too)
- **Animation allowlist:** project-defined animations recognized as tokens
- **Divider audit:** 4 patterns serve different purposes, ~85% consistent

### Infrastructure
- **PR review backlog:** 32/32 resolved
- **Page spec docs:** 21/21 at production quality
- **Phase 1 styling validators:** 7/7 items
- **Phase 3 feature gaps:** 11/11 features
- **Offline track:** complete (4 mutations, retry, reconnect toast)
- **Package upgrades:** Convex 1.34, Storybook 10, all major packages
- **Docs reorg:** 220MB stale content removed
- **Backwards compat:** all shims removed
- **PDF export:** billing reports via jsPDF

---

## Current Health

| Metric | Value |
|--------|-------|
| Validators | 53/53 pass (18 ratcheted, 35 binary) |
| Raw styling violations | 100 files / 197 baselined |
| Fixed size drift | 0 |
| Ratcheted query debt | 39 issues |
| E2E hard rules debt | 8 (screenshot tooling only) |
| Backend query debt | 0 |
| Unresolved PR comments | 0 |
| Unit tests | 4436+ pass |
| E2E tests | 164 pass |
| Page spec docs | 21/21 complete |
| HIGH severity issues | 1 remaining (meeting-to-doc handoff) |
| MEDIUM severity issues | ~44 remaining |

### Consistency Scorecard

| Layer | Score | Notes |
|-------|-------|-------|
| Spacing | 95% | 1,191 gap props vs 180 raw margin/padding |
| Card padding | 98% | Strict size variants |
| Colors | 100% | All semantic tokens |
| Typography | 95%+ | Typography component dominant |
| Dividers | 85% | Appropriate patterns per context |
| Width/height tokens | 90% | 3 tokens fully migrated |
| Animations | 95% | All project animations allowlisted |
| Fixed sizing | 100% | All square pairs use size-N |
