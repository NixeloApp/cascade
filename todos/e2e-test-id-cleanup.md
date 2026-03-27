# E2E Test ID & Selector Cleanup

> **Priority:** P1
> **Last Updated:** 2026-03-27

## Remaining Work

### 1. Recording card still uses title-based E2E targeting

`MeetingsPage.getRecordingCard(title)` finds a specific recording by filtering all `RECORDING_CARD` elements with `{ hasText: title }`. This is fragile — two recordings with overlapping titles will match wrong, and the test is coupled to seed data text.

**Fix:** Rewrite the meetings E2E tests to not target individual recordings by title. Use list position (`.first()`, `.nth(n)`) since seed data order is deterministic, or scope by a parent container. Drop `getRecordingCard(title)` and all callers.

### 2. Sprint test IDs are functions but E2E uses prefix selectors

`START_TRIGGER` and `COMPLETE_TRIGGER` are `(sprintName) => ...` functions. The E2E page object uses prefix-match selectors (`[data-testid^="sprint-start-trigger-"]`) with `.first()` fallbacks — effectively the same as static IDs.

**Fix:** Decide: if tests always scope to a single visible sprint card, revert to static IDs. If tests need to disambiguate multiple cards, scope by card container instead of baking names into test IDs.

## Done (remove from tracking)

- ~~`evaluate` click patterns in E2E page objects~~ — All replaced with Playwright `.click()`.
- ~~`toHaveTextContent` in E2E~~ — All replaced with `toContainText`.
- ~~`RECORDING_CARD_ITEM` dead code in test-ids.ts~~ — Deleted.
