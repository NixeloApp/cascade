# Visual Consistency Hardening

> **Priority:** P1
> **Status:** In Progress
> **Last Updated:** 2026-03-25

Make the product more visually cohesive and more enforceable in code, using the consistency contract, screenshot review loop, and validator output as the cleanup map.

## Remaining

### Screenshot-driven cleanup

- [ ] Review approved screenshots page by page and turn every visibly broken or weird state into an explicit todo item instead of leaving it as vague review debt
- [ ] Fix screenshot-exposed broken states before approving new baselines -- missing content, bad shells, off spacing, broken empty states, and modal/popover layout failures should not be normalized
- [ ] Use screenshot review to find and remove AI-slop patterns -- nested cards, redundant shells, accidental panel-in-panel layouts, and inconsistent control groupings

### Screenshot coverage gaps

- [ ] Keep screenshot coverage and screenshot drift approval in sync with visual changes
- [ ] Do not let modal/interaction-state screenshot gaps hide consistency regressions
- [ ] Backfill tablet and mobile screenshot coverage anywhere specs still effectively read as desktop-first even if the route is already visually reviewed
- [ ] Capture and approve real surface variants when they matter, not just the canonical route screenshot: empty, loading, error, modal, sheet, popover, dropdown, create, edit, confirm, destructive, blocked, filtered, selected, inline-edit, and expanded-detail states.
- [ ] Outreach now has canonical plus tab-state coverage; the remaining screenshot gap there is dialog/destructive-state review, not basic route visibility.
- [ ] Audit existing screenshot folders for uneven matrices -- some pages already have desktop/tablet/mobile variants plus deep state captures, while others only have the canonical route and need explicit expansion
- [ ] Treat "tablet/mobile missing from the reviewed matrix" as a real consistency gap, not just a documentation nicety

### Human-review blind spots

- [ ] motion / animation consistency
- [ ] density and hierarchy consistency inside large complex surfaces
- [ ] component-state cohesion across remaining tabs and card-heavy product surfaces outside the standardized overlay/dashboard shells
- [ ] icon sizing / stroke-weight rhythm across mixed surfaces
- [ ] icon tone/color consistency -- shared semantic icon tones should read as one system, without one-off raw `text-*` icon overrides drifting across pages
- [ ] remaining raw Tailwind baseline shrink as touched files are cleaned up
- [ ] shared shell discipline -- stop panel/card nesting and other accidental composition patterns that make surfaces feel inconsistent
- [ ] "looks polished but not like our product" review pass -- screenshots should catch when a surface is visually coherent but still too custom, decorative, or unlike the real app
- [ ] spec-currentness drift -- CURRENT.md files must track the actual branch route and screenshot matrix instead of falling behind and becoming desktop-only summaries

## Exit Criteria

- [ ] The visual-consistency validator runs with zero meaningful drift findings or an intentionally tiny known set
- [ ] Screenshot review no longer has obvious uncaptured consistency holes for important surfaces, including tablet/mobile and major feature states
- [ ] The remaining human-review blind spots are either covered by guardrails or tracked as explicit debt
- [ ] Screenshot review no longer surfaces obvious "what is this layout doing?" moments on core routes and dialogs
