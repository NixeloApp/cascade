# E2E Test ID & Selector Cleanup

> **Priority:** P1
> **Status:** Complete
> **Last Updated:** 2026-03-28

## Shipped

- [x] Replaced meeting recording selection by title-filtered card text with ordered-card helpers in the meetings page object.
  Implemented in:
  - `e2e/pages/meetings.page.ts`
  - `e2e/meetings.spec.ts`
  - `e2e/screenshot-lib/interactive-captures.ts`
  - `e2e/utils/seeded-meetings.ts`
- [x] Reworked sprint start and complete triggers to use static test IDs scoped within sprint cards instead of name-encoded IDs.
  Implemented in:
  - `src/lib/test-ids.ts`
  - `src/components/Sprints/SprintManager.tsx`
  - `src/components/Sprints/SprintManager.test.tsx`
  - `e2e/pages/sprints.page.ts`
- [x] Added explicit sprint card and sprint name test hooks so both unit tests and E2E page objects can target the right card without prefix selectors.

## Done (kept for history)

- ~~`evaluate` click patterns in E2E page objects~~ — All replaced with Playwright `.click()`.
- ~~`toHaveTextContent` in E2E~~ — All replaced with `toContainText`.
- ~~`RECORDING_CARD_ITEM` dead code in test-ids.ts~~ — Deleted.
