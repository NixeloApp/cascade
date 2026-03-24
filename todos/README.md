# Nixelo Todo — MVP

> **Last Updated:** 2026-03-24

---

## Remaining Work

### Phase 0: Validator Exceptions — Complete

All actionable baselines reduced. Remaining at architectural floor.

| Baseline | Current | Status |
|----------|---------|--------|
| raw-tailwind-violations | 145 / 93 files | Structural floor (margins, widths, heights) |
| post-fetch-js-filters | 28 / 16 files | At floor — complex JS logic |
| e2e-quality (UNSCOPED_FIRST) | 16 | At floor — genuinely ambiguous selectors |
| client-query-filters | 9 / 7 files | At floor — text search, local grouping |
| multi-filter-query-results | 9 / 8 files | Tracks with post-fetch + client |
| oversized-cva-variant-axis | 8 axes | Architectural — primitive UI components |

Clean (12 of 18): e2e-catch-swallows, e2e-hard-rules, feature-class-string-style-bundle-penalty, feature-cva-base-only, feature-cva-definitions, feature-cva-single-use, feature-cva-style-bundles, fixed-size-drift, global-css-page-class, icon-tone-drift, raw-tailwind-cross-file-clusters, raw-tailwind-route-clusters.

### ~17 MEDIUM Page Spec Issues Remaining

| Category | Count | Details |
|----------|-------|---------|
| Visual/shell weight | 8 | Auth shell x4, dashboard gradients x2, forgot-password sparse, meetings density |
| Screenshot coverage | 3 | Documents states, analytics states, auth sign-up |
| Product depth | 2 | Sprint story-point progress, dependencies graph |
| Infrastructure | 1 | External error reporting (Sentry/PostHog) |
| Responsive | 1 | Roadmap touch interactions |
| Complexity | 1 | Editor sparse content |
| UX | 1 | Workspaces search/filter |

All require design decisions, product specs, or infrastructure setup.

### Future

| Item | Detail |
|------|--------|
| [meeting-intelligence.md](./meeting-intelligence.md) | Meeting-to-doc flow (HIGH — only remaining HIGH issue) |
| [plane-features.md](./plane-features.md) | Only external notification routing remains |

---

## Current Health

| Metric | Value |
|--------|-------|
| Validators | 53/53 pass |
| CI baselines clean | 12 of 18 (was 8) |
| Unit tests | 4472 pass |
| E2E tests | 164 pass |
| Page spec docs | 21/21 complete |
| Spec issues fixed | 51 total (was 0) |
| MEDIUM remaining | 17 (was 34+) |

### What's been fixed

**Architecture**: RoadmapView decomposition (2671 to 768 lines), ClientCard extraction, WorkspaceCard extraction + unified layout, WikiDocumentGrid dedup, ProjectTimesheet dead code removal, useEffect to beforeLoad redirects, auth hydrated/formReady removal, formatCurrency consolidation, workspace compact/standard layout merge.

**Backend**: Invoice list with client join, reactive portal tokens, archived notification pagination, admin-scoped token query, workspaceId team filter, excludeUserId search filter, workspace ownership validation.

**Frontend**: Invoice table layout, invoice draft dialog, workspace backlog sort/filter, workspace sprints filter, portal admin gating, footer link wiring, ErrorBoundary recovery (try again + dashboard + stack trace), icon barrel migration, design tokens, hero background cleanup.

**Card architecture**: Banned all nested Cards. CardSection as inner surface (58 replacements). Validator enforces.

**Validator cleanup**: 4 dead CVA variants, 5 baselines zeroed (e2e-hard-rules, fixed-size-drift, global-css-page-class, e2e-quality 50 to 16), raw-tailwind 276 to 145, 14 margin-to-gap conversions.
