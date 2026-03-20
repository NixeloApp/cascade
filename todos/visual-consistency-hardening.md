# Visual Consistency Hardening

> **Priority:** P1
> **Status:** New
> **Last Updated:** 2026-03-20

## Goal

Make the product more visually cohesive and more enforceable in code, using the new consistency contract and validator output as the cleanup map.

## New Guardrails Already Added

- [x] `docs/design/CONSISTENCY.md` defines the practical consistency contract
- [x] `pnpm run validate` now includes advisory audits for typography drift, control chrome drift, shared shape drift, and richer screenshot/spec coverage
- [x] Screenshot validation docs are linked to the design/testing review loop

## Remaining Cleanup

### Typography override drift

- [x] Absorb the repeated landing-page hero/showcase/metric typography patterns into owned `Typography` variants
- [x] Absorb the shared app/auth/error typography treatments into owned `Typography` variants
- [x] Absorb the shared board/panel/secondary-surface heading and label treatments into owned `Typography` variants
- [x] Remove or absorb the 43 current `Typography` className size/weight/tracking overrides surfaced by `check-typography-drift.js`
- [x] Where the same override pattern repeats, add a real `Typography` variant or supporting primitive instead of continuing one-off className fixes

### Owned-control drift

- [x] Absorb the shared compact button sizing patterns into owned `Button` sizes / chrome sizes
- [x] Remove or absorb the 17 current control-chrome overrides surfaced by `check-control-chrome-drift.js`
- [x] Promote repeated `Button` / `Badge` / `Input` / `Textarea` / `TabsTrigger` restyling into owned variants instead of feature-local className patches

### Screenshot review residue

- [ ] Keep screenshot coverage and screenshot drift approval in sync with visual changes
- [ ] Do not let modal/interaction-state screenshot gaps hide consistency regressions

### Human-review blind spots

These are still only partially automated and need explicit cleanup/review:

- [ ] motion / animation consistency
- [ ] density and hierarchy consistency inside large complex surfaces
- [ ] component-state cohesion across dialogs, sheets, popovers, tabs, and dashboard cards
- [ ] icon sizing / stroke-weight rhythm across mixed surfaces
- [ ] remaining raw Tailwind baseline shrink as touched files are cleaned up

## Done When

- [ ] The visual-consistency validator runs with zero meaningful drift findings or an intentionally tiny known set
- [ ] Repeated Typography styling hacks have been replaced by actual variant/component decisions
- [ ] Screenshot review no longer has obvious uncaptured consistency holes for important surfaces
