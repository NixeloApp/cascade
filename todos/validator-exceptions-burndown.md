# Validator Exceptions Burndown

> **Priority:** P2 (last priority)
> **Status:** In Progress
> **Last Updated:** 2026-03-15
> **Verification Summary:** `41/41` validators pass

## Objective

Keep the validator suite green while eliminating the remaining allowlists and baselines.

## Remaining Baselines

### Border Radius (`check-border-radius.js`) — 15 files
- 4 progress bars/chart bars (rounded-full on thin elements)
- 2 decorative blurs (rounded-full on background glows)
- 3 pseudo-elements/drag handles (can't use React components)
- 2 raw DOM strings (service worker, kanban-dnd)
- 4 bare `rounded` on divs (need component radius props)

### Nested Cards (`check-nested-cards.js`) — 7 files
- 5 Settings pages (cause surface-shell regressions when inner Cards replaced)
- 2 Landing CVA files (component-level patterns)

### Test Coverage (`test-coverage-baseline.js`) — ~52 files
- Add tests or reduce validator target surface

## Genuine Exceptions (permanent)

- **Inline strong:** 1 file (CommentRenderer — renders user markdown)
- **Raw links:** 8 patterns (test files, Landing, markdown renderers)
- **Arbitrary TW:** 5 patterns (Radix runtime vars, CSS `inherit`, `perspective`, `calc()`)

## Acceptance Criteria

- [ ] Border radius baseline ≤ 15
- [ ] Nested cards baseline ≤ 7
- [ ] `test-coverage-baseline.js` empty or removed
- [x] `pnpm run validate` passes with all 41 checks
