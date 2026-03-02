# E2E Reliability Overhaul (State-of-the-Art)

> **Priority:** P0 (Highest)
> **Effort:** Large
> **Status:** Active
> **Last Audited:** 2026-03-02

---

## Objective

Make E2E tests deterministic, robust, and CI-trustworthy:
- eliminate flaky timeout-driven behavior
- use explicit state-based waits
- reduce false negatives in CI
- maintain confidence as test coverage grows

## Baseline

- Last full run: `2026-03-02`
- Executed tests: `113`
- Failures: `23`
- Error rate: `20.35%`

### Focused Validation Snapshot (2026-03-02, targeted suite)

- Command: `pnpm exec playwright test e2e/activity-feed.spec.ts e2e/analytics.spec.ts e2e/issues.spec.ts e2e/auth.spec.ts --reporter=line`
- Executed: `28` (of `32`, `4` not run after failures)
- Passed: `25`
- Failed: `3`
- Current targeted error rate: `10.71%`

---

## Hard Rules (New Standard)

- [ ] No fixed sleep waits (`waitForTimeout`) except for explicitly justified polling edge cases.
- [ ] Await specific UI state changes (`toBeVisible`, `toHaveText`, `toHaveURL`, `toHaveCount`) tied to user outcomes.
- [ ] Prefer semantic/role selectors and stable test ids over brittle CSS/text fallbacks.
- [ ] Every critical user action must wait for one deterministic completion signal.
- [ ] Any flaky test fix must include root-cause notes and a guard assertion preventing regression.

---

## Workstreams

### 1) Failure Triage + Categorization

- [x] Bucket current failures into: selector drift, async race, data setup instability, auth/session, backend latency.
- [ ] Create per-spec failure heatmap from latest run artifacts.
- [x] Prioritize top 15 most-failing specs first.

### 2) Waiting Strategy Refactor

- [ ] Replace weak waits with state-based helpers:
  - `waitForDashboardReady`
  - `waitForBoardLoaded`
  - `waitForIssueCreateSuccess`
  - `waitForOAuthRedirectComplete`
- [ ] Standardize pattern: action -> await deterministic state -> assert outcome.
- [ ] Remove redundant retries masking race conditions.

### 3) Test Data & Isolation Hardening

- [ ] Ensure each spec has isolated data namespace and idempotent setup.
- [ ] Strengthen cleanup for test artifacts/users to prevent cross-test contamination.
- [ ] Add backend health precheck in setup with explicit failure reason when unavailable.

### 4) Selector Contract Stabilization

- [ ] Audit failing specs for unstable selectors and replace with:
  - `getByRole`
  - `getByLabel`
  - `getByTestId(TEST_IDS...)`
- [ ] Expand `TEST_IDS` constants where critical flows lack stable anchors.
- [ ] Document selector hierarchy for E2E authoring.

### 5) CI Stability Controls

- [ ] Run shard-level pass-rate metrics and publish trend in CI summary.
- [ ] Add flaky quarantine label/process (temporary, time-boxed).
- [ ] Keep `forbidOnly` and strict no-skip policy for critical path specs.

### 6) Upgrade Passing Tests (Not Just Failing Ones)

- [ ] Review currently passing core specs and refactor weak waits preemptively.
- [ ] Apply shared helper abstractions to reduce copy/paste anti-patterns.
- [ ] Add reliability checklist to PR review for E2E file changes.

---

## Phase Plan

### Phase 1 (S1): Stop the Bleeding

- [ ] Fix top failing specs and cut error rate from `20.35%` to `<10%`.
- [ ] Land waiting helper library + replace worst timeout anti-patterns.

### Phase 2 (S2): Make It Deterministic

- [ ] Refactor all critical-path specs to state-driven awaits.
- [ ] Bring error rate to `<5%` on 3 consecutive CI runs.

### Phase 3 (S3): Harden and Scale

- [ ] Proactively modernize remaining passing tests.
- [ ] Reach `<2%` error rate on 5 consecutive CI runs.

---

## Acceptance Criteria

- [ ] No unjustified `waitForTimeout` usage across E2E suite.
- [ ] Error rate < `2%` for 5 consecutive CI runs.
- [ ] Core flows (`auth`, `issue create/edit`, `board drag/drop`, `docs`, `search`) stable across shards.
- [ ] E2E authoring standard documented and enforced in reviews.

---

## Related Files

- `playwright.config.ts`
- `e2e/global-setup.ts`
- `e2e/fixtures/`
- `e2e/utils/`
- `.github/workflows/ci.yml`
- `docs/testing/e2e.md`

---

## Execution Log

### 2026-03-02 - Batch A (completed)

- Decision: Remove brittle template-name coupling from project creation flow.
- Change: `e2e/pages/projects.page.ts` now selects the first available template option in the create-project modal instead of hardcoding `/Software Development/i`.
- Change: `e2e/auth.spec.ts` removed fixed sleeps (`waitForTimeout`) and replaced with `expect.poll` + deterministic fallback navigation.
- Change: `e2e/pages/auth.page.ts` stabilized submit button binding via `TEST_IDS.AUTH.SUBMIT_BUTTON` and waits for form readiness before sign-in submit.
- Change: `e2e/pages/projects.page.ts` narrowed create-issue submit selector to explicit create-issue submit path (avoids strict-mode collisions with "Create new label").

### 2026-03-02 - Batch A Retest Outcomes

- Initial targeted rerun after first patch set: `20` passed / `5` failed (`32` total, `7` not run after failures).
- Second targeted rerun after additional selector/wait updates: `25` passed / `3` failed (`28` executed, `4` not run).

### Remaining Blockers (current)

- `e2e/auth.spec.ts` - `Integration › can sign in with existing user and lands on dashboard` still intermittently fails to reach authenticated app shell after UI login (auth/session redirect race).
- `e2e/analytics.spec.ts` - `analytics shows correct issue count after creating issues` still times out in issue creation path under load (submit actionability/race remains).
- `e2e/issues.spec.ts` - `Issue Detail › can open issue detail dialog` still assumes a `Time tracking` heading appears deterministically (UI content timing drift).

### Next Step (strictly next)

- Introduce deterministic helper trio and migrate affected specs first:
  - `waitForIssueCreateSuccess` (await modal close + new card/key signal)
  - `waitForIssueDetailReady` (await detail modal + stable key/timer-control signal, not heading text)
  - `waitForOAuthRedirectComplete`/auth-shell-ready guard for post-login stabilization
