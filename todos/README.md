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
