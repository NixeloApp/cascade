# Query Filter Ordering Issues

> **Priority:** P2
> **Status:** Queued
> **Last Updated:** 2026-03-12
> **Verification Summary:** `5` verified unresolved query-shape issues remain; `1` original item is already fixed in the current codebase.

Several queries apply filters **after** `take(limit)`, which can return incomplete or incorrect results when the dataset exceeds the limit.

## Pattern

```typescript
// WRONG: Filter after limit - misses matching items beyond limit
const items = await ctx.db.query("items")
  .withIndex("by_org", q => q.eq("orgId", orgId))
  .take(100);
const filtered = items.filter(i => i.status === "active"); // May miss items!

// CORRECT: Use index or filter before limit
const items = await ctx.db.query("items")
  .withIndex("by_org_status", q => q.eq("orgId", orgId).eq("status", "active"))
  .take(100);
```

## Verified Unresolved Queries

### workspaces.ts - Backlog filter
- `getBacklogIssues` takes limit, then filters `sprintId === undefined && status !== "done"`
- Fix: Add index `by_workspace_sprint` or filter in query

### workspaces.ts - Sprint issue count
- Uses `.take(BOUNDED_LIST_LIMIT).length` for count
- Fix: Use `efficientCount` or bounded count that doesn't truncate

### workspaces.ts - Cross-team dependencies
- Takes limit before evaluating link type and cross-team conditions
- Fix: Filter before limit or use appropriate index

### calendarEvents.ts - Org calendar with workspace/team filter
- `listByOrganizationDateRange` takes limit, then filters workspace/team in memory
- Fix: Use more specific index or restructure query

### invoices.ts - Client filter
- `list` takes `BOUNDED_LIST_LIMIT`, then filters by `clientId`
- Fix: Add index `by_client` or `by_org_client`

## Verified Fixed On 2026-03-12

### calendarEvents.ts - Workspace calendar with team filter
- `listByWorkspaceDateRange` now switches to a team-specific query path when `teamId` is provided, so this item no longer belongs in the unresolved queue.

## Priority

P2 - These cause incorrect results at scale but work fine for small datasets.

## Notes

- Some may need new indexes in schema.ts
- Consider if the filtered subset is small enough that client-side filtering is acceptable
- Test with datasets larger than the limit to verify fixes
