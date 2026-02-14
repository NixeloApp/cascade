# Bolt's Journal

## 2024-05-24 - Soft Delete Performance Optimization
**Learning:** Convex indexes require `isDeleted` (or equivalent) to be explicitly included in the index fields to allow efficient filtering of active items at the database level. Using `.filter(notDeleted)` without index support causes full scans of all items matching other criteria, which degrades performance as the number of soft-deleted items grows.
**Action:** Always include `isDeleted` in indexes used for listing "active" items, especially for high-cardinality collections like Issues. Use `.lt("isDeleted", true)` range query to efficiently select active items (where `isDeleted` is `undefined`) while preserving sort order by creation time (implicit tie-breaker).

## 2025-05-23 - Optimization of Selectable Issues List
**Learning:** Filtering large datasets in memory (e.g., excluding subtasks from all project issues) is a major bottleneck when the excluded set grows large.
**Action:** Instead of fetching all items and filtering, use parallel index queries for the *included* types (`Promise.all(types.map(...))`). This pushes filtering to the database index, significantly reducing data transfer and memory usage.

## 2025-05-24 - Merging Paginated Lists
**Learning:** Naive array merging using `.some()` to check duplicates for paginated results (load more) becomes O(N*M) which blocks the UI thread for ~400ms when merging ~5000 items. This is especially problematic in hooks like `useSmartBoardData` that run on every data update.
**Action:** Use `Set` for O(1) duplicate checks and bulk array construction `[...existing, ...new]` instead of iterative `push`, reducing merge time to <10ms for large datasets.
