# Nixelo - Feature Todos

> **Last Updated:** 2026-02-10

Organized feature specifications and roadmap items. Each file contains:
- Problem statement and motivation
- Detailed implementation steps
- Acceptance criteria
- Related files

---

## Current Focus

| Priority | File | Feature | Status |
|----------|------|---------|--------|
| **P0** | [quality-overhaul.md](./quality-overhaul.md) | E2E test stability | Near Complete |
| **P1** | [multi-level-views.md](./multi-level-views.md) | Org/Workspace/Team views | Not Started |
| **P2** | [emoji-overhaul.md](./emoji-overhaul.md) | Icon picker, emoji migration | Phase 1 Done |

---

## Active (MVP)

| File | Feature | Effort | Status |
|------|---------|--------|--------|
| [quality-overhaul.md](./quality-overhaul.md) | Flaky E2E test fixes | Medium | Near Complete |
| [multi-level-views.md](./multi-level-views.md) | Board/Wiki/Calendar at org/workspace/team levels | Large | Not Started |
| [feature-gaps.md](./feature-gaps.md) | Rich text comments, user picker, Slack | Medium | Partial |
| [emoji-overhaul.md](./emoji-overhaul.md) | Icon component consolidation, emoji picker | Medium | Phase 1 Done |

---

## Deferred (Post-MVP)

| File | Feature | Priority | Effort |
|------|---------|----------|--------|
| [agency-mvp.md](./agency-mvp.md) | Invoicing, client portal | P2 | Large |
| [public-launch.md](./public-launch.md) | Demo video, HN, Reddit, PH | P3 | Medium |
| [uptime-monitoring.md](./uptime-monitoring.md) | Monitors, status pages, auto-incidents | P3 | Medium |
| [post-mvp.md](./post-mvp.md) | Post-launch roadmap (consolidated) | P3-P4 | Various |
| [enterprise.md](./enterprise.md) | SSO/SAML, Stripe, AI assistant | P4 | Large |
| [growth-features.md](./growth-features.md) | Slack sync, search, version history | P4 | Medium |

---

## Quick Reference

### What's Done

- Label groups and velocity charts
- Saved filters UI
- `TEST_IDS` shared constants + validators
- Icon component consolidation (Phase 1)
- JSDoc coverage on core Convex functions
- Biome complexity warnings resolved

### What's Next

1. **E2E Stability** - Fix remaining flaky tests
2. **Multi-Level Views** - Core MVP gap (workspace backlog, org calendar, etc.)
3. **Icon Picker** - Replace raw emoji input with proper picker UI

---

## How to Use

1. **Pick a feature** from the tables above
2. **Read the full spec** - understand the problem and implementation
3. **Work through tasks sequentially** - specs are ordered by dependency
4. **Check off tasks** as you complete them
5. **Update the spec** if you discover new requirements

---

## Related Docs

- [CLAUDE.md](../CLAUDE.md) - Development guide
- [RULES.md](../RULES.md) - Development rules
- [docs/README.md](../docs/README.md) - Full documentation index
