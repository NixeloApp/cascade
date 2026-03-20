# Screenshot Tooling Cleanup

> **Priority:** P2
> **Status:** New
> **Last Updated:** 2026-03-19

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
- [ ] Add a post-capture hash check that flags loading-state hashes
- [ ] Re-capture the 37 failed screenshots with proper wait logic
- [ ] Add `animations: 'disabled'` to `page.screenshot()` calls

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
- [ ] Replace raw data-attribute selectors with TEST_IDS constants
- [x] Reduce shared helper/page-readiness `.first()` usage so unique route sentinels rely on scoped locator semantics
- [x] Extract `dismissAllDialogs()`, `waitForDialogOpen()`, `waitForScreenshotReady()` to `e2e/utils/`
- [ ] Update validator skip in `check-e2e-quality.js` (done -- references this TODO)

## Done When

- [ ] Zero loading-spinner screenshots in the manifest
- [ ] `.catch(() => {})` count reduced from 198 to only intentional cases with comments
- [x] No `waitForTimeout` calls
- [ ] Shared helpers extracted to `e2e/utils/`
- [ ] Raw selector count near-zero via TEST_IDS constants
