# Validator Exceptions Burndown

> **Priority:** P2 (maintenance)
> **Status:** Near Complete
> **Last Updated:** 2026-03-15
> **Verification Summary:** `41/41` validators pass, `519` test files, `4100` tests

## Remaining Baselines

### Test Coverage (`test-coverage-baseline.js`) — 2 files
- `src/components/Auth/EmailVerificationRequired.tsx` — complex auth flow
- `src/components/Calendar/EventDetailsModal.tsx` — 346 lines, 24 imports

### Border Radius (`check-border-radius.js`) — 10 files
- Progress bars, blur glows, pseudo-elements, raw DOM, chart bars (permanent)

### Nested Cards (`check-nested-cards.js`) — 7 files
- 5 Settings pages (cause surface-shell regressions)
- 2 Landing CVA files (component-level patterns)

## Genuine Exceptions (permanent)
- **Inline strong:** 1 file (CommentRenderer — renders user markdown)
- **Raw links:** 8 patterns (test files, Landing, markdown renderers)
- **Arbitrary TW:** 5 patterns (Radix runtime vars, CSS keywords)

## Session Results
- Test coverage: 49 → 2 (**96%** reduction)
- Border radius: 50 → 10 (**80%** reduction)
- Nested cards: 73 → 7 (**90%** reduction)
- Inline strong: 11 → 1 (**91%** reduction)
- Arbitrary TW: 9 → 5 (**44%** reduction)
