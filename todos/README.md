# Nixelo Todo — MVP

> **Last Updated:** 2026-03-24

---

## Remaining Work

### Phase 0: Zero Validator Exceptions

**Goal: 0 baselined violations across all validators.**

| Metric | Current | Target |
|--------|---------|--------|
| Raw styling violations | 162 across 102 files | 0 |
| Files with 5 violations | 1 | 0 |
| Files with 4 violations | 2 | 0 |
| Files with 3 violations | 9 | 0 |
| Files with 2 violations | 32 | 0 |
| Files with 1 violation | 58 | 0 |

### Phase 1: Visual Review (needs dev server + screenshots)

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

### What's been fixed

Architecture: RoadmapView decomposition (2671→768 lines), ClientCard extraction, WorkspaceCard extraction, WikiDocumentGrid dedup, ProjectTimesheet dead code removal, useEffect→beforeLoad redirects (2 routes), auth hydrated/formReady removal, formatCurrency consolidation (6 duplicates→2 shared modules).

Backend: Invoice list with client join, reactive portal tokens, archived notification pagination, admin-scoped token query.

Frontend: Invoice draft dialog, portal admin gating, footer link wiring, icon barrel migration (82 files), design tokens (roadmap + sidebar).

Card architecture: Banned all nested Cards (no exemptions). Introduced `CardSection` as the designated inner surface (58 replacements across 21 files). Card = outer container, CardSection = inner grouping. Validator enforces the ban.
