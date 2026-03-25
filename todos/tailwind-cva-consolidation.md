# Tailwind-to-CVA Consolidation

> **Priority:** P3
> **Status:** Ongoing ratchet
> **Last Updated:** 2026-03-25

## Current Baseline

- Raw styling debt baseline: **73 files / 102 violations**
- Validator ratchet is in place; the goal is to keep shrinking the baseline without forcing fake abstractions.

## Remaining

### Highest-Debt Files

- [ ] `RoadmapView.tsx`
- [ ] `IssueCard.tsx`
- [ ] `calendar-body-month.tsx`
- [ ] `RoadmapHeaderControls.tsx`
- [ ] `DocumentTree.tsx`
- [ ] `GlobalSearch.tsx`
- [ ] `ProductShowcase.tsx`
- [ ] `ProjectsList.tsx`

### Main Violation Buckets

- [ ] Margin utilities that are still acceptable composition in some places but should be reviewed when touched.
- [ ] Width utilities, especially repeated control widths that may justify semantic props.
- [ ] Padding wrappers that may indicate repeated shell/layout patterns.
- [ ] Height utilities around charts and overlays that may still need explicit ownership.

## Working Rule

- [ ] Extract shared semantics into primitives/components only when repetition is real.
- [ ] Keep one-off composition in raw Tailwind when abstraction would hide layout intent.
- [ ] Verify spacing/layout changes visually with screenshots when the route is screenshot-owned.
