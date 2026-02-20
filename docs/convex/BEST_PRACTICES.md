# Convex Best Practices Guide

Comprehensive guide for writing Convex code in the Nixelo codebase. Follow these patterns for consistent, performant, and maintainable backend code.

**Last Updated:** 2026-01-28

---

## Table of Contents

1. [Schema Design](#1-schema-design)
2. [Queries](#2-queries)
3. [Mutations](#3-mutations)
4. [Actions](#4-actions)
5. [Error Handling](#5-error-handling)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Performance Optimization](#7-performance-optimization)
8. [Code Organization](#8-code-organization)
9. [Testing](#9-testing)
10. [Components & Utilities](#10-components--utilities)

---

## 1. Schema Design

### Table Definition

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const applicationTables = {
  issues: defineTable({
    // Required fields
    projectId: v.id("projects"),
    title: v.string(),
    status: v.string(),

    // Optional fields
    description: v.optional(v.string()),
    assigneeId: v.optional(v.id("users")),

    // Audit fields (include on all tables)
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),

    // Soft delete fields (include on deletable tables)
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_project", ["projectId"])
    .index("by_project_status", ["projectId", "status"])
    .index("by_deleted", ["isDeleted"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["projectId"],
    }),
};
```

### Index Naming Convention

| Pattern | Example | Use Case |
|---------|---------|----------|
| `by_{field}` | `by_project` | Single field lookup |
| `by_{field1}_{field2}` | `by_project_status` | Composite lookup |
| `by_{table}_{field}` | `by_user_date` | Disambiguate similar names |
| `search_{field}` | `search_title` | Full-text search |

### Index Best Practices

```typescript
// ✅ DO: Use composite indexes (covers single-field queries too)
.index("by_project_status", ["projectId", "status"])

// ❌ DON'T: Create redundant single-field index
.index("by_project", ["projectId"])  // Redundant if by_project_status exists
.index("by_project_status", ["projectId", "status"])

// ✅ DO: Keep composite index if you need different sort orders
.index("by_project", ["projectId"])  // Sort by _creationTime
.index("by_project_updated", ["projectId", "updatedAt"])  // Sort by updatedAt
```

### Validators

```typescript
// ✅ DO: Use explicit validators
status: v.union(
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("done")
),

// ✅ DO: Use v.record() for dynamic keys
metadata: v.record(v.string(), v.string()),

// ⚠️ AVOID: v.any() unless absolutely necessary
// If you must use it, document why:
/** ProseMirror snapshot - structure varies by editor version */
snapshot: v.any(),

// ❌ DON'T: Use v.any() for known structures
settings: v.any(), // Bad - define the shape instead
```

### Soft Delete Pattern

Always use soft delete for user data:

```typescript
// Schema
isDeleted: v.optional(v.boolean()),
deletedAt: v.optional(v.number()),
deletedBy: v.optional(v.id("users")),

// In queries - always filter deleted
import { notDeleted } from "./lib/softDeleteHelpers";

const items = await ctx.db.query("items")
  .withIndex("by_project")
  .filter(notDeleted)
  .collect();

// In mutations - soft delete instead of hard delete
import { softDeleteFields } from "./lib/softDeleteHelpers";

await ctx.db.patch(itemId, softDeleteFields(userId));
```

---

## 2. Queries

### Basic Query Pattern

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

export const get = query({
  args: { id: v.id("issues") },
  handler: async (ctx, args) => {
    // 1. Authenticate
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({ code: "UNAUTHENTICATED" });
    }

    // 2. Fetch data
    const issue = await ctx.db.get(args.id);
    if (!issue || issue.isDeleted) {
      throw new ConvexError({ code: "NOT_FOUND", resource: "issue" });
    }

    // 3. Check permissions
    const canAccess = await canAccessProject(ctx, issue.projectId, userId);
    if (!canAccess) {
      throw new ConvexError({ code: "FORBIDDEN" });
    }

    return issue;
  },
});
```

### Using Custom Functions (Preferred)

```typescript
import { projectQuery } from "./customFunctions";

// ✅ Cleaner - auth and permissions handled automatically
export const get = projectQuery({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    // ctx.userId, ctx.project, ctx.role available
    const issue = await ctx.db.get(args.issueId);
    if (!issue || issue.isDeleted) {
      throw new ConvexError({ code: "NOT_FOUND", resource: "issue" });
    }
    return issue;
  },
});
```

### Query Performance Rules

#### Rule 1: Use .withIndex() Before .filter()

```typescript
// ❌ BAD: .filter() scans all documents
const issues = await ctx.db.query("issues")
  .filter(q => q.eq(q.field("projectId"), projectId))
  .collect();

// ✅ GOOD: .withIndex() uses database index
const issues = await ctx.db.query("issues")
  .withIndex("by_project", q => q.eq("projectId", projectId))
  .collect();
```

#### Rule 2: Never Use Date.now() in Queries

```typescript
// ❌ BAD: Breaks caching, re-runs on every millisecond
export const getRecent = query({
  handler: async (ctx) => {
    const cutoff = Date.now() - 86400000; // Different every call!
    return await ctx.db.query("items")
      .filter(q => q.gte(q.field("createdAt"), cutoff))
      .collect();
  },
});

// ✅ GOOD: Pass time from client (rounded to minute)
export const getRecent = query({
  args: { since: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.query("items")
      .withIndex("by_created_at", q => q.gte("createdAt", args.since))
      .collect();
  },
});

// Client-side: round to nearest minute
const since = Math.floor(Date.now() / 60000) * 60000 - 86400000;
useQuery(api.items.getRecent, { since });
```

#### Rule 3: Limit Results with .take(), .first(), or Pagination

```typescript
// ❌ BAD: Unbounded - could return 100,000 documents
const allIssues = await ctx.db.query("issues")
  .withIndex("by_project")
  .collect();

// ✅ GOOD: Use .take() for known limits
const recentIssues = await ctx.db.query("issues")
  .withIndex("by_project", q => q.eq("projectId", projectId))
  .order("desc")
  .take(100);

// ✅ GOOD: Use .first() for single document
const latestIssue = await ctx.db.query("issues")
  .withIndex("by_project", q => q.eq("projectId", projectId))
  .order("desc")
  .first();

// ✅ GOOD: Use .unique() when expecting exactly one
const issue = await ctx.db.query("issues")
  .withIndex("by_key", q => q.eq("key", "PROJ-123"))
  .unique();

// ✅ GOOD: Use pagination for lists
export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db.query("issues")
      .withIndex("by_project")
      .paginate(args.paginationOpts);
  },
});
```

#### Rule 4: Avoid N+1 Queries with Batch Fetching

```typescript
// ❌ BAD: N+1 queries
const issues = await ctx.db.query("issues").collect();
const enriched = await Promise.all(
  issues.map(async (issue) => ({
    ...issue,
    assignee: issue.assigneeId ? await ctx.db.get(issue.assigneeId) : null,
  }))
);

// ✅ GOOD: Batch fetch
import { batchFetchUsers } from "./lib/batchHelpers";

const issues = await ctx.db.query("issues").collect();
const userIds = issues.map(i => i.assigneeId).filter(Boolean);
const usersMap = await batchFetchUsers(ctx, userIds);

const enriched = issues.map(issue => ({
  ...issue,
  assignee: issue.assigneeId ? usersMap.get(issue.assigneeId) : null,
}));
```

---

## 3. Mutations

### Basic Mutation Pattern

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({ code: "UNAUTHENTICATED" });
    }

    // Validate permissions
    const role = await getProjectRole(ctx, args.projectId, userId);
    if (!role || !hasMinimumRole(role, "editor")) {
      throw new ConvexError({ code: "FORBIDDEN", requiredRole: "editor" });
    }

    // Create with timestamps
    const id = await ctx.db.insert("issues", {
      ...args,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return id;
  },
});
```

### Using Custom Functions (Preferred)

```typescript
import { projectEditorMutation } from "./customFunctions";

// ✅ Cleaner - auth, project load, and role check automatic
export const create = projectEditorMutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    // ctx.userId, ctx.projectId, ctx.project, ctx.role available
    const id = await ctx.db.insert("issues", {
      projectId: ctx.projectId,
      title: args.title,
      createdBy: ctx.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return id;
  },
});
```

### Custom Function Reference

| Function | Auth | Role | Context Provided |
|----------|------|------|------------------|
| `authenticatedQuery` | ✅ | - | `userId` |
| `authenticatedMutation` | ✅ | - | `userId` |
| `projectQuery` | ✅ | viewer+ | `userId`, `projectId`, `project`, `role` |
| `projectViewerMutation` | ✅ | viewer+ | `userId`, `projectId`, `project`, `role` |
| `projectEditorMutation` | ✅ | editor+ | `userId`, `projectId`, `project`, `role` |
| `projectAdminMutation` | ✅ | admin | `userId`, `projectId`, `project`, `role` |
| `issueMutation` | ✅ | editor+ | `userId`, `issue`, `project`, `role` |

### Mutation Rules

#### Rule 1: Always Validate Arguments

```typescript
// ✅ Arguments are validated at runtime by Convex
export const update = mutation({
  args: {
    id: v.id("issues"),
    title: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
  },
  handler: async (ctx, args) => {
    // args.priority is guaranteed to be "low" | "medium" | "high"
  },
});
```

#### Rule 2: Use Transactions for Related Writes

```typescript
// ✅ All writes in one mutation are atomic
export const moveIssue = mutation({
  handler: async (ctx, args) => {
    // These all succeed or all fail together
    await ctx.db.patch(args.issueId, { status: args.newStatus });
    await ctx.db.insert("issueActivity", {
      issueId: args.issueId,
      action: "status_changed",
      // ...
    });
  },
});
```

#### Rule 3: Date.now() is OK in Mutations

```typescript
// ✅ OK - mutations are not cached
export const update = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      ...args,
      updatedAt: Date.now(), // Fine in mutations
    });
  },
});
```

---

## 4. Actions

### When to Use Actions

| Use Case | Use Query/Mutation | Use Action |
|----------|-------------------|------------|
| Read database | ✅ | ❌ |
| Write database | ✅ | ❌ |
| Call external API | ❌ | ✅ |
| Send email | ❌ | ✅ |
| Long-running task | ❌ | ✅ |
| File processing | ❌ | ✅ |

### Action Pattern

```typescript
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";

export const sendNotification = action({
  args: { userId: v.id("users"), message: v.string() },
  handler: async (ctx, args) => {
    // Actions can call queries/mutations
    const user = await ctx.runQuery(internal.users.getUser, { id: args.userId });
    if (!user) {
      throw new ConvexError({ code: "NOT_FOUND", resource: "user" });
    }

    // Actions can call external APIs
    await fetch("https://api.example.com/notify", {
      method: "POST",
      body: JSON.stringify({ email: user.email, message: args.message }),
    });

    // Record the notification
    await ctx.runMutation(internal.notifications.create, {
      userId: args.userId,
      message: args.message,
      sentAt: Date.now(),
    });
  },
});
```

### Action Rules

#### Rule 1: Never Call Actions from Frontend

```typescript
// ❌ BAD: Don't call actions from frontend
const result = await ctx.runAction(api.email.send, { ... });

// ✅ GOOD: Call mutation that schedules action
export const requestEmail = mutation({
  handler: async (ctx, args) => {
    // Record intent in database
    const emailId = await ctx.db.insert("emailQueue", { ...args });
    // Schedule action to run
    await ctx.scheduler.runAfter(0, internal.email.send, { emailId });
    return emailId;
  },
});
```

#### Rule 2: Actions Don't Retry Automatically

```typescript
// ✅ Handle failures explicitly
export const processPayment = action({
  handler: async (ctx, args) => {
    try {
      const result = await stripeClient.charge(args);
      await ctx.runMutation(internal.payments.markSuccess, { id: args.id });
    } catch (error) {
      await ctx.runMutation(internal.payments.markFailed, {
        id: args.id,
        error: error.message,
      });
      throw error; // Re-throw for visibility
    }
  },
});
```

---

## 5. Error Handling

### Use ConvexError for Application Errors

```typescript
import { ConvexError } from "convex/values";

// ✅ ConvexError data is preserved in production
throw new ConvexError({
  code: "NOT_FOUND",
  resource: "issue",
  id: args.issueId,
});

// ❌ Regular Error is redacted to "Server Error" in production
throw new Error("Issue not found");
```

### Standard Error Codes

Create `convex/lib/errors.ts`:

```typescript
import { ConvexError } from "convex/values";

export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL";

interface ErrorData {
  code: ErrorCode;
  message?: string;
  resource?: string;
  field?: string;
  requiredRole?: string;
  retryAfter?: number;
}

// Factory functions for consistent errors
export function unauthenticated(): ConvexError<ErrorData> {
  return new ConvexError({ code: "UNAUTHENTICATED" });
}

export function forbidden(requiredRole?: string): ConvexError<ErrorData> {
  return new ConvexError({ code: "FORBIDDEN", requiredRole });
}

export function notFound(resource: string, id?: string): ConvexError<ErrorData> {
  return new ConvexError({ code: "NOT_FOUND", resource, message: id ? `${resource} ${id} not found` : undefined });
}

export function validation(field: string, message: string): ConvexError<ErrorData> {
  return new ConvexError({ code: "VALIDATION", field, message });
}

export function conflict(message: string): ConvexError<ErrorData> {
  return new ConvexError({ code: "CONFLICT", message });
}

export function rateLimited(retryAfter: number): ConvexError<ErrorData> {
  return new ConvexError({ code: "RATE_LIMITED", retryAfter });
}
```

### Usage

```typescript
import { unauthenticated, forbidden, notFound } from "./lib/errors";

export const update = mutation({
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw unauthenticated();

    const issue = await ctx.db.get(args.id);
    if (!issue) throw notFound("issue", args.id);

    const role = await getProjectRole(ctx, issue.projectId, userId);
    if (!hasMinimumRole(role, "editor")) throw forbidden("editor");

    // ... update logic
  },
});
```

### Client-Side Error Handling

```typescript
import { ConvexError } from "convex/values";

try {
  await updateIssue({ id, title });
} catch (error) {
  if (error instanceof ConvexError) {
    const data = error.data as { code: string; message?: string };

    switch (data.code) {
      case "UNAUTHENTICATED":
        redirect("/signin");
        break;
      case "FORBIDDEN":
        showError("You don't have permission to do this");
        break;
      case "NOT_FOUND":
        showError("Item not found");
        break;
      case "VALIDATION":
        showError(data.message || "Invalid input");
        break;
      case "RATE_LIMITED":
        showError("Too many requests. Please wait.");
        break;
      default:
        showError("Something went wrong");
    }
  } else {
    // Unknown error
    showError("An unexpected error occurred");
    console.error(error);
  }
}
```

---

## 6. Authentication & Authorization

### Authentication Check

```typescript
import { getAuthUserId } from "@convex-dev/auth/server";

// Always check auth at the start
const userId = await getAuthUserId(ctx);
if (!userId) {
  throw new ConvexError({ code: "UNAUTHENTICATED" });
}
```

### Authorization Hierarchy

```
Organization Admin
    ↓ (can access all workspaces)
Workspace Admin/Member
    ↓ (can access workspace teams/projects)
Team Admin/Member
    ↓ (can access team projects)
Project Admin/Editor/Viewer
    ↓ (role-based access to project)
```

### RBAC Utilities

```typescript
// convex/rbac.ts
export type ProjectRole = "admin" | "editor" | "viewer";

const ROLE_HIERARCHY: Record<ProjectRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
};

export function hasMinimumRole(
  userRole: ProjectRole | null,
  requiredRole: ProjectRole
): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
```

### Permission Check Pattern

```typescript
// convex/projectAccess.ts
export async function canAccessProject(
  ctx: QueryCtx,
  projectId: Id<"projects">,
  userId: Id<"users">
): Promise<boolean> {
  // 1. Check if org admin (bypass)
  const isOrgAdmin = await isOrganizationAdmin(ctx, userId);
  if (isOrgAdmin) return true;

  // 2. Check direct project membership
  const membership = await ctx.db.query("projectMembers")
    .withIndex("by_project_user", q =>
      q.eq("projectId", projectId).eq("userId", userId)
    )
    .filter(notDeleted)
    .unique();

  if (membership) return true;

  // 3. Check if project is public within org
  const project = await ctx.db.get(projectId);
  if (project?.isPublic) {
    const isOrgMember = await isOrganizationMember(ctx, project.organizationId, userId);
    if (isOrgMember) return true;
  }

  return false;
}

export async function assertCanAccessProject(
  ctx: QueryCtx,
  projectId: Id<"projects">,
  userId: Id<"users">
): Promise<void> {
  const canAccess = await canAccessProject(ctx, projectId, userId);
  if (!canAccess) {
    throw new ConvexError({ code: "FORBIDDEN" });
  }
}
```

### Cross-Entity Validation

When a query/mutation accepts IDs for related entities, always validate they belong together:

```typescript
// ❌ BAD: No validation that sprint belongs to project
export const listByDateRange = query({
  args: { projectId: v.id("projects"), sprintId: v.optional(v.id("sprints")) },
  handler: async (ctx, args) => {
    // User could pass any sprintId from another project!
    const issues = await getIssues(ctx, args.projectId);
    return args.sprintId ? issues.filter(i => i.sprintId === args.sprintId) : issues;
  },
});

// ✅ GOOD: Validate sprint belongs to this project
export const listByDateRange = query({
  args: { projectId: v.id("projects"), sprintId: v.optional(v.id("sprints")) },
  handler: async (ctx, args) => {
    if (args.sprintId) {
      const sprint = await ctx.db.get(args.sprintId);
      if (!sprint || sprint.projectId !== args.projectId) {
        throw forbidden("Sprint not found in this project");
      }
    }
    // Now safe to use sprintId
  },
});
```

### Multi-Tenant Data Filtering

When returning stats/counts for users across projects, filter by shared project membership:

```typescript
// ❌ BAD: Returns all comments, leaking data from other projects
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const comments = await ctx.db.query("issueComments")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .collect();
    return { commentCount: comments.length };  // Leaks count from all projects!
  },
});

// ✅ GOOD: Filter by shared project membership
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const viewerId = await getAuthUserId(ctx);

    // Get projects the viewer can access
    const viewerProjects = await ctx.db.query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", viewerId))
      .collect();
    const allowedProjectIds = new Set(viewerProjects.map(m => m.projectId));

    // Get comments and filter by allowed projects
    const allComments = await ctx.db.query("issueComments")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .take(1000);

    // Batch fetch issues to check project membership
    const issueIds = [...new Set(allComments.map(c => c.issueId))];
    const issues = await Promise.all(issueIds.map(id => ctx.db.get(id)));
    const allowedIssueIds = new Set(
      issues.filter(i => i && allowedProjectIds.has(i.projectId)).map(i => i!._id)
    );

    const filteredComments = allComments.filter(c => allowedIssueIds.has(c.issueId));
    return { commentCount: filteredComments.length };
  },
});
```

### Public vs Internal Functions

```typescript
// Public - can be called from frontend
export const list = query({ ... });
export const create = mutation({ ... });

// Internal - only callable from backend
export const processInternal = internalMutation({ ... });
export const cleanupInternal = internalAction({ ... });

// Use internal for:
// - Scheduled tasks (crons, scheduler)
// - Functions called by actions
// - Admin operations not exposed to UI
```

---

## 7. Performance Optimization

### Index Strategy

```typescript
// 1. Create indexes for all query patterns
.index("by_project", ["projectId"])                    // List by project
.index("by_project_status", ["projectId", "status"])   // Filter by status
.index("by_assignee", ["assigneeId"])                  // User's issues
.index("by_key", ["key"])                              // Lookup by key

// 2. Include soft delete in filtering indexes
.index("by_project_not_deleted", ["projectId", "isDeleted"])

// 3. Add search indexes for text search
.searchIndex("search_title", {
  searchField: "title",
  filterFields: ["projectId", "status"],
})
```

### Query Optimization Checklist

- [ ] Using `.withIndex()` instead of `.filter()` where possible
- [ ] No `Date.now()` in queries
- [ ] Results limited with `.take()`, `.first()`, or pagination
- [ ] Using batch fetching for related data
- [ ] No N+1 query patterns

### Batch Enrichment Pattern

When enriching a list of items by status/category, batch all items first, then enrich once:

```typescript
// ❌ BAD: Enrich per status (N+1 on labels, users, etc.)
const enrichedByStatus: Record<string, EnrichedIssue[]> = {};
for (const [statusId, issues] of Object.entries(issuesByStatus)) {
  enrichedByStatus[statusId] = await enrichIssues(ctx, issues);  // Called N times!
}

// ✅ GOOD: Batch all, then redistribute
const allIssues = Object.values(issuesByStatus).flat();
const enrichedAll = await enrichIssues(ctx, allIssues);  // Called once

const enrichedById = new Map(enrichedAll.map((i) => [i._id, i]));
const enrichedByStatus: Record<string, EnrichedIssue[]> = {};
for (const [statusId, issues] of Object.entries(issuesByStatus)) {
  enrichedByStatus[statusId] = issues
    .map((i) => enrichedById.get(i._id))
    .filter((i): i is EnrichedIssue => i !== undefined);
}
```

### Add Limits to .collect() Queries

Always add `.take()` limits to prevent unbounded memory usage:

```typescript
// ❌ BAD: Unbounded - could return thousands
const labels = await ctx.db.query("labels")
  .withIndex("by_project", (q) => q.eq("projectId", projectId))
  .collect();

// ✅ GOOD: Bounded with sensible limit
import { MAX_LABELS_PER_PROJECT } from "./lib/queryLimits";

const labels = await ctx.db.query("labels")
  .withIndex("by_project", (q) => q.eq("projectId", projectId))
  .take(MAX_LABELS_PER_PROJECT);
```

### Denormalization

```typescript
// When to denormalize:
// - Frequently accessed together
// - Rarely changes
// - Worth the consistency overhead

// Example: Cache workspace/team IDs in issues
issues: defineTable({
  projectId: v.id("projects"),
  workspaceId: v.id("workspaces"),  // Cached from project
  teamId: v.optional(v.id("teams")), // Cached from project
  // ...
})

// Update cached fields when project changes
export const updateProjectTeam = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, { teamId: args.teamId });

    // Update all issues in project
    const issues = await ctx.db.query("issues")
      .withIndex("by_project", q => q.eq("projectId", args.projectId))
      .collect();

    await Promise.all(
      issues.map(issue =>
        ctx.db.patch(issue._id, { teamId: args.teamId })
      )
    );
  },
});
```

### Pagination

```typescript
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: {
    projectId: v.id("projects"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("issues")
      .withIndex("by_project", q => q.eq("projectId", args.projectId))
      .filter(notDeleted)
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// Frontend
const { results, status, loadMore } = usePaginatedQuery(
  api.issues.list,
  { projectId },
  { initialNumItems: 25 }
);
```

---

## 8. Code Organization

### Directory Structure

```
convex/
├── _generated/           # Auto-generated (don't edit)
├── model/               # Domain logic (business rules)
│   ├── issues.ts        # Issue validation, workflows
│   ├── projects.ts      # Project business logic
│   └── permissions.ts   # Permission calculations
├── lib/                 # Generic utilities
│   ├── errors.ts        # Error factory functions
│   ├── batchHelpers.ts  # Batch fetching
│   ├── pagination.ts    # Pagination utilities
│   └── softDeleteHelpers.ts
├── issues/              # Issue domain
│   ├── queries.ts       # Query functions
│   ├── mutations.ts     # Mutation functions
│   └── helpers.ts       # Issue-specific helpers
├── projects/            # Project domain
│   └── ...
├── schema.ts            # Database schema
├── customFunctions.ts   # Auth/RBAC wrappers
├── crons.ts             # Scheduled jobs
└── http.ts              # HTTP endpoints
```

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Queries | `{domain}/queries.ts` | `issues/queries.ts` |
| Mutations | `{domain}/mutations.ts` | `issues/mutations.ts` |
| Helpers | `{domain}/helpers.ts` or `lib/{name}.ts` | `lib/batchHelpers.ts` |
| Tests | `{module}.test.ts` | `issues.test.ts` |
| Internal functions | In same file, export as `internal` | - |

### Function Organization

```typescript
// issues/queries.ts
import { query } from "../_generated/server";
import { projectQuery } from "../customFunctions";
import { notDeleted } from "../lib/softDeleteHelpers";
import { batchFetchUsers } from "../lib/batchHelpers";

// Simple queries - use base query
export const get = query({
  args: { id: v.id("issues") },
  handler: async (ctx, args) => { ... },
});

// Project-scoped queries - use projectQuery
export const list = projectQuery({
  args: {},
  handler: async (ctx) => { ... },
});
```

### Separating Business Logic

```typescript
// model/issues.ts - Business rules
export function validateIssueTransition(
  currentStatus: string,
  newStatus: string,
  workflowStates: WorkflowState[]
): boolean {
  // Pure business logic - easy to test
  const current = workflowStates.find(s => s.id === currentStatus);
  const next = workflowStates.find(s => s.id === newStatus);
  // ... validation logic
}

// issues/mutations.ts - Thin wrapper
import { validateIssueTransition } from "../model/issues";

export const updateStatus = projectEditorMutation({
  args: { issueId: v.id("issues"), status: v.string() },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);

    // Use business logic from model
    const isValid = validateIssueTransition(
      issue.status,
      args.status,
      ctx.project.workflowStates
    );

    if (!isValid) {
      throw new ConvexError({ code: "VALIDATION", message: "Invalid transition" });
    }

    await ctx.db.patch(args.issueId, { status: args.status });
  },
});
```

---

## 9. Testing

### Test Setup

```typescript
// convex/testSetup.ts
import { modules } from "./testSetup";
import schema from "./schema";

export { modules, schema };
```

### Writing Tests

```typescript
// convex/issues.test.ts
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup";
import { createTestUser, createTestProject } from "./testUtils";

describe("issues", () => {
  describe("create", () => {
    it("should create an issue with auto-generated key", async () => {
      const t = convexTest(schema, modules);

      // Setup
      const userId = await createTestUser(t, { name: "Test User" });
      const projectId = await createTestProject(t, userId, { key: "TEST" });

      // Execute as authenticated user
      const issueId = await t.mutation(
        api.issues.create,
        { projectId, title: "Test Issue", type: "task" },
        { identity: { subject: userId } }
      );

      // Assert
      const issue = await t.run(ctx => ctx.db.get(issueId));
      expect(issue).toBeDefined();
      expect(issue?.key).toBe("TEST-1");
      expect(issue?.title).toBe("Test Issue");
    });

    it("should reject unauthenticated requests", async () => {
      const t = convexTest(schema, modules);

      await expect(
        t.mutation(api.issues.create, { projectId: "123", title: "Test" })
      ).rejects.toThrow();
    });
  });
});
```

### Test Utilities

Use `createTestContext()` for tests that need full setup (user + org + workspace + team):

```typescript
// convex/testUtils.ts - Preferred pattern
import { createTestContext } from "./testUtils";

describe("projects", () => {
  it("should create a project", async () => {
    const t = convexTest(schema, modules);

    // ✅ GOOD: One-liner for full context
    const { userId, organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

    const projectId = await asUser.mutation(api.projects.create, {
      name: "Test",
      organizationId,
      workspaceId,
    });

    expect(projectId).toBeDefined();
  });
});

// For tests needing multiple separate users (e.g., access control)
it("should deny access to non-members", async () => {
  const t = convexTest(schema, modules);

  // Setup owner with full context
  const { organizationId, asUser: asOwner } = await createTestContext(t, { name: "Owner" });

  // Create separate user (not in org)
  const outsiderId = await createTestUser(t, { name: "Outsider" });
  const asOutsider = asAuthenticatedUser(t, outsiderId);

  // ... test access control
});
```

Lower-level utilities (use when `createTestContext` is overkill):

```typescript
// Create just a user
const userId = await createTestUser(t, { name: "Test User" });

// Create user + org/workspace/team (returns IDs but not asUser)
const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, userId);

// Create authenticated test client
const asUser = asAuthenticatedUser(t, userId);
```
```

### Running Tests

```bash
# Start Convex dev server first
npx convex dev

# Run tests
pnpm test:convex

# Run with UI
pnpm test:convex:ui

# Run with coverage
pnpm test:convex:coverage
```

---

## 10. Components & Utilities

### Rate Limiting

```typescript
// Using @convex-dev/rate-limiter component
import { RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Configure default limits
});

// In mutation
export const create = mutation({
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const { ok, retryAfter } = await rateLimiter.limit(ctx, "create", userId);
    if (!ok) {
      throw new ConvexError({ code: "RATE_LIMITED", retryAfter });
    }

    // ... create logic
  },
});
```

### Action Cache

```typescript
// Cache expensive AI calls
import { ActionCache } from "@convex-dev/action-cache";
import { components } from "./_generated/api";

const cache = new ActionCache(components.actionCache);

export const suggestDescription = action({
  handler: async (ctx, args) => {
    return await cache.fetch(ctx, {
      key: `suggest:${args.title}`,
      ttl: 3600000, // 1 hour
      action: async () => {
        return await generateWithAI(args.title);
      },
    });
  },
});
```

### Aggregates

```typescript
// Fast counting with @convex-dev/aggregate
import { Aggregate } from "@convex-dev/aggregate";
import { components } from "./_generated/api";

const issueCount = new Aggregate(components.aggregate, {
  name: "issueCountByProject",
  key: (doc) => doc.projectId,
  sum: () => 1,
});

// O(log n) count instead of O(n)
const count = await issueCount.lookup(ctx, projectId);
```

### Scheduled Functions

```typescript
// Schedule background work
export const create = mutation({
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("items", args);

    // Schedule processing
    await ctx.scheduler.runAfter(0, internal.items.process, { id });

    // Schedule cleanup in 30 days
    await ctx.scheduler.runAfter(
      30 * 24 * 60 * 60 * 1000,
      internal.items.cleanup,
      { id }
    );

    return id;
  },
});
```

### Cron Jobs

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily at 9 AM UTC
crons.cron("daily digest", "0 9 * * *", internal.email.sendDailyDigest);

// Every 5 minutes
crons.interval("retry failed", { minutes: 5 }, internal.sync.retryFailed);

export default crons;
```

---

## Quick Reference

### Do's and Don'ts

| Do | Don't |
|----|-------|
| Use `ConvexError` for application errors | Use `throw new Error` (redacted in prod) |
| Use `.withIndex()` for filtering | Use `.filter()` for indexed fields |
| Pass time from client to queries | Use `Date.now()` in queries |
| Use `.take()`, `.first()`, pagination | Use `.collect()` on unbounded queries |
| Use batch fetching for related data | Make N+1 queries in loops |
| Use internal functions for scheduled tasks | Call public functions from crons |
| Define explicit validators | Use `v.any()` without documentation |

### Import Cheatsheet

```typescript
// Convex core
import { query, mutation, action, internalQuery, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id, Doc } from "./_generated/dataModel";

// Auth
import { getAuthUserId } from "@convex-dev/auth/server";

// Custom functions
import { projectQuery, projectEditorMutation, projectAdminMutation } from "./customFunctions";

// Helpers
import { notDeleted, softDeleteFields } from "./lib/softDeleteHelpers";
import { batchFetchUsers } from "./lib/batchHelpers";
import { unauthenticated, forbidden, notFound } from "./lib/errors";
```

---

## Further Reading

- [Convex Documentation](https://docs.convex.dev/)
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/)
- [The Zen of Convex](https://docs.convex.dev/understanding/zen)
- [Query Performance](https://stack.convex.dev/convex-query-performance)
- [Authorization Guide](https://stack.convex.dev/authorization)
- [Custom Functions](https://stack.convex.dev/custom-functions)
- [convex-helpers](https://github.com/get-convex/convex-helpers)
