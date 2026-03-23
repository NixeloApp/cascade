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

### Phase 3+: Remaining

| Item | Detail |
|------|--------|
| [meeting-intelligence.md](./meeting-intelligence.md) | Meeting-to-doc flow (product design) |
| [plane-features.md](./plane-features.md) | Only external notification routing remains |
| ~34 MEDIUM page spec issues | Architecture extractions, invoice UX, workspace cleanup, visual polish |

---

## Shipped

### Features (20+)
- **My Issues:** server-side group counts, priority/due date filters
- **Issues page:** server-side full-text search, priority/type filters
- **Org Analytics:** date range filtering (7d/30d/90d), period-over-period trend comparison
- **Analytics queries:** per-assignee/label cycle/lead time, sprint burndown comparison
- **AI provider:** runtime fallback on transient errors
- **Push notifications:** auto-recovery after SW replacement
- **Team settings:** full settings page (general, members, danger zone)
- **Team detail:** member avatar row, TeamLayoutContext (eliminates duplicate queries in 4 child routes)
- **Workspace teams:** scoped to workspace via by_workspace index
- **Client portal:** project selector for portal links, typed mutations, dialog modal for creation
- **Assistant page:** wired to real AI usage data
- **Bulk operations:** bulkAddLabels + bulkRemoveLabels
- **Time tracking:** CSV export for time entries, proper EmptyState for project-scoped tabs
- **Activity feed:** clickable issue key links, Load More pagination
- **Project inbox:** search filtering by issue title/key
- **Calendar:** filter selections persisted in URL search params
- **Alerts center:** reduced page size from 50 to 25, added Load More

### Code Quality
- **Raw styling:** 276 -> 197 violations, 3 design tokens fully migrated
- **Fixed size drift:** 85 -> 0 violations (all h-N w-N -> size-N)
- **Card recipes:** 25 dead definitions removed (668 -> 623 lines)
- **Query debt:** redundant post-fetch filters removed, baselines ratcheted
- **Validator:** raw Tailwind -> raw styling (catches inline style props too)
- **Animation allowlist:** project-defined animations recognized as tokens
- **Divider audit:** 4 patterns for different contexts, ~85% consistent

### Infrastructure
- **PR review backlog:** 32/32 resolved
- **Page spec docs:** 21/21 at production quality
- **Phase 1 styling validators:** 7/7 items
- **Phase 3 feature gaps:** 11/11 features
- **Offline track:** complete (4 mutations, retry, reconnect toast)
- **Package upgrades:** Convex 1.34, Storybook 10, all major packages
- **Docs reorg:** 220MB stale content removed
- **PDF export:** billing reports via jsPDF

---

## Current Health

| Metric | Value |
|--------|-------|
| Validators | 53/53 pass |
| Raw styling violations | 100 files / 197 baselined |
| Fixed size drift | 0 |
| Ratcheted query debt | ~39 issues |
| Backend query debt | 0 |
| Unit tests | 4436+ pass |
| E2E tests | 164 pass |
| Page spec docs | 21/21 complete |
| HIGH severity issues | 1 remaining (meeting-to-doc) |
| MEDIUM severity issues | 34 remaining |

### Consistency Scorecard

| Layer | Score |
|-------|-------|
| Spacing | 95% |
| Card padding | 98% |
| Colors | 100% |
| Typography | 95%+ |
| Dividers | 85% |
| Width/height tokens | 90% |
| Animations | 95% |
| Fixed sizing | 100% |
