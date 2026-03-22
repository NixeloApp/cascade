# Tailwind-to-CVA Consolidation

> **Priority:** P2
> **Status:** In Progress
> **Last Updated:** 2026-03-22

## Problem

126 files with raw Tailwind violations, 436 total violations. But the violations aren't equal — analysis shows they cluster into a few repeating patterns that should be fixed in batches, not one-by-one.

## Styling Contract

- Tailwind-first for static feature/page layout — do not create local `cva()` helpers or string-map style systems for one-off class lists
- `cva()` is for shared primitive/component semantics, not "this file has a section/header/list" naming
- `index.css` is for tokens, global utilities, and truly shared effects — not single-page style buckets
- If a pattern repeats, extract a real component or add an owned primitive variant; if it does not repeat, keep it raw Tailwind
- Do not replace bad local `cva()` with bad local class-string objects — hidden style systems are worse
- `Icon` usage should be semantic — owned `size`/`tone` props, small color palette

## What's Done

- [x] Ratcheted 35 stale baselines (148 → 126 files)
- [x] Fixed violations in 5 files (NotificationItem, ApiKeysManager, AuthPageLayout, DocumentSidebar, OfflineTab)
- [x] Validator catches const-string class hiding (`const FOO = "w-full ..."` in `className={FOO}`)
- [x] Violation cluster analysis (see below)

## Violation Cluster Analysis

436 violations across 126 files. 223 of those are in the top 30 repeating patterns:

### Batch 1: Structural allowlist (zero-risk, ~65 violations removed)

These are correct Tailwind-first layout. Validator should stop flagging them.

| Count | Pattern | Why it's fine |
|-------|---------|---------------|
| 49x | `min-w-0` | Required for flex text truncation |
| 16x | `min-h-32` | Min-height constraint — layout concern |

### Batch 2: Sibling margins → Stack/Flex gap (~53 violations)

Margins used for spacing between siblings. Replace parent with `<Stack gap="...">`.

| Count | Files | Pattern |
|-------|-------|---------|
| 14x | 13 | `mb-2` |
| 14x | 11 | `mt-2` |
| 9x | 9 | `mt-1` |
| 8x | 6 | `mb-1` |
| 7x | 4 | `mt-3` |
| 7x | 4 | `mt-0.5` |

Each fix: read the parent, wrap children in `<Stack gap="xs|sm|md">`, remove `mt-*`/`mb-*` from children.

### Batch 3: Icon sizing → size-* or Icon prop (~19 violations)

| Count | Pattern | Fix |
|-------|---------|-----|
| 7x | `w-4 h-4` | `size-4` |
| 5x | `h-4 w-4` | `size-4` |
| 4x | `h-5 w-5` | `size-5` |
| 3x | `w-3 h-3` | `size-3` |

### Batch 4: Repeated stat-cell pattern (~10 violations)

| Count | Files | Pattern | Fix |
|-------|-------|---------|-----|
| 7x | 1 | `p-4 bg-ui-bg-secondary` | `<Card variant="section" padding="md">` — already used elsewhere in the codebase |
| 3x | 2 | `p-4` standalone | Same |

### Batch 5: Icon inline margin (~18 violations)

| Count | Pattern | Fix |
|-------|---------|-----|
| 18x | `inline mr-1` | Icon before text — should use Button/Badge leading icon API or `<Icon>` with gap from parent Flex |

## Execution Order

1. **Allowlist `min-w-0` and `min-h-32`** in the validator — removes ~65 false positives from the count
2. **Batch 3 (icon sizing)** — mechanical `h-X w-X` → `size-X`, safe, 19 violations
3. **Batch 4 (stat cells)** — replace repeated `p-4 bg-ui-bg-secondary` divs with Card variant
4. **Batch 2 (margins → gaps)** — largest batch, needs reading each context, 53 violations across 30+ files
5. **Batch 5 (icon inline margin)** — needs audit of where `inline mr-1` is used and whether a component API exists

## CVA Consolidation (after raw TW is reduced)

- [ ] Audit 10 feature-component CVA definitions — merge into `ui/` primitives or keep if truly feature-specific
- [ ] Typography: audit 30+ variants for overlap — merge variants that differ only by one property
- [ ] Badge: audit 10+ variants for overlap
- [ ] Card: audit 8+ variants
- [ ] Delete or demote one-off CVAs (0 variants, single call site)
- [ ] Audit primitive variant APIs for gaps that force local CVAs or raw TW

## Validator Improvements

- [x] Catches const-string class hiding (`const FOO = "..."` in `className={FOO}`)
- [ ] Allowlist structural patterns (`min-w-0`, `min-h-*`) so violation count reflects real debt
- [ ] Flag class-map objects (`const STYLES = { header: "...", body: "..." }`)
- [ ] Add a validator that flags new CVA definitions outside `src/components/ui/`
- [ ] Add a validator that flags CVA files with >10 variants
- [ ] Add a validator that flags feature-local CVAs with only base styles or a single call site

## Anti-patterns

| Anti-pattern | What to do instead |
|-------------|-------------------|
| Raw `className="flex items-center gap-2 px-3 ..."` repeated 3+ times | Extract a component or add a CVA variant |
| One-off CVA with 2 variants used in 1 file | Just use a component with props |
| CVA that duplicates a `ui/` primitive's variant | Add the variant to the primitive, delete the feature CVA |
| `<Icon className="text-foo h-4 w-4" />` | Use owned `size`/`tone` props |
| `cva()` with no variants (just a base) | Use `cn()` directly or a simple component |
| `const SECTION_CLASSES = { ... }` or `const FOO = "w-full ..."` | Keep raw Tailwind or extract a real component |

## Done When

- [ ] Structural patterns allowlisted — violation count reflects real debt only
- [ ] Raw TW violation count under 50 files (after allowlisting)
- [ ] Top repeating clusters resolved (batches 2-5)
- [ ] Feature-component CVAs either justified or merged into `ui/`
- [ ] No CVA definition with 0 variants (just base styles)
- [ ] Typography/Badge/Card variant counts reviewed and consolidated
