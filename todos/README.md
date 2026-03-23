# Nixelo Todo — MVP

> **Last Updated:** 2026-03-24

---

## Remaining Work

### Phase 0: Zero Validator Exceptions

**Goal: every baseline at 0, every inline exemption list empty.**

#### CI Baselines (6 with debt, 13 already clean)

| Baseline | Current | Status |
|----------|---------|--------|
| raw-tailwind-violations | 162 / 102 files | Long tail (58 at 1, 32 at 2). Diminishing returns. |
| e2e-quality (UNSCOPED_FIRST) | 50 | Mechanical — scope E2E selectors |
| post-fetch-js-filters | 28 / 16 files | Backend queries filtering in JS after fetch |
| client-query-filters | 7 / 5 files | At floor — remaining are legitimate (text search, local grouping) |
| multi-filter-query-results | 9 / 8 files | Union of post-fetch + client. Tracks with above. |
| oversized-cva-variant-axis | 8 axes | Architectural — primitive UI components legitimately large |

Already clean (13): e2e-catch-swallows, e2e-hard-rules, feature-class-string-style-bundle-penalty, feature-cva-base-only, feature-cva-definitions, feature-cva-single-use, feature-cva-style-bundles, fixed-size-drift, global-css-page-class, icon-tone-drift, raw-tailwind-cross-file-clusters, raw-tailwind-route-clusters.

#### Inline Exemptions in Validators

| Validator | Exemptions | What they are |
|-----------|-----------|---------------|
| check-border-radius | 17 files | Progress bars, decorative elements, drag handles — mostly legitimate |
| check-component-naming | 3 product skips | RoadmapRows (multi-component), Icons.tsx, InlinePropertyEdit |
| check-tech-debt | MAX_ALLOWED=10 | Allows up to 10 tech debt markers |

### Phase 1: Visual Review

| Item | Detail |
|------|--------|
| AI slop cleanup | Worst offenders fixed. Remaining items need visual review. |
| Mobile/tablet coverage | Backfill responsive gaps |
| Icon visual consistency | Sizing, stroke-weight rhythm, tone drift |
| Shell discipline | Composition pattern drift |

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
| ~22 MEDIUM page spec issues | Mostly visual polish and product decisions |

---

## Current Health

| Metric | Value |
|--------|-------|
| Validators | 53/53 pass |
| CI baselines clean | 13 of 18 (was 8) |
| Unit tests | 4471 pass |
| E2E tests | 164 pass |
| Page spec docs | 21/21 complete |
| Spec issues fixed | 41 total |

### What's been fixed

Architecture: RoadmapView decomposition (2671→768 lines), ClientCard extraction, WorkspaceCard extraction, WikiDocumentGrid dedup, ProjectTimesheet dead code removal, useEffect→beforeLoad redirects (2 routes), auth hydrated/formReady removal, formatCurrency consolidation (6 duplicates→2 shared modules).

Backend: Invoice list with client join, reactive portal tokens, archived notification pagination, admin-scoped token query, workspaceId team filter, excludeUserId search filter.

Frontend: Invoice draft dialog, portal admin gating, footer link wiring, icon barrel migration (82 files), design tokens (roadmap + sidebar), 6 client-side filters eliminated.

Card architecture: Banned all nested Cards (no exemptions). Introduced `CardSection` as the designated inner surface (58 replacements across 21 files). Card = outer container, CardSection = inner grouping. Validator enforces the ban.

Validator cleanup: 4 dead CVA variants removed, e2e-hard-rules zeroed (Promise sleep → expect.poll), fixed-size-drift zeroed (stale entries), global-css-page-class zeroed (dead CSS + inline hero backgrounds).
