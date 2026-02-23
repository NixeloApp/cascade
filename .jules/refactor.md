# Refactor Journal

This journal tracks critical learnings and major refactoring decisions.

## 2026-02-20 - Initial Setup
- Created refactor journal.
- Refactored `convex/users.ts` to consolidate parallel project counting logic into `countByProjectParallel` helper.
- Learned: When extracting helpers for "fast path" optimizations, ensure that clamping logic (e.g. `Math.min`) is applied at the appropriate level (per-project vs global) to preserve exact behavior.

## 2026-02-20 - Documents Access Refactor
- Refactored `convex/documents.ts` to centralize document retrieval and access checks into `getAccessibleDocument` helper.
- Learned: When replacing manual checks with a helper, verify that the helper's error types (e.g., `NOT_FOUND` vs returning `null`) match the original behavior for each call site. In this case, mutations and specific queries expected `throw notFound`, which matched the helper.

## 2026-02-20 - Projects Enrichment Refactor
- Refactored `convex/projects.ts` to extract `enrichProject` helper for `getProject` and `getByKey`.
- Learned: When extracting enrichment logic, separate it from access control if the access control failure behavior differs (e.g., throw vs return null). The enrichment helper should operate on an already-accessible document.

## 2026-02-20 - Organizations Efficient Count
- Refactored `getUserOrganizations` in `convex/organizations.ts` to use `efficientCount` instead of `take(1000).length`.
- Learned: When replacing naive counting with `efficientCount`, verify that the behavior around limits (e.g. 1000 items) is consistent with expectations. In this case, `efficientCount` uses the underlying `count()` operation which is much faster and doesn't load documents into memory.
