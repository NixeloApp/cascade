# Nixelo Todo — MVP

> **Last Updated:** 2026-03-24

---

## Remaining Work

### Phase 1: Code Quality & Consistency

| Item | Detail |
|------|--------|
| AI slop cleanup | Worst offenders fixed. Remaining items need visual review with dev server. |
| Mobile/tablet coverage | Backfill responsive gaps (needs visual review) |
| Icon visual consistency | Sizing, stroke-weight rhythm, tone drift (needs visual review) |
| Shell discipline | Composition pattern drift (needs visual review) |
| Raw styling cleanup | 102 files / 162 violations. Long tail — 58 files at 1, 32 at 2. Mostly structural margins/widths. Diminishing returns. |

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
| ~22 MEDIUM page spec issues | Mostly visual polish and product decisions. See breakdown below. |

#### MEDIUM issues breakdown

| Category | Count | Examples |
|----------|-------|---------|
| Visual/shell weight | 8 | Auth shell, dashboard gradients, meetings density |
| Screenshot coverage | 3 | Documents, analytics, auth sign-up |
| Product decisions | 5 | Invoice table vs cards, sprint depth, dependency graph, workspace filtering |
| Scalability | 3 | Invoice/client pagination (already bounded), workspace layout complexity |
| Responsive | 2 | Roadmap touch interactions, meeting detail layout |
| Content | 1 | Sprint progress semantics |

#### What's been fixed (41 spec issues total)

Architecture: RoadmapView decomposition (2671→768 lines), ClientCard extraction, WorkspaceCard extraction, WikiDocumentGrid dedup, ProjectTimesheet dead code removal, useEffect→beforeLoad redirects (2 routes), auth hydrated/formReady removal, formatCurrency consolidation (6 duplicates→2 shared modules).

Backend: Invoice list with client join, reactive portal tokens, archived notification pagination, admin-scoped token query.

Frontend: Invoice draft dialog, portal admin gating, footer link wiring, icon barrel migration (82 files), Card variant cleanup, design tokens (roadmap + sidebar).

---

## Current Health

| Metric | Value |
|--------|-------|
| Validators | 53/53 pass |
| Raw styling violations | 102 files / 162 baselined (was 276) |
| Fixed size drift | 0 |
| RoadmapView | 768 lines (was 2671, 71% reduction) |
| Icon imports | 100% via @/lib/icons barrel |
| Unit tests | 4472 pass |
| E2E tests | 164 pass |
| Page spec docs | 21/21 complete |
| Spec issues fixed | 41 total (across all severities) |
| HIGH severity issues | 1 remaining (meeting-to-doc) |
| MEDIUM severity issues | 22 remaining |

### Consistency Scorecard

| Layer | Score |
|-------|-------|
| Spacing | 95% |
| Card padding | 98% |
| Colors | 100% |
| Typography | 95%+ |
| Dividers | 85% |
| Width/height tokens | 90% |
| Animations | 95%+ |
| Fixed sizing | 100% |
| Icon imports | 100% |
