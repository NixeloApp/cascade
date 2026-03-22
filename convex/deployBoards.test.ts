import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { WEEK } from "./lib/timeUtils";
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

  it("should always return workflowStates even when status visibility is false", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    await createTestIssue(t, projectId, userId, { title: "Issue A" });

    const slug = "status-hidden-board";
    await t.run(async (ctx) => {
      await ctx.db.insert("deployBoards", {
        projectId,
        slug,
        isActive: true,
        visibleFields: {
          status: false,
          priority: false,
          assignee: false,
          labels: false,
          dueDate: false,
        },
        createdBy: userId,
        updatedAt: Date.now(),
      });
    });

    const result = await t.query(api.deployBoards.getBySlug, { slug });

    expect(result).not.toBeNull();
    // workflowStates must always be present for column rendering
    expect(result?.workflowStates.length).toBeGreaterThan(0);
    // Issues must still be returned with status for grouping
    expect(result?.issues.length).toBe(1);
    expect(result?.issues[0].status).toBeTypeOf("string");
    // Hidden fields should be undefined
    expect(result?.issues[0].priority).toBeUndefined();
    expect(result?.issues[0].assigneeName).toBeUndefined();
    expect(result?.issues[0].labels).toBeUndefined();
    expect(result?.issues[0].dueDate).toBeUndefined();
  });

  it("should resolve assignee names when assignee visibility is enabled", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t, { name: "Alice Smith" });
    const projectId = await createTestProject(t, userId);

    await createTestIssue(t, projectId, userId, {
      title: "Assigned issue",
      assigneeId: userId,
    });

    const slug = "assignee-board";
    await t.run(async (ctx) => {
      await ctx.db.insert("deployBoards", {
        projectId,
        slug,
        isActive: true,
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

    const result = await t.query(api.deployBoards.getBySlug, { slug });

    expect(result).not.toBeNull();
    const issue = result?.issues[0];
    expect(issue?.assigneeName).toBe("Alice Smith");
  });

  it("should not resolve assignee when assignee visibility is disabled", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t, { name: "Bob Jones" });
    const projectId = await createTestProject(t, userId);

    await createTestIssue(t, projectId, userId, {
      title: "Assigned but hidden",
      assigneeId: userId,
    });

    const slug = "assignee-hidden-board";
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
          dueDate: true,
        },
        createdBy: userId,
        updatedAt: Date.now(),
      });
    });

    const result = await t.query(api.deployBoards.getBySlug, { slug });

    expect(result).not.toBeNull();
    const issue = result?.issues[0];
    // assignee is disabled — name must not leak
    expect(issue?.assigneeName).toBeUndefined();
  });

  it("should include dueDate when dueDate visibility is enabled", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    const dueTimestamp = Date.now() + WEEK;
    await t.run(async (ctx) => {
      const project = await ctx.db.get(projectId);
      if (!project) throw new Error("Project not found");
      await ctx.db.insert("issues", {
        projectId,
        organizationId: project.organizationId,
        workspaceId: project.workspaceId,
        key: `${project.key}-99`,
        title: "Issue with due date",
        type: "task",
        status: "todo",
        priority: "medium",
        reporterId: userId,
        updatedAt: Date.now(),
        labels: [],
        linkedDocuments: [],
        attachments: [],
        order: 0,
        dueDate: dueTimestamp,
      });
    });

    const slug = "duedate-board";
    await t.run(async (ctx) => {
      await ctx.db.insert("deployBoards", {
        projectId,
        slug,
        isActive: true,
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

    const result = await t.query(api.deployBoards.getBySlug, { slug });

    expect(result).not.toBeNull();
    const issue = result?.issues.find((i) => i.title === "Issue with due date");
    expect(issue?.title).toBe("Issue with due date");
    expect(issue?.dueDate).toBe(dueTimestamp);
  });
});
