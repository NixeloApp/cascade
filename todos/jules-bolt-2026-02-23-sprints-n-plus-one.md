# Found: Sprints N+1 Query Pattern
**Severity:** medium
**Files:** convex/sprints.ts
## Description
The `listByProject` function in `convex/sprints.ts` iterates over up to 50 sprints and performs multiple queries for each sprint to calculate issue counts (total and completed). Specifically, it runs one `efficientCount` for the total and one `efficientCount` for EACH "done" status in the workflow. If there are 3 done statuses, this results in 4 queries per sprint. For 50 sprints, this triggers ~200 concurrent queries.

This N+1 pattern increases latency and DB load, although parallelized.

## Suggested Fix
Refactor `listByProject` to reduce the number of queries per sprint.
Possible solutions:
1.  Use `efficientCount` with a `filter` on the `by_sprint` index to count "done" issues in a single query per sprint (scanning all sprint issues). This trades DB scan volume (higher) for fewer round trips (lower).
2.  If feasible, implement an aggregation query that counts issues by sprint and status for the entire project in one go (though Convex lacks native aggregation, scanning `by_project` might be too slow).
3.  Consider adding a `by_project_sprint` index if it helps optimizers.

## Why Logged
The optimization requires careful benchmarking of "scan all sprint issues" vs "scan partition of sprint issues" and might involve schema changes or complex query logic. Implementing it correctly exceeds the scope of a "small" fix.
