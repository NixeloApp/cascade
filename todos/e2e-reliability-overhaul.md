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
   - `createIssue()` now owns modal-close/success completion, and duplicate modal-close waits were removed from touched consumers.
   - issue title edit guards now cover both the detail modal and the direct issue page route.
   - issue description/priority edit guards now cover both the detail modal and the direct issue page route.
   - issue-detail dialog close assertions now go through `ProjectsPage.closeIssueDetail()` in the touched modal consumers.
   - global-search close assertions in `search.spec.ts` now go through `DashboardPage` helpers instead of spec-level `Escape` handling.
   - time-entry modal open/close in billing settings now goes through `DashboardPage` helpers instead of spec-level dialog handling.
   - dashboard modal smoke tests now rely on page-object open/close helpers, and shortcut-open tests close their modals before exit.
   - invite-panel reset behavior now lives in `SettingsPage.closeInviteUserModalIfOpen()` instead of being inlined inside the open flow.
   - workspace-create reset now goes through `WorkspacesPage.closeCreateWorkspaceDialogIfOpen()`, and the shared workspaces-page create flow uses the modal form submit path instead of depending on the button click staying actionable.
   - dashboard modal open helpers now call named `close...IfOpen()` resets before reopening, and global-search open retries focus the input inside the retry loop so the helper proves the input survives long enough for typing.
   - issue-detail open/close now goes through `ProjectsPage.closeIssueDetailIfOpen()`, so touched issue-detail flows do not depend on the modal already being in the expected state before re-opening or closing it.
   - `createProject()` now treats the wizard's `Creating...` loading state as a valid submit-start signal before waiting for modal dismissal and success toast, instead of assuming the dialog must start closing immediately after the first click.
   - create-project modal reopen/cancel coverage now goes through `ProjectsPage.closeCreateProjectFormIfOpen()`, and the new issues regression guard verifies the dialog can be canceled, canceled again, and reopened without inheriting stale modal state.
   - auth comprehensive coverage now uses `AuthPage.expandEmailForm()` and `waitForFormExpanded()` instead of spec-level expansion retries, and the sign-in/sign-up toggle test no longer carries a flaky annotation.
   - activity-feed coverage now uses `ProjectsPage` helpers for page-state detection, feed-entry visibility, action text, issue keys, and relative timestamps instead of probing feed internals directly from the spec.
   - invite coverage now uses `SettingsPage` helpers for invite visibility and revoked-state assertions, and `inviteUser()` / `revokeInvite()` both wait on the actual invite table state rather than a toast or a still-mounted form button.
   - next target: tighten `DocumentsPage` create/edit helpers so document creation owns the editor-ready signal and touched docs specs stop duplicating editor hydration assertions around new-document flows.
2. Selector contract completion:
   - `pnpm run validate` now passes with no `Test ID constants` warnings.
   - continue replacing brittle text/CSS fallbacks opportunistically when modifying critical specs.
   - add missing `TEST_IDS` constants only where critical controls still lack stable anchors.
3. Data isolation and cleanup hardening:
   - ensure per-spec unique namespaces for created entities.
   - guarantee teardown paths for users/projects/issues created during tests.
4. Suite policy enforcement:
   - remove unnecessary retries in critical-path specs.
   - keep no-skip/no-only audits clean for critical path at commit time.
5. Evidence updates after every full run:
   - append the latest pass/fail outcome and duration in this file.
   - record failing spec names and immediate next action when the suite is not 100% pass.

## Current Hardening Notes

- Project-tab navigation is scoped to the project tab strip to avoid collisions with global navigation links.
- `createProject()` now retries `click -> /projects/[KEY]/board` to absorb modal/hydration redirect races.
- `createProject()` now scopes to the active project modal, waits for modal-close plus success toast, and falls back to direct board navigation when the client-side redirect lags after a confirmed create.
- Issue-detail URL specs now read the issue key from `TEST_IDS.ISSUE.KEY` via `ProjectsPage`, not by parsing the card `aria-label`.
- `createIssue()` owns the completion signal, so touched specs now assert the user-visible outcome instead of re-checking modal closure.
- Issue metadata edit coverage now uses stable detail selectors for description content and case-insensitive priority assertions, so the modal test guards both persistence and UI presentation without brittle text casing.
- Standalone issue-detail route interactions now go through `IssueDetailPage`, so direct-route specs no longer reach into `getByTestId()` from the spec body for description edit assertions.
- Issue-detail modal close flows now go through `ProjectsPage.closeIssueDetail()`, so touched specs do not inline `Escape` plus dialog-hidden waits after edits.
- Global-search close flows now go through `DashboardPage.closeGlobalSearchWithEscape()` or `DashboardPage.closeGlobalSearch()`, so touched search specs no longer manage modal teardown directly.
- Billing settings now open and close the header time-entry modal through `DashboardPage`, so the spec only asserts billable checkbox behavior instead of dialog mechanics.
- Dashboard modal smoke tests no longer duplicate open/close visibility assertions that the corresponding `DashboardPage` helpers already guarantee.
- Invite-panel reset now goes through a named `SettingsPage` helper, so the admin invite flow no longer hides modal cleanup inside the open retry block.
- `WorkspacesPage.createWorkspace()` now preserves the old blanket Escape reset behind `closeCreateWorkspaceDialogIfOpen()` and submits through the shared create form, after `teams.spec.ts` showed that narrowing the reset to only a visible workspace dialog broke the shared workspace-create flow.
- `DashboardPage` modal open helpers now reuse named `close...IfOpen()` resets, and global search keeps focus inside the retry loop, after the targeted search rerun showed the modal could disappear between the helper's visible check and the first `fill()`.
- `DashboardPage.closeTimeEntryModal()` is idempotent again, after the billing-disabled flow showed the timer dialog can already be gone by cleanup time even though the checkbox assertion completed.
- `ProjectsPage.openIssueDetail()` and `closeIssueDetail()` now reuse a named `closeIssueDetailIfOpen()` reset, after hardening moved the detail-dialog setup and teardown into the page object and the targeted rerun confirmed the modal flow stays deterministic across integration and issues specs.
- `ProjectsPage.createProject()` now accepts the wizard's `Creating...` state as proof that submit started, after the issue-detail setup rerun exposed that waiting only for immediate dialog dismissal could misclassify a valid create click as a failure.
- `ProjectsPage.openCreateProjectForm()` and `cancelCreateProject()` now reuse `closeCreateProjectFormIfOpen()`, after the create-project modal hardening showed the dialog needed an explicit reset path for repeated cancel/reopen flows instead of assuming the previous close fully settled.
- `auth-comprehensive.spec.ts` now relies on `AuthPage.expandEmailForm()` and `waitForFormExpanded()` for sign-in/sign-up coverage, after removing the spec-local expansion retries and flaky annotation proved the page object already exposes the deterministic state transition those tests needed.
- `activity-feed.spec.ts` now goes through `ProjectsPage` helpers for empty-vs-entry state, action text, issue-key visibility, and relative timestamps, after moving those assertions out of the spec body showed the feed state could be treated as a single page-object contract.
- `SettingsPage.openInviteUserModal()` now waits for the invite form controls, `inviteUser()` accepts the invite row as the success signal, and `revokeInvite()` waits for the row status to become `revoked`, after the invite reruns showed the inline card could close before the button-based retry logic realized the action had already succeeded.

## Latest Targeted Hardening Evidence

- `pnpm run validate`
  - `RESULT: PASS (0 errors)`
- `pnpm exec playwright test e2e/onboarding.spec.ts --reporter=line --workers=1`
  - `7 passed (1.5m)`
- `pnpm exec playwright test e2e/rbac.spec.ts --reporter=line --workers=1`
  - `3 passed (27.6s)`
- `pnpm exec playwright test e2e/issues.spec.ts e2e/issue-detail-page.spec.ts --reporter=line --workers=1`
  - superseded by the dedicated issue-edit runs below
- `pnpm exec playwright test e2e/issues.spec.ts --reporter=line --workers=1`
  - superseded by the current issues hardening rerun below
- `pnpm exec playwright test e2e/issues.spec.ts --reporter=line --workers=1`
  - `5 passed (3.0m)`
- `pnpm exec playwright test e2e/issue-detail-page.spec.ts --reporter=line --workers=1`
  - `5 passed (3.0m)`
- `pnpm exec playwright test e2e/issues.spec.ts e2e/integration-workflow.spec.ts --reporter=line --workers=1`
  - `9 passed (4.9m)`
- `pnpm exec playwright test e2e/search.spec.ts --reporter=line --workers=1`
  - `7 passed (2.4m)`
- `pnpm exec playwright test e2e/settings/billing.spec.ts --reporter=line --workers=1`
  - `2 passed (22.5s)`
- `pnpm exec playwright test e2e/dashboard.spec.ts --reporter=line --workers=1`
  - `11 passed (1.6m)`
- `pnpm exec playwright test e2e/invites.spec.ts --reporter=line --workers=1`
  - `1 passed (29.1s)`
- `pnpm exec playwright test e2e/teams.spec.ts --reporter=line --workers=1`
  - `3 passed (33.5s)`
- `pnpm exec playwright test e2e/workspaces-org.spec.ts -g "Admin can create multiple workspaces" --reporter=line --workers=1`
  - `1 passed (18.3s)`
- `pnpm exec playwright test e2e/settings/billing.spec.ts -g "billing disabled hides billable checkbox on time entries" --reporter=line --workers=1`
  - `1 passed (16.0s)`
- `pnpm exec playwright test e2e/search.spec.ts -g "search returns matching issues" --reporter=line --workers=1`
  - `1 passed (1.0m)`
- `pnpm exec playwright test e2e/issues.spec.ts e2e/integration-workflow.spec.ts -g "can open issue detail dialog|complete project lifecycle" --reporter=line --workers=1`
  - `2 passed (1.2m)`
- `pnpm exec playwright test e2e/issues.spec.ts e2e/integration-workflow.spec.ts --reporter=line --workers=1`
  - `10 passed (5.3m)`
- `pnpm exec playwright test e2e/auth-comprehensive.spec.ts --reporter=line --workers=1`
  - `9 passed (40.5s)`
- `pnpm exec playwright test e2e/activity-feed.spec.ts --reporter=line --workers=1`
  - `4 passed (2.7m)`
- `pnpm exec playwright test e2e/invites.spec.ts --reporter=line --workers=1`
  - `1 passed (20.5s)`
- `pnpm exec playwright test e2e/board-drag-drop.spec.ts e2e/time-tracking.spec.ts e2e/search.spec.ts e2e/activity-feed.spec.ts e2e/analytics.spec.ts e2e/integration-workflow.spec.ts --reporter=line --workers=1`
  - `26 passed (9.2m)`

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

## Related Files

- `playwright.config.ts`
- `e2e/global-setup.ts`
- `e2e/fixtures/`
- `e2e/utils/`
- `.github/workflows/ci.yml`
- `docs/testing/e2e.md`
