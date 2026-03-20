# Screenshot Tooling Cleanup

> **Priority:** P2
> **Status:** New
> **Last Updated:** 2026-03-20

## Problem

The screenshot capture tool (`e2e/screenshot-pages.ts`, 5039 lines) has two categories of issues:

### 1. Failed captures producing loading-spinner screenshots

The manifest (`.screenshot-hashes.json`) contains 226 entries but only 179 unique hashes. **37 entries across 10 groups** are identical loading-spinner captures -- completely unrelated features share the same hash because the modal never rendered.

**Affected features (confirmed visually):**
- Avatar upload modal (all 4 viewports)
- Command palette (tablet-light, desktop-light)
- Cover image upload (all 4 viewports)
- Create issue modal (desktop-dark)
- Dashboard customize modal (mobile-light)
- Members confirm dialog (mobile-light)
- Notifications popover/filter (desktop-light, desktop-dark, tablet-light, mobile-light)
- Time tracking manual entry modal (all 4 viewports)
- Workspace create modal (mobile-light, tablet-light, desktop-light)

**Root cause:** **198 `.catch(() => {})` calls** silently swallow errors throughout the file. `waitForDialogOpen()` catches overlay and dialog content wait failures. `waitForScreenshotReady()` catches spinner visibility checks. When anything fails, the tool proceeds to screenshot the loading state instead of the modal.

**Impact:** 16.4% of the screenshot manifest is useless -- visual regressions in those modals go undetected.

**Fix:**
- [ ] Audit and remove unnecessary `.catch(() => {})` calls (198 total) -- let failures propagate or handle them explicitly
- [x] Make `waitForDialogOpen` fail loudly when dialog content doesn't appear -- extracted to `e2e/utils/wait-helpers.ts` and reused by `screenshot-pages.ts`
- [x] Add a post-capture hash check that flags loading-state hashes
- [x] Re-capture the 37 failed screenshots with proper wait logic
- [x] Recover the time-entry modal baselines plus the command-palette tablet and dashboard-customize mobile baselines after readiness hardening
- [x] Recover the remaining desktop-light command-palette baseline after the shared omnibox readiness fixes landed
- [x] Recover the missing desktop-dark create-issue modal baseline
- [x] Recover the settings avatar-upload and cover-upload baselines across all four canonical configs after replacing brittle dropzone-copy waits
- [x] Recover the members confirm-dialog baselines across all four canonical configs after fixing alert-dialog open waits and section-scroll alignment
- [x] Recover the final desktop-dark notifications filter baseline after strengthening notifications route and filter-content readiness waits
- [x] Add `animations: 'disabled'` to `page.screenshot()` calls

### 2. Anti-patterns that should use proper Playwright/E2E conventions

| Pattern | Count | Issue |
|---------|-------|-------|
| `.catch(() => {})` silent swallows | **198** | Biggest issue -- hides all failures, root cause of spinner captures |
| `.first()` on broad selectors | 201 | Masks over-broad selectors; many are on elements that should be unique |
| `page.waitForTimeout()` | 7 | Hardcoded animation waits; use `animations: 'disabled'` or `waitForAnimation()` |
| Raw `data-` attribute selectors | ~33 | Should use TEST_IDS constants (52 TEST_IDS refs already exist, partial migration) |
| `setTimeout` in polling loop | 1 | Legitimate for server-side polling but could use `expect.poll()` |

**Existing E2E helpers that could be reused** (`e2e/utils/wait-helpers.ts`):
- `waitForAnimation()` -- CSS animation completion via `getAnimations()`
- `waitForModal()` -- Modal open + animation complete
- `waitForDashboardReady()` -- Full dashboard shell readiness
- `waitForBoardLoaded()` -- Project board readiness
- `dismissAllToasts()` -- Toast removal with retry

**Fix:**
- [ ] Replace `.catch(() => {})` with explicit error handling or let errors propagate
- [x] Replace `SettingsPage` swallow paths for invite-modal cancel dismissal and organization-settings success-toast reset with explicit helper behavior
- [x] Replace `CalendarPage` swallow paths for today-navigation alignment and event scroll preparation with explicit helper behavior
- [x] Replace `DocumentsPage` swallow path for error-boundary diagnostics expansion with explicit helper behavior
- [x] Replace `OnboardingPage` swallow path for Driver.js tour-step transition waits with shared animation helper behavior
- [x] Replace shared `dismissAllToasts()` swallow path with explicit stuck-toast failure behavior
- [x] Replace `WorkspacesPage` swallow paths for optional loading waits and create-button interaction retries with explicit helper behavior
- [x] Replace `DashboardPage` swallow paths for modal backdrop dismissal and app-error detail expansion with explicit helper behavior
- [x] Replace shared auth-helper swallows for email-form expansion, sign-up heading waits, and sign-in timeout screenshots with explicit helper behavior
- [x] Replace the `ProjectsPage` create-project and create-issue modal swallows with explicit interaction helpers and fallback handling
- [x] Replace swallowed alert-dialog stabilization in `openStableAlertDialog()` with explicit retries + animation waits
- [x] Replace swallowed omnibox and advanced-search modal stabilization with explicit readiness waits
- [x] Replace swallowed notification panel and snooze-popover stabilization with explicit retries + animation waits
- [x] Replace shortcuts and time-entry modal stabilization with explicit dialog-content readiness waits
- [x] Replace calendar month-toggle and sprint overlap hard waits with state-based readiness waits
- [x] Replace `waitForTimeout` calls with `animations: 'disabled'` or `waitForAnimation()`
- [x] Replace swallowed dashboard-customize and create-issue modal content waits with explicit readiness checks
- [x] Replace swallowed avatar upload, cover upload, workspace-create, and members-confirm dialog waits with explicit content readiness checks
- [x] Replace swallowed shared page-readiness waits so public/app route captures fail loudly on missing content
- [x] Replace swallowed route-entry and temp-page setup waits in settings/dashboard/workspace/notification captures so modal screenshots fail on broken navigation
- [x] Replace swallowed create-issue, calendar interaction, and document-editor interaction waits so project content captures fail on broken navigation and missing interactive state
- [x] Replace swallowed dashboard/projects/board/meetings/sprints/issues navigation and interaction waits so those captures fail on broken loads and missing interactive content
- [x] Replace swallowed calendar/board retry helpers, scroll helpers, and issue/document discovery helpers so shared screenshot plumbing fails loudly
- [x] Replace strict loading-skeleton waits and cancelled animation promise failures in shared screenshot readiness helpers
- [x] Replace the shared board/calendar/loading/notification screenshot selectors with owned `TEST_IDS` constants
- [x] Replace the shared sidebar/document/workspace-list screenshot selectors with owned `TEST_IDS` constants
- [x] Replace the shared toast/auth helper screenshot selectors with owned toast `TEST_IDS` constants
- [x] Replace the shared settings-page section selectors with owned `TEST_IDS` constants
- [x] Replace the shared dashboard nav and loading-spinner selectors with owned `TEST_IDS` constants
- [x] Replace the shared calendar grid/header/attendees selectors with owned `TEST_IDS` constants
- [x] Replace the last calendar screenshot harness raw `data-calendar` selector with `TEST_IDS.CALENDAR.DAY_CELL` and remove the dead runtime attribute
- [x] Replace the calendar drag-and-drop screenshot raw `data-date` selector dependency with index-based day-cell targeting
- [x] Replace the shared dialog overlay open-state raw selector with visible role-based dialog counting in `wait-helpers.ts`
- [x] Replace the shared dialog open-state and dropdown-menu content raw selectors with role-based locators plus the owned dialog overlay contract
- [x] Replace the shared auth readiness `data-expanded` / `data-form-ready` / `data-hydrated` selectors with owned `TEST_IDS` constants
- [x] Extract shared locator-state fallback helpers and rewire auth/dashboard readiness helpers away from inline catch chains
- [x] Replace the project create-issue trigger and modal selectors with owned `TEST_IDS` constants
- [x] Replace the orphaned onboarding tour command-palette/dashboard/board/sidebar selectors with owned `TEST_IDS` constants
- [x] Replace the onboarding create-project tour selector with the owned `TEST_IDS.ONBOARDING.CREATE_PROJECT_BUTTON` contract
- [x] Remove the dead sidebar `nav-*` tour markers and `data-tour` prop plumbing now that no E2E flow consumes them
- [x] Replace the document outline raw `data-block-id` lookup with an owned heading-anchor contract shared by the Plate heading renderer and sidebar
- [x] Replace the calendar month-view drag-state `data-drop-target` / `data-date` selectors with owned `TEST_IDS` contracts
- [x] Replace the remaining live E2E `data-state` checks in calendar/dashboard helpers with accessible pressed/selected state assertions
- [x] Remove the dead loading-skeleton, board-column, and notification-row raw marker attrs now that the harness uses owned `TEST_IDS`
- [x] Remove the remaining route-nav `data-active` state contract and rely on `aria-current` for active styling
- [ ] Replace raw data-attribute selectors with TEST_IDS constants
- [x] Reduce shared helper/page-readiness `.first()` usage so unique route sentinels rely on scoped locator semantics
- [x] Extract `dismissAllDialogs()`, `waitForDialogOpen()`, `waitForScreenshotReady()` to `e2e/utils/`
- [ ] Update validator skip in `check-e2e-quality.js` (done -- references this TODO)

## Done When

- [x] Zero loading-spinner screenshots in the manifest
- [ ] `.catch(() => {})` count reduced from 198 to only intentional cases with comments
- [x] No `waitForTimeout` calls
- [ ] Shared helpers extracted to `e2e/utils/`
- [ ] Raw selector count near-zero via TEST_IDS constants
