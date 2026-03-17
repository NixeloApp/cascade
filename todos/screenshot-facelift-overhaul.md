# Visual Facelift & Layout Consistency

> **Priority:** P0
> **Status:** Active
> **Last Updated:** 2026-03-17
> **Objective:** Fix systemic layout inconsistency, broken component visuals, and establish enforceable patterns.

---

## Part 1: Page Layout Wrapper Consistency

The app has `PageLayout`, `PageHeader`, `PageContent` components but 10+ pages bypass them with ad-hoc `max-w-*` divs and custom padding. This creates inconsistent spacing, widths, and visual rhythm across pages.

### Pages rolling their own layout (must migrate to PageLayout)

- [ ] **`assistant.tsx`** — wraps content in `<div className="p-6 max-w-7xl mx-auto">` inside PageLayout (duplicated max-width). Stats grid has no max-width, config section has `max-w-4xl`. Sections don't align horizontally.
- [ ] **`workspaces/$workspaceSlug/settings.tsx`** — uses `<div className="max-w-3xl mx-auto py-6">` instead of PageLayout.
- [ ] **`workspaces/$workspaceSlug/teams/$teamSlug/settings.tsx`** — copy-paste of above pattern.
- [ ] **`workspaces/$workspaceSlug/wiki.tsx`** — returns raw `<Grid>` with no padding/header.
- [ ] **`workspaces/$workspaceSlug/teams/$teamSlug/wiki.tsx`** — returns raw `<Flex>` with `py-20`.
- [ ] **`my-issues.tsx`** — returns raw `<Flex>` without PageLayout.
- [ ] **`settings/profile.tsx`** — overrides PageHeader padding with className instead of using props.

### Pages with custom headers (should use PageHeader or extend it)

- [ ] **`projects/$key/board.tsx`** — ad-hoc Card-based filter bar instead of PageHeader.
- [ ] **`projects/$key/route.tsx`** — inline card header with custom backdrop-blur styling.
- [ ] **`calendar.tsx`** — custom select bar with hardcoded responsive padding.

### Validator: enforce PageLayout usage

- [ ] **Add `check-page-layout.js` validator** — scan route files in `src/routes/_auth/_app/` for ad-hoc `max-w-*` + `mx-auto` patterns that should use PageLayout. Flag `max-w-{sm,md,lg,xl,2xl,3xl,4xl,5xl,6xl,7xl}` + `mx-auto` in route files as violations.

---

## Part 2: Notification Popover — Still Looks Wrong

Scroll is fixed but the visual structure is broken.

- [ ] **Empty state too tall** — `EmptyState` default size (`min-h-56`) is way too big for a 384px-wide popover. Use `size="compact"`.
- [ ] **3-tier background color mess** — header uses `bg-ui-bg`, section headers use `bg-ui-bg-secondary`, footer uses `bg-ui-bg-secondary`. Too many background layers for a popover. Simplify to 2 colors max.
- [ ] **No gap between date groups** — "Today", "Yesterday", "This Week" sections sit flush against each other with only a divider. Needs visual breathing room between groups.
- [ ] **Header/footer border inconsistency** — header has `rounded-t-lg` but no left/right borders, footer has `rounded-b-lg` but no left/right borders. The outer PopoverContent has its own border/shadow via `overlayInset` recipe. Double-container effect.
- [ ] **`max-h-popover-panel` (80vh) too aggressive** — with few notifications the panel stretches to fill 80% of viewport height. Consider `60vh` or a smarter constraint.

---

## Part 3: Workspace Card — Broken Layout

- [ ] **"1 team" badge wraps to 2 lines** — footer `<Flex wrap>` causes the badge to wrap. Documents page uses the same pattern WITHOUT `wrap` and it works. Remove `wrap` from workspace card footer.
- [ ] **Badge lacks `shrink-0`** — in `justify="between"` flex, unshrinkable children force wrapping. Add `shrink-0` to action badges.
- [ ] **Metadata double-wrap** — `Metadata` component has built-in `flex-wrap`, and the parent Flex also has `wrap`. Creates double-wrapping potential.
- [ ] **Compact vs standard layout inconsistency** — two nearly identical card layouts (lines 54-128 and 131-188) with subtle spacing differences. Compact footer has no `mt-auto`, standard does.
- [ ] **Card padding inconsistency** — workspaces uses `p-6` via className, documents uses `padding="lg"` via Card prop. Should use the prop.

---

## Part 4: Assistant Page — Width Alignment

- [ ] **Stats section has no max-width** — Grid stretches full container width while config below has `max-w-4xl`. The two sections don't align.
- [ ] **Nested max-width** — outer wrapper `max-w-7xl`, inner config `max-w-4xl`. Should use PageLayout's `maxWidth` prop and remove ad-hoc divs.
- [ ] **Spend/questions/answered cards don't match bottom sections** — different effective widths because stats have no constraint.

---

## Part 5: Validator Hardening

Make the validator catch the patterns we keep finding manually.

### New validators needed

- [ ] **`check-page-layout.js`** — flag ad-hoc `max-w-* mx-auto` in route files. Pages should use `<PageLayout maxWidth="...">`.
- [ ] **`check-empty-state-size.js`** — flag `<EmptyState>` without `size="compact"` inside popovers/panels (narrow containers).

### Existing validator improvements

- [ ] **`check-raw-tailwind.js`** — tighten baseline. Many baselined files have been partially cleaned up. Re-audit and shrink the baseline set.
- [ ] **`check-layout-prop-usage.js`** — add rule for `<Flex className="justify-between">` → `<Flex justify="between">` if not already covered.

---

## Part 6: Screenshot Coverage (dev server runs on localhost:5555)

### Routes not yet captured

- [ ] Portal page (`/portal/$token`)
- [ ] Onboarding flow (`/onboarding`)
- [ ] Invoice detail (`/$orgSlug/invoices/$invoiceId`)

### Modals not yet captured

- [ ] Dashboard customize modal, move document dialog, avatar/cover upload modals
- [ ] Confirm dialog, alert dialog, markdown preview modal

### Interactive states not yet captured

- [ ] Board: column empty, WIP limit warning
- [ ] Issues: draft restoration, duplicate detection, inline editing, side panel
- [ ] Documents: locked, table/code blocks, color picker, favorites
- [ ] Calendar: drag-and-drop, quick-add
- [ ] Sprints: completion modal, date overlap warning
- [ ] Notifications: snooze popover
- [ ] Settings: profile with avatar/cover, 2FA setup, workspace/project settings
- [ ] Navigation: sidebar favorites, project tree, mobile hamburger
- [ ] Error: permission denied, loading skeletons, toasts, form validation

### CI integration (blocked — screenshots are gitignored)

- [ ] CI screenshot manifest check — blocked until screenshots are either generated in CI or committed to git. Use `node scripts/screenshot-diff.js` locally for now.

---

## Part 7: Visual Facelift (after Parts 1-5)

- [ ] Review screenshot set and rank pages by visual quality (1-5).
- [ ] Pick bottom 5 pages for first facelift batch.
- [ ] Fix spacing, hierarchy, patterns, clutter per page.
- [ ] No nested cards, mismatched patterns, cramped layouts.
- [ ] Before/after comparison using screenshot diff tool.

---

## Execution Order

1. **Page layout consistency (Part 1)** — migrate all pages to PageLayout, add validator.
2. **Notification popover (Part 2)** — fix visual structure.
3. **Workspace card (Part 3)** — fix badge wrapping, layout consistency.
4. **Assistant page (Part 4)** — fix width alignment.
5. **Validator hardening (Part 5)** — catch these patterns automatically.
6. **Screenshot coverage (Part 6)** — expand captures (needs browser).
7. **Visual facelift (Part 7)** — page-level improvements.
