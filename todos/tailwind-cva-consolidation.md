# Tailwind-to-CVA Consolidation

> **Priority:** P2
> **Status:** In Progress
> **Last Updated:** 2026-03-22

## Problem

The codebase has 126 files with raw Tailwind violations (was 148, ratcheted down) and 48 files with CVA definitions. Most remaining violations are **legitimate structural layout** — `min-w-0` for truncation, `h-5 w-px` dividers, `max-h-64` for scrollable dropdowns, `animate-*` tokens, Skeleton sizing. These are correct uses of Tailwind-first layout.

The real remaining debt is:
- **Dumb validator**: the raw TW validator flags structural layout that is correct, while missing anti-patterns like const-string class hiding (now fixed) and class-map style systems
- **CVA sprawl**: too many one-off CVA recipes that should be primitive variants or plain components
- **Missing primitive coverage**: some common patterns force raw TW because no owned variant exists

## What's Done

- [x] Ratcheted 35 stale baselines (148 → 126 files, ~148 violation-point reduction)
- [x] Fixed violations in 5 files (NotificationItem, ApiKeysManager, AuthPageLayout, DocumentSidebar, OfflineTab)
- [x] Validator now catches const-string class hiding (`const FOO = "w-full ..."` used in `className={FOO}`)
- [x] Styling contract documented (below)

## Styling Contract

- Tailwind-first for static feature/page layout — do not create local `cva()` helpers or local string-map style systems just to name a one-off class list
- `cva()` is for shared primitive/component semantics, not for "this file has a section/header/list/icon wrapper" naming
- `index.css` is for tokens, global utilities, and truly shared decorative effects — not single-page named style buckets
- If a pattern repeats, extract a real component or add an owned primitive variant; if it does not repeat, keep it simple and local
- Do not replace bad local `cva()` with bad local class-string objects; hidden style systems are worse, not better
- `Icon` usage should be semantic — prefer owned `size`/`tone` props, keep the allowed color palette intentionally small

## Next: Make the Validator Smart

The validator currently flags every raw Tailwind token mechanically. It needs to distinguish:

### Legitimate structural layout (should NOT be flagged)

These are correct Tailwind-first patterns per the styling contract:

| Pattern | Why it's fine |
|---------|--------------|
| `min-w-0` on a Flex child | Required for text truncation in flex layouts |
| `h-5 w-px bg-ui-border` | Vertical divider — a semantic component would be over-engineering |
| `max-h-64 overflow-y-auto` | Scroll constraint on a dropdown — specific to that context |
| `animate-fade-in`, `animate-scale-in` | Animation tokens — already defined in `@theme`, just applied |
| `sr-only` | Accessibility helper — not a styling concern |
| `hidden sm:block` | Responsive visibility — layout concern, not design system |
| Skeleton sizing (`h-8 w-56`) | Skeletons need arbitrary sizes to match content shapes |

### Actual anti-patterns (SHOULD be flagged, some already are)

| Pattern | Status |
|---------|--------|
| `const CLASSES = "..."` used in `className={CLASSES}` | ✅ Now caught |
| Repeated `p-3 bg-ui-bg-secondary` div (3+ times in a file) | Partially caught by cluster check |
| `className="flex items-center gap-2"` when `<Flex align="center" gap="xs">` exists | Not caught — validator doesn't suggest component alternatives |
| `h-X w-X` when `size-X` works | Caught by fixed-size-drift validator |
| `opacity-50` on Icon when `tone="tertiary"` exists | Caught by icon-tone-drift validator |

### Validator improvements needed

- [ ] **Allowlist structural patterns**: `min-w-0`, `sr-only`, `hidden sm:*`, `animate-*` tokens, Skeleton sizing should not count as violations
- [ ] **Flag class-map objects**: `const STYLES = { header: "...", body: "..." }` used for className — same anti-pattern as const-string hiding but in object form
- [ ] **Suggest component alternatives**: when `className="flex items-center gap-2"` is flagged, suggest `<Flex align="center" gap="xs">` specifically
- [ ] **Context-aware severity**: a `p-3` on a div inside a Card is different from `p-3` on a standalone section wrapper — the first is a layout concern, the second might need a Card variant

## Phase 2: Consolidate CVA Sprawl

- [ ] Audit 10 feature-component CVA definitions (Landing pages, PageLayout) — merge into `ui/` primitives or keep if truly feature-specific
- [ ] Typography: audit 30+ variants for overlap — merge variants that differ only by one property
- [ ] Badge: audit 10+ variants for overlap
- [ ] Card: audit 8+ variants — ensure no feature-local Card recipes exist
- [ ] Delete or demote one-off CVAs (0 variants, single call site)
- [ ] Audit primitive variant APIs for gaps that force local CVAs or raw TW

## Phase 3: Enforce

- [ ] Add a validator that flags new CVA definitions outside `src/components/ui/` (feature CVAs should be rare and justified)
- [ ] Add a validator that flags CVA files with >10 variants (sign of sprawl)
- [ ] Add a validator that flags feature-local CVAs with only base styles or a single call site
- [ ] Tighten raw TW ratchet as structural allowlisting reduces false positives

## Anti-patterns to Watch

| Anti-pattern | What to do instead |
|-------------|-------------------|
| Raw `className="flex items-center gap-2 px-3 py-1.5 ..."` repeated 3+ times | Extract a component or add a CVA variant |
| One-off CVA with 2 variants used in 1 file | Just use a component with props |
| CVA in a feature component that duplicates a `ui/` primitive's variant | Add the variant to the primitive, delete the feature CVA |
| `<Icon className="text-foo h-4 w-4" />` for product semantics | Use owned `size`/`tone` props |
| `cva()` with no variants (just a base) | Use `cn()` directly or a simple component |
| `const SECTION_CLASSES = { ... }` or `const FOO = "w-full ..."` | Keep one-off layout as plain Tailwind or extract a real component |

## Done When

- [ ] Validator smart enough to distinguish structural layout from design-system violations
- [ ] Raw TW violation count reduced to <50 files (after structural patterns allowlisted)
- [ ] Feature-component CVAs either justified or merged into `ui/`
- [ ] No CVA definition with 0 variants (just base styles)
- [ ] Typography/Badge/Card variant counts reviewed and consolidated where overlapping
