# Screenshot Tooling Cleanup

> **Priority:** P2
> **Status:** New
> **Last Updated:** 2026-03-19

## Problem

The screenshot capture tool (`e2e/screenshot-pages.ts`) has two categories of issues:

### 1. Failed captures producing loading-spinner screenshots

The manifest (`.screenshot-hashes.json`) contains 226 entries but only 179 unique hashes. 28 entries across 11 groups are identical loading-spinner captures — completely unrelated features (avatar upload, dashboard customize, command palette, notifications, time tracking, workspaces) share the same hash because the modal never rendered.

**Root cause:** `waitForDialogOpen()` (line ~868) uses `.catch(() => {})` on both the overlay wait and dialog content wait. When the modal fails to open (timeout), the error is silently swallowed and `captureCurrentView` screenshots whatever is on screen — the loading spinner. `waitForScreenshotReady()` (line ~2265) has the same `.catch(() => {})` pattern on its spinner visibility check.

**Impact:** 12% of the screenshot manifest is useless — visual regressions in those modals would go completely undetected.

**Fix:**
- [ ] Make `waitForDialogOpen` fail loudly when dialog content doesn't appear instead of silently proceeding
- [ ] Add a post-capture hash check that flags when a screenshot matches known loading-state hashes
- [ ] Re-capture the 28 failed screenshots with proper modal wait logic
- [ ] Consider adding `animations: 'disabled'` to `page.screenshot()` calls to handle CSS animation settling without timeouts

### 2. Anti-patterns that should use proper Playwright/E2E conventions

The project validators (`check-e2e-quality.js`, `check-e2e-hard-rules.js`) explicitly skip `screenshot-pages.ts` with the rationale that it's "capture tooling, not a spec test." While the file doesn't need spec-level assertion rigor, it should still follow better practices where existing E2E helpers already solve the same problems.

**Current anti-patterns:**

| Pattern | Count | Issue |
|---------|-------|-------|
| `.first()` on broad selectors | ~200 | Masks over-broad selectors; many are on elements that should be unique |
| `page.waitForTimeout()` | 7 | Hardcoded animation waits; `animations: 'disabled'` or `waitForAnimation()` from `e2e/utils/wait-helpers.ts` would be better |
| `setTimeout` in polling loop | 1 | Legitimate for server-side polling but could use `expect.poll()` |
| Raw CSS/data selectors | ~10 | `[data-calendar]`, `[data-loading-skeleton]` etc. should use TEST_IDS constants |

**Existing E2E helpers that could be reused:**

The project already has proper implementations in `e2e/utils/wait-helpers.ts`:
- `waitForAnimation()` — CSS animation completion via `getAnimations()`
- `waitForModal()` — Modal open + animation complete
- `waitForDashboardReady()` — Full dashboard shell readiness
- `waitForBoardLoaded()` — Project board readiness
- `dismissAllToasts()` — Toast removal with retry

**Fix:**
- [ ] Replace `waitForTimeout` calls with `animations: 'disabled'` on screenshot calls or `waitForAnimation()` from shared helpers
- [ ] Replace raw data-attribute selectors with TEST_IDS constants
- [ ] Reduce `.first()` usage by scoping selectors or using test IDs for unique elements
- [ ] Extract `dismissAllDialogs()`, `waitForDialogOpen()`, and `waitForScreenshotReady()` to `e2e/utils/` so both screenshot tool and E2E tests can share them
- [ ] Update the validator skip comment in `check-e2e-quality.js` to reference this TODO

## Done When

- [ ] Zero loading-spinner screenshots in the manifest (all captures show real content)
- [ ] No `waitForTimeout` calls — replaced with proper wait mechanisms
- [ ] Shared helpers extracted to `e2e/utils/` and reused by both screenshot tool and E2E specs
- [ ] Raw selector count reduced to near-zero via TEST_IDS constants
