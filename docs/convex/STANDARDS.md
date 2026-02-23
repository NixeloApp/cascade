# Convex Backend Standards

> **IMPORTANT**: These standards are enforced by the validation script (`scripts/validate/check-convex-patterns.js`).
> All Convex code MUST follow these patterns to pass CI.

## 1. Envelope Pattern for Mutation Returns

**RULE**: All mutations that create resources MUST return an object, not a raw ID.

### Why?

1. **Consistency** - All mutations return objects, making the API predictable
2. **Extensibility** - Easy to add fields without breaking existing code
3. **Self-documenting** - The return shape is explicit via `returns` validator
4. **Type safety** - TypeScript knows exactly what you get back

### Pattern

```typescript
// CORRECT - Envelope Pattern
export const createProject = authenticatedMutation({
  args: { /* ... */ },
  returns: v.object({
    projectId: v.id("projects"),
  }),
  handler: async (ctx, args) => {
    const projectId = await ctx.db.insert("projects", { /* ... */ });
    return { projectId };
  },
});

// Usage in tests/frontend:
const { projectId } = await mutation(api.projects.createProject, { /* ... */ });
```

```typescript
// WRONG - Raw ID return
export const createProject = authenticatedMutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const projectId = await ctx.db.insert("projects", { /* ... */ });
    return projectId;  // BAD: Returns raw ID
  },
});
```

### Return Type Patterns by Mutation Type

| Mutation Type | Return Pattern | Example |
|--------------|----------------|---------|
| Create | `{ <resource>Id: v.id("table") }` | `{ projectId: v.id("projects") }` |
| Create with extra data | `{ <resource>Id, ...fields }` | `{ organizationId, slug }` |
| Update | `{ success: true, <resource>Id }` | `{ success: true, projectId }` |
| Delete/Soft Delete | `{ success: true, deleted: true }` | `{ success: true, deleted: true }` |
| Restore | `{ success: true, restored: true }` | `{ success: true, restored: true }` |
| Action | `{ success: true }` | `{ success: true }` |
| Bulk operations | `{ updated: number }` | `{ updated: 5 }` |

### Explicit `returns` Validator

All mutations SHOULD have an explicit `returns` validator:

```typescript
export const createTeam = organizationMemberMutation({
  args: { /* ... */ },
  returns: v.object({
    teamId: v.id("teams"),
    slug: v.string(),
  }),
  handler: async (ctx, args) => {
    // ...
    return { teamId, slug };
  },
});
```

---

## 2. Security: Organization Membership Validation

**RULE**: When adding a user to a project/team, ALWAYS verify they are an organization member first.

### Pattern

```typescript
export const addProjectMember = projectAdminMutation({
  args: { userEmail: v.string(), role: projectRoles },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.userEmail))
      .first();

    if (!user) throw notFound("user");

    // REQUIRED: Verify organization membership before adding to project
    const isMember = await isOrganizationMember(ctx, ctx.project.organizationId, user._id);
    if (!isMember) {
      throw validation(
        "userEmail",
        "User must be a member of the organization to be added to this project",
      );
    }

    // Then proceed with adding to project...
  },
});
```

### Why?

Without this check, a malicious admin could add ANY user (even from other organizations) to their project, potentially leaking data or causing confusion.

---

## 3. Authentication & Authorization

### Always Check Auth

```typescript
// Use authenticated custom functions
export const myQuery = authenticatedQuery({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    // ctx.userId is guaranteed to exist
    // For raw functions, always check:
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
  },
});
```

### Use Role-Based Custom Functions

| Function | Use When |
|----------|----------|
| `authenticatedQuery` | Basic auth required |
| `authenticatedMutation` | Basic auth required |
| `projectQuery` | Access to specific project needed |
| `projectAdminMutation` | Project admin role required |
| `organizationQuery` | Organization context needed |
| `organizationMemberMutation` | Organization member role required |
| `teamQuery` | Team access needed |
| `teamLeadMutation` | Team lead/admin role required |

---

## 4. Error Handling

### Use Typed Errors

```typescript
import { conflict, forbidden, notFound, validation } from "./lib/errors";

// Correct error usage
if (!project) throw notFound("project", projectId);
if (!hasAccess) throw forbidden("member");
if (existing) throw conflict("Project key already exists");
if (name.length < 2) throw validation("name", "Name must be at least 2 characters");
```

### Error Types

| Error | HTTP Equivalent | When to Use |
|-------|-----------------|-------------|
| `notFound(resource, id?)` | 404 | Resource doesn't exist |
| `forbidden(role?, message?)` | 403 | User lacks permission |
| `conflict(message)` | 409 | Resource already exists |
| `validation(field, message)` | 400 | Invalid input |

---

## 5. Query Optimization

### Always Use Indexes

```typescript
// CORRECT - Uses index
const project = await ctx.db
  .query("projects")
  .withIndex("by_key", (q) => q.eq("key", args.key))
  .first();

// WRONG - Full table scan
const project = await ctx.db
  .query("projects")
  .filter((q) => q.eq(q.field("key"), args.key))
  .first();
```

### Soft Delete Filtering

```typescript
import { notDeleted } from "./lib/softDeleteHelpers";

// Correct - Filter out deleted items
const items = await ctx.db
  .query("projects")
  .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
  .filter(notDeleted)
  .collect();
```

### Bounded Queries

```typescript
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";

// Always limit unbounded queries
const members = await ctx.db
  .query("projectMembers")
  .withIndex("by_project", (q) => q.eq("projectId", projectId))
  .filter(notDeleted)
  .take(BOUNDED_LIST_LIMIT);  // Max 100 items
```

---

## 6. Audit Logging

### Log Important Actions

```typescript
import { logAudit } from "./lib/audit";

export const createProject = authenticatedMutation({
  // ...
  handler: async (ctx, args) => {
    const projectId = await ctx.db.insert("projects", { /* ... */ });

    // Log the action
    await logAudit(ctx, {
      action: "project_created",
      actorId: ctx.userId,
      targetId: projectId,
      targetType: "projects",
      metadata: {
        name: args.name,
        key: args.key,
      },
    });

    return { projectId };
  },
});
```

### Standard Action Names

| Action | Pattern |
|--------|---------|
| Create | `<resource>_created` |
| Update | `<resource>_updated` |
| Delete | `<resource>_deleted` |
| Restore | `<resource>_restored` |
| Member added | `member_added` |
| Member removed | `member_removed` |
| Role changed | `member_role_updated` |

---

## 7. Import Conventions

### Prefer Static Imports

```typescript
// CORRECT - Static import at top of file
import { isOrganizationMember } from "./lib/organizationAccess";

// AVOID - Dynamic import (use only when necessary for code splitting)
const { isOrganizationMember } = await import("./lib/organizationAccess");
```

Dynamic imports are acceptable only when:
- The import is used in only one rare code path
- The module is very large and would bloat the main bundle

---

## 8. Test Patterns

### Use Test Helpers

```typescript
import { convexTest } from "convex-test";
import { createTestContext, createProjectInOrganization } from "./testUtils";

describe("Feature", () => {
  it("should work", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, workspaceId, asUser } = await createTestContext(t);

    // Use API calls with destructuring (Envelope Pattern)
    const { projectId } = await asUser.mutation(api.projects.createProject, {
      name: "Test Project",
      key: "TEST",
      organizationId,
      workspaceId,
      boardType: "kanban",
    });

    // Assertions...
  });
});
```

### Destructure API Returns

```typescript
// CORRECT - Destructure the envelope
const { projectId } = await asUser.mutation(api.projects.createProject, { /* ... */ });
const { organizationId, slug } = await asUser.mutation(api.organizations.createOrganization, { /* ... */ });

// WRONG - Assume raw ID
const projectId = await asUser.mutation(api.projects.createProject, { /* ... */ });
```

---

## Quick Reference

| Rule | Summary |
|------|---------|
| Envelope Pattern | Return `{ resourceId }` not raw ID |
| Security Check | Verify org membership before adding to project/team |
| Returns Validator | Add `returns: v.object({...})` to all mutations |
| Indexes | Always use `.withIndex()`, never filter-only |
| Soft Delete | Filter with `notDeleted` helper |
| Bounded | Use `take(BOUNDED_LIST_LIMIT)` for lists |
| Audit | Log all create/update/delete actions |
| Errors | Use typed errors from `./lib/errors` |
| Tests | Destructure API returns: `const { projectId } = await ...` |
