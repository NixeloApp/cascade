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
