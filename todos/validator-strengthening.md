# Validator Strengthening

> **Priority:** P1
> **Status:** Clear next passes
> **Last Updated:** 2026-03-25

## Goal

- [ ] Close the remaining validator gaps that still allow structural drift without blocking healthy development.
- [ ] Prefer AST-backed or route-aware checks over regex-only heuristics where the false-positive/false-negative tradeoff is currently weak.
- [ ] Keep audit-only checks explicit and rare; new validators should default to enforced unless there is a clear reason not to.

## Remaining

### 1. Lifecycle timestamp ownership validator

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

- [ ] Add the lifecycle timestamp validator after the ownership helpers are explicit enough to enforce without noise.

## Done Criteria

- [ ] Each validator has a precise contract and test coverage where practical.
- [ ] New validators plug into the shared result-utils path and follow the enforced/audit model already in place.
- [ ] No reintroduction of severity levels or soft failure taxonomy.
- [ ] The todo can shrink to only residual false-positive tuning or baseline cleanup after those remaining passes land.
