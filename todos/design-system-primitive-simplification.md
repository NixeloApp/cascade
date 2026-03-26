# Design System Primitive Simplification

> **Priority:** P1
> **Status:** Open
> **Last Updated:** 2026-03-26

## Why This Is Open

- [ ] The old Tailwind/CVA hotspot pass cleaned the worst feature-local files, but the remaining styling debt has shifted into shared primitives and ratcheted leftovers.
- [ ] The validator baselines show that the biggest complexity is no longer feature-local `cva()` sprawl. It is oversized shared variant surfaces and a still-large raw Tailwind allowance across many files.
- [ ] If shared primitives keep accumulating one-off recipes/chromes/variants, we are just moving styling debt upward into the design system instead of removing it.

## Shared Primitive Surface Area

- [ ] Simplify [Card.tsx](/home/mikhail/Desktop/cascade/src/components/ui/Card.tsx).
  Current problem: the `recipe` axis is massively overloaded at `199` options and acts like a catch-all visual theme switchboard instead of a tight primitive.
- [ ] Simplify [Button.tsx](/home/mikhail/Desktop/cascade/src/components/ui/Button.tsx).
  Current problem:
  - `chrome` (`39`)
  - `chromeSize` (`37`)
  - `variant` (`18`)
  - `size` (`14`)
  have grown into a broad matrix that is hard to reason about and easy to misuse.
- [ ] Simplify [Typography.tsx](/home/mikhail/Desktop/cascade/src/components/ui/Typography.tsx).
  Current problem:
  - `variant` (`60`)
  - `color` (`11`)
  are too broad, which makes route/component authors depend on giant primitive enums instead of clearer semantic wrappers.
- [ ] Review [Badge.tsx](/home/mikhail/Desktop/cascade/src/components/ui/Badge.tsx) after the first three.
  It is smaller than the others, but `variant` is still at `24`, above the oversized-axis threshold and likely carrying presentation states that should live elsewhere.

## Raw Tailwind Ratchet Follow-Through

- [ ] Burn down the remaining raw Tailwind baseline instead of treating it as "already handled."
- [ ] Start with the highest remaining files still above the local residue floor:
  - [calendar-body-month.tsx](/home/mikhail/Desktop/cascade/src/components/Calendar/shadcn-calendar/body/month/calendar-body-month.tsx) (`4`)
  - [IssueCard.tsx](/home/mikhail/Desktop/cascade/src/components/IssueDetail/IssueCard.tsx) (`4`)
  - [GlobalSearch.tsx](/home/mikhail/Desktop/cascade/src/components/GlobalSearch.tsx) (`3`)
  - [ProductShowcase.tsx](/home/mikhail/Desktop/cascade/src/components/Landing/ProductShowcase.tsx) (`3`)
  - [RoadmapView.tsx](/home/mikhail/Desktop/cascade/src/components/RoadmapView.tsx) (`3`)
- [ ] After those, sweep the remaining `1-2` count files by pattern, not by random one-file cleanup.

## Rules For This Pass

- [ ] Do not add new shared primitive variants just to avoid touching a local component.
- [ ] Do not replace feature-local raw Tailwind debt with giant shared primitive enums unless the semantic API is genuinely reusable.
- [ ] Prefer:
  - smaller primitive surfaces
  - clearer semantic wrappers
  - fewer global recipe knobs
  over:
  - ever-growing `variant` / `recipe` / `chrome` option sets

## Exit Criteria

- [ ] `Card`, `Button`, and `Typography` no longer dominate the oversized-axis baseline the way they do now.
- [ ] The remaining raw Tailwind baseline is materially smaller and concentrated only in justified edge cases.
- [ ] Shared primitives read like stable building blocks instead of catch-all escape hatches for every visual surface.
