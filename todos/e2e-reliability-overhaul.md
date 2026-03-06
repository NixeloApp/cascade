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

## Remaining Work (Execution Backlog)

This is the concrete "what's left" list for reliability hardening after the latest green full-suite run.

1. Deterministic post-action assertions in critical flows:
   - convert any remaining action-only steps into `action -> deterministic wait -> outcome assert`.
   - target specs first: `issue create/edit`.
2. Selector contract completion:
   - replace remaining brittle text/CSS fallbacks with role/label/test-id selectors.
   - add missing `TEST_IDS` constants for any critical controls without stable anchors.
3. Data isolation and cleanup hardening:
   - ensure per-spec unique namespaces for created entities.
   - guarantee teardown paths for users/projects/issues created during tests.
4. Suite policy enforcement:
   - remove unnecessary retries in critical-path specs.
   - keep no-skip/no-only audits clean for critical path at commit time.
5. Evidence updates after every full run:
   - append the latest pass/fail outcome and duration in this file.
   - record failing spec names and immediate next action when the suite is not 100% pass.

## Evidence Freshness Guard

Full-suite evidence in this TODO is considered stale if older than 24 hours.

- If stale, do not treat `Full local suite run reports 100% pass` as release-gate evidence.
- Refresh by rerunning:
  - `pnpm exec playwright test --reporter=line`
- Then update:
  - `Last Updated`
  - latest run outcome, duration, and skip count
  - immediate next action when not 100% pass

## Latest Verified Full-Suite Evidence

- Run command:
  - `pnpm exec playwright test --reporter=line`
- Run date:
  - `2026-03-06`
- Outcome:
  - `155 passed (5.9m)`, `0 skipped`
- Gate interpretation:
  - current local suite is green; refresh is required when evidence is older than 24 hours (see `Evidence Freshness Guard`).

## Historical Resolution Notes (2026-03-06)

- Hardened `e2e/search.spec.ts` against selector drift by replacing raw `cmdk-*` selectors and loose text fallbacks with explicit `TEST_IDS` anchors for the search input, loading state, results group, minimum-query message, and tab controls.
- Added dashboard page-object helpers to enforce `open/fill -> wait for settled state -> assert outcome` for global search instead of ad hoc per-test waits.
- Guard assertions now verify both tab activation and filtered result absence in the search tab-switch path, so the spec fails on regressions in either state propagation or filtering.
- Targeted validation:
  - `pnpm exec playwright test e2e/search.spec.ts --reporter=line`
  - `7 passed (2.7m)`
- Hardened `e2e/board-drag-drop.spec.ts` by replacing the drag-handle CSS-class assertion with a dedicated `TEST_IDS.ISSUE.DRAG_HANDLE` contract and by routing board column checks through existing board test ids.
- Strengthened `ProjectsPage.switchToTab(...)` to await the expected project route after each tab click, so backlog/board transitions are asserted instead of assumed.
- Targeted validation:
  - `pnpm exec playwright test e2e/board-drag-drop.spec.ts --reporter=line --workers=1`
  - `5 passed (2.1m)`
- Stabilized `ProjectsPage` around canonical board and issue-card test ids so issue/detail flows no longer depend on legacy CSS/data-attribute fallbacks.
- Hardened `e2e/documents.spec.ts` by moving document-route waits into `DocumentsPage.createNewDocument()` and turning the title-edit case into a real title mutation/assertion backed by explicit document title test ids.
- Targeted validation:
  - `pnpm exec playwright test e2e/issues.spec.ts --reporter=line --workers=1`
  - `3 passed (1.6m)`
  - `pnpm exec playwright test e2e/documents.spec.ts --reporter=line --workers=1`
  - `4 passed (1.2m)`
- Hardened the forgot-password/reset flow against route remounts during auth HTTP responses by making the reset step URL-backed (`/forgot-password?step=reset&email=...`) instead of local component state.
- Removed native submit races from the password-reset request and reset-code forms by using explicit button-driven submission plus Enter-key handlers, and added a hydration wait before the forgot-password page object interacts with the form.
- Root cause note:
  - the forgot-password route could successfully request a reset OTP while remounting before React local state committed, so Playwright stayed on the initial form even though the backend had already generated a code.
  - storing the step in the URL makes the UI deterministic across remounts and gives the test a stable completion signal (`Check your email` heading + reset-code input).
- Targeted validation:
  - `pnpm exec playwright test e2e/auth.spec.ts -g "password reset flow sends code and allows reset" --reporter=line --workers=1`
  - `1 passed (17.9s)`
  - `pnpm exec playwright test e2e/auth.spec.ts --reporter=line --workers=1`
  - `19 passed (2.0m)`
- Hardened issue-creation completion checks by removing the loose page-text fallback from `waitForIssueCreateSuccess(...)` and requiring the explicit `Issue created successfully` toast after modal dismissal.
- Moved workflow assertions for newly created Scrum issues onto the backlog tab before opening detail views, so issue-card visibility is verified against the correct surface instead of incidental page text.
- Root cause note:
  - the old helper could treat any matching text node as proof of successful issue rendering, which masked whether the card actually appeared in backlog after creation.
  - using the success toast for completion and backlog-scoped card assertions makes the issue lifecycle tests fail on real regressions in rendering or tab placement.
- Targeted validation:
  - `pnpm exec playwright test e2e/integration-workflow.spec.ts e2e/time-tracking.spec.ts e2e/issues.spec.ts --reporter=line --workers=1`
  - `8 passed (3.1m)`

## Historical Resolution Notes (2026-03-05)

- Re-enabled `Sprints` spec suite by removing `test.describe.skip(...)`.
- Replaced static skipped calendar OAuth placeholder with runnable redirect-contract assertion.
- Tightened sprint create-button locator scope to avoid strict-mode ambiguity.
- Follow-up focus remains: selector contracts, deterministic completion signals, and data-isolation hardening.

## Related Files

- `playwright.config.ts`
- `e2e/global-setup.ts`
- `e2e/fixtures/`
- `e2e/utils/`
- `.github/workflows/ci.yml`
- `docs/testing/e2e.md`
