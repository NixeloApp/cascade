# E2E Test ID & Selector Cleanup

> **Priority:** P1
> **Context:** PR #934 review exposed several test-targeting patterns that are fragile, misused, or half-fixed.

## Problems

### 1. Recording card still uses title-based E2E targeting

`MeetingsPage.getRecordingCard(title)` finds a specific recording by filtering all `RECORDING_CARD` elements with `{ hasText: title }`. This is fragile:

- Two recordings with overlapping titles will match wrong.
- The test knows recording titles, coupling E2E to seed data text.
- `filter({ hasText })` is a workaround for not having a proper per-item identifier.

**Current state:**
- Component: `data-testid={TEST_IDS.MEETINGS.RECORDING_CARD}` (static, shared across all cards)
- E2E: `getByTestId(RECORDING_CARD).filter({ hasText: title })` (text-based disambiguation)
- Dead code: `RECORDING_CARD_ITEM` still in `test-ids.ts` (unused after removing `data-slot`)

**Fix:** Rewrite the meetings E2E tests to not target individual recordings by title. Instead:
- Navigate to a recording via list position (`.first()`, `.nth(n)`) since seed data order is deterministic.
- Or scope by a parent container that already narrows to one card.
- Drop `getRecordingCard(title)` and all callers.
- Delete `RECORDING_CARD_ITEM` from `test-ids.ts`.

### 2. Sprint test IDs are now functions but E2E uses prefix selectors

`START_TRIGGER` and `COMPLETE_TRIGGER` were changed from static strings to `(sprintName) => ...` functions. The E2E page object (`sprints.page.ts`) was updated with prefix-match selectors (`[data-testid^="sprint-start-trigger-"]`) and `.first()` fallbacks.

This works but is a halfway pattern:
- The prefix selector + `.first()` is effectively the same as the old static ID when there's one sprint visible.
- The `sprintName`-based targeting couples to seed data names.

**Fix:** Decide on one approach:
- If tests always scope to a single visible sprint card first, static IDs are fine — revert to static.
- If tests need to disambiguate multiple sprint cards, scope by card container (e.g., find the card by sprint name text, then find the button inside it) instead of baking names into test IDs.

### 3. Meetings E2E page object had `evaluate` clicks

Fixed in this PR — `openRecording`, `openDetailTabIfPresent`, `filterByStatus`, `filterMemoryByProject` all replaced `element.evaluate(el => el.click())` with Playwright `.click()`. But audit the rest of the E2E page objects for the same antipattern — `evaluate` clicks bypass React's event system and silently fail to trigger state updates.

```bash
# Find remaining evaluate-click patterns across all page objects
grep -rn "evaluate.*click\|\.click()" e2e/pages/
```

### 4. `toHaveTextContent` may exist in other E2E files

Fixed in `meetings.page.ts` but grep the full `e2e/` directory — any other `toHaveTextContent` usage in Playwright context is a bug (it's a vitest/jest matcher, not Playwright).

```bash
grep -rn "toHaveTextContent" e2e/
```
