# E2E Reliability Overhaul

> **Priority:** P0 (Highest)
> **Effort:** Large
> **Status:** In Progress (checklist actively being worked in order; latest recorded local full-suite runs are green repeatedly; validation passing)
> **Last Updated:** 2026-03-12
> **Review Outcome:** status unchanged in this audit; latest local full-suite evidence is now refreshed on 2026-03-12 with `161 passed` in `5.6m`. Screenshot-specific reliability was also refreshed on 2026-03-12 with a clean `pnpm screenshots` run (`207 screenshots captured`).

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
- [x] Add backend health precheck in setup with explicit failure reason when unavailable.

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

- [x] Fix top failing specs and drive local full-suite to consistent green runs.
- [ ] Land waiting helper rollout across highest-risk specs.

### Phase 2 (S2): Determinism

- [ ] Refactor all critical-path specs to state-driven awaits.
- [ ] Eliminate flaky selector and race-condition hotspots.

### Phase 3 (S3): Sustainment

- [ ] Proactively modernize remaining passing specs.
- [x] Keep full local suite green across repeated runs.

## Acceptance Criteria

- [ ] No unjustified `waitForTimeout` usage across E2E suite.
- [x] Full local suite run reports 100% pass.
- [x] Core flows (`auth`, `issue create/edit`, `board drag/drop`, `docs`, `search`) are stable.
- [ ] E2E authoring standard is documented and enforced in reviews.

## Remaining Work (Execution Backlog)

This is the concrete "what's left" list for reliability hardening after the latest green full-suite run.

### Execution Priority Note

- validation-first cleanup is now landed and `pnpm run validate` passes again; keep that bar in place before taking on any new E2E-only hardening.
- do not land narrow one-off fixes purely to make a failing check go green; prefer reusable page-object, helper, selector-contract, and UI-state abstractions that remove the whole class of failure.
- treat each failure as an architecture opportunity: simplify control flow, make completion boundaries explicit, reduce duplicated test logic, and leave the touched code clearer than it was before.

1. Deterministic post-action assertions in critical flows:
   - convert any remaining action-only steps into `action -> deterministic wait -> outcome assert`.
   - `createIssue()` now owns modal-close/success completion, and duplicate modal-close waits were removed from touched consumers.
   - `ProjectsPage.openCreateIssueModal()` now uses a direct trigger-visible -> dialog-ready contract with one explicit `nixelo:create-issue` fallback instead of nested retries plus a fixed sleep, and `issues.spec.ts` plus `board-drag-drop.spec.ts` stayed green on the follow-up rerun (`11 passed`, `2.9m`).
   - `trySignInUser()` now waits on named sign-in-surface and Convex-WebSocket readiness contracts instead of an inline interval logger plus an implicit `waitForFunction` timeout, and the follow-up auth/signout rerun stayed green (`20 passed`, `1.5m`).
   - seeded-user `InvalidAccountId` recovery now lives in `TestUserService.loginTestUserWithRepair()`, so `trySignInUser()` no longer owns that repair branch inline, and `waitForMockOTP()` now reports the last backend error/status in its timeout instead of failing with an unqualified polling timeout.
   - auth locator contracts now match the current auth shell headings and `TEST_IDS.AUTH.*` anchors, and UI-login fallback now re-establishes `/signin` before asserting the sign-in surface, so auth bootstrap no longer fails open when the fallback lands on the public shell; the follow-up auth/onboarding/signout rerun stayed green (`27 passed`, `2.7m`).
   - onboarding skip completion now goes through `skipOnboardingToDashboard()` with an explicit visible-skip-control -> dashboard-route contract instead of open-coded selector fallbacks inside `handleOnboardingOrDashboard()`.
   - `authenticatedTest`, `onboardingTest`, and `rbacTest` fixture bootstrap now all use `TestUserService.loginTestUserWithRepair()` instead of bypassing the shared seeded-account repair path, so authenticated and RBAC entry points no longer drift away from the auth contract used by global setup.
   - `AuthPage.clickForgotPassword()` now treats forgot-password entry as a direct sign-in-trigger -> forgot-password-route contract with one explicit route fallback instead of re-running the whole sign-in expansion flow, and `AuthPage.requestPasswordReset()` now uses a direct request -> reset-code-step contract with one explicit route recovery instead of wrapping the request in another generic attempt helper.
   - `OnboardingPage.selectTeamLead()` / `selectTeamMember()` now use a direct role-select -> next-step-heading contract with one explicit onboarding-route recovery, and `waitForWizard()` / `waitForRoleCardsReady()` now use direct visibility/interactivity assertions instead of boolean wrapper helpers around the same expectations.
   - `AuthPage.clickForgotPasswordLink()` now uses a direct click -> forgot-password-route contract with one bounded second click instead of falling back to a synthetic `dispatchEvent("click")`, so the forgot-password entry helper stays inside real user interaction paths.
   - `AuthPage.goBackToSignIn()` now uses the shared sign-in-landing contract with one explicit `/signin` recovery instead of depending on a bare heading wait before expanding the form again.
   - `OnboardingPage.skipOnboarding()` and `goToDashboard()` now own a direct click -> dashboard-route contract with one bounded second-click recovery instead of leaving the dashboard settle boundary to the calling spec.
   - `OnboardingPage.clickBack()` now owns a direct back-click -> role-selection contract with one bounded second click instead of leaving the return-to-wizard boundary to the calling spec.
   - `AuthPage.submitForgotPasswordRequest()` now uses the real `Send reset code` button instead of a synthetic `form.requestSubmit()`, so the password-reset request path stays on real user interaction semantics.
   - `AuthPage.attemptSignUp()` now waits for a real submit-start signal (`Creating account...`, verification step, or error toast) before committing to the verification wait, with one bounded second click when the first submit does not start, so the sign-up flow no longer jumps straight from click to long verification polling.
   - `AuthPage.signIn()` now waits for a real submit-start signal (`Signing in...`, redirect, or error toast) and uses one bounded second click when the first submit does not start, so the successful sign-in path no longer treats the submit button click itself as completion.
   - `AuthPage.verifyEmail()` and `completePasswordReset()` now wait for real submit-start signals (`Verifying...` / `Resetting...`, redirect, or toast outcome) with one bounded second click when the first submit does not start, so those OTP-backed flows no longer treat a button click or `document.readyState` as proof that the auth mutation actually began.
   - `AuthPage.expectAuthenticatedApp({ recoverFromLanding: true })` now owns the bounded landing/sign-in escape hatch before asserting dashboard/onboarding readiness, and the existing-user auth spec no longer open-codes the `/app` fallback inside the test body.
   - `AuthPage.signInAndReachAuthenticatedApp()` now owns the last API-assisted sign-in recovery branch, so the existing-user auth spec no longer open-codes a `trySignInUser()` fallback after the UI sign-in path.
   - `OnboardingPage.createProject()` now treats the wizard's `Creating...` state or completion screen as the submit-start contract, with one bounded second click when the first submit does not start, so team-member onboarding no longer assumes the first click immediately transitions the wizard.
   - `auth-helpers.ts` now treats dashboard readiness as a shell contract instead of a URL-only success signal: `skipOnboardingToDashboard()`, `handleOnboardingOrDashboard()`, and the app-gateway path in `trySignInUser()` all wait for the actual dashboard shell before declaring bootstrap complete.
   - authenticated dashboard bootstrap now lives in `wait-helpers.ts` as `ensureAuthenticatedDashboardReady()`, and both `auth.fixture.ts` and `rbac.fixture.ts` now use that same recovery contract instead of keeping separate fixture-specific dashboard bootstrap logic.
   - `auth.fixture.ts` now uses one shared `bootstrapFixtureUser()` path for both `authenticatedTest` and `onboardingTest`, so token injection, repair-aware login, and fixture bootstrap sequencing no longer drift between dashboard and onboarding fixtures.
   - fixture auth token preload and repair-aware login now live in `fixture-auth.ts`, and both `auth.fixture.ts` and `rbac.fixture.ts` now use that shared helper instead of maintaining separate token-injection and repair-logging logic.
   - issue title edit guards now cover both the detail modal and the direct issue page route.
   - issue description/priority edit guards now cover both the detail modal and the direct issue page route.
   - issue-detail dialog close assertions now go through `ProjectsPage.closeIssueDetail()` in the touched modal consumers.
   - global-search close assertions in `search.spec.ts` now go through `DashboardPage` helpers instead of spec-level `Escape` handling.
   - time-entry modal open/close in billing settings now goes through `DashboardPage` helpers instead of spec-level dialog handling.
   - `DashboardPage.openTimeEntryModal({ expectBillable })` now treats org-setting propagation as part of the helper contract, reloading the app shell only when the timer modal proves the billing context is stale after an out-of-band settings mutation.
   - `ProjectsPage.startTimer()` / `stopTimer()` now share a timer-action completion contract that waits for the success toast plus the opposite control state, so touched time-tracking specs no longer duplicate button-state assertions after each timer action.
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
   - documents coverage now uses `DocumentsPage.createNewDocument()` as the completion boundary for URL change plus editor readiness, so touched docs specs no longer duplicate editor hydration assertions after every create step.
   - roadmap coverage now goes through `ProjectsPage` helpers for route readiness, current-month visibility, and epic-filter state instead of mixing direct tab navigation with inline timeline/filter lookups in the spec body.
   - sprint/backlog coverage now goes through `ProjectsPage` helpers for route-specific ready state, so `sprints.spec.ts` no longer mixes page-object tab switching with raw page-level heading/button assertions.
   - analytics coverage now goes through `ProjectsPage` helpers for route readiness, metric/chart visibility, total-issue count parsing, and empty-sprint messaging instead of reasserting those same sections from the spec body.
   - RBAC coverage now goes through `ProjectsPage` helpers for project-tab visibility and route-specific readiness, so role checks no longer mix raw `page.getByRole()` tab lookups with inline settings/sprint/analytics assertions.
   - permission-cascade owner settings coverage now goes through `ProjectsPage` helpers for settings-tab visibility and route readiness, so the project-settings permission check no longer clicks raw tab locators or duplicates settings-page URL assertions.
   - permission-cascade workspace settings coverage now goes through `WorkspacesPage` helpers for detail-page readiness and settings-route access, so the workspace-settings permission check no longer probes raw settings links or duplicates workspace-settings URL assertions.
   - permission-cascade org-owner settings coverage now goes through `SettingsPage` helpers for admin-tab navigation, so the organization-settings permission check no longer probes raw admin-tab visibility instead of using the shared settings navigation contract.
   - permission-cascade admin user-management coverage now goes through `SettingsPage` helpers for admin-tab plus platform-users visibility, so the organization-members check no longer probes stale members-tab assumptions or ad hoc list markers.
   - permission-cascade create-workspace/create-project smoke assertions now go through `WorkspacesPage` and `ProjectsPage` helpers, so those tests no longer depend on raw URL/main-content checks after the create flows finish.
   - permission-cascade workspace/project visibility smoke assertions now go through `WorkspacesPage` and `ProjectsPage` list helpers, so those tests no longer read raw main-content and href counts directly.
   - full `permission-cascade.spec.ts` rerun now passes after the helper migration, so the file is currently green end-to-end and no longer relies on the stale raw settings/members assertions that were driving this slice.
   - `workspaces-org.spec.ts` now goes through `SettingsPage` helpers for admin-settings readiness, organization-name visibility, time-approval state, and non-admin admin-tab blocking, and through `WorkspacesPage` helpers for workspace detail visibility.
   - `teams.spec.ts` now goes through `WorkspacesPage` helpers for workspace opening, teams-tab navigation, teams-page readiness, and empty-vs-teams state detection instead of branching on raw headings, workspace cards, and `Teams` links in the spec body.
   - `dashboard.spec.ts` now goes through `DashboardPage` helpers for main-section visibility, issue-filter visibility, and notification-panel visibility instead of asserting those raw locators from the spec body.
   - `DashboardPage.signOutViaUserMenu()` now uses a direct user-menu click plus a bounded second sign-out attempt against a named signed-out destination contract, so sign-out no longer retries the whole menu flow when the first click already mounted the redirect.
   - `DashboardPage.signOutViaUserMenu()` now opens the user menu through an explicit menu-ready contract before clicking `Sign out`, and it reopens once if the Radix menu item remounts during the first click, so the full-suite sign-out flow no longer depends on a detached menu item staying stable long enough for Playwright's first click.
   - `onboarding.spec.ts` now goes through `OnboardingPage` for onboarding-route readiness, skip-to-dashboard completion, project-create completion, and dashboard-route readiness instead of mixing spec-level `waitForURL()` and dashboard-heading waits into the flow.
   - `issue-detail-page.spec.ts` now goes through `IssueDetailPage` for route-ready assertions, issue-not-found assertions, and breadcrumb navigation back to the project board instead of repeating direct URL, error-state, and route-return checks from the spec body.
   - `error-scenarios.spec.ts` now goes through `ProjectsPage`, `DocumentsPage`, and `IssueDetailPage` for authenticated non-existent project/document/issue checks instead of repeating route navigation and error-state assertions directly in the spec body.
   - `error-scenarios.spec.ts` now goes through `LandingPage.expectLandingOrSignInPage()` for the unauthenticated protected-route redirect check instead of polling raw headings from the spec body.
   - `invite.spec.ts` now goes through `InvitePage` for invalid-token, go-home, loading-or-invalid, and invalid-branding assertions instead of probing invite route state with raw selectors in the spec body.
   - `oauth-mocked.spec.ts` now goes through `AuthPage.gotoSignInLanding()`, `signInWithGoogle()`, and `waitForOAuthErrorSettle()` for the three mocked OAuth error flows instead of repeating the same raw Google-button and alert-settle logic in each test.
   - `AuthPage.waitForOAuthErrorSettle()` now polls a named OAuth settle state (`signin` / `alert` / `toast`) instead of retrying the whole settle check, so the mocked OAuth failures now assert the actual post-callback landing state directly.
   - `AuthPage.expandEmailForm()` now uses a direct form-expanded contract with one bounded second-click recovery, and `clickForgotPassword()` now uses a direct navigation contract with a navigation-aware fallback instead of retrying the whole auth-form flow.
   - `AuthPage.signUp()` now treats expanded-form readiness, credential fill stability, and verification-step visibility as one bounded two-attempt contract instead of retrying the whole auth flow blindly.
   - `AuthPage.signUp()` now waits for the verification form itself, not just an intermediate success toast, so the sign-up integration flow owns the actual `verify email` step visibility that the serial auth tests and the full suite depend on.
   - `OnboardingPage.waitForWizard()`, `waitForRoleCardsReady()`, `selectTeamLead()`, and `selectTeamMember()` now use direct wizard-visible, cards-interactive, and next-step-heading contracts with one bounded reroute/retry path instead of retrying the whole onboarding transition block.
   - `AuthPage.requestPasswordReset()` now uses a direct forgot-password entry contract plus a bounded reset-code-step request flow instead of retrying the whole password-reset request block, and `/forgot-password` now persists the reset email in session storage so the reset form survives route remounts without leaking the email into the URL.
   - `integration-workflow.spec.ts` now goes through `ProjectsPage` for `calendar`/`timesheet` tab navigation, active-tab assertions, and timesheet ready state instead of dropping back to raw tab-strip locators and a raw `Time Entries` tab check.
   - `permission-cascade.spec.ts` now goes through `ProjectsPage.gotoProjectBoard()` and `expectProjectNotFound()` for the non-existent-project permission check instead of constructing the project URL and not-found heading directly in the spec body.
   - `dashboard.spec.ts` now goes through `SettingsPage.expectDarkThemeEnabled()` / `expectDarkThemeDisabled()` for the theme-state check instead of reading the `html` class directly from the spec body.
   - current raw page-level selector scan across `e2e/*.spec.ts` is clean.
   - `createTestNamespace(testInfo)` now owns run-scoped names and project keys across the create-heavy E2E specs, and the current `rg` scan of `e2e/*.spec.ts` is clean for spec-local `Date.now()` namespaces.
   - authenticated dashboard bootstrap now goes through `/app` and waits for a healthy dashboard shell before tests proceed, after the docs/search reruns showed a URL match alone could still leave the app on a `500` boundary.
   - dashboard search retries now surface app-error diagnostics immediately, after the minimum-query rerun showed `userSettings:get` could fail with `UNAUTHENTICATED` while the retry loop was still polling for the search input.
   - `DashboardCustomizeModal`, `PreferencesTab`, and the settings shell now gate auth-sensitive queries with `useConvexAuth()`, after the search minimum-query and dashboard theme reruns showed hidden/user-settings queries could still trip `UNAUTHENTICATED` boundaries during initial auth bootstrap.
   - `SettingsPage.inviteUser()` now treats modal open, email fill, optional role selection, and invite-row visibility as one retryable interaction, after the settings/admin rerun showed the invite email input could detach between modal-open success and the first fill.
   - `BreadcrumbLink` now honors `asChild`, after the `workspaces-org.spec.ts` rerun surfaced nested-anchor hydration errors in workspace breadcrumbs even though the tests still passed.
   - `waitForBackendReady()` in `e2e/global-setup.ts` now records the last site/client probe result and prints explicit failure diagnostics when Convex is unavailable, so the backend health precheck no longer fails as a timeout with no useful endpoint context.
   - next focus: keep trimming helper retries that are still acting as synchronization safety nets instead of explicit completion contracts, starting with the remaining auth/bootstrap polling helpers and setup-specific retry branches.
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
  - latest full runs are green repeatedly:
    - `2026-03-07`: `160 passed` in `8.0m`
    - `2026-03-07`: `160 passed` in `7.8m`
    - `2026-03-09`: `161 passed` in `5.4m`
    - `2026-03-09`: `161 passed` in `5.7m`
   - immediate next actions:
     - continue converting retry-heavy flows into explicit completion contracts while the suite is green enough to use as a stable benchmark.
     - use the repeated green baseline to prioritize cleanup of remaining helper retries and other high-churn flows that still lean on broad retry wrappers instead of narrow completion contracts.
   - adjacent non-E2E verification on `2026-03-07`:
     - `pnpm run validate` passed; `Test coverage` still reports `164 file(s) missing tests` as warn-only.
     - `pnpm run test:run` passed: `371 passed`, `5 skipped`.
     - `pnpm run test:convex:run` passed: `250 passed`, `3 skipped`.
     - backend/unit suites are currently green, but they still emit expected-looking stderr from negative-path tests and scheduled-job env validation (`BOT_SERVICE_URL`, OAuth error-path logs, digest-email render error logs), so those logs should not be confused with actual test failures.

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
- `ensureAuthenticated()` now routes authenticated tests through `/app` and waits for a healthy dashboard shell instead of treating the dashboard URL alone as success, after the docs/search reruns showed API-authenticated tests could still land on a `500` dashboard during bootstrap.
   - `DashboardPage.searchFor()` now uses a direct input/value contract with one bounded refill recovery, and `waitForSearchSettled()` now polls a named search-results state instead of retrying the whole interaction, after the full search rerun confirmed the modal only needed a single query re-entry when the input remounted.
   - `DashboardPage.closeTimeEntryModal()` is idempotent again, after the billing-disabled flow showed the timer dialog can already be gone by cleanup time even though the checkbox assertion completed.
   - `DashboardPage.openTimeEntryModal({ expectBillable })` now uses a direct modal-open contract with one bounded second-click recovery and keeps the app-shell reload as a single explicit billing-state resync path, after the repeated billing reruns confirmed the timer dialog only needed a second trigger or one post-settings reload instead of retrying the whole flow.
   - `DashboardPage.openTimeEntryModal({ expectBillable })` now polls the timer modal billing state (`billable` / `non-billable`) before declaring the shell stale, and it performs bounded close-reload-open recovery when an out-of-band organization settings mutation still leaves the modal on the old billing context.
   - `DashboardPage.openTimeEntryModal({ expectBillable })` now uses one direct billing-state check plus one named app-shell resync instead of a generic three-attempt loop, after the focused billing rerun confirmed the helper only needs a single stale-context recovery path when org settings change out of band.
   - `DashboardPage.signOutViaUserMenu()` now reacquires the visible `Sign out` menu item inside the retry loop and waits for a signed-out destination, after the isolated signout rerun showed the previous locator could detach between menu-open and click.
   - Convex WebSocket readiness now lives in `wait-helpers.ts` as `waitForConvexConnectionReady()`, and `auth-helpers.ts`, `OnboardingPage`, and `rbac.fixture.ts` now use that same readiness contract instead of carrying separate `__convex_test_client` waits; the focused auth/onboarding/RBAC rerun stayed green (`29 passed`, `2.3m`).
   - collapsed auth-form expansion now goes through the real `Continue with email` control in `SignInForm` / `SignUpForm`, and `AuthPage.expandEmailForm()` plus `waitForFormExpanded()` now require a stable expanded state so the helper survives the one-time auth-shell remount instead of relying on `form.requestSubmit()`; the focused auth/auth-comprehensive rerun stayed green (`28 passed`, `3.6m`).
   - `trySignInUser()`'s UI-login fallback now uses `clickContinueWithEmail()`, shared auth locators, `waitForFormReady()`, and a submit-start poll instead of `page.evaluate()` with raw `querySelector`, native value setters, and `dispatchEvent("input")`; the focused auth/onboarding/signout rerun stayed green (`27 passed`, `3.2m`).
   - shared workspace-create submission in `wait-helpers.ts` now uses the real dialog footer submit button instead of `form.requestSubmit()`, so both `WorkspacesPage.createWorkspace()` and `ProjectsPage.createWorkspace()` stay on the same page-level interaction contract; the focused `issues` + `teams` + `workspaces-org` rerun stayed green (`14 passed`, `2.7m`).
   - `ProjectsPage.createIssue()` now starts submission through the real modal footer button plus a bounded submit-start poll instead of `createIssueForm.requestSubmit()`, so issue creation stays on the same page-level contract as the rest of the project flows; the focused `issues` + `board-drag-drop` rerun stayed green (`11 passed`, `3.0m`).
   - `ProjectsPage.openCreateIssueModal()` no longer falls back to dispatching the synthetic `nixelo:create-issue` window event; it now owns one bounded second trigger lookup/click on real UI controls only, and the focused `issues` + `board-drag-drop` rerun stayed green again after removing the event path (`11 passed`, `3.1m`).
   - onboarding skip detection in `auth-helpers.ts` now uses locator polling over the shared `onboardingLocators()` set instead of a raw `waitForFunction()` DOM scan for "skip for now", and the focused auth/onboarding/signout rerun stayed green (`27 passed`, `3.2m`).
   - `DashboardPage.signOutViaUserMenu()` now routes the remount-prone sign-out menu item through `clickVisibleUserMenuSignOutItem()` instead of a bare try/catch inside `attemptSignOutViaUserMenu()`, so the user-menu retry is an explicit bounded contract rather than exception-driven control flow; the focused `dashboard` + `signout` rerun stayed green (`12 passed`, `56.4s`).
   - `AuthPage.attemptSignUp()` now uses one bounded credential-fill contract (`fillSignUpCredentials()` plus explicit filled-value assertions) instead of three separate post-fill “is the form still expanded?” checks, so sign-up no longer spreads the same remount-recovery logic across each field step; the focused auth/auth-comprehensive rerun stayed green (`28 passed`, `3.2m`).
   - shared `auth-helpers.ts` auth-surface waits now poll named form states (`signin-landing`, `signin-expanded`, `signup-landing`, `signup-expanded`) instead of using `Promise.race()` over whichever heading/button happened to resolve first, and `clickContinueWithEmail()` now gets one bounded second click before failing, so the global-setup/UI-fallback path uses the same explicit collapsed-auth contract as `AuthPage`; the focused auth/auth-comprehensive rerun stayed green (`28 passed`, `3.0m`) and the auth/onboarding/signout rerun stayed green (`27 passed`, `2.9m`).
   - `AuthPage.waitForToastOutcome()` now polls a named auth-toast outcome state (`success` / `error` / `pending`) instead of racing success and error toast locators, so verification and password-reset flows wait on one explicit post-submit contract rather than whichever toast waiter resolves first; the focused auth/auth-comprehensive rerun stayed green (`28 passed`, `3.0m`).
   - shared `auth-helpers.ts` sign-up completion now polls a named post-submit state (`verification` / `redirect` / `error` / `pending`) instead of racing verification UI against redirect, and `signUpUserViaUI()` now fails explicitly on the error-toast path instead of timing out without context; the focused auth/auth-comprehensive rerun stayed green (`28 passed`, `3.2m`).
   - `IssueDetailPage.waitForEditMode()` now polls a named edit-state contract instead of racing title-input visibility against description-editor visibility, so the standalone issue-detail route treats “edit mode entered” as one explicit state before title/description edits continue; the focused `issue-detail-page` rerun stayed green (`5 passed`, `1.6m`).
   - `ProjectsPage.waitForCreateProjectSubmitStart()` now polls a named submit-state contract (`submitting` / `closed` / `pending`) instead of racing sticky-footer button states against modal closure, so shared project creation waits on one explicit submit-start boundary before the rest of the board/issue flows continue; the focused `issues` rerun stayed green (`6 passed`, `1.8m`).
   - `DashboardPage.clickVisibleUserMenuSignOutItem()` now uses one explicit second sign-out click attempt instead of hiding the recovery path inside a `.catch()` callback, so the user-menu remount path stays a bounded control-flow contract rather than exception-driven branching; the focused `dashboard` + `signout` rerun stayed green (`12 passed`, `49.7s`).
   - `AuthPage.fillSignUpCredentials()` now uses one explicit credential fill plus one bounded re-fill recovery instead of a generic two-iteration loop, so the sign-up form remount path stays a named second-attempt contract rather than a retry wrapper; the focused auth/auth-comprehensive rerun stayed green (`28 passed`, `3.0m`).
   - `ProjectsPage.openCreateIssueModal()` now uses one explicit first trigger lookup/click plus one explicit second trigger lookup/click through the same helper contract, instead of splitting the bounded retry across separate lookup and boolean-wrapper branches; the focused `issues` + `board-drag-drop` rerun stayed green (`11 passed`, `3.0m`).
   - `AuthPage.attemptSignUp()` now requires the same submit-start contract after its bounded second submit click instead of letting the retry path fall straight through to the later verification wait, so the sign-up retry path no longer treats the second click itself as sufficient proof that account creation started; the focused auth/auth-comprehensive rerun stayed green (`28 passed`, `3.2m`).
   - `DashboardPage.openGlobalSearch()` now uses one explicit first trigger click plus one explicit second trigger click through a shared `clickGlobalSearchTrigger()` helper, instead of mixing the bounded retry into an inline readiness branch; the focused `dashboard` + `search` rerun stayed green (`19 passed`, `2.4m`).
   - `DashboardPage.openShortcutsHelp()` now uses one explicit first trigger click plus one explicit second trigger click through a shared `clickShortcutsHelpTrigger()` helper, and it now waits on a stable shortcuts-modal visible contract instead of branching off a one-shot `isVisible()` check; the focused `dashboard` rerun stayed green (`11 passed`, `1.1m`).
   - `DashboardPage.openTimeEntryModalOnce()` now uses one explicit first timer-trigger click plus one explicit second timer-trigger click through a shared `clickTimeEntryTrigger()` helper, instead of mixing the bounded retry into the modal-open branch; the focused `billing` + `time-tracking` rerun stayed green (`3 passed`, `1.1m`).
   - `SettingsPage.toggleTimeApproval()` now uses one explicit first save attempt plus one explicit draft-restage and second save, and organization-settings save now clicks the real `Save changes` button instead of using `button.evaluate(() => click())`; the focused `workspaces-org` rerun stayed green (`5 passed`, `51.0s`).
   - shared project/workspace creation no longer falls back to DOM `evaluate(() => click())`: `ProjectsPage.tryStartCreateProjectSubmit()`, `clickNewProjectButton()`, `clickFirstProjectTemplate()`, and `WorkspacesPage.clickNewWorkspaceButton()` now use one explicit first click plus one bounded second real click after reasserting visibility/actionability; the focused `issues` + `workspaces-org` rerun stayed green (`11 passed`, `2.8m`).
   - `CalendarPage.createEvent()` no longer falls back to `saveEventButton.evaluate(() => click())`; event save now uses one explicit first real click plus one bounded second real click after reasserting visibility/actionability, and the focused `calendar` rerun stayed green (`4 passed`, `54.6s`).
   - shared `waitForFormReady()` in `wait-helpers.ts` no longer falls back to raw `document.readyState`; it now waits on explicit auth-form readiness (`data-form-ready="true"` or the expanded/hydrated email+password+submit surface), so auth/bootstrap helpers stay on state-driven form readiness even if the marker lags; the focused `auth` + `auth-comprehensive` + `onboarding` + `signout` rerun stayed green (`36 passed`, `3.9m`).
   - `DocumentsPage.expectEditorVisible()` no longer waits on raw `document.readyState`; it now polls an explicit document-editor readiness state (`editor` / `initializer` / `error` / `pending`), clicks the one-time initializer only when that state appears, and then rechecks the editor/error boundary deterministically; the focused `documents` rerun stayed green (`4 passed`, `44.9s`).
- `DashboardPage.signOutViaUserMenu()` now uses a direct menu-open -> sign-out click contract with one bounded second attempt and a named signed-out destination check, after the isolated signout rerun confirmed the full flow does not need a blanket retry wrapper.
- Screenshot capture hardening on `2026-03-12` now resolves shared page-object route navigation to absolute URLs, waits for `/projects/:key/backlog` with the same board-ready contract as `/board`, and makes `ProjectsPage.openCreateIssueModal()` wait for dialog-scoped form controls before returning; latest full screenshot matrix passed with `207 screenshots captured`.
- historical full-suite run on `2026-03-07`: `160 passed` in `5.4m`.
- latest full-suite run on `2026-03-09`: `161 passed` in `5.7m`.
- latest full-suite run on `2026-03-12`: `161 passed` in `5.6m`.
- latest auth/bootstrap rerun on `2026-03-12`:
  - `pnpm exec playwright test e2e/auth.spec.ts e2e/signout.spec.ts --reporter=line --workers=1` -> `20 passed (1.5m)`
  - `pnpm exec playwright test e2e/auth.spec.ts e2e/signout.spec.ts --reporter=line --workers=1` -> `20 passed (1.9m)` after moving seeded-account repair into `TestUserService` and improving OTP timeout diagnostics
  - `pnpm exec playwright test e2e/auth.spec.ts e2e/onboarding.spec.ts e2e/signout.spec.ts --reporter=line --workers=1` -> `27 passed (2.7m)` after aligning auth locators with the current auth shell and making UI-login fallback re-establish `/signin` before asserting the sign-in surface
  - `pnpm exec playwright test e2e/dashboard.spec.ts e2e/rbac.spec.ts --reporter=line --workers=1` -> `14 passed (1.1m)` after moving shared fixture bootstrap (`authenticatedTest`, `onboardingTest`, `rbacTest`) onto `loginTestUserWithRepair()`
  - `pnpm exec playwright test e2e/auth.spec.ts e2e/auth-comprehensive.spec.ts --reporter=line --workers=1` -> `28 passed (1.6m)` after collapsing the forgot-password and password-reset helpers to direct route/outcome contracts
  - `pnpm exec playwright test e2e/onboarding.spec.ts --reporter=line --workers=1` -> `7 passed (1.1m)` after collapsing onboarding role selection to direct role-select -> next-step contracts
  - `pnpm exec playwright test e2e/auth.spec.ts e2e/auth-comprehensive.spec.ts --reporter=line --workers=1` -> `28 passed (1.2m)` after simplifying `clickForgotPasswordLink()` to a real click-based route contract
  - `pnpm exec playwright test e2e/auth.spec.ts e2e/auth-comprehensive.spec.ts --reporter=line --workers=1` -> `28 passed (1.9m)` after moving `goBackToSignIn()` onto the shared sign-in-landing contract with explicit `/signin` recovery
  - `pnpm exec playwright test e2e/onboarding.spec.ts --reporter=line --workers=1` -> `7 passed (59.4s)` after moving onboarding dashboard exits onto shared click -> dashboard contracts
  - `pnpm exec playwright test e2e/onboarding.spec.ts --reporter=line --workers=1` -> `7 passed (1.0m)` after moving onboarding back navigation onto a shared back-click -> role-selection contract
  - `pnpm exec playwright test e2e/auth.spec.ts e2e/auth-comprehensive.spec.ts --reporter=line --workers=1` -> `28 passed (1.5m)` after moving the password-reset request helper onto the real submit button
  - `pnpm exec playwright test e2e/auth.spec.ts e2e/auth-comprehensive.spec.ts --reporter=line --workers=1` -> `28 passed (1.2m)` after making `attemptSignUp()` wait for a concrete submit-start signal before entering the verification wait
  - `pnpm exec playwright test e2e/auth.spec.ts e2e/auth-comprehensive.spec.ts --reporter=line --workers=1` -> `28 passed (1.5m)` after making `signIn()` wait for a concrete submit-start signal before returning to the caller
  - `pnpm exec playwright test e2e/auth.spec.ts e2e/auth-comprehensive.spec.ts --reporter=line --workers=1` -> `28 passed (1.5m)` after moving `verifyEmail()` and `completePasswordReset()` onto the same concrete submit-start contract
  - `pnpm exec playwright test e2e/auth.spec.ts e2e/auth-comprehensive.spec.ts --reporter=line --workers=1` -> `28 passed (1.6m)` after moving the landing/sign-in recovery path into `expectAuthenticatedApp({ recoverFromLanding: true })` and removing the duplicated spec-level `/app` fallback
  - `pnpm exec playwright test e2e/auth.spec.ts e2e/auth-comprehensive.spec.ts --reporter=line --workers=1` -> `28 passed (1.3m)` after moving the remaining API-assisted sign-in recovery path into `AuthPage.signInAndReachAuthenticatedApp()`
  - `pnpm exec playwright test e2e/onboarding.spec.ts --reporter=line --workers=1` -> `7 passed (58.5s)` after moving `OnboardingPage.createProject()` onto a concrete submit-start contract
  - `pnpm exec playwright test e2e/auth.spec.ts e2e/onboarding.spec.ts e2e/signout.spec.ts --reporter=line --workers=1` -> `27 passed (2.2m)` after making auth bootstrap require the actual dashboard shell instead of treating dashboard URL alone as success
  - `pnpm exec playwright test e2e/dashboard.spec.ts e2e/rbac.spec.ts --reporter=line --workers=1` -> `14 passed (1.2m)` after consolidating fixture dashboard bootstrap onto `ensureAuthenticatedDashboardReady()`
  - `pnpm exec playwright test e2e/dashboard.spec.ts e2e/onboarding.spec.ts --reporter=line --workers=1` -> `18 passed (1.5m)` after consolidating `authenticatedTest` and `onboardingTest` onto a shared fixture bootstrap path
  - `pnpm exec playwright test e2e/dashboard.spec.ts e2e/onboarding.spec.ts e2e/rbac.spec.ts --reporter=line --workers=1` -> `21 passed (1.7m)` after moving fixture token preload and repair-aware login into `fixture-auth.ts`
- the previous three exposed regressions now have targeted green evidence plus a restored full-suite green confirmation:
  - `pnpm exec playwright test e2e/auth.spec.ts -g "sign up flow sends verification email|can complete email verification" --reporter=line --workers=1` -> `2 passed (26.7s)` and `2 passed (34.1s)`
  - `pnpm exec playwright test e2e/settings/billing.spec.ts e2e/signout.spec.ts --reporter=line --workers=1` -> `3 passed (40.1s)` and `3 passed (31.8s)`
  - `pnpm exec playwright test --reporter=line` -> `160 passed (5.4m)`
  - `pnpm run validate` -> `PASS` with the existing warn-only `164 file(s) missing tests`
- latest landing/search stabilization evidence on `2026-03-09`:
  - `pnpm exec playwright test e2e/auth.spec.ts e2e/landing.spec.ts --reporter=line --workers=1` -> `28 passed (1.7m)`
  - `pnpm exec playwright test --reporter=line` -> `161 passed (5.7m)`
  - `pnpm screenshots` -> `200 screenshots captured`
- latest calendar coverage stabilization evidence on `2026-03-09`:
  - screenshot seed now adds workspace membership for the screenshot user and seeded collaborators, so workspace-scoped calendar queries can see the seeded events.
  - Playwright and screenshot browser contexts now run in `UTC`, so seeded calendar dates and browser-visible date ranges stay aligned locally and in CI.
  - `pnpm screenshots` now captures calendar event-detail modal screenshots on desktop dark/light, tablet light, and mobile light.
- `SettingsPage.inviteUser()` now wraps modal open, form fill, optional role selection, and invite-row visibility in the same retry boundary, after the settings/admin rerun showed the invite email input could detach immediately after the modal-open helper succeeded.
- `SettingsPage.fillInviteEmail()` now uses a direct fill-and-confirm contract with one explicit modal reset instead of a small retry loop, after the isolated invites rerun confirmed the inline invite form only needed a bounded reopen recovery when the email input detached during fill.
- `SettingsPage.toggleTimeApproval()` now uses explicit draft-state and save-state helpers with one bounded re-stage recovery, after the admin settings reruns showed the live organization-settings subscription could remount the save button mid-click and invalidate a blanket retry wrapper.
- `board-drag-drop.spec.ts` now treats `dragTo()` as the action boundary and asserts the two allowed post-drag end states directly, after the repeated reruns showed the spec did not need to retry the entire drag gesture just to prove the card still exists in source or target.
- `IssueDetailPage.editTitle()` / `editDescription()` now use a bounded edit-mode recovery on the standalone route instead of retrying the whole edit cycle, after the direct-route reruns showed the first `Edit Issue` click or the first save-control mount could be dropped without invalidating the entire edit contract.
- `DashboardPage.openShortcutsHelp()` / `closeShortcutsHelp()` now use direct dialog open/close contracts with one bounded recovery instead of retrying the whole keyboard-shortcuts modal interaction, after the focused dashboard reruns confirmed the help dialog only needed a single reopen or outside-click fallback.
- `DashboardPage.openCommandPalette()` / `closeCommandPalette()` now use direct dialog open/close contracts with one bounded reopen recovery instead of retrying the whole command-palette interaction, after the repeated dashboard reruns confirmed the header command button only needed a single second click when the dialog missed the first mount.
- `DashboardPage.filterIssues()` now uses a direct tab-click plus active-state assertion instead of retrying the whole filter interaction, after the repeated dashboard reruns confirmed the filter pills settle deterministically once the dashboard shell is ready.
- `DashboardPage.closeGlobalSearch()` now relies directly on `closeGlobalSearchIfOpen()` instead of wrapping the same close contract in another retry shell, after the focused dashboard rerun confirmed the close path stays deterministic for both button-open and shortcut-open flows.
- `DashboardPage.openGlobalSearch()` / `openGlobalSearchWithShortcut()` now use direct modal-ready contracts with one bounded reopen recovery instead of retrying the whole open interaction, after the repeated dashboard reruns confirmed the search modal only needed a single second trigger when the first mount was missed.
- `ProjectsPage.openIssueDetail()` and `closeIssueDetail()` now reuse a named `closeIssueDetailIfOpen()` reset, after hardening moved the detail-dialog setup and teardown into the page object and the targeted rerun confirmed the modal flow stays deterministic across integration and issues specs.
- `ProjectsPage.openIssueDetail()` now uses a direct close-if-open -> force-click -> dialog-ready contract instead of wrapping that same modal-open sequence in a retry shell, after the issue-detail-open rerun confirmed the modal still settles deterministically.
- `ProjectsPage.closeIssueDetail()` now relies directly on `closeIssueDetailIfOpen()` instead of wrapping the same close contract in an extra retry loop, after the title-edit rerun confirmed the reopen path still passes.
- `ProjectsPage.createProject()` now accepts the wizard's `Creating...` state as proof that submit started, after the issue-detail setup rerun exposed that waiting only for immediate dialog dismissal could misclassify a valid create click as a failure.
- `ProjectsPage.submitCreateProject()` now uses a bounded submit-start contract (`Creating...` or modal dismissal) with a semantic click first and a DOM-click fallback for the sticky footer button, after the latest project-create reruns showed Playwright actionability could reject a still-valid footer button as outside the viewport.
- Playwright `globalSetup` now seeds built-in project templates before worker auth setup, so project-creation specs no longer depend on earlier files opportunistically calling `testUserService.seedTemplates()` before a later isolated rerun reaches `ProjectsPage.createProject()`.
- `ProjectsPage.openCreateProjectForm()` now uses a direct open contract with one explicit second-click recovery if the modal does not mount on the first attempt, instead of wrapping the whole open sequence in a broad retry loop.
- `ProjectsPage.openCreateProjectForm()` now requires a live projects shell before clicking and treats wizard-ready state (`template` or `configure`) as the modal-open completion signal, instead of assuming a visible dialog container or a previously mounted sidebar is enough to make the create flow safe.
- `ProjectsPage.goto()` now owns app-gateway recovery plus projects-shell visibility, after the serial search reruns showed a direct `/projects` navigation could settle on a loading shell or the landing page while the next create-project step still assumed the org shell was interactive.
- `ProjectsPage.createProject()` now uses a direct template-selection contract with one explicit modal-reopen recovery if the configure step does not appear after the first template click, instead of wrapping the whole template step in a broad retry loop.
- `ProjectsPage.ensureCreateProjectConfigureStep()` now owns the wizard-ready contract for `createProject()`, reopening the modal once if it mounted without either the template choices or the configure step, after the focused `sprints.spec.ts` rerun showed the modal container could appear before the wizard reached a usable state.
- `ProjectsPage.createIssue()` now submits once and waits on the shared issue-create completion contract (modal dismissed, created card visible, success toast visible) instead of wrapping `requestSubmit()` in a broad retry loop.
- `/app` organization bootstrap now waits for `api.users.getCurrent` to return a real user before calling `initializeDefaultOrganization`, and the backend mutation now fails fast with a precise error if the authenticated user profile document is missing instead of trying to patch a nonexistent user id.
- `ProjectsPage.openCreateProjectForm()` and `cancelCreateProject()` now reuse `closeCreateProjectFormIfOpen()`, after the create-project modal hardening showed the dialog needed an explicit reset path for repeated cancel/reopen flows instead of assuming the previous close fully settled.
- `auth-comprehensive.spec.ts` now relies on `AuthPage.expandEmailForm()` and `waitForFormExpanded()` for sign-in/sign-up coverage, after removing the spec-local expansion retries and flaky annotation proved the page object already exposes the deterministic state transition those tests needed.
- `AuthPage` auth-form transitions now use named landing and expanded states (`signin-landing`, `signin-expanded`, `signup-landing`, `signup-expanded`) so route switches wait for the target form instance instead of trusting a transient `data-expanded` match from the previous auth route.
- `authenticatedTest.ensureAuthenticated()` now treats dashboard bootstrap as a direct contract (`dashboard URL -> no 500 boundary -> dashboard shell ready`) with one explicit recovery path that escalates from `/app` to `/:orgSlug/dashboard` when auth injection lands on the marketing shell, instead of relying on a generic two-attempt loop around the whole bootstrap.
- `DashboardPage.goto()` now follows the same explicit contract (`dashboard route -> dashboard shell ready -> my-issues visible`) with one named recovery path (`/app`, then direct dashboard route, then a final reload) instead of branching through inline retry/reload logic.
- `trySignInUser()` now owns a named post-submit redirect contract that either settles on dashboard/onboarding directly or escalates once through the `/app` gateway before failing, instead of carrying a long inline timeout branch inside the UI-login path.
- `activity-feed.spec.ts` now goes through `ProjectsPage` helpers for empty-vs-entry state, action text, issue-key visibility, and relative timestamps, after moving those assertions out of the spec body showed the feed state could be treated as a single page-object contract.
- `SettingsPage.openInviteUserModal()` now waits for the invite form controls, `inviteUser()` accepts the invite row as the success signal, and `revokeInvite()` waits for the row status to become `revoked`, after the invite reruns showed the inline card could close before the button-based retry logic realized the action had already succeeded.
- `SettingsPage.openInviteUserModal()` now uses a direct close-if-open -> click -> form-visible contract instead of wrapping that same modal-open sequence in a retry shell, after the invite flow rerun confirmed the admin invite modal opens deterministically.
- `SettingsPage.inviteUser()` now uses `ensureInviteFormReady()` to own the inline invite-card remount case before filling the form, so the send flow no longer depends on a blanket retry loop while still recovering if the card disappears between modal-open and the first keystroke.
- `SettingsPage.openInviteUserModal()` and `ensureInviteFormReady()` now wait on explicit invite-surface states (`table` / `empty`, then `closed` / `open` / `ready`) so the admin invite flow no longer mistakes a half-mounted inline card for a usable form.
- isolated reruns now confirm the auth and invite contracts end-to-end:
  - `pnpm exec playwright test e2e/auth-comprehensive.spec.ts -g "can switch between sign in and sign up" --reporter=line --workers=1` -> `1 passed (18.5s)`
  - `pnpm exec playwright test e2e/invites.spec.ts --reporter=line --workers=1` -> `1 passed (23.0s)`
  - `pnpm exec playwright test e2e/auth-comprehensive.spec.ts e2e/invites.spec.ts --reporter=line --workers=1` -> `10 passed (47.9s)`
  - `pnpm run validate` -> `PASS` with the existing warn-only `164 file(s) missing tests`
- latest project/create-flow reruns on `2026-03-07` are green after the projects-shell recovery follow-up:
  - `pnpm exec playwright test e2e/search.spec.ts -g "search displays result count in tabs" --reporter=line --workers=1` -> `1 passed (30.6s)`
  - `pnpm exec playwright test e2e/invites.spec.ts --reporter=line --workers=1` -> `1 passed (19.4s)`
  - `pnpm exec playwright test e2e/issues.spec.ts e2e/sprints.spec.ts e2e/roadmap.spec.ts e2e/search.spec.ts --reporter=line --workers=1` -> `19 passed (4.7m)`
  - `pnpm run validate` -> `PASS` with the existing warn-only `164 file(s) missing tests`
- latest billing helper rerun on `2026-03-07` is green after the billing-state resync simplification:
  - `pnpm exec playwright test e2e/settings/billing.spec.ts --reporter=line --workers=1` -> `2 passed (38.0s)`
  - `pnpm run validate` -> `PASS` with the existing warn-only `164 file(s) missing tests`
- `DocumentsPage.createNewDocument()` now owns the post-create URL and editor-ready checks, after the docs rerun confirmed the spec no longer needs to reassert editor hydration separately after every new-document action.
- `DocumentsPage.createNewDocument()` now clicks once and waits on route change plus editor readiness directly instead of wrapping the route transition in a retry loop, after the docs rerun confirmed the create flow no longer needs the extra retry shell.
- `DocumentsPage.editDocumentTitle()` now uses a direct click -> input visible -> save -> title updated contract instead of wrapping the same sequence in a retry loop, after the docs rerun confirmed inline title editing still settles deterministically.
- `DocumentsPage.expectEditorVisible()` now waits directly on document readiness, the optional initializer button, and the editor visibility/error-boundary checks instead of wrapping that same readiness contract in a retry shell.
- `roadmap.spec.ts` now relies on `ProjectsPage` for roadmap route readiness, current-month visibility, and epic-filter state, after moving the remaining timeline/filter checks out of the spec body confirmed the route-specific controls can be treated as a single page-object contract.
- `switchToTab("sprints")` and `switchToTab("backlog")` now finish on `ProjectsPage` route-specific ready checks, after the dedicated rerun confirmed `sprints.spec.ts` no longer needs raw heading/button assertions to prove the sprint manager and backlog board finished loading.
- `analytics.spec.ts` now relies on `ProjectsPage` for analytics route readiness, metric/chart visibility, total-issue parsing, and empty-sprint messaging, after the targeted rerun confirmed the dashboard-specific loaded sections can be asserted as page-object contracts instead of repeated spec-local checks.
- `rbac.spec.ts` now relies on `ProjectsPage` for project-tab visibility plus settings/sprints/analytics readiness, after the targeted rerun confirmed the role-permission checks can reuse the same project navigation contracts as the regular project-flow specs.
- `permission-cascade.spec.ts` now relies on `ProjectsPage` for owner-only project-settings access, after the targeted rerun confirmed the permission check can reuse the same settings-tab visibility and settings-route readiness contract as the RBAC coverage.
- `permission-cascade.spec.ts` now relies on `WorkspacesPage` for workspace detail readiness and workspace-settings navigation, after the targeted rerun confirmed the workspace-settings permission check can reuse a page-object contract instead of probing raw workspace links and URL patterns.
- `permission-cascade.spec.ts` now relies on `SettingsPage` for org-owner admin-settings access, after the targeted rerun confirmed the settings permission check can reuse the shared admin-tab navigation contract instead of probing raw admin-tab visibility.
- `permission-cascade.spec.ts` now relies on `SettingsPage.openAdminUsersList()` for admin user-management visibility, after the targeted rerun confirmed the test should assert the actual platform-users table instead of probing a stale members tab that the settings UI no longer exposes.
- `permission-cascade.spec.ts` now relies on `WorkspacesPage.expectWorkspaceVisible()` and `ProjectsPage.expectBoardVisible()` for the org-owner create-workspace/create-project smoke coverage, after the targeted rerun confirmed those checks do not need raw URL or main-content assertions once the page objects own the completion boundary.
- `permission-cascade.spec.ts` now relies on `WorkspacesPage.expectWorkspacesView()` / `workspaceCards` and `ProjectsPage.expectProjectsView()` / `projectItems` for the visibility-count smoke coverage, after the targeted rerun confirmed those list checks do not need raw `main` locators or direct href counting.
- Full `permission-cascade.spec.ts` now reruns cleanly end-to-end after the settings, workspace, and visibility helper migrations, so the file has current whole-spec evidence instead of only isolated targeted cases.
- `workspaces-org.spec.ts` now relies on `SettingsPage` for admin-settings readiness, org-name visibility, time-approval state, and non-admin admin-tab blocking, plus `WorkspacesPage.expectWorkspaceDetailVisible()` for workspace creation coverage, after the full-file rerun confirmed the organization/workspace permission smoke tests do not need raw page-level assertions.
- `teams.spec.ts` now relies on `WorkspacesPage.openWorkspaceTeams()`, `expectTeamsLoaded()`, and `getTeamsPageState()`, after the full-file rerun confirmed the workspace/team navigation tests do not need to branch on raw workspace headings, card clicks, or `Teams` links from the spec body.
- `dashboard.spec.ts` now relies on `DashboardPage.expectMainSectionsVisible()`, `expectIssueFiltersVisible()`, and `expectNotificationsPanelVisible()`, after the focused rerun confirmed those visibility checks can be treated as a single dashboard contract instead of repeated spec-local assertions.
- `OnboardingPage.goto()` now waits for the onboarding route, `skipOnboarding()` and `goToDashboard()` now own dashboard-route plus dashboard-ready completion, and `createProject()` now waits for the member-complete screen, after the focused rerun confirmed `onboarding.spec.ts` no longer needs spec-level `waitForURL()` or dashboard-heading waits to prove those transitions finished.
- the previous `can skip onboarding` dashboard-loading watchpoint is currently cleared, after a focused rerun confirmed the flow reaches the dashboard cleanly on the guarded `/app` bootstrap path.
- the remaining onboarding storage-state watchpoints are currently cleared, after focused reruns confirmed both the team-lead back-navigation flow and the team-member completion flow still pass with the simplified dashboard exits and direct member-project-create completion contract.
- `issue-detail-page.spec.ts` now relies on `IssueDetailPage.expectIssueNotFound()`, `expectIssueLoaded()`, `expectProjectBreadcrumbVisible()`, and `returnToProjectBoard()`, after the full-file rerun confirmed the standalone route can own both its error-state and happy-path readiness checks instead of leaving those assertions scattered in the spec body.
- `error-scenarios.spec.ts` now relies on `ProjectsPage.gotoProjectBoard()` plus `expectProjectNotFound()`, `DocumentsPage.gotoDocument()` plus `expectDocumentNotFound()`, and `IssueDetailPage.expectIssueNotFound()`, after the focused rerun confirmed the authenticated invalid-resource coverage can reuse page-object route contracts instead of building URL and error assertions inline.
- `LandingPage.expectLandingOrSignInPage()` now owns the unauthenticated protected-route redirect check, after the focused rerun confirmed `error-scenarios.spec.ts` does not need a spec-local heading poll to prove the redirect settled on landing or sign-in.
- `invite.spec.ts` now relies on `InvitePage.expectInvalidInvitation()`, `goHome()`, `expectLoadingOrInvalid()`, and `expectInvalidInvitationBranding()`, after the focused rerun confirmed the public invite route can own invalid-token, loading, and go-home state checks instead of leaving them as raw selectors in the spec body.
- `oauth-mocked.spec.ts` now relies on `AuthPage.gotoSignInLanding()`, `signInWithGoogle()`, and `waitForOAuthErrorSettle()`, after the focused rerun confirmed the three mocked OAuth error cases can share the same sign-in entry and error-settle contract instead of repeating inline Google-button and alert waits.
- `AuthPage.waitForOAuthErrorSettle()` now polls a named settle state instead of retrying the whole callback outcome check, after the mocked OAuth rerun confirmed the error cases only need a direct `signin` / `alert` / `toast` completion contract.
- `AuthPage.expandEmailForm()` now uses a direct expansion contract with one bounded second-click recovery, and `clickForgotPassword()` now uses a direct forgot-password navigation contract with a navigation-aware fallback instead of retrying the whole sign-in form flow, after the focused auth rerun confirmed those two transitions can settle deterministically without a blanket retry shell.
- `AuthPage.signUp()` now uses a bounded sign-up attempt contract that re-enters the flow only once when the form collapses before verification, and `expectSignUpVerificationStep()` now polls a named verification outcome state instead of using a strict-mode `or()` locator, after the targeted verification rerun confirmed the page object can own the whole submit-to-verify transition cleanly.
- `OnboardingPage.waitForWizard()`, `waitForRoleCardsReady()`, `selectTeamLead()`, and `selectTeamMember()` now use direct readiness and next-step contracts with one bounded onboarding-route recovery instead of retrying the whole onboarding transition block, after the full onboarding rerun confirmed the role-selection flows still settle cleanly.
- `AuthPage.requestPasswordReset()` now uses a direct entry-step plus reset-code-step contract with one bounded retry, and `/forgot-password` now restores the reset email from session storage when the route remounts, after the password-reset integration rerun confirmed the flow no longer falls back to the email-entry form between requesting and applying the reset code.
- `integration-workflow.spec.ts` now relies on `ProjectsPage.switchToTab("calendar" | "timesheet" | "board")`, `expectProjectTabCurrent()`, and `expectTimesheetLoaded()`, after the focused rerun confirmed the project tab workflow no longer needs raw tab-strip lookups or a spec-local `Time Entries` visibility check.
- `permission-cascade.spec.ts` now relies on `ProjectsPage.gotoProjectBoard()` plus `expectProjectNotFound()` for the non-existent-project permission check, after the full-file rerun confirmed the last raw project-not-found heading in that file can reuse the shared project error contract.
- `dashboard.spec.ts` now relies on `SettingsPage.expectDarkThemeEnabled()` and `expectDarkThemeDisabled()` for theme-state assertions, after the focused rerun confirmed the last direct `page.locator("html")` check could move behind the settings page object and the current `e2e/*.spec.ts` raw-selector scan returned clean.
- `createTestNamespace(testInfo)` now owns run-scoped names and project keys across the create-heavy E2E specs, after the grouped reruns plus the final `workspaces-org.spec.ts` pass confirmed the shorter namespace id avoids the earlier long-title click-intercept issue and the current `e2e/*.spec.ts` timestamp scan is clean.
- `GlobalSearch` now renders an explicit empty state instead of delegating to `CommandEmpty`, and the latest targeted reruns confirm the remaining runtime failure was the auth/bootstrap path rather than missing empty-state markup.
- `DashboardCustomizeModal`, `PreferencesTab`, and `Settings` now skip auth-sensitive queries until `useConvexAuth()` reports an authenticated session, after the targeted search and dashboard reruns showed those hidden/settings-shell queries could still trigger `userSettings:get` or settings-route `500` boundaries during initial mount.
- `BreadcrumbLink` now respects `asChild`, after the workspace-management rerun surfaced nested `<a>` hydration errors from `PageHeader` breadcrumbs on workspace detail routes.

## Latest Targeted Hardening Evidence

- `pnpm run validate`
  - `RESULT: PASS (0 errors)`
- `pnpm vitest run convex/organizations.test.ts`
  - `12 passed (747ms)`
- `pnpm exec playwright test e2e/onboarding.spec.ts --reporter=line --workers=1`
  - `7 passed (1.5m)`
- `pnpm exec playwright test e2e/rbac.spec.ts --reporter=line --workers=1`
  - `3 passed (24.9s)`
- `pnpm exec playwright test e2e/issues.spec.ts e2e/issue-detail-page.spec.ts --reporter=line --workers=1`
  - superseded by the dedicated issue-edit runs below
- `pnpm exec playwright test e2e/issues.spec.ts --reporter=line --workers=1`
  - superseded by the current issues hardening rerun below
- `pnpm exec playwright test e2e/issues.spec.ts --reporter=line --workers=1`
  - `5 passed (3.0m)`
- `pnpm exec playwright test e2e/issue-detail-page.spec.ts --reporter=line --workers=1`
  - `5 passed (2.6m)`
- `pnpm exec playwright test e2e/error-scenarios.spec.ts --reporter=line --workers=1`
  - `4 passed (29.5s)`
- `pnpm exec playwright test e2e/time-tracking.spec.ts --reporter=line --workers=1`
  - `1 passed (57.4s)` after guarding `/app` bootstrap on authenticated-user readiness
- `pnpm exec playwright test e2e/onboarding.spec.ts -g "shows member-specific content and can complete onboarding" --reporter=line --workers=1`
  - `1 passed (38.8s)`
- `pnpm exec playwright test e2e/onboarding.spec.ts -g "can skip onboarding" --reporter=line --workers=1`
  - `1 passed (18.9s)`
- `pnpm exec playwright test e2e/onboarding.spec.ts -g "shows member-specific content and can complete onboarding" --reporter=line --workers=1`
  - `1 passed (41.4s)` after replacing the member-project-create retry wrapper with an explicit submit-start plus completion-state contract
- `pnpm exec playwright test e2e/onboarding.spec.ts -g "shows team lead features and can go back to role selection" --reporter=line --workers=1`
  - `1 passed (40.8s)`
- `pnpm exec playwright test e2e/error-scenarios.spec.ts --reporter=line --workers=1`
  - `4 passed (28.8s)`
- `pnpm exec playwright test e2e/invite.spec.ts --reporter=line --workers=1`
  - `4 passed (18.6s)`
- `pnpm exec playwright test e2e/oauth-mocked.spec.ts --reporter=line --workers=1`
  - `11 passed (15.2s)`
- `pnpm exec playwright test e2e/integration-workflow.spec.ts --reporter=line --workers=1`
  - `4 passed (2.6m)`
- `pnpm exec playwright test e2e/issues.spec.ts --reporter=line --workers=1`
  - `6 passed (3.1m)` after replacing the issue-create submit retry with the shared completion contract
- `pnpm exec playwright test e2e/issues.spec.ts -g "can reopen project creation dialog after canceling" --reporter=line --workers=1`
  - `1 passed (33.2s)` after removing the extra `cancelCreateProject()` retry wrapper
- `pnpm exec playwright test e2e/issues.spec.ts -g "can reopen project creation dialog after canceling" --reporter=line --workers=1`
  - `1 passed (25.5s)` after replacing the create-project modal open retry with a direct open contract plus one explicit recovery click
- `pnpm exec playwright test e2e/issues.spec.ts -g "can create an issue from board view" --reporter=line --workers=1`
  - `1 passed (44.6s)` after replacing the project-template selection retry with a direct configure-step contract plus one explicit modal-reopen recovery
- `pnpm exec playwright test e2e/issues.spec.ts -g "can create an issue from board view" --reporter=line --workers=1`
  - `1 passed (23.1s)` after replacing the create-project submit retry loop with a bounded submit-start contract plus sticky-footer DOM-click fallback
- `pnpm exec playwright test e2e/issues.spec.ts -g "can edit an issue title from the detail dialog" --reporter=line --workers=1`
  - `1 passed (46.7s)` after removing the extra `closeIssueDetail()` retry wrapper
- `pnpm exec playwright test e2e/issues.spec.ts -g "can open issue detail dialog" --reporter=line --workers=1`
  - `1 passed (54.6s)` after replacing the issue-detail open retry with a direct dialog-ready contract
- `pnpm exec playwright test e2e/documents.spec.ts --reporter=line --workers=1`
  - `4 passed (26.7s)` after replacing the new-document route retry with a direct route-plus-editor contract
- `pnpm exec playwright test e2e/documents.spec.ts --reporter=line --workers=1`
  - `4 passed (29.4s)` after replacing the document-title edit retry with a direct edit contract
- `pnpm exec playwright test e2e/documents.spec.ts --reporter=line --workers=1`
  - `4 passed (29.8s)` after replacing the editor-visible retry with a direct editor-ready contract
- `pnpm exec playwright test e2e/invites.spec.ts --reporter=line --workers=1`
  - `1 passed (33.1s)` after replacing the invite-modal open retry with a direct modal-open contract
- `pnpm exec playwright test e2e/invites.spec.ts --reporter=line --workers=1`
  - `1 passed (27.7s)` after replacing the invite-send retry with a named invite-form readiness contract
- `pnpm exec playwright test e2e/permission-cascade.spec.ts --reporter=line --workers=1`
  - `9 passed (2.0m)`
- `pnpm exec playwright test e2e/permission-cascade.spec.ts -g "org owner can create projects in any workspace" --reporter=line --workers=1`
  - `1 passed (30.0s)` after confirming the new create-project submit contract also holds in the org-owner permission path
- `pnpm exec playwright test e2e/issues.spec.ts e2e/integration-workflow.spec.ts --reporter=line --workers=1`
  - `9 passed (4.9m)`
- `pnpm exec playwright test e2e/search.spec.ts --reporter=line --workers=1`
  - `7 passed (2.4m)`
- `pnpm exec playwright test e2e/search.spec.ts --reporter=line --workers=1`
  - `7 passed (56.5s)` after replacing the global-search query-entry and search-settled retry wrappers with direct input/value and result-state contracts
- `pnpm exec playwright test e2e/settings/billing.spec.ts --reporter=line --workers=1`
  - `2 passed (22.5s)`
- `pnpm exec playwright test e2e/settings/billing.spec.ts --reporter=line --workers=1`
  - `2 passed (26.2s)` after replacing the timer-modal retry wrapper with a direct open contract plus a single billing-state resync path
- `pnpm exec playwright test e2e/settings/billing.spec.ts --reporter=line --workers=1`
  - `2 passed (32.7s)` confirming the timer-modal billing flows stay green on a repeated isolated rerun
- `pnpm exec playwright test e2e/signout.spec.ts --reporter=line --workers=1`
  - `1 passed (24.2s)` after replacing the sign-out retry wrapper with a direct menu-open and signed-out-destination contract
- `pnpm exec playwright test e2e/auth.spec.ts e2e/auth-comprehensive.spec.ts --reporter=line --workers=1`
  - `1 failed, 27 passed (2.6m)`; the remaining failure was the pre-existing password-reset integration propagation timeout, not the changed form-expansion or forgot-password navigation flows
- `pnpm exec playwright test e2e/auth-comprehensive.spec.ts e2e/auth.spec.ts -g "validates required fields|can navigate to forgot password from sign in|Sign In Form - Elements|Sign Up Form - Elements|Forgot Password Form - Elements|Google OAuth - Elements|Login Section - Back Navigation" --reporter=line --workers=1`
  - `12 passed (31.0s)` after replacing the auth form-expansion and forgot-password retry wrappers with direct state-transition contracts plus bounded recovery
- `pnpm exec playwright test e2e/oauth-mocked.spec.ts --reporter=line --workers=1`
  - `11 passed (17.7s)` after replacing the OAuth error settle retry wrapper with a named settle-state poll
- `pnpm exec playwright test e2e/auth.spec.ts -g "sign up flow sends verification email|can complete email verification" --reporter=line --workers=1`
  - `2 passed (23.3s)` after replacing the sign-up retry wrapper with a bounded sign-up attempt contract plus a named verification outcome state
- `pnpm exec playwright test e2e/onboarding.spec.ts --reporter=line --workers=1`
  - `7 passed (56.4s)` after replacing the onboarding wizard and role-selection retry wrappers with direct readiness and next-step contracts plus bounded route recovery
- `pnpm exec playwright test e2e/auth.spec.ts -g "password reset flow sends code and allows reset" --reporter=line --workers=1`
  - `1 passed (20.6s)` after replacing the password-reset request retry wrapper with a direct request-code contract and persisting the reset email across `/forgot-password?step=reset` remounts
- `pnpm exec playwright test e2e/workspaces-org.spec.ts -g "Admin can toggle time approval setting" --reporter=line --workers=1`
  - `1 passed (18.7s)` after replacing the time-approval save retry wrapper with explicit draft-state and save-state helpers
- `pnpm exec playwright test e2e/workspaces-org.spec.ts -g "Admin can toggle time approval setting" --reporter=line --workers=1`
  - `1 passed (18.1s)` confirming the admin time-approval flow stays green on a repeated isolated rerun
- `pnpm exec playwright test e2e/workspaces-org.spec.ts --reporter=line --workers=1`
  - `5 passed (51.0s)` after replacing synthetic organization-settings save clicks with a real `Save changes` button contract and keeping the explicit time-approval first-save/second-save path green across the full org-management slice
- `pnpm exec playwright test e2e/issues.spec.ts e2e/workspaces-org.spec.ts --reporter=line --workers=1`
  - `11 passed (2.8m)` after removing DOM-click fallbacks from shared project/workspace creation entry points and keeping those flows on bounded real-click interaction contracts
- `pnpm exec playwright test e2e/calendar.spec.ts --reporter=line --workers=1`
  - `4 passed (54.6s)` after replacing the calendar create-event save DOM click fallback with a bounded second real click contract
- `pnpm exec playwright test e2e/auth.spec.ts e2e/auth-comprehensive.spec.ts e2e/onboarding.spec.ts e2e/signout.spec.ts --reporter=line --workers=1`
  - `36 passed (3.9m)` after replacing the shared auth form-ready helper’s raw document-readiness fallback with explicit auth-surface readiness
- `pnpm exec playwright test e2e/documents.spec.ts --reporter=line --workers=1`
  - `4 passed (44.9s)` after replacing the documents editor raw document-readiness wait with an explicit editor/initializer/error readiness contract
- `pnpm exec playwright test e2e/board-drag-drop.spec.ts -g "can drag issue between columns (status change)" --reporter=line --workers=1`
  - `1 passed (28.5s)` after replacing the drag/drop retry wrapper with a direct post-drag end-state assertion
- `pnpm exec playwright test e2e/board-drag-drop.spec.ts -g "can drag issue between columns (status change)" --reporter=line --workers=1`
  - `1 passed (27.7s)` confirming the drag/drop flow stays green on a repeated isolated rerun
- `pnpm exec playwright test e2e/issue-detail-page.spec.ts -g "can edit an issue from the direct issue detail page" --reporter=line --workers=1`
  - `1 passed (31.4s)` after replacing the standalone title-edit retry shell with bounded edit-mode recovery
- `pnpm exec playwright test e2e/issue-detail-page.spec.ts -g "can edit issue description and priority from the direct issue detail page" --reporter=line --workers=1`
  - `1 passed (38.7s)` after replacing the standalone description-edit retry shell with bounded edit-mode and save-control recovery
- `pnpm exec playwright test e2e/issue-detail-page.spec.ts --reporter=line --workers=1`
  - `5 passed (1.7m)` confirming the full standalone issue-detail file stays green after the helper change
- `pnpm exec playwright test e2e/dashboard.spec.ts -g "Keyboard Shortcuts Help.*can open and close via button" --reporter=line --workers=1`
  - `1 passed (26.9s)` after replacing the shortcuts-help retry wrapper with a direct open/close contract plus bounded fallback
- `pnpm exec playwright test e2e/dashboard.spec.ts -g "Keyboard Shortcuts Help.*can open via keyboard shortcut" --reporter=line --workers=1`
  - `1 passed (19.7s)` confirming the shortcuts-help dialog also stays green when opened by keyboard shortcut
- `pnpm exec playwright test e2e/dashboard.spec.ts -g "Command Palette.*can open and close via button" --reporter=line --workers=1`
  - `1 passed (32.6s)` after replacing the command-palette retry wrapper with a direct open/close contract plus bounded reopen recovery
- `pnpm exec playwright test e2e/dashboard.spec.ts -g "Command Palette.*can open and close via button" --reporter=line --workers=1`
  - `1 passed (29.2s)` confirming the command-palette flow stays green on a repeated isolated rerun
- `pnpm exec playwright test e2e/dashboard.spec.ts -g "can filter issues" --reporter=line --workers=1`
  - `1 passed (23.1s)` after replacing the issue-filter retry wrapper with a direct active-tab assertion
- `pnpm exec playwright test e2e/dashboard.spec.ts -g "can filter issues" --reporter=line --workers=1`
  - `1 passed (13.9s)` confirming the issue-filter flow stays green on a repeated isolated rerun
- `pnpm exec playwright test e2e/dashboard.spec.ts -g "Global Search" --reporter=line --workers=1`
  - `2 passed (19.7s)` after removing the extra global-search close retry wrapper
- `pnpm exec playwright test e2e/dashboard.spec.ts -g "Global Search" --reporter=line --workers=1`
  - `2 passed (29.4s)` after replacing the global-search open retry wrappers with direct modal-ready contracts plus bounded reopen recovery
- `pnpm exec playwright test e2e/dashboard.spec.ts -g "Global Search" --reporter=line --workers=1`
  - `2 passed (18.2s)` confirming the global-search open/close flows stay green on a repeated isolated rerun
- `pnpm exec playwright test e2e/dashboard.spec.ts --reporter=line --workers=1`
  - `11 passed (1.6m)`
- `pnpm exec playwright test e2e/invites.spec.ts --reporter=line --workers=1`
  - `1 passed (29.1s)`
- `pnpm exec playwright test e2e/teams.spec.ts --reporter=line --workers=1`
  - `3 passed (33.5s)`
- `pnpm exec playwright test e2e/workspaces-org.spec.ts -g "Admin can create multiple workspaces" --reporter=line --workers=1`
  - `1 passed (18.3s)`
- `pnpm exec playwright test e2e/workspaces-org.spec.ts --reporter=line --workers=1`
  - `5 passed (44.7s)`
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
- `pnpm exec playwright test e2e/documents.spec.ts --reporter=line --workers=1`
  - `4 passed (1.1m)`
- `pnpm exec playwright test e2e/roadmap.spec.ts --reporter=line --workers=1`
  - `3 passed (1.6m)`
- `pnpm exec playwright test e2e/sprints.spec.ts --reporter=line --workers=1`
  - `3 passed (2.0m)`
- `pnpm exec playwright test e2e/sprints.spec.ts --reporter=line --workers=1`
  - `3 passed (59.2s)` after moving project-template seeding into Playwright global setup and letting `ProjectsPage.createProject()` recover once when the modal mounts before the wizard reaches a usable step
- `pnpm exec playwright test e2e/analytics.spec.ts --reporter=line --workers=1`
  - `5 passed (3.1m)`
- `pnpm exec playwright test e2e/permission-cascade.spec.ts -g "workspace settings are accessible to workspace members" --reporter=line --workers=1`
  - `1 passed (18.9s)`
- `pnpm exec playwright test e2e/permission-cascade.spec.ts -g "project settings require appropriate permissions" --reporter=line --workers=1`
  - `1 passed (33.3s)`
- `pnpm exec playwright test e2e/permission-cascade.spec.ts -g "org owner can access organization settings" --reporter=line --workers=1`
  - `1 passed (18.8s)`
- `pnpm exec playwright test e2e/permission-cascade.spec.ts -g "organization members list is accessible to admins" --reporter=line --workers=1`
  - `1 passed (18.7s)`
- `pnpm exec playwright test e2e/permission-cascade.spec.ts -g "org owner can create workspaces|org owner can create projects in any workspace" --reporter=line --workers=1`
  - `2 passed (51.9s)`
- `pnpm exec playwright test e2e/permission-cascade.spec.ts -g "user can only see workspaces they have access to|user can only see projects they have access to" --reporter=line --workers=1`
  - `2 passed (22.5s)`
- `pnpm exec playwright test e2e/permission-cascade.spec.ts --reporter=line --workers=1`
  - `9 passed (2.3m)`
- `pnpm exec playwright test e2e/teams.spec.ts --reporter=line --workers=1`
  - `3 passed (30.5s)`
- `pnpm exec playwright test e2e/board-drag-drop.spec.ts e2e/time-tracking.spec.ts e2e/search.spec.ts e2e/activity-feed.spec.ts e2e/analytics.spec.ts e2e/integration-workflow.spec.ts --reporter=line --workers=1`
  - `26 passed (9.2m)`
- `pnpm exec playwright test e2e/issues.spec.ts e2e/issue-detail-page.spec.ts --reporter=line --workers=1`
  - `11 passed (5.8m)`
- `pnpm exec playwright test e2e/activity-feed.spec.ts e2e/analytics.spec.ts --reporter=line --workers=1`
  - `9 passed (4.1m)`
- `pnpm exec playwright test e2e/roadmap.spec.ts e2e/sprints.spec.ts e2e/teams.spec.ts --reporter=line --workers=1`
  - `9 passed (3.4m)`
- `pnpm exec playwright test e2e/time-tracking.spec.ts e2e/board-drag-drop.spec.ts --reporter=line --workers=1`
  - `6 passed (3.0m)`
- `pnpm exec playwright test e2e/board-drag-drop.spec.ts e2e/search.spec.ts e2e/sprints.spec.ts e2e/time-tracking.spec.ts --reporter=line --workers=1`
  - `16 passed (4.1m)` after the global template-seeding precondition and the create-project configure-step recovery were both in place
- `pnpm exec playwright test e2e/workspaces-org.spec.ts --reporter=line --workers=1`
  - `5 passed (46.9s)`
- `pnpm vitest run src/components/GlobalSearch.test.tsx`
  - `19 passed (1.83s)`
- `pnpm exec playwright test e2e/search.spec.ts e2e/documents.spec.ts --reporter=line --workers=1`
  - `1 failed, 5 passed, 5 did not run (2.8m)`; blocker remains `search.spec.ts` non-matching-query settle timing out after the modal disappears
- `pnpm exec playwright test e2e/search.spec.ts -g "search requires minimum 2 characters|can close search with Escape key|can open search with keyboard shortcut" --reporter=line --workers=1`
  - `3 passed (19.8s)`
- `pnpm vitest run src/components/Settings/PreferencesTab.test.tsx`
  - `2 passed (816ms)`
- `pnpm exec playwright test e2e/dashboard.spec.ts -g "can switch themes via settings" --reporter=line --workers=1`
  - `1 passed (16.9s)`
- `pnpm exec playwright test e2e/dashboard.spec.ts --reporter=line --workers=1`
  - `11 passed (55.3s)`
- `pnpm exec playwright test e2e/invites.spec.ts --reporter=line --workers=1`
  - `1 passed (28.3s)`
- `pnpm exec playwright test e2e/settings/billing.spec.ts e2e/invites.spec.ts e2e/workspaces-org.spec.ts --reporter=line --workers=1`
  - `8 passed (1.1m)`
- `pnpm exec playwright test e2e/settings/billing.spec.ts e2e/signout.spec.ts --reporter=line --workers=1`
  - `3 passed (30.7s)`
- `pnpm exec playwright test --reporter=line`
  - `160 passed (8.0m)`
- `pnpm exec playwright test --reporter=line`
  - `160 passed (7.8m)`
- `pnpm vitest run src/components/ui/Breadcrumb.test.tsx`
  - `2 passed (600ms)`
- `pnpm exec playwright test e2e/workspaces-org.spec.ts --reporter=line --workers=1`
  - `5 passed (50.1s)`
- `pnpm run validate`
  - `PASS` with the existing warn-only `164 file(s) missing tests`
- `pnpm exec playwright test e2e/documents.spec.ts e2e/search.spec.ts e2e/permission-cascade.spec.ts --reporter=line --workers=1`
  - `20 passed (2.6m)` after tightening authenticated dashboard bootstrap to recover via the concrete `/:orgSlug/dashboard` route when `/app` falls back to the landing page
- `pnpm run validate`
  - `PASS` with the existing warn-only `164 file(s) missing tests`
- `pnpm exec playwright test e2e/dashboard.spec.ts e2e/settings/billing.spec.ts e2e/signout.spec.ts --reporter=line --workers=1`
  - `14 passed (1.3m)` after moving `DashboardPage.goto()` onto the same named app-shell recovery contract as the authenticated fixture
- `pnpm run validate`
  - `PASS` with the existing warn-only `164 file(s) missing tests`
- `pnpm exec playwright test e2e/signout.spec.ts --reporter=line --workers=1`
  - `1 passed (18.9s)` after centralizing post-sign-in redirect recovery inside `trySignInUser()`
- `pnpm exec playwright test e2e/auth.spec.ts -g "can sign in with existing user and lands on dashboard" --reporter=line --workers=1`
  - `1 passed (24.0s)` with the sign-in integration test still proving the helper can recover from a landing-page stall and reach the app shell
- `pnpm exec playwright test e2e/issue-detail-page.spec.ts -g "can edit issue description and priority from the direct issue detail page" --reporter=line --workers=1`
  - `1 passed (1.3m)`
- `pnpm vitest run src/components/Onboarding/RoleSelector.test.tsx`
  - `1 passed (1.30s)`
- `node node_modules/typescript/bin/tsc -b . --noEmit`
  - `pass`
- `pnpm exec playwright test e2e/onboarding.spec.ts e2e/issue-detail-page.spec.ts --reporter=line --workers=2`
  - `12 passed (3.0m)`

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
  - `2026-03-07`
- Outcome:
  - `160 passed` `(7.8m)`
- Consecutive green full runs:
  - `2`
- Failing specs:
  - `none`
- Immediate next action:
  - keep reducing helper retries in the remaining high-churn flows and use targeted mixed-worker repros only for watchpoints that are no longer blocking the full suite.
- Gate interpretation:
  - current local suite is green across consecutive full runs; release-gate evidence is strong enough to move from recovery into cleanup and simplification work.

## Related Files

- `playwright.config.ts`
- `e2e/global-setup.ts`
- `e2e/fixtures/`
- `e2e/utils/`
- `.github/workflows/ci.yml`
- `docs/testing/e2e.md`
