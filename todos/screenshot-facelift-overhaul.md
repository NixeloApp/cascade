# Visual Facelift & Layout Consistency

> **Priority:** P0
> **Status:** Active
> **Last Updated:** 2026-03-17
> **Objective:** Fix systemic layout inconsistency, broken component visuals, and establish enforceable patterns.

---

## Part 1: Page Layout Wrapper Consistency

The app has `PageLayout`, `PageHeader`, `PageContent` components but 10+ pages bypass them with ad-hoc `max-w-*` divs and custom padding. This creates inconsistent spacing, widths, and visual rhythm across pages.

### Pages rolling their own layout (must migrate to PageLayout)

- [x] **`assistant.tsx`** — ~~wraps content in `<div className="p-6 max-w-7xl mx-auto">` inside PageLayout~~ Fixed: uses `PageLayout maxWidth="xl"`, removed ad-hoc wrapper and inner `max-w-4xl`.
- [x] **`workspaces/$workspaceSlug/settings.tsx`** — Fixed: removed ad-hoc header div and `mx-auto py-6` (parent workspace layout provides PageLayout + PageHeader). Kept `max-w-3xl` as inner content constraint.
- [x] **`workspaces/$workspaceSlug/teams/$teamSlug/settings.tsx`** — Fixed: same cleanup as workspace settings.
- [x] **`workspaces/$workspaceSlug/wiki.tsx`** — N/A: tab panel inside parent PageLayout, raw Grid is correct here.
- [x] **`workspaces/$workspaceSlug/teams/$teamSlug/wiki.tsx`** — N/A: same as workspace wiki, already inside parent PageLayout.
- [x] **`my-issues.tsx`** — Fixed: wrapped in PageLayout, title moved to PageHeader with segmented control as actions.
- [x] **`settings/profile.tsx`** — Fixed: removed className override on PageHeader, uses default padding.

### Pages with custom headers (deferred — too specialized for PageHeader)

- [ ] **`projects/$key/board.tsx`** — sprint selector, progress bar, export button, separate FilterBar. Too coupled to board logic for simple PageHeader migration.
- [ ] **`projects/$key/route.tsx`** — tab navigation with conditional mobile/desktop layouts, backdrop-blur wrapper. Fundamentally different from PageHeader purpose.
- [ ] **`calendar.tsx`** — two scope-filter selects. Simplest of the three but responsive widths need PageHeader support first.

### Validator: enforce PageLayout usage

- [ ] **Add `check-page-layout.js` validator** — scan route files in `src/routes/_auth/_app/` for ad-hoc `max-w-*` + `mx-auto` patterns that should use PageLayout. Flag `max-w-{sm,md,lg,xl,2xl,3xl,4xl,5xl,6xl,7xl}` + `mx-auto` in route files as violations.

---

## Part 2: Notification Popover — Still Looks Wrong

Scroll is fixed but the visual structure is broken.

- [x] **Empty state too tall** — Fixed: added `size="compact"` to EmptyState in notification popover.
- [x] **3-tier background color mess** — Fixed: simplified to 2-tier. Section headers now use `bg-ui-bg` (same as header), footer uses `border-t` for separation.
- [x] **No gap between date groups** — Fixed: added `gap="xs"` between date groups.
- [x] **Header/footer border inconsistency** — Fixed: removed inner `rounded-t-lg`/`rounded-b-lg`, outer PopoverContent handles rounding.
- [x] **`max-h-popover-panel` (80vh) too aggressive** — N/A: panel uses flex + overflow-y-auto, so max-h only caps the upper bound. With few notifications it naturally sizes to content.

---

## Part 3: Workspace Card — Broken Layout

- [x] **"1 team" badge wraps to 2 lines** — Fixed: removed `wrap` from workspace card footer Flex.
- [x] **Badge lacks `shrink-0`** — Fixed: added `shrink-0` to "Open workspace" badge.
- [x] **Metadata double-wrap** — N/A: footer Flex has no `wrap`, Metadata in footer has no `wrap`. Compact variant's badge Flex has `wrap` which is correct for badges.
- [x] **Compact vs standard layout inconsistency** — N/A: compact uses Grid (footer naturally positioned), standard uses Flex column (needs `mt-auto`). Both correct for their layouts.
- [x] **Card padding inconsistency** — Fixed: both compact and standard variants now use `padding="lg"` prop instead of `className="p-6"`.

---

## Part 4: Assistant Page — Width Alignment

- [x] **Stats section has no max-width** — Fixed: PageLayout `maxWidth="xl"` constrains both sections equally.
- [x] **Nested max-width** — Fixed: removed ad-hoc wrapper and inner `max-w-4xl`, using PageLayout prop.
- [x] **Spend/questions/answered cards don't match bottom sections** — Fixed: both sections now share the same PageLayout constraint.

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
