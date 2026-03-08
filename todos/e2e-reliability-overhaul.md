# E2E Reliability Overhaul

> **Priority:** P0 (Highest)
> **Effort:** Large
> **Status:** In Progress (latest local full-suite green twice in a row; validation passing)
> **Last Updated:** 2026-03-07

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

- [x] Fix top failing specs and drive local full-suite to consistent green runs.
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
   - `DashboardPage.signOutViaUserMenu()` now reacquires the Radix dropdown item inside a retry boundary and waits for a signed-out landing/sign-in destination, so sign-out no longer races a remounted menu item or leaves redirect completion to the spec body.
   - `onboarding.spec.ts` now goes through `OnboardingPage` for onboarding-route readiness, skip-to-dashboard completion, project-create completion, and dashboard-route readiness instead of mixing spec-level `waitForURL()` and dashboard-heading waits into the flow.
   - `issue-detail-page.spec.ts` now goes through `IssueDetailPage` for route-ready assertions, issue-not-found assertions, and breadcrumb navigation back to the project board instead of repeating direct URL, error-state, and route-return checks from the spec body.
   - `error-scenarios.spec.ts` now goes through `ProjectsPage`, `DocumentsPage`, and `IssueDetailPage` for authenticated non-existent project/document/issue checks instead of repeating route navigation and error-state assertions directly in the spec body.
   - `error-scenarios.spec.ts` now goes through `LandingPage.expectLandingOrSignInPage()` for the unauthenticated protected-route redirect check instead of polling raw headings from the spec body.
   - `invite.spec.ts` now goes through `InvitePage` for invalid-token, go-home, loading-or-invalid, and invalid-branding assertions instead of probing invite route state with raw selectors in the spec body.
   - `oauth-mocked.spec.ts` now goes through `AuthPage.gotoSignInLanding()`, `signInWithGoogle()`, and `waitForOAuthErrorSettle()` for the three mocked OAuth error flows instead of repeating the same raw Google-button and alert-settle logic in each test.
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
   - next focus: repeat the full suite on the new green baseline and keep trimming helper retries that are still acting as synchronization safety nets instead of explicit completion contracts.
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
   - latest full runs on `2026-03-07` are green twice in a row: `160 passed` in `8.0m`, then `160 passed` in `7.8m`.
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
- `DashboardPage.searchFor()` now throws app-error diagnostics from inside its retry loop, after the minimum-query rerun showed the global search could fail behind a generic missing-input timeout when `userSettings:get` returned `UNAUTHENTICATED`.
- `DashboardPage.closeTimeEntryModal()` is idempotent again, after the billing-disabled flow showed the timer dialog can already be gone by cleanup time even though the checkbox assertion completed.
- `DashboardPage.openTimeEntryModal({ expectBillable })` now reloads the app shell only when the modal proves org billing state is stale, after the grouped billing/signout rerun reproduced an out-of-band settings race that did not show up in the earlier isolated billing run.
- `DashboardPage.signOutViaUserMenu()` now reacquires the visible `Sign out` menu item inside the retry loop and waits for a signed-out destination, after the isolated signout rerun showed the previous locator could detach between menu-open and click.
- `SettingsPage.inviteUser()` now wraps modal open, form fill, optional role selection, and invite-row visibility in the same retry boundary, after the settings/admin rerun showed the invite email input could detach immediately after the modal-open helper succeeded.
- `ProjectsPage.openIssueDetail()` and `closeIssueDetail()` now reuse a named `closeIssueDetailIfOpen()` reset, after hardening moved the detail-dialog setup and teardown into the page object and the targeted rerun confirmed the modal flow stays deterministic across integration and issues specs.
- `ProjectsPage.createProject()` now accepts the wizard's `Creating...` state as proof that submit started, after the issue-detail setup rerun exposed that waiting only for immediate dialog dismissal could misclassify a valid create click as a failure.
- `/app` organization bootstrap now waits for `api.users.getCurrent` to return a real user before calling `initializeDefaultOrganization`, and the backend mutation now fails fast with a precise error if the authenticated user profile document is missing instead of trying to patch a nonexistent user id.
- `ProjectsPage.openCreateProjectForm()` and `cancelCreateProject()` now reuse `closeCreateProjectFormIfOpen()`, after the create-project modal hardening showed the dialog needed an explicit reset path for repeated cancel/reopen flows instead of assuming the previous close fully settled.
- `auth-comprehensive.spec.ts` now relies on `AuthPage.expandEmailForm()` and `waitForFormExpanded()` for sign-in/sign-up coverage, after removing the spec-local expansion retries and flaky annotation proved the page object already exposes the deterministic state transition those tests needed.
- `activity-feed.spec.ts` now goes through `ProjectsPage` helpers for empty-vs-entry state, action text, issue-key visibility, and relative timestamps, after moving those assertions out of the spec body showed the feed state could be treated as a single page-object contract.
- `SettingsPage.openInviteUserModal()` now waits for the invite form controls, `inviteUser()` accepts the invite row as the success signal, and `revokeInvite()` waits for the row status to become `revoked`, after the invite reruns showed the inline card could close before the button-based retry logic realized the action had already succeeded.
- `DocumentsPage.createNewDocument()` now owns the post-create URL and editor-ready checks, after the docs rerun confirmed the spec no longer needs to reassert editor hydration separately after every new-document action.
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
- `issue-detail-page.spec.ts` now relies on `IssueDetailPage.expectIssueNotFound()`, `expectIssueLoaded()`, `expectProjectBreadcrumbVisible()`, and `returnToProjectBoard()`, after the full-file rerun confirmed the standalone route can own both its error-state and happy-path readiness checks instead of leaving those assertions scattered in the spec body.
- `error-scenarios.spec.ts` now relies on `ProjectsPage.gotoProjectBoard()` plus `expectProjectNotFound()`, `DocumentsPage.gotoDocument()` plus `expectDocumentNotFound()`, and `IssueDetailPage.expectIssueNotFound()`, after the focused rerun confirmed the authenticated invalid-resource coverage can reuse page-object route contracts instead of building URL and error assertions inline.
- `LandingPage.expectLandingOrSignInPage()` now owns the unauthenticated protected-route redirect check, after the focused rerun confirmed `error-scenarios.spec.ts` does not need a spec-local heading poll to prove the redirect settled on landing or sign-in.
- `invite.spec.ts` now relies on `InvitePage.expectInvalidInvitation()`, `goHome()`, `expectLoadingOrInvalid()`, and `expectInvalidInvitationBranding()`, after the focused rerun confirmed the public invite route can own invalid-token, loading, and go-home state checks instead of leaving them as raw selectors in the spec body.
- `oauth-mocked.spec.ts` now relies on `AuthPage.gotoSignInLanding()`, `signInWithGoogle()`, and `waitForOAuthErrorSettle()`, after the focused rerun confirmed the three mocked OAuth error cases can share the same sign-in entry and error-settle contract instead of repeating inline Google-button and alert waits.
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
- `pnpm exec playwright test e2e/error-scenarios.spec.ts --reporter=line --workers=1`
  - `4 passed (28.8s)`
- `pnpm exec playwright test e2e/invite.spec.ts --reporter=line --workers=1`
  - `4 passed (18.6s)`
- `pnpm exec playwright test e2e/oauth-mocked.spec.ts --reporter=line --workers=1`
  - `11 passed (15.2s)`
- `pnpm exec playwright test e2e/integration-workflow.spec.ts --reporter=line --workers=1`
  - `4 passed (2.6m)`
- `pnpm exec playwright test e2e/permission-cascade.spec.ts --reporter=line --workers=1`
  - `9 passed (2.0m)`
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
