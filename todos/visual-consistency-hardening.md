# Visual Consistency Hardening

> **Priority:** P1
> **Status:** In Progress
> **Last Updated:** 2026-03-25

Make the product more visually cohesive and more enforceable in code, using the consistency contract, screenshot review loop, and validator output as the cleanup map.

## Remaining

Documents workspace screenshot review now covers the canonical route plus template and search variants, the projects route now has reviewed multi-project, single-project, empty, loading, and create-modal states across the full viewport matrix, the invoices route now has reviewed canonical, filtered-empty, create-dialog, and loading states across the full viewport matrix, the issues route now has reviewed filtered, modal, side-panel, and loading captures across desktop/tablet/mobile, the my-issues route now has reviewed true-empty, filter-active, filtered-empty, and loading states across the full viewport matrix, notifications now has reviewed archive/filter/popover/empty/loading/overflow states across the full viewport matrix, roadmap now has reviewed dependency-linked canonical, grouped, detail-open, empty, milestone, and selector-open states across the full viewport matrix, time tracking now has reviewed burn-rate, rates, empty, all-time, truncation, and modal states across the full viewport matrix, the project inbox now has reviewed closed, bulk-selection, snooze, decline, duplicate, and both empty-tab states across the full viewport matrix, the workspaces route now has reviewed true-empty, search-empty, and create-modal coverage across all four configs, the dashboard route now has reviewed shell simplification plus the full canonical/modal/loading/responsive matrix, project analytics now has reviewed sparse-data plus no-activity variants across the full viewport matrix, org analytics now has reviewed sparse-data plus no-activity variants across the full viewport matrix, org calendar now has reviewed workspace-scope, team-scope, and loading variants across the full viewport matrix, the assistant route now has reviewed overview, conversations, empty, and loading states across the full viewport matrix, the public auth suite now has current sign-in/signup/forgot-password screenshots plus a shared email-reveal shell instead of duplicated height hacks, and meetings now uses a focused small-screen detail switcher so transcript, notes, actions, and people no longer pile into one long mobile stack. Shared page-shell cleanup also landed: `PageHeader` is now a lighter top-level shell, `PageContent` owns one page-level loading/empty-state contract, `OverviewBand` now uses a flatter summary shell with literal org/time copy instead of nested panel coaching blocks, and the shared project/workspace/team detail shells now use lighter headers plus compact section strips instead of heavier card-on-card tab chrome. The remaining work here is broader page-by-page polish, empty-state quality on other surfaces, and cross-surface consistency rather than another blind core-route gap.

### Screenshot-driven cleanup

- [ ] Review approved screenshots page by page and turn every visibly broken or weird state into an explicit todo item instead of leaving it as vague review debt
- [ ] Fix screenshot-exposed broken states before approving new baselines -- missing content, bad shells, off spacing, broken empty states, and modal/popover layout failures should not be normalized
- [ ] Use screenshot review to find and remove AI-slop patterns -- nested cards, redundant shells, accidental panel-in-panel layouts, and inconsistent control groupings

### Screenshot coverage gaps

- [ ] Keep screenshot coverage and screenshot drift approval in sync with visual changes
- [ ] Do not let modal/interaction-state screenshot gaps hide consistency regressions
- [ ] Backfill tablet and mobile screenshot coverage anywhere specs still effectively read as desktop-first even if the route is already visually reviewed
- [ ] Capture and approve real surface variants when they matter, not just the canonical route screenshot: empty, loading, error, modal, sheet, popover, dropdown, create, edit, confirm, destructive, blocked, filtered, selected, inline-edit, and expanded-detail states.
- [ ] Audit existing screenshot folders for uneven matrices -- some pages already have desktop/tablet/mobile variants plus deep state captures, while others only have the canonical route and need explicit expansion
- [ ] Treat "tablet/mobile missing from the reviewed matrix" as a real consistency gap, not just a documentation nicety
- [ ] Backfill true empty-state review on routes that now have strong filled and interaction coverage but still only shallow empty-state validation

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

- [ ] The visual-consistency validator runs with zero meaningful drift findings or an intentionally tiny known set.
- [ ] Screenshot review no longer has obvious uncaptured consistency holes for important surfaces, including tablet/mobile and major feature states.
- [ ] The remaining human-review blind spots are either covered by guardrails or tracked as explicit debt.
- [ ] Screenshot review no longer surfaces obvious "what is this layout doing?" moments on core routes and dialogs.
