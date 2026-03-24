# Nixelo Todo — MVP

> **Last Updated:** 2026-03-24

---

## Remaining Work

### Phase 0: Validator Exceptions — Status

All actionable baselines have been reduced. Remaining are at their architectural floor.

| Baseline | Current | Status |
|----------|---------|--------|
| raw-tailwind-violations | 162 / 102 files | Long tail. Diminishing returns. |
| post-fetch-js-filters | 28 / 16 files | At floor — complex JS logic that Convex query filters can't express |
| e2e-quality (UNSCOPED_FIRST) | 16 | At floor — remaining are genuinely ambiguous selectors |
| client-query-filters | 7 / 5 files | At floor — text search, local grouping, virtual groups |
| multi-filter-query-results | 9 / 8 files | Tracks with post-fetch + client |
| oversized-cva-variant-axis | 8 axes | Architectural — primitive UI components |

Already clean (12 of 18): e2e-catch-swallows, e2e-hard-rules, feature-class-string-style-bundle-penalty, feature-cva-base-only, feature-cva-definitions, feature-cva-single-use, feature-cva-style-bundles, fixed-size-drift, global-css-page-class, icon-tone-drift, raw-tailwind-cross-file-clusters, raw-tailwind-route-clusters.

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
| [email-outreach.md](./email-outreach.md) | Lightweight cold email sequences (research complete, build pending) |
| [plane-features.md](./plane-features.md) | Only external notification routing remains |
| ~22 MEDIUM page spec issues | Mostly visual polish and product decisions |

---

## Current Health

| Metric | Value |
|--------|-------|
| Validators | 53/53 pass |
| CI baselines clean | 12 of 18 (was 8) |
| Unit tests | 4471 pass |
| E2E tests | 164 pass |
| Page spec docs | 21/21 complete |
| Spec issues fixed | 41 total |

### What's been fixed

Architecture: RoadmapView decomposition (2671→768 lines), ClientCard extraction, WorkspaceCard extraction, WikiDocumentGrid dedup, ProjectTimesheet dead code removal, useEffect→beforeLoad redirects (2 routes), auth hydrated/formReady removal, formatCurrency consolidation (6 duplicates→2 shared modules).

Backend: Invoice list with client join, reactive portal tokens, archived notification pagination, admin-scoped token query, workspaceId team filter, excludeUserId search filter, workspace ownership validation.

Frontend: Invoice draft dialog, portal admin gating, footer link wiring, icon barrel migration (82 files), design tokens (roadmap + sidebar), 6 client-side filters eliminated, hero background effects removed.

Card architecture: Banned all nested Cards (no exemptions). Introduced `CardSection` as the designated inner surface (58 replacements across 21 files). Card = outer container, CardSection = inner grouping. Validator enforces the ban.

Validator cleanup: 4 dead CVA variants removed, e2e-hard-rules zeroed, fixed-size-drift zeroed, global-css-page-class zeroed, e2e-quality UNSCOPED_FIRST 50→16, baselines 8→12 clean.
