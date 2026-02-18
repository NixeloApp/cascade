# Recursive Improvement Protocol

> **Purpose:** Living document for continuous quality improvement. When told "work on this doc", systematically improve Nixelo by benchmarking against Plane, Cal.com, and Mintlify.
>
> **Last Run:** 2026-02-17
> **Overall Progress:** 133/278 (Phase 1-6 complete)

---

## Quick Reference

| Phase | File | Status | Summary |
|-------|------|--------|---------|
| 1 | [PHASE_1_USER_STORIES.md](./PHASE_1_USER_STORIES.md) | ✅ Complete | Feature parity with Plane, Cal.com |
| 2 | [PHASE_2_EDITOR_POLISH.md](./PHASE_2_EDITOR_POLISH.md) | ✅ Complete | Editor features, markdown |
| 3 | [PHASE_3_UI_UX_CONSISTENCY.md](./PHASE_3_UI_UX_CONSISTENCY.md) | ✅ Complete | Design system, a11y, error handling |
| 4 | [PHASE_4_FEATURE_POLISH.md](./PHASE_4_FEATURE_POLISH.md) | ✅ Complete | Keyboard shortcuts, empty states, toasts |
| 5 | [PHASE_5_QUALITY_DEEP_DIVE.md](./PHASE_5_QUALITY_DEEP_DIVE.md) | ✅ Complete | 342 tests, 153 stories, N+1 fixes |
| 6 | [PHASE_6_PERFORMANCE_BACKEND.md](./PHASE_6_PERFORMANCE_BACKEND.md) | ✅ Complete | Bundle, Convex tests, CI |

---

## How This Doc Works

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
