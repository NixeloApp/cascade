# Visual Consistency Hardening

> **Priority:** P1
> **Status:** In Progress
> **Last Updated:** 2026-03-20

## Goal

Make the product more visually cohesive and more enforceable in code, using the new consistency contract and validator output as the cleanup map.

### Screenshot-driven cleanup

- [ ] Review approved screenshots page by page and turn every visibly broken or weird state into an explicit todo item instead of leaving it as vague review debt
- [ ] Fix screenshot-exposed broken states before approving new baselines -- missing content, bad shells, off spacing, broken empty states, and modal/popover layout failures should not be normalized
- [ ] Use screenshot review to find and remove AI-slop patterns -- nested cards, redundant shells, accidental panel-in-panel layouts, and inconsistent control groupings

### Screenshot review residue

- [ ] Keep screenshot coverage and screenshot drift approval in sync with visual changes
- [ ] Do not let modal/interaction-state screenshot gaps hide consistency regressions

### Human-review blind spots

These are still only partially automated and need explicit cleanup/review:

- [ ] motion / animation consistency
- [ ] density and hierarchy consistency inside large complex surfaces
- [ ] component-state cohesion across dialogs, sheets, popovers, tabs, and dashboard cards
- [ ] icon sizing / stroke-weight rhythm across mixed surfaces
- [ ] icon tone/color consistency -- shared semantic icon tones should read as one system, without one-off raw `text-*` icon overrides drifting across pages
- [ ] remaining raw Tailwind baseline shrink as touched files are cleaned up
- [ ] shared shell discipline -- stop panel/card nesting and other accidental composition patterns that make surfaces feel inconsistent
- [ ] modal, drawer, popover, and dropdown content rhythm -- spacing, heading treatment, action rows, and empty/error states should read as one system
- [ ] "looks polished but not like our product" review pass -- screenshots should catch when a surface is visually coherent but still too custom, decorative, or unlike the real app

## Done When

- [ ] The visual-consistency validator runs with zero meaningful drift findings or an intentionally tiny known set
- [ ] Screenshot review no longer has obvious uncaptured consistency holes for important surfaces
- [ ] The remaining human-review blind spots are either covered by guardrails or tracked as explicit debt
- [ ] Screenshot review no longer surfaces obvious "what is this layout doing?" moments on core routes and dialogs
