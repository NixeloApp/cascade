# Nixelo Todo — MVP

> **Last Updated:** 2026-03-23

---

## Remaining Work

### Phase 0: Page Spec Docs *(complete)*

All 21 page specs rewritten to production quality.

### Phase 1: Code Quality & Consistency

| Item | Detail |
|------|--------|
| AI slop cleanup | Nested cards, redundant shells, panel-in-panel layouts, inconsistent control groupings |
| Mobile/tablet coverage | Backfill responsive gaps — many pages are desktop-first only |
| Icon consistency | Sizing, stroke-weight rhythm, tone/color drift across surfaces |
| Shell discipline | Stop accidental card nesting and composition pattern drift |
| Raw styling cleanup | 100 files / 197 violations baselined (was 276). Remaining are mostly legitimate structural patterns. |

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
| [plane-features.md](./plane-features.md) | Only external notification routing remains |

---

## Shipped

- **PR review backlog:** 32/32 resolved
- **Phase 0 (Page Spec Docs):** 21/21 at production quality
- **Phase 1 (Styling & Validators):** 7/7 items
- **Phase 3 (Feature Gaps):** 11/11 features
- **Offline track:** complete (4 mutations, retry, reconnect toast, push recovery)
- **Package upgrades:** Convex 1.34, Storybook 10, all Radix/Plate/Mantine/TanStack
- **Docs reorg:** 220MB stale content removed, 8 clean directories
- **Backwards compat:** all shims removed
- **PDF export:** billing reports via jsPDF
- **Bulk label ops:** bulkAddLabels + bulkRemoveLabels
- **Raw styling validator:** renamed, catches className + inline style props
- **Animation allowlist:** project-defined animations recognized as design tokens
- **Token migrations:** w-sidebar, min-h-content-block, max-h-dropdown fully migrated
- **Divider audit:** 4 patterns serve different purposes — ~85% consistent
- **Fixed size drift:** all 85 h-N w-N pairs converted to size-N (baseline zeroed)
- **Card recipe cleanup:** 25 dead recipe definitions removed (668→623 lines)
- **My Issues:** server-side group counts + priority/due date filters
- **Analytics:** per-assignee/label cycle/lead time breakdowns, sprint burndown comparison
- **AI provider fallback:** runtime fallback on transient errors (5xx, timeout, rate limit)
- **Push subscription recovery:** auto-resubscribe after service worker replacement
- **Team settings:** full settings page replacing Coming Soon placeholder
- **Workspace teams scoping:** getTeams filters by workspaceId via by_workspace index
- **Client portal link:** user chooses which project to scope portal access to
- **Assistant page:** wired to real AI usage data, removed all hardcoded stats
- **Query debt:** removed redundant post-fetch filters, ratcheted baseline

---

## Current Health

| Metric | Value |
|--------|-------|
| Validators | 53/53 pass (18 ratcheted, 35 binary) |
| Raw styling violations | 100 files / 197 baselined (was 276) |
| Fixed size drift | 0 violations (was 85) |
| Ratcheted query debt | 40 issues across client filters + post-fetch filters |
| E2E hard rules debt | 8 hardcoded timeouts (all in screenshot-pages.ts) |
| Backend query debt | 0 |
| Unresolved PR comments | 0 |
| Unit tests | 4436 pass |
| E2E tests | 164 pass |
| Page spec docs | 21/21 complete |
| HIGH severity page spec issues | 1 remaining (meeting-to-doc handoff — product design work) |

### Consistency Scorecard

| Layer | Score | Notes |
|-------|-------|-------|
| Spacing (Stack/Flex gap) | 95% | 1,191 gap props vs 180 raw margin/padding |
| Card padding | 98% | Strict size variants, nearly zero raw padding on Cards |
| Colors | 100% | All semantic tokens |
| Typography | 95%+ | Typography component dominant |
| Dividers | 85% | border-b for edges, Separator for explicit, raw px only for structural connectors |
| Width/height tokens | 90% | All 3 tokens fully migrated; remaining raw values are non-token concerns |
| Animations | 95% | All allowlisted as design tokens |
| Fixed sizing | 100% | All h-N w-N pairs use size-N |
