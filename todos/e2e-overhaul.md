# E2E & Screenshot Infrastructure Overhaul

> **Created:** 2026-03-24
> **Goal:** Unified, reusable E2E infrastructure with consistent `data-testid` usage, shared page objects, and zero duplication between tests and screenshots.

---

## Current State (Problems)

### The Numbers

| Metric | Value |
|--------|-------|
| `screenshot-pages.ts` | **5,292 lines** in a single file |
| Page objects | 13 files, ~6,822 lines total |
| Page objects reused by screenshot tool | **1 out of 13** (only `ProjectsPage`) |
| Private functions in `screenshot-pages.ts` | **134** |
| Duplicated wait/auth helpers | **6 confirmed** |
| `data-testid` in components | 442 across 142 files |
| TEST_IDs defined | 181 leaf IDs in 22 groups |

### Core Issues

1. **Screenshot tool is a parallel universe.** `screenshot-pages.ts` (5,292 lines) defines its own auth injection, wait helpers, readiness checks, URL matchers, and selectors — duplicating what the E2E page objects and utils already provide. Only `ProjectsPage` is reused.

2. **Duplicated implementations that have diverged:**
   - `injectAuthTokens` — screenshot tool has a simpler copy without stale-key cleanup vs the real one in `auth-helpers.ts`
   - `waitForBoardReady` (screenshot) vs `waitForBoardLoaded` (wait-helpers) — same intent, different contracts
   - `waitForCalendarReady` (screenshot) — no shared equivalent
   - `waitForAnimations` (test-helpers) vs `waitForAnimation` (wait-helpers) — the test-helpers version waits for infinite animations (bug)
   - `waitForToast` exists in both `test-helpers.ts` and `wait-helpers.ts` with different signatures
   - 30 private `isXxxUrl()` functions in screenshot tool could use shared `routePattern()` utility

3. **Monolith structure.** The 5,292-line file handles: CLI parsing, test data seeding, auth flow, public page captures, empty state captures, filled state captures, modal/dialog state captures, per-page readiness checks, hash guards, dry-run mode, manifest diffing — all in one file.

4. **Flaky readiness checks.** Empty state captures run after seed data is already in the DB, relying on the assumption that Convex hasn't synced yet. This is inherently racy.

5. **`test-helpers.ts` is a junk drawer.** Contains duplicates of `wait-helpers.ts` functions plus grab-bag utilities. Should be consolidated.

---

## Phase 1: Deduplicate & Consolidate Utils

**Goal:** Single source of truth for all shared utilities. No duplicates.

### 1.1 Consolidate wait helpers

- [ ] Delete `test-helpers.ts:waitForAnimations` — use `wait-helpers.ts:waitForAnimation` everywhere (it correctly skips infinite animations)
- [ ] Delete `test-helpers.ts:waitForToast` — use `wait-helpers.ts:waitForToast` everywhere
- [ ] Move remaining `test-helpers.ts` functions (`createTestNamespace`, `generateTestEmail`, `dismissAllToasts`, `mockApiResponse`) into purpose-specific files or `wait-helpers.ts`
- [ ] Delete `test-helpers.ts` once empty
- [ ] Update barrel `e2e/utils/index.ts` to remove dual exports

### 1.2 Consolidate auth helpers

- [ ] Remove the private `injectAuthTokens` from `screenshot-pages.ts`
- [ ] Export a single `injectAuthTokens(page, token, refreshToken)` from `auth-helpers.ts`
- [ ] Screenshot tool imports and uses the shared version

### 1.3 Fix known bug

- [ ] Fix `wait-helpers.ts` line 91: `hydratedMarker` reference error in `waitForFormReady`

---

## Phase 2: Extract Page Readiness into Page Objects

**Goal:** Each page object owns its own "ready" check. Screenshot tool and E2E specs both call the same method.

### 2.1 Add `waitUntilReady(prefix?: "empty" | "filled")` to page objects

Each page object should export a static or instance method that waits until the page is in a screenshot-ready state. This replaces the 30+ private `waitForXxxReady` functions in `screenshot-pages.ts`.

- [ ] `DashboardPage.waitUntilReady(prefix)` — replaces `waitForDashboardReady` (screenshot)
- [ ] `ProjectsPage.waitUntilReady(prefix)` — replaces `waitForProjectsReady` (screenshot)
- [ ] `CalendarPage.waitUntilReady()` — replaces `waitForCalendarReady` (screenshot)
- [ ] `DocumentsPage.waitUntilReady()` — replaces document editor readiness logic
- [ ] Similarly for: `IssuesPage`, `SettingsPage`, `WorkspacesPage`, `MeetingsPage`, `NotificationsPage`, `TimeTrackingPage`, etc.
- [ ] Move `waitForPublicPageReady` logic into page objects for auth pages (`AuthPage.waitUntilReady`)

### 2.2 Replace `isXxxUrl()` functions

- [ ] Replace 30 private `isXxxUrl(url)` regex functions with `routePattern()` from `e2e/utils/routes.ts`
- [ ] Or move URL detection into page objects as `static matchesUrl(url: string): boolean`

---

## Phase 3: Split Screenshot Monolith

**Goal:** Break `screenshot-pages.ts` (5,292 lines) into focused modules.

### 3.1 Proposed structure

```
e2e/
├── screenshots/
│   ├── runner.ts              # CLI, config parsing, browser setup
│   ├── capture.ts             # Core takeScreenshot + hash guards
│   ├── public-pages.ts        # Public page screenshot sequence
│   ├── empty-states.ts        # Empty state screenshot sequence
│   ├── filled-states.ts       # Filled state screenshot sequence
│   ├── modals.ts              # Modal/dialog state screenshots
│   ├── manifest.ts            # Manifest diff/approve logic
│   └── dry-run.ts             # Dry run listing
```

- [ ] Extract CLI parsing and browser setup into `runner.ts`
- [ ] Extract `takeScreenshot`, hash guards, staging logic into `capture.ts`
- [ ] Extract `screenshotPublicPages` into `public-pages.ts`
- [ ] Extract `screenshotEmptyStates` into `empty-states.ts`
- [ ] Extract `screenshotFilledStates` into `filled-states.ts`
- [ ] Extract modal/dialog state captures into `modals.ts`
- [ ] Extract manifest diff/approve into `manifest.ts`
- [ ] Keep `screenshot-pages.ts` as a thin entry point that imports and orchestrates

### 3.2 Fix empty state race condition

- [ ] Option A: Capture empty states with a separate fresh user (no seed data)
- [ ] Option B: Capture empty states BEFORE seeding data
- [ ] Option C: Use a dedicated "empty org" that never gets seeded
- [ ] Pick one approach and implement it consistently

---

## Phase 4: Expand TEST_IDS Coverage

**Goal:** Every interactive/stateful element that E2E tests or screenshots need to locate has a TEST_ID.

### 4.1 Audit gaps

Current: 181 TEST_IDs across 22 groups, used in 142 component files (442 occurrences).

- [ ] Audit pages that screenshot tool uses raw selectors for (dashboard widgets, settings sections, sprint cards, etc.)
- [ ] Add TEST_IDs for elements currently found by fragile selectors:
  - `page.locator("#time-entry-form")` — should be TEST_IDS.TIME_TRACKING.ENTRY_FORM
  - `page.locator("form").filter(...)` — sprint form, should be TEST_IDS.SPRINT.FORM
  - `page.locator("code").first()` — editor code block, should be TEST_IDS.EDITOR.CODE_BLOCK
  - `page.locator("[role='option']").first()` — dropdown options, context-specific TEST_IDs
- [ ] Ensure every page/section that gets a screenshot has a TEST_ID marker for readiness detection

### 4.2 Page objects should prefer TEST_IDs

- [ ] Audit page objects that use 0 TEST_IDs (`workspaces.page.ts`, `meetings.page.ts`, `invite.page.ts`)
- [ ] Add TEST_IDs for primary elements and update page objects to use them
- [ ] Keep `getByRole`/`getByLabel` for truly semantic queries (buttons, inputs) — TEST_IDs for structural elements (containers, cards, sections)

### 4.3 Selector priority enforcement

Per RULES.md, selector priority is:
1. `getByRole`, `getByLabel`, `getByText` (accessible selectors)
2. `getByTestId(TEST_IDS.X.Y)` (constants)
3. `locator("[data-tour='...']")` (scoped)
4. Scoped CSS selectors

- [ ] Add a lint check or validator that flags `page.locator("#...")` and `page.locator("form")` etc. in E2E code
- [ ] Ensure `check-test-ids.js` validator covers screenshot tool, not just spec files

---

## Phase 5: Screenshot Tool Uses Page Objects

**Goal:** Screenshot capture calls page objects for navigation, readiness, and interaction — no private reimplementations.

### 5.1 Page object integration

- [ ] Screenshot public pages: use `AuthPage`, `LandingPage`, `InvitePage` page objects
- [ ] Screenshot empty/filled: use `DashboardPage`, `ProjectsPage`, etc.
- [ ] Screenshot modals: use page object methods to open/close modals
- [ ] Remove all private `waitForXxxReady` functions from screenshot tool

### 5.2 New page objects needed

Some pages don't have page objects yet:

- [ ] `InvoicesPage` (invoices list)
- [ ] `ClientsPage` (clients list)
- [ ] `TimeTrackingPage` (time tracking)
- [ ] `AnalyticsPage` (org analytics)
- [ ] `NotificationsPage` (notifications center)
- [ ] `RoadmapPage` (project roadmap)
- [ ] `ActivityPage` (project activity feed)
- [ ] `BillingPage` (project billing)
- [ ] `TimesheetPage` (project timesheet)
- [ ] `MembersPage` (project members)
- [ ] `BacklogPage` (project backlog)
- [ ] `SprintsPage` (project sprints)

---

## Phase 6: CI Integration & Regression Prevention

- [ ] Add validator that counts private functions in screenshot tool (should trend toward 0 as they move to page objects)
- [ ] Add validator that ensures screenshot tool doesn't define its own `waitForXxx` when a page object provides `waitUntilReady`
- [ ] Run screenshot diff in CI (already exists via `screenshots:diff`)
- [ ] Consider splitting screenshot capture across CI workers by config (desktop-dark, desktop-light, tablet, mobile) for parallelism

---

## Priority Order

1. **Phase 1** (dedup utils) — removes bugs, prevents confusion, ~1 session
2. **Phase 3.2** (fix empty state race) — unblocks screenshot capture, ~30 min
3. **Phase 2** (readiness in page objects) — biggest impact on maintainability, ~2–3 sessions
4. **Phase 4** (TEST_IDs expansion) — incremental, can do alongside Phase 2
5. **Phase 3** (split monolith) — depends on Phase 2, ~1–2 sessions
6. **Phase 5** (screenshot uses page objects) — depends on Phase 2+3, ~2 sessions
7. **Phase 6** (CI) — polish, ~30 min

---

## Success Criteria

- [ ] `screenshot-pages.ts` is under 500 lines (entry point + orchestration only)
- [ ] 0 private wait/readiness functions in screenshot tool
- [ ] 0 duplicated auth/wait helpers across the codebase
- [ ] Every screenshot target has a page object with `waitUntilReady()`
- [ ] TEST_IDs coverage: 250+ leaf IDs (up from 181)
- [ ] Screenshot capture completes without failures for all 4 configs
- [ ] E2E specs and screenshots share identical page objects and selectors
