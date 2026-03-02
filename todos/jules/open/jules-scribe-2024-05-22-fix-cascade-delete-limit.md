# Fix Cascade Delete Limit Bug

## Context
The `cascadeDelete`, `cascadeSoftDelete`, and `cascadeRestore` functions in `convex/lib/relationships.ts` use `BOUNDED_DELETE_BATCH` (100) to fetch child records.

```typescript
const children = await (ctx.db as unknown as GenericDatabaseWriter<AnyDataModel>)
  .query(rel.child)
  .withIndex(rel.index, (q) => q.eq(rel.foreignKey, recordId))
  .take(BOUNDED_DELETE_BATCH);
```

## Issue
If a parent record has more than 100 children (e.g., a project with 200 issues, or an issue with 150 comments), only the first 100 will be processed. The remaining children will be orphaned (for delete) or inconsistent (for soft delete/restore).

## Proposed Solution
Refactor these functions to handle all children, not just the first batch.

Possible approaches:
1.  **Iterative Deletion:** Loop until no children remain.
    ```typescript
    while (true) {
      const children = await ... .take(BOUNDED_DELETE_BATCH);
      if (children.length === 0) break;
      // process children
    }
    ```
    *Note: This works for `delete` but not `softDelete` if the query filters by `eq` on foreign key (unless we filter out already soft-deleted ones).*

2.  **Pagination:** Use `collectInBatches` from `convex/lib/boundedQueries.ts` or `paginate()`.

3.  **Recursive limit:** The current recursion might blow up the stack or memory if not handled carefully with very deep trees, but the main issue is the horizontal width (too many direct children).

## Action
Implement a safe way to cascade delete/soft-delete large numbers of children, likely using `collectInBatches` or a loop with proper filters.

## Audit (2026-03-02)

- `convex/lib/relationships.ts` still enforces `BOUNDED_DELETE_BATCH` and throws when child count exceeds the batch limit.
- The large-fanout cascade behavior is still unimplemented.
- Status: Open.

## Execution Plan (Updated 2026-03-02)

**Owner:** `@unassigned`  
**Sprint Tag:** `S1`  
**Effort:** Medium

### Steps

- [x] Replace single-batch traversal with looped/paginated traversal in cascade operations
- [x] Ensure soft-delete/restore paths avoid reprocessing already-handled rows
- [x] Add tests for fanout >100 on delete, soft-delete, and restore

## Progress Log

### 2026-03-02 - Batch A (fanout-safe cascade traversal complete)

- Decision:
  - remove overflow throw behavior and make cascade traversal intrinsically fanout-safe with bounded iterative loops.
- Change:
  - updated `convex/lib/relationships.ts`:
    - `cascadeDelete` relation handling now loops in `BOUNDED_DELETE_BATCH` chunks until no children remain.
    - `set_null` relation handling now also loops in bounded batches until fully unlinked.
    - `restrict` relation check reduced to existence probe (`take(1)`).
    - `cascadeSoftDelete` now processes only active children (`isDeleted !== true`) in bounded loops to avoid reprocessing.
    - `cascadeRestore` now processes only soft-deleted children (`isDeleted === true`) in bounded loops to avoid reprocessing.
    - removed overflow error throws tied to child-count > `BOUNDED_DELETE_BATCH`.
  - updated `convex/lib/relationships_overflow.test.ts`:
    - converted previous overflow-failure assertion into success assertions for fanout `BOUNDED_DELETE_BATCH + 1`.
    - added dedicated overflow tests for hard delete, soft delete, and restore.
- Validation:
  - `pnpm exec biome check convex/lib/relationships.ts convex/lib/relationships_overflow.test.ts` => pass (non-blocking complexity warning only)
  - `pnpm test convex/lib/relationships.test.ts convex/lib/relationships_overflow.test.ts` => pass (`7 passed`)
- Blockers:
  - none.
- Next Step:
  - optional follow-up: split `handleDeleteRelation` into smaller helpers to eliminate the complexity warning.

### 2026-03-02 - Batch B (resolution confirmation)

- Decision:
  - close as resolved; fanout overflow safety is implemented and regression-covered.
- Validation:
  - `pnpm test convex/lib/relationships.test.ts convex/lib/relationships_overflow.test.ts` => pass (`7 passed`)
  - verified overflow regression tests still assert `BOUNDED_DELETE_BATCH + 1` fanout behavior for hard delete, soft delete, and restore.
- Blockers:
  - none.
- Next Step:
  - move to Priority `04` (`jules-librarian-2026-02-23-lodash-vulnerability.md`).

### 2026-03-02 - Batch C (strict-order revalidation checkpoint)

- Decision:
  - keep this item resolved; no further code changes required after current regression rerun.
- Validation:
  - `pnpm test convex/lib/relationships.test.ts convex/lib/relationships_overflow.test.ts` => pass (`7 passed`)
  - confirmed overflow coverage still enforces safe fanout behavior at `BOUNDED_DELETE_BATCH + 1` across delete/soft-delete/restore flows.
- Blockers:
  - none.
- Next Step:
  - continue strict order with Priority `04` (`jules-librarian-2026-02-23-lodash-vulnerability.md`).
