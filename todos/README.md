# Nixelo Todo — MVP

> **Last Updated:** 2026-03-25

---

## Remaining Work

### 13 MEDIUM Page Spec Issues (all need design/product decisions)

| Category | Count | Details |
|----------|-------|---------|
| Visual/shell weight | 8 | Auth shell x4, dashboard gradients x2, forgot-password sparse, meetings density |
| Screenshot coverage | 3 | Documents states, analytics states, auth sign-up |
| Product depth | 1 | Dependencies graph (needs design: node graph? matrix? table?) |
| Infrastructure | 1 | External error reporting (Sentry/PostHog) |

**Resolved this session:**
- ~~UX: Workspaces search/filter~~ — Added search with name/description/slug filtering
- ~~Product depth: Sprint story-point progress~~ — Dual progress bars (issues + story points)
- ~~Responsive: Roadmap touch interactions~~ (deferred — mobile roadmap is read-only, acceptable)
- ~~Complexity: Editor sparse content~~ (screenshot seed data issue, not code)

### Infrastructure

| Item | Detail |
|------|--------|
| [e2e-overhaul.md](./e2e-overhaul.md) | E2E overhaul — 6 of 7 phases complete. Remaining: Phase 3.1 (continue splitting monolith, 4,544 lines) |

### Features (need product decisions)

| Item | Detail |
|------|--------|
| [meeting-intelligence.md](./meeting-intelligence.md) | Meeting-to-doc flow — needs volume estimate for provider choice |
| [plane-features.md](./plane-features.md) | Only external notification routing remains |

---

## Current Health

| Metric | Value |
|--------|-------|
| Validators | 53/53 pass |
| Unit tests | 4474 pass |
| E2E tests | 164 pass |
| Page spec docs | 21/21 complete |
| Spec issues fixed | 53 total |
| TEST_IDs | 197 |
| MEDIUM remaining | 13 |
