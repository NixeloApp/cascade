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

### Data-testid migration (~75% complete in screenshot tool)

**Screenshot tool:** 95 `getByTestId(TEST_IDS)` calls. Remaining 57 `getByText` are mostly appropriate semantic selectors:
- ~25 empty state / validation messages (legitimate `getByText` usage)
- ~10 seeded content text (necessary for seed-specific screenshots)
- ~12 UI section names that could become TEST_IDs (diminishing returns)
- ~10 public page text (no PageHeader, text is appropriate)

Remaining mechanical fixes:
- [ ] Fix 2 raw `page.locator()` calls (`page.locator("a")`, `page.locator("[role='option']")`)
- [ ] Add TEST_IDs for dashboard widgets ("Quick Stats", "Recent Activity") and board toolbar ("Swimlanes", "Properties") if desired

### Page objects — ✅ DONE

All 3 page objects migrated to TEST_IDs:
- ~~`meetings.page.ts`~~ — now uses 7 MEETINGS TEST_IDs
- ~~`invite.page.ts`~~ — now uses INVITE.STATE_SCREEN + INVITE.LOADING
- ~~`workspaces.page.ts`~~ — now uses WORKSPACE.CARD + LOADING.SPINNER + PAGE.HEADER_TITLE

### Phase 3.1: Split monolith — ✅ DONE (5,292 → 619 lines)

Monolith is now a 619-line orchestration shell. All capture logic lives in 11 modules under `e2e/screenshot-lib/` totaling ~4,710 lines.

| Module | Lines | Contents |
|--------|-------|----------|
| filled-states.ts | 1,427 | Main screenshot pass through all authenticated pages |
| readiness.ts | 928 | 26 page readiness functions + waitForExpectedContent |
| interactive-captures.ts | 802 | Modal, dialog, and interactive state captures |
| capture.ts | 447 | Capture state, filtering, staging, takeScreenshot |
| helpers.ts | 320 | Discovery, document editing, issue drafts, auth |
| routing.ts | 267 | Spec folder mapping, URL patterns |
| dialog-helpers.ts | 161 | openOmnibox, openStableDialog, modal helpers |
| config.ts | 159 | Constants, types, viewport/theme configs |
| public-pages.ts | 116 | Public pages and empty state captures |
| cli.ts | 69 | CLI option parsing |
| index.ts | 14 | Re-exports |

### Phase 5: Screenshot tool uses page objects — IN PROGRESS

Created 5 new page objects and wired them into screenshot readiness:
- [x] IssuesPage — replaces waitForIssuesReady
- [x] AnalyticsPage — replaces waitForAnalyticsReady
- [x] RoadmapPage — replaces waitForRoadmapReady
- [x] BacklogPage — replaces waitForWorkspaceBacklogReady
- [x] TeamPage — replaces waitForTeamDetailReady

Remaining page objects to create:
- [ ] NotificationsPage, TimeTrackingPage, SprintsPage, ClientsPage, InvoicesPage, ActivityPage, BillingPage, TimesheetPage, MembersPage

### Phase 6: CI integration

- [ ] Add validator that counts private functions in screenshot tool
- [ ] Ensure `check-test-ids.js` validator covers screenshot tool
- [ ] Consider splitting screenshot capture across CI workers

---

## Current Stats

| Metric | Before | After |
|--------|--------|-------|
| File lines | 5,292 | 619 |
| Private functions | 134 | ~10 |
| TEST_ID usage | 64 | 95 |
| Fragile selectors | ~150 | 57 (mostly appropriate getByText) |
| TEST_IDs defined | 181 | 203 |
| Page objects at 0 TEST_IDs | 3 | 0 |
| Duplicate helpers | 6 | 0 |
| body.innerText probes | 15 | 0 |

## Success Criteria

- [ ] `screenshot-pages.ts` under 500 lines
- [ ] 0 private readiness functions in screenshot tool
- [ ] TEST_IDs coverage: 250+ (currently 197)
- [ ] Screenshot capture completes for all 4 configs
- [ ] E2E specs and screenshots share identical page objects
