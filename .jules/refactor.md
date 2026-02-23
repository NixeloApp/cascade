# Refactor Journal

This journal tracks critical learnings and major refactoring decisions.

## 2026-02-20 - Initial Setup
- Created refactor journal.
- Refactored `convex/users.ts` to consolidate parallel project counting logic into `countByProjectParallel` helper.
- Learned: When extracting helpers for "fast path" optimizations, ensure that clamping logic (e.g. `Math.min`) is applied at the appropriate level (per-project vs global) to preserve exact behavior.

## 2026-02-20 - Documents Access Refactor
- Refactored `convex/documents.ts` to centralize document retrieval and access checks into `getAccessibleDocument` helper.
- Learned: When replacing manual checks with a helper, verify that the helper's error types (e.g., `NOT_FOUND` vs returning `null`) match the original behavior for each call site. In this case, mutations and specific queries expected `throw notFound`, which matched the helper.

## 2026-02-20 - Issues Bulk Operations Refactor
- Refactored `convex/issues/mutations.ts` to extract issue and project fetching logic into `fetchProjectsForIssues` helper.
- Learned: When extracting helpers for bulk operations, ensure that filtering logic (e.g. `!isDeleted`) matches the original implementation to preserve behavior, especially regarding return values (e.g. sums vs arrays).
- Learned: Explicitly check for required foreign keys (e.g. `projectId`) in helpers to ensure type safety and prevent runtime errors, even if the schema implies they are required.
