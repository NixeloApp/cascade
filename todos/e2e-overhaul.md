# E2E & Screenshot Infrastructure Overhaul

> **Goal:** Unified, reusable E2E infrastructure with consistent `data-testid` usage, shared page objects, and zero duplication between tests and screenshots.

---

## Completed

- **Phase 1** — Deduplicated utils, fixed hydratedMarker bug, consolidated auth helpers
- **Phase 2.1** — `waitUntilReady()` on all 10 page objects
- **Phase 2.2** — Replaced 38 `isXxxUrl()` functions with shared `routePattern()`
- **Phase 3.2** — Two-phase empty state capture, replaced 33 spinner selectors
- **Phase 4.1** — Added 16 TEST_IDs, eliminated all body text probes and querySelectorAll
- **Phase 5** — Default readiness fallback, deleted 10 private functions

---

## Remaining Work

### Data-testid migration (~57% complete in screenshot tool)

**Screenshot tool:** 95 `getByTestId(TEST_IDS)` calls vs 72 fragile selectors (57 `getByText` + 15 `getByRole("heading")`).

- [ ] Replace remaining 57 `getByText` calls with TEST_ID selectors where possible
- [ ] Replace remaining 15 `getByRole("heading")` calls (public pages are acceptable)
- [ ] Fix 2 remaining raw `page.locator()` calls (`page.locator("a")`, `page.locator("[role='option']")`)

### Page objects with 0 TEST_IDs

- [ ] `meetings.page.ts` — uses raw `.locator("section")` and xpath; add MEETINGS TEST_IDs
- [ ] `invite.page.ts` — entirely text/role based; add INVITE TEST_IDs
- [ ] `workspaces.page.ts` — partially migrated (2 TEST_IDs, 6 raw locators)

### Phase 3.1: Split monolith (4,544 lines → target <500)

Extracted so far: config (170) + cli (72) + routing (190) = 432 lines.

- [ ] Extract `takeScreenshot`, hash guards, staging logic into `capture.ts`
- [ ] Extract `screenshotPublicPages` into `public-pages.ts`
- [ ] Extract `screenshotEmptyStates` / `screenshotFilledStates`
- [ ] Extract modal/dialog state captures into `modals.ts`
- [ ] Extract manifest diff/approve into `manifest.ts`

### Phase 5: Screenshot tool uses page objects

- [ ] Replace screenshot readiness functions with page object `waitUntilReady()` calls
- [ ] Create missing page objects: InvoicesPage, ClientsPage, TimeTrackingPage, AnalyticsPage, NotificationsPage, RoadmapPage, ActivityPage, BillingPage, TimesheetPage, MembersPage, BacklogPage, SprintsPage

### Phase 6: CI integration

- [ ] Add validator that counts private functions in screenshot tool
- [ ] Ensure `check-test-ids.js` validator covers screenshot tool
- [ ] Consider splitting screenshot capture across CI workers

---

## Current Stats

| Metric | Before | After |
|--------|--------|-------|
| File lines | 5,292 | 4,544 |
| Private functions | 134 | ~76 |
| TEST_ID usage | 64 | 95 |
| Fragile selectors | ~150 | 72 |
| Duplicate helpers | 6 | 0 |
| body.innerText probes | 15 | 0 |

## Success Criteria

- [ ] `screenshot-pages.ts` under 500 lines
- [ ] 0 private readiness functions in screenshot tool
- [ ] TEST_IDs coverage: 250+ (currently 197)
- [ ] Screenshot capture completes for all 4 configs
- [ ] E2E specs and screenshots share identical page objects
