# E2E And Screenshot Consolidation

> **Priority:** P0
> **Status:** Nearly complete — structural work done, residual polish remains
> **Last Updated:** 2026-03-27

## What Was Done

The bulk of this todo has been addressed. All execution-plan derivation, phase planning, blocked-transport consolidation, manifest-driven target selection, raw-locator elimination, production-hook cleanup, and validator enforcement items are complete. Validators ratchet all baselines.

## Remaining Work

### Session orchestration reusability
- [ ] `readiness.ts` still exists as a screenshot-specific dispatch layer to page objects. Evaluate whether it can be inlined or deleted now that every check delegates to a page object.
- [ ] `session.ts` is well-structured but screenshot-specific. It cannot yet be reused by product E2E tests for state setup. Evaluate whether the multi-config loop, phase ordering, and seed management can be extracted into shared helpers.

### Documentation
- [ ] Update CI workflow docs to make the surface area obvious: what validates product behavior, what validates static artifacts, what no longer exists as a default workflow.
- [ ] Document the remaining webPush test hooks in production code (`src/lib/webPush.tsx`) with a concrete justification for each.

### Exit criteria (still open)
- [ ] A contributor can point to one reusable helper path for a given route/state instead of choosing between E2E helpers and screenshot-only helpers.
- [ ] Screenshot generation and screenshot integrity checking are clearly separate concepts in code and docs.
