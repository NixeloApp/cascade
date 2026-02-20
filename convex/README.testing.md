# Testing Convex Functions

This document explains how to test Convex backend functions in the Nixelo project.

## Testing Approach

Convex provides its own testing utilities for testing queries and mutations. Unlike frontend tests with Vitest, Convex tests run in a special test environment.

## Setup

Install Convex testing utilities:

```bash
pnpm add -D convex-test
```

## Example Test Structure

```typescript
// convex/documents.test.ts
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./setup.test";

describe("documents", () => {
  it("should create a document", async () => {
    const t = convexTest(schema, modules);

    // Create a user first
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Test User",
        email: "test@example.com",
      });
    });

    // Set auth context
    t.setUser({ sub: userId });

    // Test document creation
    const docId = await t.mutation(api.documents.create, {
      title: "Test Document",
      isPublic: false,
    });

    expect(docId).toBeDefined();

    // Verify document was created
    const doc = await t.query(api.documents.getDocument, { id: docId });
    expect(doc?.title).toBe("Test Document");
    expect(doc?.createdBy).toBe(userId);
  });

  it("should not allow unauthenticated users to create documents", async () => {
    const t = convexTest(schema, modules);

    // Don't set user auth
    await expect(
      t.mutation(api.documents.create, {
        title: "Test Document",
        isPublic: false,
      })
    ).rejects.toThrow("Not authenticated");
  });

  it("should filter documents based on permissions", async () => {
    const t = convexTest(schema, modules);

    // Create two users
    const user1Id = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "User 1",
        email: "user1@example.com",
      });
    });

    const user2Id = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "User 2",
        email: "user2@example.com",
      });
    });

    // User 1 creates a private document
    t.setUser({ sub: user1Id });
    await t.mutation(api.documents.create, {
      title: "Private Doc",
      isPublic: false,
    });

    // User 1 creates a public document
    await t.mutation(api.documents.create, {
      title: "Public Doc",
      isPublic: true,
    });

    // User 2 should only see the public document
    t.setUser({ sub: user2Id });
    const user2Docs = await t.query(api.documents.list, {});

    expect(user2Docs).toHaveLength(1);
    expect(user2Docs[0].title).toBe("Public Doc");
  });
});
```

## Setup File for Convex Tests

Create a `convex/setup.test.ts` file to export your modules:

```typescript
// convex/setup.test.ts
import { default as documents } from "./documents";
import { default as projects } from "./projects";
import { default as issues } from "./issues";
import { default as auth } from "./auth";

export const modules = {
  documents,
  projects,
  issues,
  auth,
};
```

## Running Convex Tests

Convex tests need to be run separately from Vitest tests:

```bash
# Add to package.json scripts
"test:convex": "vitest --config vitest.convex.config.ts"
```

Create a separate config file `vitest.convex.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["convex/**/*.test.ts"],
    exclude: ["convex/_generated/**"],
  },
});
```

## Best Practices

1. **Test Authentication**: Always test authenticated and unauthenticated scenarios
2. **Test Permissions**: Verify that users can only access/modify data they should
3. **Test Edge Cases**: Empty strings, missing fields, invalid IDs
4. **Test Activity Logging**: Verify that mutations log activities correctly
5. **Use Transactions**: Convex handles transactions automatically, but be aware of race conditions

## Testing Patterns

### Testing Queries

```typescript
it("should return null for non-existent document", async () => {
  const t = convexTest(schema, modules);
  const doc = await t.query(api.documents.getDocument, {
    id: "invalid-id" as any,
  });
  expect(doc).toBeNull();
});
```

### Testing Mutations

```typescript
it("should update document title", async () => {
  const t = convexTest(schema, modules);
  const userId = await createTestUser(t);
  t.setUser({ sub: userId });

  const docId = await t.mutation(api.documents.create, {
    title: "Original",
    isPublic: false,
  });

  await t.mutation(api.documents.updateTitle, {
    id: docId,
    title: "Updated",
  });

  const doc = await t.query(api.documents.getDocument, { id: docId });
  expect(doc?.title).toBe("Updated");
});
```

### Testing Error Cases

```typescript
it("should throw error when non-owner tries to delete", async () => {
  const t = convexTest(schema, modules);

  const owner = await createTestUser(t);
  const other = await createTestUser(t);

  t.setUser({ sub: owner });
  const docId = await t.mutation(api.documents.create, {
    title: "Test",
    isPublic: false,
  });

  // Switch to other user
  t.setUser({ sub: other });

  await expect(
    t.mutation(api.documents.deleteDocument, { id: docId })
  ).rejects.toThrow("Not authorized");
});
```

## Resources

- [Convex Testing Documentation](https://docs.convex.dev/functions/testing)
- [convex-test npm package](https://www.npmjs.com/package/convex-test)

## Current Status

✅ **Infrastructure Ready:** All test utilities, configuration, and helpers are in place.
⚠️ **Blocked:** Tests fail because they cannot find the `_generated` directory or connect to a local Convex instance during the test run in this environment.

To run tests locally:

1. Ensure `npx convex dev` is running
2. Run `pnpm run test:convex`
