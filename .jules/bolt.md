## 2025-05-23 - Optimization of Selectable Issues List
**Learning:** Filtering large datasets in memory (e.g., excluding subtasks from all project issues) is a major bottleneck when the excluded set grows large.
**Action:** Instead of fetching all items and filtering, use parallel index queries for the *included* types (`Promise.all(types.map(...))`). This pushes filtering to the database index, significantly reducing data transfer and memory usage.
