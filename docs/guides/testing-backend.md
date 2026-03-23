# Backend Testing with Convex

Backend integration testing for Nixelo using [convex-test](https://www.npmjs.com/package/convex-test) and [Vitest](https://vitest.dev/).

## Quick Start

```bash
# 1. Start Convex dev server (required)
npx convex dev

# 2. Run backend tests (in another terminal)
pnpm test:convex

# Interactive UI
pnpm test:convex:ui

# Coverage report
pnpm test:convex:coverage
```

## Prerequisites

- **Active Convex deployment** - You must have Convex configured locally
- **Environment file** - `.env` or `.env.local` with Convex settings
- **Running dev server** - `npx convex dev` must be running

## Architecture

```
convex/
├── schema.ts              # Database schema
├── testUtils.ts           # Test helper functions (createTestUser, etc.)
├── vitest.convex.config.ts # Test configuration (separate from frontend)
├── rbac.ts                # RBAC module (example)
├── rbac.test.ts           # Test file (example)
├── issues/
│   ├── helpers.test.ts    # Issue helper tests
│   ├── queries.test.ts    # Issue query tests
│   └── mutations.test.ts  # Issue mutation tests
├── lib/
│   ├── encryption.test.ts # Encryption utility tests
│   ├── errors.test.ts     # Error helper tests
│   ├── pagination.test.ts # Pagination tests
│   ├── queryLimits.test.ts # Query limit tests
│   ├── timeUtils.test.ts  # Time utility tests
│   ├── constrainedValidators.test.ts # Validator tests
│   └── softDeleteHelpers.test.ts # Soft delete tests
└── ... (42 test files total)
```

## Test Setup

### Test Utilities

**File:** `convex/testUtils.ts`

```typescript
import type { TestConvex } from "convex-test";
import type { Id } from "./_generated/dataModel";
import type schema from "./schema";

type TestCtx = TestConvex<typeof schema>;

// Create a test user
export async function createTestUser(
  t: TestCtx,
  userData?: { name?: string; email?: string }
): Promise<Id<"users">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      name: userData?.name || `Test User ${Date.now()}`,
      email: userData?.email || `test${Date.now()}@example.com`,
      emailVerificationTime: Date.now(),
    });
  });
}

// Create a test project
export async function createTestProject(
  t: TestCtx,
  creatorId: Id<"users">,
  projectData?: {
    name?: string;
    key?: string;
    isPublic?: boolean;
  }
): Promise<Id<"projects">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("projects", {
      name: projectData?.name || `Test Project ${Date.now()}`,
      key: projectData?.key || `TEST${Date.now().toString().slice(-6)}`,
      createdBy: creatorId,
      // ... other fields
    });
  });
}

// Add a project member
export async function addProjectMember(
  t: TestCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
  role: "admin" | "editor" | "viewer",
  addedBy: Id<"users">
): Promise<Id<"projectMembers">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("projectMembers", {
      projectId,
      userId,
      role,
      addedBy,
      addedAt: Date.now(),
    });
  });
}

// Create a test issue
export async function createTestIssue(
  t: TestCtx,
  projectId: Id<"projects">,
  reporterId: Id<"users">,
  issueData?: {
    title?: string;
    type?: "task" | "bug" | "story" | "epic";
    priority?: "lowest" | "low" | "medium" | "high" | "highest";
  }
): Promise<Id<"issues">> {
  // ... implementation
}
```

## Writing Tests

### Basic Test Structure

```typescript
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "./schema";
import { createTestUser, createTestProject } from "./testUtils";

describe("MyModule", () => {
  it("should do something", async () => {
    const t = convexTest(schema);

    // Setup test data
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    // Run your test
    const result = await t.run(async (ctx) => {
      const { myFunction } = await import("./myModule");
      return await myFunction(ctx, projectId, userId);
    });

    // Assert
    expect(result).toBeDefined();
  });
});
```

### Testing Queries

```typescript
it("should return project data", async () => {
  const t = convexTest(schema);

  // Setup
  const userId = await createTestUser(t);
  const projectId = await createTestProject(t, userId, {
    name: "Test Project",
  });

  // Run query
  const project = await t.run(async (ctx) => {
    return await ctx.db.get(projectId);
  });

  // Assert
  expect(project).not.toBeNull();
  expect(project?.name).toBe("Test Project");
});
```

### Testing Mutations

```typescript
it("should update project name", async () => {
  const t = convexTest(schema);

  // Setup
  const userId = await createTestUser(t);
  const projectId = await createTestProject(t, userId);

  // Run mutation
  await t.run(async (ctx) => {
    await ctx.db.patch(projectId, { name: "Updated Name" });
  });

  // Verify
  const project = await t.run(async (ctx) => {
    return await ctx.db.get(projectId);
  });

  expect(project?.name).toBe("Updated Name");
});
```

### Testing Permissions (RBAC)

```typescript
import { hasMinimumRole, getUserRole } from "./rbac";

describe("RBAC", () => {
  // Pure function test (no database needed)
  describe("hasMinimumRole", () => {
    it("should return true when role meets minimum", () => {
      expect(hasMinimumRole("admin", "viewer")).toBe(true);
      expect(hasMinimumRole("editor", "editor")).toBe(true);
      expect(hasMinimumRole("viewer", "admin")).toBe(false);
    });
  });

  // Integration test (requires database)
  describe("getUserRole", () => {
    it("should return role for project member", async () => {
      const t = convexTest(schema);

      const adminId = await createTestUser(t);
      const memberId = await createTestUser(t);
      const projectId = await createTestProject(t, adminId);

      await addProjectMember(t, projectId, memberId, "editor", adminId);

      const role = await t.run(async (ctx) => {
        return await getUserRole(ctx, projectId, memberId);
      });

      expect(role).toBe("editor");
    });
  });
});
```

### Testing Authentication

```typescript
it("should reject unauthenticated users", async () => {
  const t = convexTest(schema);

  // Run without authentication
  await expect(
    t.run(async (ctx) => {
      const { protectedFunction } = await import("./myModule");
      return await protectedFunction(ctx, {});
    })
  ).rejects.toThrow("Not authenticated");
});

it("should allow authenticated users", async () => {
  const t = convexTest(schema);

  const userId = await createTestUser(t);

  // Run with authentication context
  const result = await t.run(
    async (ctx) => {
      const { protectedFunction } = await import("./myModule");
      return await protectedFunction(ctx, {});
    },
    { identity: { subject: userId } } // Mock auth
  );

  expect(result).toBeDefined();
});
```

## Test Types

### Pure Function Tests

Tests for utility functions that don't require database:

```typescript
// No convexTest needed
describe("pure functions", () => {
  it("should validate input", () => {
    expect(validateEmail("test@example.com")).toBe(true);
    expect(validateEmail("invalid")).toBe(false);
  });
});
```

**Benefits:**
- Fast execution
- No Convex deployment needed
- Can run anywhere

### Integration Tests

Tests that interact with the database:

```typescript
// Requires convexTest and running Convex dev server
describe("integration", () => {
  it("should create and query data", async () => {
    const t = convexTest(schema);
    // ... test with database
  });
});
```

**Requirements:**
- Active Convex deployment
- `npx convex dev` running

## Test Helpers

### Expect Async Throws

```typescript
import { expectThrowsAsync } from "./testUtils";

it("should throw on invalid input", async () => {
  await expectThrowsAsync(
    () => myFunction("invalid"),
    "Invalid input"
  );
});
```

### Creating Test Data

```typescript
// Create user
const userId = await createTestUser(t, {
  name: "Alice",
  email: "alice@example.com",
});

// Create project
const projectId = await createTestProject(t, userId, {
  name: "My Project",
  key: "MYPROJ",
  isPublic: false,
});

// Add member
await addProjectMember(t, projectId, memberId, "editor", userId);

// Create issue
const issueId = await createTestIssue(t, projectId, userId, {
  title: "Test Issue",
  type: "bug",
  priority: "high",
});
```

## CI/CD Integration

### GitHub Actions

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: pnpm install

      - name: Deploy Convex (for tests)
        run: npx convex deploy
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}

      - name: Run backend tests
        run: pnpm test:convex
```

### Required Secrets

- `CONVEX_DEPLOY_KEY` - Get from Convex dashboard → Settings → Deploy Keys

## Troubleshooting

### Error: "Could not find the _generated directory"

**Cause:** convex-test needs an active Convex deployment to discover modules.

**Solution:**
```bash
# Make sure Convex dev server is running
npx convex dev

# Then run tests in another terminal
pnpm test:convex
```

### Error: "CONVEX_DEPLOYMENT not set"

**Cause:** Missing Convex configuration.

**Solution:**
1. Check `.env` or `.env.local` exists
2. Run `npx convex dev` to set up deployment
3. Follow Convex setup instructions

### Tests Pass Locally But Fail in CI

**Cause:** CI environment doesn't have Convex deployment.

**Solution:**
1. Add `CONVEX_DEPLOY_KEY` secret to GitHub
2. Run `npx convex deploy` before tests in CI workflow

### Flaky Tests

**Cause:** Test isolation issues or timing problems.

**Solution:**
- Use unique IDs in test data (timestamps)
- Don't rely on global state
- Clean up test data if needed

## Best Practices

1. **Isolate tests** - Each test should create its own data
2. **Use unique identifiers** - Include timestamps in test data
3. **Test permissions** - Verify access control works
4. **Test error cases** - Not just happy paths
5. **Mock authentication** - Use identity parameter when needed
6. **Keep tests fast** - Minimize database operations
7. **Use helpers** - Leverage testUtils for common operations

## Current Coverage

42 test files covering all major backend modules:

| Category | Modules | Examples |
|----------|---------|----------|
| Core CRUD | issues, projects, documents, sprints, teams, workspaces, organizations | `issues.test.ts`, `projects.test.ts` |
| Security | RBAC, auth, API keys, multi-tenant isolation, project/user security | `rbac.test.ts`, `projects_security.test.ts` |
| Features | calendar events, time tracking, labels, custom fields, reactions, notifications | `calendarEvents.test.ts`, `timeTracking.test.ts` |
| Integrations | GitHub, webhooks, automation rules, analytics, dashboard | `github.test.ts`, `webhooks.test.ts` |
| Utilities | encryption, errors, pagination, query limits, time utils, validators, soft delete | `lib/encryption.test.ts`, `lib/pagination.test.ts` |
| Workflows | sprint workflow (integration), issue queries/mutations/helpers | `sprintWorkflow.integration.test.ts` |

---

**Related Documentation:**
- [Docs Index](../README.md)
- [Convex Testing Docs](https://docs.convex.dev/functions/testing)
- [convex-test on npm](https://www.npmjs.com/package/convex-test)
- [Backend README](../../convex/README.md)

---

*Last Updated: 2026-01-28*
