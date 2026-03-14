# Validator Exceptions Burndown

> **Priority:** P0
> **Status:** Active
> **Last Updated:** 2026-03-14
> **Verification Summary:** `37/37` validators pass, and `1` explicit exception bucket remains.

## Objective

Keep the validator suite green while eliminating the remaining allowlists and baselines that still mask work we want to finish.

## Verified Exception Debt

### Test coverage baseline

- **File:** `scripts/validate/test-coverage-baseline.js`
- **Remaining entries:** `126`
- **Breakdown:** `103` component files, `13` hooks, `10` Convex files
- **Fix:** add tests or reduce the validator target surface until the baseline reaches `0`.

## Non-Goals

- Do not count `scripts/ci/e2e-hard-rules-baseline.json`; it is already effectively empty.
- Do not count `convex/lib/` and `convex/internal/` envelope-pattern exclusions unless we decide to expand validator scope.

## Execution Order

1. Burn down `scripts/validate/test-coverage-baseline.js` in chunks that keep `pnpm run validate` green.
2. Delete each exception only after the replacement test or code cleanup lands.

## Acceptance Criteria

- [x] `scripts/validate/check-time-constants.js` has no exception entries.
- [x] `scripts/validate/check-test-coverage.js` has no allowlist entries.
- [x] `scripts/validate/check-unused-params.js` has no allowlist entries.
- [ ] `scripts/validate/test-coverage-baseline.js` is empty or removed.
- [ ] `pnpm run validate` still passes with no new exception buckets introduced.
