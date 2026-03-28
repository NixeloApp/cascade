# E2E And Screenshot Consolidation

> **Priority:** P0
> **Status:** Complete
> **Last Updated:** 2026-03-28

## What Was Done

The bulk of this todo has been addressed. All execution-plan derivation, phase planning, blocked-transport consolidation, manifest-driven target selection, raw-locator elimination, production-hook cleanup, and validator enforcement items are complete. Validators ratchet all baselines.

## Remaining Work

### Session orchestration reusability
- [x] Moved route/state readiness into `e2e/utils/page-readiness.ts` so screenshot capture and future product E2E flows share one page-object-based readiness path.
- [x] Extracted the viewport/theme matrix loop into `e2e/utils/config-matrix.ts` so screenshot session orchestration no longer owns that reusable iteration logic.

### Documentation
- [x] Updated CI/workflow docs so screenshot generation (`pnpm screenshots`) and screenshot integrity (`pnpm screenshots:integrity`, `pnpm run static`) are called out as separate concerns.
- [x] Documented the remaining webPush test hooks in `src/lib/webPush.tsx` and `docs/guides/pwa.md` with concrete justifications.

### Exit criteria (still open)
- [x] A contributor can point to one reusable helper path for a given route/state instead of choosing between E2E helpers and screenshot-only helpers.
- [x] Screenshot generation and screenshot integrity checking are clearly separate concepts in code and docs.
