# Found: Sprints N+1 Query Pattern
**Severity:** medium
**Files:** convex/sprints.ts
**Status:** ✅ FIXED (2026-02-24)

## Description
The `listByProject` function in `convex/sprints.ts` iterates over up to 50 sprints and performs multiple queries for each sprint to calculate issue counts (total and completed). Specifically, it runs one `efficientCount` for the total and one `efficientCount` for EACH "done" status in the workflow. If there are 3 done statuses, this results in 4 queries per sprint. For 50 sprints, this triggers ~200 concurrent queries.

This N+1 pattern increases latency and DB load, although parallelized.

## Fix Applied
Used option 1: Changed from N queries per done status to a single query with `.filter()` using `q.or()` to match all done statuses.

**Before:** 50 sprints × (1 total + 3 done statuses) = 200 queries
**After:** 50 sprints × 2 queries = 100 queries (50% reduction)

The filter approach scans sprint issues once and applies an OR filter for all done statuses, which is more efficient than making separate indexed queries for each status.
