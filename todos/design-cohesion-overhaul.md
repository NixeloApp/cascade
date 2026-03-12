# Design Cohesion Overhaul

> **Priority:** P0
> **Status:** Complete
> **Last Updated:** 2026-03-12
> **Owner:** visual-system, page-shell, and doc-quality cleanup
> **Follow-Through:** remaining screenshot-driven visual polish now lives in `todos/e2e-screenshot-quality.md`

## Why This Exists

The current visual work is too reactive.

We fixed many screenshot determinism problems, but that did not produce a cohesive product. The
remaining failures are structural:

1. page `CURRENT.md` docs got flattened into passive summaries and lost their diagnostic diagrams
2. public hero/showcase composition is not disciplined enough
3. internal app header controls are crowded and visually floating
4. search, commands, shortcuts, and advanced search do not behave like one modal family
5. our validator story mostly catches raw Tailwind usage, not design-system drift or composition slop

This doc captured the execution plan for fixing that.

## Progress Since Start

Completed:
- semantic interaction ownership foundation is in place
- `SegmentedControl` exists as the owned single-select primitive
- `RouteNav` exists as the owned route-navigation primitive
- Storybook coverage was added for both primitives
- validators now block:
  - importing exported CVA helpers outside shared ui primitives
  - using low-level `ToggleGroup` in app code outside approved special cases

What this changed:
- we should stop doing ad hoc “tab cleanup” passes
- remaining work should migrate real surfaces onto owned shells and tighten docs/review quality around them

## Non-Negotiables

- Screenshot pass does not mean design pass.
- Shared shells beat local patches.
- `CURRENT.md` docs must be useful for critique, not just status notes.
- If a surface cannot be explained as a reusable recipe, it is probably slop.

## Completed Tracks

### 1. Restore Spec Docs As Review Tools

Goal:
- bring back diagram-first `CURRENT.md` docs with sharper failure callouts

Files:
- `docs/design/specs/pages/01-landing/CURRENT.md`
- `docs/design/specs/pages/02-signin/CURRENT.md`
- `docs/design/specs/pages/06-board/CURRENT.md`
- then extend to other active pages after the first pass proves the format

Rules:
- include ASCII structure block
- identify where the layout is failing, not just what components exist
- call out screenshot-review misses explicitly when they happen

### 2. Fix Landing Hero And Product Showcase

Problem:
- `Product control tower` is squeezed
- the showcase mixes product-like density with brochure-like filler cards
- light mode still feels pasted together

Primary files:
- `src/components/Landing/HeroSection.tsx`
- `src/components/Landing/ProductShowcase.tsx`
- `src/components/Landing/NavHeader.tsx`

Target:
- hero feels authored, not assembled
- title/copy block gets real space
- showcase reads as one artifact, not several competing demos

### 3. Fix Internal Header Control Composition

Problem:
- shortcuts, timer, search, notifications, and user menu are packed into one pill and visually
  float on top of each other

Primary files:
- `src/components/App/AppHeader.tsx`
- `src/components/GlobalSearch.tsx`
- `src/components/Notifications/*`
- `src/components/TimeTracking/TimerWidget*`

Target:
- clear hierarchy between primary trigger, secondary controls, and identity
- control grouping is intentional on desktop and mobile
- header chrome stops competing with page content

### 4. Unify The Modal Family

Problem:
- search/commands, advanced search, and keyboard shortcuts have different body density, footer
  rhythm, scroll behavior, and framing
- some dialogs contain more content than fits but do not scroll well

Primary files:
- `src/components/ui/Dialog.tsx`
- `src/components/GlobalSearch.tsx`
- `src/components/KeyboardShortcutsHelp.tsx`
- `src/components/AdvancedSearchModal.tsx`

Target:
- one shared modal anatomy
- explicit scroll region strategy
- coherent header/body/footer rhythm
- visual parity between command-style and form-style overlays

### 5. Move Validators From Utility Policing To Composition Enforcement

Problem:
- `check-raw-tailwind.js` catches some class misuse, but it does not enforce recipes
- we still allow too much “rounded X bg Y px Z py Z text W” soup

Primary files:
- `scripts/validate/check-raw-tailwind.js`
- shared primitives in `src/components/ui/`

Needed next:
- define shell recipes for:
  - page headers
  - action clusters
  - modal panels
  - filter/tool bars
  - showcase/stat cards
- flag suspicious class mixtures even in allowed files
- shrink the allowlist over time instead of treating it as permanent

Done in this track already:
- CVA ownership boundary validator added
- control-ownership validator added
- route nav and segmented single-select controls now have owned primitives instead of app-level styling clones

## Execution Order

1. Restore the landing/auth/board `CURRENT.md` docs so reviews are honest again.
2. Finish app header control grouping using the new semantic control primitives.
3. Fix modal anatomy and scrolling as a shared system.
4. Fix landing hero + showcase composition.
5. Expand validator coverage from interaction ownership into shared shell recipes and class-soup detection.

## Deliverables

- Updated `CURRENT.md` docs with diagrams and sharper critique
- One resolved landing hero/showcase composition
- One resolved internal header layout
- One shared modal anatomy applied to search, advanced search, and shortcuts
- Validator expansion proposal turned into concrete rules/checks

## Checklist

- [x] Restore diagram-first style across active `CURRENT.md` docs
- [x] Redesign `ProductShowcase` hierarchy and width distribution
- [x] Recompose app-header right-side actions into intentional groups
- [x] Make search/commands modal scroll correctly when content exceeds frame
- [x] Make advanced search modal scroll and footer treatment match the family
- [x] Redesign keyboard shortcuts modal so scrolling is useful and the surface does not look improvised
- [x] Define owned semantic primitives for route nav and segmented single-select controls
- [x] Add Storybook coverage for those interaction primitives
- [x] Expand validation to enforce CVA ownership boundaries
- [x] Expand validation to enforce semantic control ownership
- [x] Define reusable recipes for header clusters, modal bodies, and showcase/stat cards
- [x] Expand validation to flag suspicious recipe drift beyond control ownership

## Done Looks Like

- A screenshot can be ugly without the docs pretending it is fine.
- Hero, header, and modal surfaces feel like one product team designed them.
- Layout changes can be nudged centrally because the main shells are recipe-based instead of ad hoc.
