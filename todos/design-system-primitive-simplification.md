# Design System Primitive Simplification

> **Priority:** P1
> **Status:** Open
> **Last Updated:** 2026-03-27

## Why This Is Open

- [ ] Shared primitives accumulate one-off recipes/chromes/variants instead of exposing clean, tight APIs.
- [ ] Components accept `ReactNode` for props that are always strings, forcing callers to wrap text in `<span>` just to attach test IDs.
- [ ] shadcn subcomponents leak into feature code inconsistently — Dialog/Sheet/AlertDialog are well-wrapped, but Select/Popover/Command expose raw primitives to 50+ feature files.
- [ ] The oversized variant baselines (Card 199, Button 108, Typography 71, Badge 24) and raw Tailwind allowance (102 violations, 73 files) remain untouched.

## ReactNode Prop Cleanup

Text-only props should be `string`, not `ReactNode`. The component should own its own rendering.

- [ ] **OverviewBand** — `metrics.value` and `metrics.detail` are ReactNode but 100% of callers pass strings/numbers. Change to `string | number`. This eliminates the `<span data-testid>` wrappers in TimeTrackingPage.
- [ ] **PageHeader** — `description` and `eyebrow` are ReactNode but every caller passes a plain string. Change to `string`. This eliminates the `<span data-testid>` in AnalyticsDashboard.
- [ ] **CardHeader** — `title` and `description` are ReactNode but ~95% of callers pass strings. Add a `badge` prop slot so EntityCard stops wrapping `title` in `<Flex>`. Change text props to `string`.
- [ ] **SectionIntro** — `eyebrow`, `title`, `description` are ReactNode but 98% are strings. Change to `string`.

**Rule:** Reserve `ReactNode` for `icon`, `actions`, `aside`, `badge`, `trigger`, `children` — things where the caller genuinely owns rendering. For `title`, `description`, `label`, `value` — use `string` and let the component render via `<Typography>`.

## shadcn Subcomponent Encapsulation

Follow the Dialog/Sheet/AlertDialog pattern: single wrapper component, all internals hidden.

### Critical (36+ files affected)
- [ ] **Select** — 36 files each import `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue` and reimplement their own wrapper. Create a `SelectField` component that takes `options`, `value`, `onChange` and handles all composition internally. Keep subcomponent exports for rare advanced layouts.

### High (14 files affected)
- [ ] **Popover** — 14 files manually compose `Popover` + `PopoverTrigger` + `PopoverContent`. Create common wrappers for the repeated patterns (reaction picker, inline edit popover, anchor popover).

### Medium (8 files affected)
- [ ] **Command** — 8 files import raw subcomponents. `CommandDialog` wrapper exists but most usage is raw. Create a `CommandMenu` wrapper that takes `items`, `onSelect`, `emptyMessage`.

### Already good (no action needed)
- Dialog, Sheet, AlertDialog — exemplary wrapping, 0 leakage
- DropdownMenu, Tabs — intentional subcomponent exposure, used correctly
- Tooltip — good convenience wrapper, light advanced usage
- Table — utility components, no wrapping needed

## Ban Raw HTML Elements in Production Code

- [ ] Ban `<span>` in production `src/` files (not test files). Use `<Typography>` instead — it renders a `<span>` by default and accepts `data-testid`.
- [ ] Exceptions: hidden markers (`hidden aria-hidden`), drop targets, and other structural DOM that isn't text content.
- [ ] Add validator rule for this.

## Oversized Variant Surfaces

- [ ] Simplify Card.tsx — `recipe` axis at 199 options, acts as a catch-all theme switchboard.
- [ ] Simplify Button.tsx — `chrome` (39), `chromeSize` (37), `variant` (18), `size` (14).
- [ ] Simplify Typography.tsx — `variant` (60), `color` (11).
- [ ] Review Badge.tsx — `variant` at 24.

## Raw Tailwind Ratchet

- [ ] Burn down the remaining 102 violations across 73 files.
- [ ] Start with highest-count files: calendar-body-month (4), IssueCard (4), GlobalSearch (3), ProductShowcase (3), RoadmapView (3).

## Exit Criteria

- [ ] Text-only props are `string` across OverviewBand, PageHeader, CardHeader, SectionIntro.
- [ ] Select usage drops from 36 direct-import files to near zero via SelectField wrapper.
- [ ] No raw `<span>` in production code outside documented exceptions.
- [ ] Card, Button, Typography no longer dominate the oversized-axis baseline.
- [ ] Raw Tailwind baseline is materially smaller.
