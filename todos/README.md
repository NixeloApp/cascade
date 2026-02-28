# Nixelo Todos

Project todos and improvement tracking.

---

## Roadmap Todos

| File | Status | Focus |
|------|--------|-------|
| [agency-mvp.md](./agency-mvp.md) | Active | Agency MVP features |
| [enterprise.md](./enterprise.md) | Active | Enterprise features |
| [growth-features.md](./growth-features.md) | Active | Growth features |
| [public-launch.md](./public-launch.md) | Active | Public launch checklist |
| [feature-gaps.md](./feature-gaps.md) | Active | Feature gaps to close |
| [multi-level-views.md](./multi-level-views.md) | Active | Multi-level views |
| [emoji-overhaul.md](./emoji-overhaul.md) | Active | Emoji system overhaul |
| [uptime-monitoring.md](./uptime-monitoring.md) | Active | Uptime monitoring |
| [oauth-monitoring-finalization.md](./oauth-monitoring-finalization.md) | Active | OAuth monitoring |
| [bandwidth_optimization.md](./bandwidth_optimization.md) | Active | Database bandwidth fixes |
| [bandwidth_burn_assessment.md](./bandwidth_burn_assessment.md) | Active | Bandwidth usage analysis |
| [memoization-cleanup.md](./memoization-cleanup.md) | Active | Remove manual memoization (React Compiler) |

---

## Jules Tasks (Automated Issues)

| File | Status | Priority |
|------|--------|----------|
| [jules-sentinel-2026-02-26-issue-search-security.md](./jules-sentinel-2026-02-26-issue-search-security.md) | Open | High |
| [jules-bolt-2026-02-23-sprints-n-plus-one.md](./jules-bolt-2026-02-23-sprints-n-plus-one.md) | Open | Medium |
| [jules-librarian-2026-02-23-lodash-vulnerability.md](./jules-librarian-2026-02-23-lodash-vulnerability.md) | Open | Low |
| [jules-spectra-2025-02-24-deduplicate-hashapikey.md](./jules-spectra-2025-02-24-deduplicate-hashapikey.md) | Open | Low |
| [jules-scribe-2024-05-22-fix-cascade-delete-limit.md](./jules-scribe-2024-05-22-fix-cascade-delete-limit.md) | Open | Medium |

---

## Recursive Improvement (Completed Phases)

> **Progress:** 133/278 (Phase 1-6 complete)
> **Last Run:** 2026-02-27

| Phase | File | Status | Summary |
|-------|------|--------|---------|
| 1 | [PHASE_1_USER_STORIES.md](./PHASE_1_USER_STORIES.md) | ✅ | Feature parity with Plane, Cal.com |
| 2 | [PHASE_2_EDITOR_POLISH.md](./PHASE_2_EDITOR_POLISH.md) | ✅ | Editor features, markdown |
| 3 | [PHASE_3_UI_UX_CONSISTENCY.md](./PHASE_3_UI_UX_CONSISTENCY.md) | ✅ | Design system, a11y, error handling |
| 4 | [PHASE_4_FEATURE_POLISH.md](./PHASE_4_FEATURE_POLISH.md) | ✅ | Keyboard shortcuts, empty states, toasts |
| 5 | [PHASE_5_QUALITY_DEEP_DIVE.md](./PHASE_5_QUALITY_DEEP_DIVE.md) | ✅ | 342 tests, 153 stories, N+1 fixes |
| 6 | [PHASE_6_PERFORMANCE_BACKEND.md](./PHASE_6_PERFORMANCE_BACKEND.md) | ✅ | Bundle, Convex tests, CI |
| 7 | [PHASE_7_CONSISTENCY_ENFORCEMENT.md](./PHASE_7_CONSISTENCY_ENFORCEMENT.md) | 🚧 | CVA expansion, validators, component recipes |

---

## How Recursive Improvement Works

1. **Invoke with:** "work on this doc" or "recursive improvement"
2. **Each run:** Pick the highest-priority incomplete section, research competitors, implement improvements
3. **Update:** Mark items complete, add findings, increment progress
4. **Repeat:** Until all sections reach 100%

---

## Competitor Repos

| Competitor | Local Path | Focus |
|------------|------------|-------|
| **Plane** | `/home/mikhail/Desktop/plane` | Issue tracking, Kanban, workflows |
| **Cal.com** | `/home/mikhail/Desktop/cal.com` | Scheduling, auth, enterprise features |
| **Mintlify** | `docs/research/library/mintlify/` | Design polish, animations, premium feel |

---

## Nixelo Advantages Over Competitors

| Feature | Plane | Cal.com | Nixelo |
|---------|-------|---------|--------|
| Column WIP limits | ❌ | N/A | ✅ |
| Sprint templates | ❌ | N/A | ✅ |
| Document comments | ❌ | N/A | ✅ |
| IP restrictions | N/A | ❌ | ✅ |
| Time tracking on issues | ❌ | N/A | ✅ |

---

## Commands

```bash
# Run full validation
pnpm run check

# Run custom validators
node scripts/validate.js

# Generate bundle report
pnpm vite build --mode analyze

# Compare with Plane
ls /home/mikhail/Desktop/plane/apps/web/core/components/
```

---

*This is a living document. Update after each improvement session.*
