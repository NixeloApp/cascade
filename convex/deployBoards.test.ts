import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestIssue, createTestProject, createTestUser } from "./testUtils";

describe("deployBoards", () => {
  it("should return public board data by slug", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    // Create an issue
    await createTestIssue(t, projectId, userId, { title: "Public issue" });

    // Create a deploy board manually
    const slug = "test-board-123";
    await t.run(async (ctx) => {
      await ctx.db.insert("deployBoards", {
        projectId,
        slug,
        isActive: true,
        visibleFields: {
          status: true,
          priority: true,
          assignee: false,
          labels: true,
          dueDate: false,
        },
        createdBy: userId,
        updatedAt: Date.now(),
      });
    });

    // Query as unauthenticated user
    const result = await t.query(api.deployBoards.getBySlug, { slug });

    expect(result).not.toBeNull();
    expect(result?.projectName).toBeTypeOf("string");
    expect(result?.issues.length).toBeGreaterThan(0);
    expect(result?.issues[0].title).toBe("Public issue");
    expect(result?.issues[0].status).toBeTypeOf("string"); // visible
    expect(result?.issues[0].dueDate).toBeUndefined(); // hidden
  });

  it("should return null for inactive boards", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    await t.run(async (ctx) => {
      await ctx.db.insert("deployBoards", {
        projectId,
        slug: "inactive-board",
        isActive: false,
        visibleFields: {
          status: true,
          priority: true,
          assignee: true,
          labels: true,
          dueDate: true,
        },
        createdBy: userId,
        updatedAt: Date.now(),
      });
    });

    const result = await t.query(api.deployBoards.getBySlug, { slug: "inactive-board" });
    expect(result).toBeNull();
  });

  it("should return null for non-existent slugs", async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(api.deployBoards.getBySlug, { slug: "does-not-exist" });
    expect(result).toBeNull();
  });
});
