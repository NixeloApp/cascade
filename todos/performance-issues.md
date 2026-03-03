# Performance Issues

UI and backend performance optimizations.

## P2 - Project issue count uses sprint-specific limit

**File:** `convex/lib/projectIssueStats.ts`

`totalIssues` is bounded by `MAX_SPRINT_ISSUES` (a sprint-specific cap), so it will never exceed that limit even for larger projects. Produces incorrect totals.

**Fix:** Use a project-specific limit or unbounded count for project totals.

## P2 - RoadmapView missing memoization

**File:** `src/components/RoadmapView.tsx`

`issueIndexMap` and `dependencyLines` are recomputed on every render. These are O(n) / O(links) derivations that can slow down virtualized roadmap scrolling.

**Fix:** Wrap in `useMemo` keyed on `filteredIssues`, `showDependencies`, and `issueLinks`.

## Priority

P2 - Performance degradation at scale but functional.
