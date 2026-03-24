# Tailwind-to-CVA Consolidation

> **Priority:** P3
> **Status:** Ongoing maintenance

## Current State

86 files / 127 violations baselined (was 102 / 146 → was 148 / 436). Validator catches new violations via ratchet.

Improvements this round:
- Added `size` prop to `Progress` component (sm/md/lg) — eliminated 4 h-1.5 violations
- Added `section`/`sectionCompact` padding to `Container` — eliminated 6 inline style violations in Landing pages
- Converted `SIZE_CLASSES` object map in AIAssistantButton to a function — eliminated 3 hidden-class violations
- Replaced `style={{ minWidth: 0 }}` with `className="min-w-0"` in 3 Landing components
- Fixed `_match` → `fullMatch` unused parameter in outreach helpers
- Added `helpers.ts` to color audit boundary (email templates need inline colors)
- Parallelized sequential `ctx.db.insert` loop in sendEngine
- Ratcheted baselines: removed 7 files entirely, lowered 8 files

## Styling Contract

- Tailwind-first for static feature/page layout
- `cva()` for shared primitive/component semantics only
- If a pattern repeats, extract a component; if not, keep it raw Tailwind
- Do not create local style objects or class-string hiding

## Top Violation Files

| File | Count |
|------|-------|
| RoadmapView.tsx | 4 |
| IssueCard.tsx | 4 |
| calendar-body-month.tsx | 4 |
| RoadmapHeaderControls.tsx | 3 |
| DocumentTree.tsx | 3 |
| GlobalSearch.tsx | 3 |
| ProductShowcase.tsx | 3 |
| ProjectsList.tsx | 3 |

## Remaining Violation Categories

| Category | Count | Fix Strategy |
|----------|-------|-------------|
| Margin (mb-N, mt-N, ml-N) | 41 | Composition — mostly legitimate layout spacing |
| Width (w-N) | 27 | Mostly SelectTrigger/dropdown widths — appropriate |
| Padding (p-N, px-N, py-N) | 31 | Wrapper div padding — composition |
| Height (h-N) | 11 | Mixed: chart sizing, SVG overlays |
| Opacity (opacity-N) | 4 | Conditional state styling |
| Other (flex, delay, animation) | 4 | Edge cases |

## How to Fix

Most remaining violations are legitimate composition-level Tailwind per the contract. Further reduction requires:
- Adding more semantic props to primitives (diminishing returns)
- Extracting repeated layout patterns into components (when patterns emerge)
- Visual verification via `pnpm screenshots` for any spacing changes
