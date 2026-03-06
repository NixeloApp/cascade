# E2E Reliability Overhaul

> **Priority:** P0 (Highest)
> **Effort:** Large
> **Status:** In Progress (local full-suite now green; hardening work remains)
> **Last Updated:** 2026-03-06

## Objective

Make E2E tests deterministic and locally verifiable with one rule: run the full suite and check pass/fail. No summary jobs, no history-derived gates.

## Baseline Rule

- Source of truth is local full run output from:
  - `pnpm exec playwright test --reporter=line`
- Acceptance signal is binary:
  - `100% pass` or `not 100% pass`

## Hard Rules

- [x] No fixed sleep waits (`waitForTimeout`) except explicitly justified polling edge cases.
- [ ] Await specific UI state changes (`toBeVisible`, `toHaveText`, `toHaveURL`, `toHaveCount`) tied to user outcomes.
- [ ] Prefer semantic/role selectors and stable test ids over brittle CSS/text fallbacks.
- [ ] Every critical user action must wait for one deterministic completion signal.
- [ ] Any flaky test fix must include root-cause notes and a guard assertion preventing regression.

## Workstreams

### 1) Failure Triage

- [x] Bucket failures into: selector drift, async race, data setup instability, auth/session, backend latency.
- [x] Maintain per-spec failure heatmap from latest local run artifacts.
- [x] Prioritize top failing specs first.

### 2) Waiting Strategy Refactor

- [x] Replace weak waits with state-based helpers:
  - `waitForDashboardReady`
  - `waitForBoardLoaded`
  - `waitForIssueCreateSuccess`
  - `waitForOAuthRedirectComplete`
- [ ] Standardize pattern: action -> await deterministic state -> assert outcome.
- [ ] Remove redundant retries masking race conditions.

### 3) Data Isolation

- [ ] Ensure each spec has isolated data namespace and idempotent setup.
- [ ] Strengthen cleanup for test artifacts/users to prevent cross-test contamination.
- [ ] Add backend health precheck in setup with explicit failure reason when unavailable.

### 4) Selector Contract Stabilization

- [ ] Audit unstable selectors and replace with:
  - `getByRole`
  - `getByLabel`
  - `getByTestId(TEST_IDS...)`
- [ ] Expand `TEST_IDS` constants where critical flows lack stable anchors.
- [x] Document selector hierarchy for E2E authoring.

### 5) Suite Controls

- [ ] Keep `forbidOnly` and strict no-skip policy for critical path specs.
- [ ] Remove unnecessary retries in critical-path specs.
- [ ] Enforce deterministic waits in all modified/new specs.

### 6) Passing-Test Hardening

- [ ] Review currently passing core specs and refactor weak waits preemptively.
- [ ] Apply shared helper abstractions to reduce copy/paste anti-patterns.
- [x] Add reliability checklist to PR review for E2E file changes.

## Phase Plan

### Phase 1 (S1): Stability Foundation

- [ ] Fix top failing specs and drive local full-suite to consistent green runs.
- [ ] Land waiting helper rollout across highest-risk specs.

### Phase 2 (S2): Determinism

- [ ] Refactor all critical-path specs to state-driven awaits.
- [ ] Eliminate flaky selector and race-condition hotspots.

### Phase 3 (S3): Sustainment

- [ ] Proactively modernize remaining passing specs.
- [ ] Keep full local suite green across repeated runs.

## Acceptance Criteria

- [ ] No unjustified `waitForTimeout` usage across E2E suite.
- [x] Full local suite run reports 100% pass.
- [ ] Core flows (`auth`, `issue create/edit`, `board drag/drop`, `docs`, `search`) are stable.
- [ ] E2E authoring standard is documented and enforced in reviews.

## Blocker Update (2026-03-05)

- Local full-suite run command:
  - `pnpm exec playwright test --reporter=line`
- Current result:
  - `155 passed (7.0m)`, no skipped tests.
- Resolution notes:
  - Re-enabled `Sprints` spec suite by removing `test.describe.skip(...)`.
  - Replaced static skipped calendar OAuth placeholder with runnable redirect-contract assertion.
  - Tightened sprint create-button locator scope to avoid strict-mode ambiguity.
- Next step:
  - Continue hardening unchecked reliability items (selector contracts, deterministic action completion signals, and data-isolation improvements).

## Related Files

- `playwright.config.ts`
- `e2e/global-setup.ts`
- `e2e/fixtures/`
- `e2e/utils/`
- `.github/workflows/ci.yml`
- `docs/testing/e2e.md`
