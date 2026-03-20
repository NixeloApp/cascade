# Visual Consistency Hardening

> **Priority:** P1
> **Status:** In Progress
> **Last Updated:** 2026-03-20

## Goal

Make the product more visually cohesive and more enforceable in code, using the new consistency contract and validator output as the cleanup map.

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
- [ ] Screenshot review no longer has obvious uncaptured consistency holes for important surfaces
- [ ] The remaining human-review blind spots are either covered by guardrails or tracked as explicit debt
