# Tailwind-to-CVA Consolidation

> **Priority:** P2
> **Status:** In Progress
> **Last Updated:** 2026-03-20
> **Depends on:** validator-strengthening.md (validators must block first so this work doesn't regress)

## Problem

The codebase has 148 files with raw Tailwind violations and 48 files with CVA definitions. CVA is the right tool but it's being spammed -- too many one-off CVA recipes that should either be:
- Merged into an existing primitive's variant system
- Consolidated with a nearby CVA that does the same thing
- Not a CVA at all (just a simple component with props)

The pipeline is: **less raw Tailwind -> promote repeated semantics into owned primitives -> keep one-off static layout as plain Tailwind -> merge overlapping CVAs together if they overlap**.

## Styling Contract

- [ ] Tailwind-first for static feature/page layout -- do not create local `cva()` helpers or local string-map style systems just to name a one-off class list
- [ ] `cva()` is for shared primitive/component semantics, not for "this file has a section/header/list/icon wrapper" naming
- [ ] `index.css` is for tokens, global utilities, and truly shared decorative effects -- not single-page named style buckets that should have stayed in Tailwind
- [ ] If a pattern repeats, extract a real component or add an owned primitive variant; if it does not repeat, keep it simple and local
- [ ] Do not replace bad local `cva()` with bad local class-string objects; hidden style systems are worse, not better

## Phase 1: Reduce Raw Tailwind

Target the remaining raw Tailwind violations by grouping repeated class clusters into owned abstractions.

- [ ] Audit raw TW in route files -- repeated spacing/shell/state patterns should become components or CVA variants
- [ ] Run `node scripts/validate/check-raw-tailwind.js --audit` and group violations by pattern (same class cluster = same missing abstraction)
- [ ] For each cluster of 3+ identical class sets, extract a component or add a CVA variant
- [ ] Tighten raw Tailwind rules on app surfaces -- colors, radius, spacing, and shell treatments should come from owned primitives or explicit variants, not feature-local class clusters
- [ ] Audit `className` escape-hatch usage on owned primitives -- recurring size/chrome/spacing overrides should become variants instead of one-off patches
- [ ] Audit landing/main-page files specifically for static layout that should just be Tailwind, not local CVAs or section-specific CSS

## Phase 2: Consolidate CVA Sprawl

- [ ] Audit 10 feature-component CVA definitions (Landing pages, PageLayout) -- merge into `ui/` primitives or keep if truly feature-specific
- [ ] Typography: audit 30+ variants for overlap -- merge variants that differ only by one property (e.g., `metricLabel` vs `caption` with `uppercase tracking-wider`)
- [ ] Badge: audit 10+ variants for overlap -- some may be duplicating each other with minor differences
- [ ] Card: audit 8+ variants -- ensure no feature-local Card recipes exist that should be a variant
- [ ] Look for CVA definitions in the same file that could be a single CVA with compound variants
- [ ] Delete or demote one-off CVAs that are only wrapping a base class or a single call site -- those should become plain components or existing primitive variants
- [ ] Audit primitive variant APIs for gaps that force local CVAs or local raw Tailwind -- fill the primitive first, then delete the feature-local workaround
- [ ] Landing-specific paydown: remove remaining local CVA/style-bundle debt from `FeaturesSection` and `LogoBar` without replacing it with hidden string maps or bespoke global CSS
- [ ] Audit `index.css` additions from recent landing cleanup and fold any section-specific styles back into Tailwind/shared primitives unless they are truly global/shared effects

## Phase 3: Make It Impossible to Slop

- [ ] Add a validator that flags new CVA definitions outside `src/components/ui/` (feature CVAs should be rare and justified)
- [ ] Add a validator that flags CVA files with >10 variants (sign of sprawl -- should split or rethink)
- [ ] Add a validator that flags raw Tailwind class clusters appearing 3+ times across files (should be a component)
- [ ] Tighten the raw TW validator from advisory to blocking with a ratchet (current baseline: 148 files, fail on increase)
- [ ] Add a validator that flags repeated primitive `className` overrides for size/chrome/radius/color when an owned variant should exist
- [ ] Add a validator that flags feature-local CVAs with only base styles or a single live call site
- [ ] Tighten validator coverage for hidden feature-local style systems: local class maps/constants that try to replace CVA should be penalized harder than explicit feature-local `cva()`

## Anti-patterns to Watch

| Anti-pattern | What to do instead |
|-------------|-------------------|
| Raw `className="flex items-center gap-2 px-3 py-1.5 ..."` repeated 3+ times | Extract a component or add a CVA variant |
| One-off CVA with 2 variants used in 1 file | Just use a component with props, CVA overhead isn't worth it |
| CVA in a feature component that duplicates a `ui/` primitive's variant | Add the variant to the primitive, delete the feature CVA |
| Typography variant for a single use case | Use `className` override on an existing variant, or merge with a similar variant |
| `cva()` with no variants (just a base) | Use `cn()` directly or a simple component |
| Replacing local `cva()` with `const SECTION_CLASSES = { ... }` | Keep one-off layout as plain Tailwind or extract a real component; do not create hidden local style APIs |
| Adding page/section-specific named classes to `index.css` | Keep it in Tailwind unless the style is truly global/shared or a decorative effect used across sections |

## Done When

- [ ] Raw TW violation count reduced from 148 to <50 files
- [ ] Feature-component CVAs either justified or merged into `ui/`
- [ ] No CVA definition with 0 variants (just base styles)
- [ ] Validator blocks new raw TW cluster repetition and unjustified feature CVAs
- [ ] Typography/Badge/Card variant counts reviewed and consolidated where overlapping
- [ ] Owned primitives cover the common styling needs without widespread `className` restyling escape hatches
- [ ] Static layout on landing/main-page surfaces is mostly plain Tailwind plus shared primitives, not feature-local CVAs, hidden style maps, or `index.css` escape hatches
