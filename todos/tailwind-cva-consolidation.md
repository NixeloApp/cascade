# Tailwind-to-CVA Consolidation

> **Priority:** P1
> **Status:** Needs explicit file-by-file cleanup
> **Last Updated:** 2026-03-26

## Goal

- [ ] Reduce raw Tailwind debt in the highest-noise files.
- [ ] Keep one-off layout in raw Tailwind when it is local and readable.
- [ ] Extract shared APIs only when the same semantics repeat across multiple call sites.
- [ ] Avoid feature-local shadow design systems made of class maps or one-off `cva()` helpers.

## Current Read

- [ ] The main problem is not “too little CVA.” The main problem is oversized components with too many inline layout decisions and repeated local patterns.
- [ ] None of the top debt files currently define `cva()` locally; the work is mostly composition cleanup, shell extraction, and repeated class cluster removal.
- [ ] The best next pass is 1-3 files at a time, not a repo-wide conversion sweep.

## Priority Order

### Tier 1: Dense repeated local composition

### Tier 2: Smaller follow-up passes

- [ ] `src/components/Roadmap/RoadmapHeaderControls.tsx`
  Current shape: ~188 lines, ~1 `className=` site.
  Cleanup target: likely low priority now; only revisit if `RoadmapView.tsx` cleanup leaves obvious repeated control semantics.

## Done Criteria

- [ ] Each touched file gets smaller or materially easier to reason about.
- [ ] Repeated shells move into an owned primitive/helper only when used more than once or when they encode a real semantic contract.
- [ ] No new feature-local `cva()` helpers unless they are clearly reusable and would be wrong to leave inline.
- [ ] No new reusable class-string maps that bypass the shared primitive layer.
- [ ] Screenshot-owned routes get visual verification after spacing/shell changes.

## Explicit Non-Goals

- [ ] Do not convert every class list into `cva()` just because it is long.
- [ ] Do not create generic spacing primitives that only hide local layout intent.
- [ ] Do not rewrite stable shared UI primitives unless the cleanup is truly cross-surface and reusable.
