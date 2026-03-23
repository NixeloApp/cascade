# Nixelo Todo — MVP

> **Last Updated:** 2026-03-23

---

## Remaining Work

### Phase 1: Code Quality & Consistency

| Item | Detail |
|------|--------|
| AI slop cleanup | Card variant="subtle" added; worst offenders fixed (OfflineTab 11→0, NotificationsTab 8→2, UserTypeManager 5→2). Remaining visual review items need dev server. |
| Mobile/tablet coverage | Backfill responsive gaps (needs visual review) |
| Icon visual consistency | Sizing, stroke-weight rhythm, tone drift (needs visual review) |
| Shell discipline | Composition pattern drift (needs visual review) |
| Raw styling cleanup | 102 files / 162 violations (long tail: 58 files at 1, 32 at 2; mostly margins and widths) |

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
| ~28 MEDIUM page spec issues | Invoice UX, visual polish (6 fixed: clients + workspace card extractions, wiki grid dedup, tab label fix, AI slop cleanup) |

---

## Current Health

| Metric | Value |
|--------|-------|
| Validators | 53/53 pass |
| Raw styling violations | 102 files / 162 baselined (was 276) |
| Fixed size drift | 0 |
| RoadmapView | 775 lines (was 2671, 71% reduction via Roadmap/ directory) |
| Icon imports | 100% via @/lib/icons barrel |
| Card variant="section" usage | 94 → 69 (25 converted to subtle or removed) |
| Unit tests | 4470 pass |
| E2E tests | 164 pass |
| Page spec docs | 21/21 complete |
| HIGH severity issues | 1 remaining (meeting-to-doc) |
| MEDIUM severity issues | ~28 remaining |

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
