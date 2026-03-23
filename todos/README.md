# Nixelo Todo — MVP

> **Last Updated:** 2026-03-24

---

## Remaining Work

### Phase 0: Zero Validator Exceptions

**Goal: every baseline at 0, every inline exemption list empty.**

#### CI Baselines (10 with debt, 8 already clean)

| Baseline | Current | What it tracks |
|----------|---------|----------------|
| raw-tailwind-violations | 162 violations / 102 files | Raw className utilities that should use design system |
| post-fetch-js-filters | 28 filters / 16 files | Convex queries filtering in JS instead of index |
| client-query-filters | 13 filters / 11 files | Frontend filtering data that backend should filter |
| multi-filter-query-results | 9 queries / 8 files | Queries with multiple chained .filter() calls |
| oversized-cva-variant-axis | 8 axes over limit | CVA variants with too many options (Card has 227 recipes!) |
| e2e-quality (UNSCOPED_FIRST) | 50 | E2E selectors using .first() without scoping |
| global-css-page-class | 3 selectors | Page-specific CSS that should be component-scoped |
| e2e-hard-rules | 7 timeouts + 1 sleep | Hardcoded waits in screenshot tooling |

Already clean: e2e-catch-swallows, feature-class-string-style-bundle-penalty, feature-cva-base-only, feature-cva-definitions, feature-cva-single-use, feature-cva-style-bundles, fixed-size-drift, icon-tone-drift, raw-tailwind-cross-file-clusters, raw-tailwind-route-clusters.

#### Inline Exemptions in Validators

| Validator | Exemptions | What they are |
|-----------|-----------|---------------|
| check-border-radius | 17 files | Files allowed to use raw rounded-* classes |
| check-component-naming | 3 product skips | RoadmapRows (multi-component), Icons.tsx, InlinePropertyEdit |
| check-tech-debt | MAX_ALLOWED=10 | Allows up to 10 tech debt markers |

### Phase 1: Visual Review (needs screenshots)

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
| CI baselines with debt | 10 of 18 |
| Inline exemption lists | 3 validators |
| Unit tests | 4472 pass |
| E2E tests | 164 pass |
| Page spec docs | 21/21 complete |
| Spec issues fixed | 41 total |
| HIGH severity issues | 1 remaining (meeting-to-doc) |
| MEDIUM severity issues | 22 remaining |

### What's been fixed

Architecture: RoadmapView decomposition (2671→768 lines), ClientCard extraction, WorkspaceCard extraction, WikiDocumentGrid dedup, ProjectTimesheet dead code removal, useEffect→beforeLoad redirects (2 routes), auth hydrated/formReady removal, formatCurrency consolidation (6 duplicates→2 shared modules).

Backend: Invoice list with client join, reactive portal tokens, archived notification pagination, admin-scoped token query.

Frontend: Invoice draft dialog, portal admin gating, footer link wiring, icon barrel migration (82 files), design tokens (roadmap + sidebar).

Card architecture: Banned all nested Cards (no exemptions). Introduced `CardSection` as the designated inner surface (58 replacements across 21 files). Card = outer container, CardSection = inner grouping. Validator enforces the ban.
