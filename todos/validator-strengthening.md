# Validator Strengthening

> **Priority:** P1
> **Status:** Clear next passes
> **Last Updated:** 2026-03-25

## Goal

- [ ] Close the remaining validator gaps that still allow structural drift without blocking healthy development.
- [ ] Prefer AST-backed or route-aware checks over regex-only heuristics where the false-positive/false-negative tradeoff is currently weak.
- [ ] Keep audit-only checks explicit and rare; new validators should default to enforced unless there is a clear reason not to.

## Remaining

### 1. Tighten unbounded `.collect()` detection

- [ ] Replace the current local-context heuristic in `scripts/validate/check-queries.js` with a stricter model for app code.
- [ ] Target behavior:
  - default: block plain `.collect()` in normal query/mutation code
  - allow explicit bounded helper/wrapper patterns
  - allow clearly named cleanup/batch-processing flows only when the exception is obvious in code, not just because a nearby `.take()` happened elsewhere in the same snippet
- [ ] Why this matters:
  the current validator still relies on nearby-text checks and can be fooled by context that is not actually bounding the `collect()`.

### 2. Lifecycle timestamp ownership validator

- [ ] Add a validator for raw lifecycle timestamp bundles in Convex write paths.
- [ ] Scope:
  - focus on `convex/**`
  - prioritize mutations/internalMutations/actions/internalActions that write coupled lifecycle fields like `archivedAt`, `archivedBy`, `completedAt`, `reviewedAt`, and similar server-owned timestamps
  - ignore tests
- [ ] Target behavior:
  - flag repeated lifecycle write bundles that should go through shared semantic helpers
  - allow clearly intentional comparisons and non-persisted calculations
- [ ] Why this matters:
  Convex does not provide `_updatedAt` or automatic lifecycle stamping, so app-owned timestamp semantics need explicit ownership instead of scattered copied patches.

## Execution Order

- [ ] Tighten `.collect()` first because the validator already exists and needs sharper ownership rules rather than a new framework.
- [ ] Add the lifecycle timestamp validator after the ownership helpers are explicit enough to enforce without noise.

## Done Criteria

- [ ] Each validator has a precise contract and test coverage where practical.
- [ ] New validators plug into the shared result-utils path and follow the enforced/audit model already in place.
- [ ] No reintroduction of severity levels or soft failure taxonomy.
- [ ] The todo can shrink to only residual false-positive tuning or baseline cleanup after those remaining passes land.
