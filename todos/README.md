# Nixelo Todo — MVP

> **Last Updated:** 2026-03-25

---

## Remaining Work

### ~17 MEDIUM Page Spec Issues

| Category | Count | Details |
|----------|-------|---------|
| Visual/shell weight | 8 | Auth shell x4, dashboard gradients x2, forgot-password sparse, meetings density |
| Screenshot coverage | 3 | Documents states, analytics states, auth sign-up |
| Product depth | 2 | Sprint story-point progress, dependencies graph |
| Infrastructure | 1 | External error reporting (Sentry/PostHog) |
| Responsive | 1 | Roadmap touch interactions |
| Complexity | 1 | Editor sparse content |
| ~~UX~~ | ~~1~~ | ~~Workspaces search/filter~~ **Fixed** — search bar with name/description/slug filtering |

All require design decisions, product specs, or infrastructure setup.

### Infrastructure

| Item | Detail |
|------|--------|
| [e2e-overhaul.md](./e2e-overhaul.md) | E2E overhaul — Phase 1/2/3.2/4/5 DONE. Remaining: Phase 3.1 (continue splitting monolith, 4,737 lines), 6 (CI validators) |

### Features

| Item | Detail |
|------|--------|
| [meeting-intelligence.md](./meeting-intelligence.md) | Meeting-to-doc flow (HIGH — needs product decisions on volume/provider) |
| [plane-features.md](./plane-features.md) | Only external notification routing remains |

---

## Current Health

| Metric | Value |
|--------|-------|
| Validators | 53/53 pass |
| Unit tests | 4474 pass |
| E2E tests | 164 pass |
| Page spec docs | 21/21 complete |
| Spec issues fixed | 51 total |
| TEST_IDs | 197 |
| MEDIUM remaining | 16 |
