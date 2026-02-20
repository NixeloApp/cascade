# Convex Performance Guidelines

Best practices for performant Convex queries and mutations in Nixelo.

## Query Performance

### Use Indexes

```typescript
// ❌ BAD: Full table scan
const issues = await ctx.db.query("issues")
  .filter(q => q.eq(q.field("projectId"), projectId))
  .collect();

// ✅ GOOD: Index lookup
const issues = await ctx.db.query("issues")
  .withIndex("by_project", q => q.eq("projectId", projectId))
  .collect();
```

### Index Design

1. **Put equality fields first** in composite indexes
2. **Range/inequality fields last** (only one allowed)
3. **Order matters** - `["projectId", "status"]` ≠ `["status", "projectId"]`

```typescript
// Good: equality → equality → range
.index("by_project_status_created", ["projectId", "status", "createdAt"])

// Query uses first 2 fields for equality, 3rd for ordering
.withIndex("by_project_status_created", q =>
  q.eq("projectId", id).eq("status", "todo")
)
.order("desc")
```

### Avoid Redundant Indexes

```typescript
// ❌ Redundant: single-field covered by composite
.index("by_project", ["projectId"])
.index("by_project_status", ["projectId", "status"])

// ✅ Keep only composite (covers both query patterns)
.index("by_project_status", ["projectId", "status"])
```

## Bounded Queries

### Use `.take()` Instead of `.collect()`

```typescript
import { safeCollect, BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";

// ❌ BAD: Unbounded - could load 100k docs
const issues = await ctx.db.query("issues").collect();

// ✅ GOOD: Bounded with limit
const issues = await safeCollect(
  ctx.db.query("issues").withIndex("by_project", q => q.eq("projectId", id)),
  1000,
  "project issues"
);
```

### Available Helpers

```typescript
import {
  safeCollect,           // Drop-in .collect() replacement with limit
  boundedCollect,        // Returns { items, hasMore, limit }
  boundedCount,          // Returns { count, isExact, limit }
  boundedCollectWithFilter, // For in-memory filtering
  BOUNDED_LIST_LIMIT,    // 1000 - general lists
  BOUNDED_SEARCH_LIMIT,  // 200 - search results
  BOUNDED_RELATION_LIMIT, // 500 - per-parent relations
} from "./lib/boundedQueries";
```

### Pagination for Large Lists

```typescript
// Use Convex pagination for infinite scroll
export const listIssues = query({
  args: {
    projectId: v.id("projects"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("issues")
      .withIndex("by_project", q => q.eq("projectId", args.projectId))
      .paginate(args.paginationOpts);
  },
});
```

## Batch Operations

### Parallel Fetches

```typescript
// ❌ BAD: Sequential N+1 queries
for (const issue of issues) {
  const assignee = await ctx.db.get(issue.assigneeId);
}

// ✅ GOOD: Parallel batch fetch
const assigneeIds = issues.map(i => i.assigneeId).filter(Boolean);
const assignees = await Promise.all(assigneeIds.map(id => ctx.db.get(id)));
const assigneeMap = new Map(assignees.map(a => [a?._id, a]));
```

### Use Batch Helpers

```typescript
import { batchFetchUsers } from "./lib/batchHelpers";

// Fetches all users in parallel, returns Map<Id, User>
const userMap = await batchFetchUsers(ctx, userIds);
```

## Filter vs Index

### When to Use `.filter()`

- **Soft delete checks** - `filter(notDeleted)` after index
- **Complex conditions** - OR logic, computed values
- **Rare queries** - Not worth adding an index

### When to Add Index

- **High-traffic queries** - Dashboard, list views
- **Large tables** - >1000 documents
- **Equality checks** - On specific field values

```typescript
// Filter OK: small result set from index
const issues = await ctx.db.query("issues")
  .withIndex("by_project", q => q.eq("projectId", id))
  .filter(notDeleted) // OK: filtering small set
  .collect();

// Should use index: filtering large table
// ❌ Scans all users
const admins = await ctx.db.query("users")
  .filter(q => q.eq(q.field("role"), "admin"))
  .collect();

// ✅ Use index
const admins = await ctx.db.query("users")
  .withIndex("by_role", q => q.eq("role", "admin"))
  .collect();
```

## Actions vs Queries/Mutations

### Minimize ctx.runQuery in Mutations

```typescript
// ❌ Unnecessary: calling query from mutation
const user = await ctx.runQuery(internal.users.getUser, { id: userId });

// ✅ Direct DB access
const user = await ctx.db.get(userId);
```

### When to Use ctx.runQuery

- **In actions** - Actions can't access DB directly
- **Cross-cutting logic** - Reusing complex query logic
- **Transactional boundaries** - When you need isolation

## Rate Limiting

Use the persistent rate limiter for API endpoints:

```typescript
import { rateLimit } from "./rateLimits";

// In mutation handler
await rateLimit(ctx, {
  name: "createIssue",
  key: ctx.userId
});
```

### Pre-configured Limits

| Name | Rate | Period | Use Case |
|------|------|--------|----------|
| `aiChat` | 10 | 1 min | AI chat messages |
| `aiSuggestion` | 20 | 1 hour | AI suggestions |
| `semanticSearch` | 30 | 1 min | Vector search |
| `createIssue` | 10 | 1 min | Issue creation |
| `apiEndpoint` | 100 | 1 min | REST API |

## Search Indexes

### Full-Text Search

```typescript
// Define in schema
.searchIndex("search_title", {
  searchField: "searchContent",
  filterFields: ["projectId"],
})

// Query
const results = await ctx.db.query("issues")
  .withSearchIndex("search_title", q =>
    q.search("searchContent", query)
     .eq("projectId", projectId)
  )
  .take(20);
```

### Search Tips

1. **Combine with filter fields** for scoping
2. **Limit results** - search can return many matches
3. **Use searchContent field** - pre-computed concatenation of searchable fields

## Monitoring

### Query Performance

- Check Convex dashboard for slow queries
- Look for queries scanning many documents
- Watch for timeout errors

### Memory Usage

- Large `.collect()` calls
- Unbounded loops with DB operations
- Actions holding large data in memory

## Quick Reference

| Pattern | Use When | Example |
|---------|----------|---------|
| `.withIndex()` | Filtering on indexed fields | `withIndex("by_project", ...)` |
| `.filter()` | Complex/rare conditions | `filter(notDeleted)` |
| `.take(n)` | Limiting results | `take(100)` |
| `.first()` | Getting single doc | `first()` |
| `.paginate()` | Infinite scroll | `paginate(opts)` |
| `safeCollect()` | Bounded collection | `safeCollect(query, 1000)` |
| `Promise.all()` | Parallel fetches | `Promise.all(ids.map(...))` |
