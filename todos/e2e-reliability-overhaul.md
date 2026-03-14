# E2E Reliability Overhaul

> **Priority:** P0
> **Status:** In Progress
> **Last Updated:** 2026-03-12
> **Latest Verified Full Suite:** `161 passed` in `5.6m`

## Objective

Keep the Playwright suite green while finishing the remaining determinism work.

## Remaining Work

### Deterministic Waits

- [ ] Standardize `action -> deterministic wait -> assert outcome` across remaining critical flows.
- [ ] Ensure every critical user action has one explicit completion signal.
- [ ] Remove redundant retries that still mask race conditions.

### Data Isolation

- [ ] Ensure each spec has an isolated data namespace and idempotent setup.
- [ ] Strengthen cleanup for test artifacts and test users to prevent cross-test contamination.

### Selector Contracts

- [ ] Replace remaining brittle selectors with `getByRole`, `getByLabel`, or `getByTestId(TEST_IDS...)`.
- [ ] Expand `TEST_IDS` coverage where critical flows still lack stable anchors.

### Suite Controls

- [ ] Keep `forbidOnly` and strict no-skip policy enforced for critical-path specs.
- [ ] Remove unnecessary retries in critical-path specs.
- [ ] Enforce deterministic waits in all modified and new specs.

### Passing-Test Hardening

- [ ] Review currently passing core specs and refactor weak waits preemptively.
- [ ] Apply shared helper abstractions to reduce copy/paste anti-patterns.

## Acceptance Criteria Still Open

- [ ] No unjustified `waitForTimeout` usage across the E2E suite.
- [ ] E2E authoring standard is documented and enforced in reviews.

## Guardrails

- Keep `pnpm run validate` passing before and after E2E hardening changes.
- Prefer reusable helper and page-object improvements over one-off test fixes.
- Treat any new flake as a contract problem, not just a rerun problem.
