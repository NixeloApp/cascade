# Validator Exceptions Burndown

> **Priority:** P2 (last priority)
> **Status:** In Progress
> **Last Updated:** 2026-03-15
> **Verification Summary:** `41/41` validators pass

## Objective

Keep the validator suite green while eliminating the remaining allowlists and baselines.

## Current Baselines

### Border Radius (`check-border-radius.js`)
- **Remaining:** 15 files
- **Breakdown:** 4 progress bars/chart bars, 2 decorative blurs, 3 pseudo-elements/drag handles, 2 raw DOM strings, 4 bare `rounded` on divs
- **Fix:** Add radius props to components or extract to UI primitives

### Nested Cards (`check-nested-cards.js`)
- **Remaining:** 7 files
- **Breakdown:** 5 Settings pages (cause surface-shell regressions when fixed), 2 Landing CVA files
- **Fix:** Extract inner Card styles into proper Card recipes, then replace inner Cards with divs using `getCardRecipeClassName()`

### Test Coverage (`test-coverage-baseline.js`)
- **Remaining:** ~52 files
- **Fix:** Add tests or reduce validator target surface

### Standards (`check-standards.js`)
- **Inline strong:** 1 file (CommentRenderer - renders user markdown, genuine exception)
- **Raw links:** 8 patterns (test files, Landing pages, markdown renderers)

### Arbitrary Tailwind (`check-arbitrary-tw.js`)
- **Remaining:** 5 patterns (Radix runtime vars, CSS `inherit`, `perspective`, `calc()`)
- **Status:** All genuine exceptions, can't be design tokens

## Completed This Session

- [x] Border radius: 50 → 15 (70% reduction)
- [x] Nested cards: 73 → 7 (90% reduction)
- [x] Inline strong: 11 → 1 (91% reduction)
- [x] Arbitrary TW: 9 → 5 (44% reduction)
- [x] Created `Dot`, `IconCircle` UI components
- [x] Added `Typography variant="strong"` for inline emphasis
- [x] Added `Alert radius` prop, `Button chromeSize="sectionToggle"`
- [x] Border radius validator: skip CVA definition regions, catch bare `rounded`

## Acceptance Criteria

- [x] `scripts/validate/check-time-constants.js` has no exception entries
- [x] `scripts/validate/check-test-coverage.js` has no allowlist entries
- [x] `scripts/validate/check-unused-params.js` has no allowlist entries
- [ ] `scripts/validate/test-coverage-baseline.js` is empty or removed
- [ ] Border radius baseline ≤ 15
- [ ] Nested cards baseline ≤ 7
- [x] `pnpm run validate` passes with all 41 checks
