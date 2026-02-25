import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import {
  createProjectInOrganization,
  createTestContext,
  createTestIssue,
  createTestUser,
  type TestContext,
} from "../testUtils";

describe("issue search optimization", () => {
  let t: ReturnType<typeof convexTest>;
  let ctx: TestContext;
  let projectId: Id<"projects">;
  let otherUserId: Id<"users">;

  beforeEach(async () => {
    t = convexTest(schema, modules);
    ctx = await createTestContext(t);
    projectId = await createProjectInOrganization(t, ctx.userId, ctx.organizationId);
    otherUserId = await createTestUser(t);
  });

  it("should find issues assigned to specific user", async () => {
    await createTestIssue(t, projectId, ctx.userId, { title: "My Issue", assigneeId: ctx.userId });
    await createTestIssue(t, projectId, ctx.userId, {
      title: "Other Issue",
      assigneeId: otherUserId,
    });

    const result = await ctx.asUser.query(api.issues.queries.search, {
      query: "",
      projectId,
      assigneeId: ctx.userId,
    });

    expect(result.page).toHaveLength(1);
    expect(result.page[0].title).toBe("My Issue");
  });

  it("should find issues assigned to 'me'", async () => {
    await createTestIssue(t, projectId, ctx.userId, { title: "My Issue", assigneeId: ctx.userId });
    await createTestIssue(t, projectId, ctx.userId, {
      title: "Other Issue",
      assigneeId: otherUserId,
    });

    const result = await ctx.asUser.query(api.issues.queries.search, {
      query: "",
      projectId,
      assigneeId: "me",
    });

    expect(result.page).toHaveLength(1);
    expect(result.page[0].title).toBe("My Issue");
  });

  it("should find unassigned issues", async () => {
    await createTestIssue(t, projectId, ctx.userId, { title: "Unassigned Issue" });
    await createTestIssue(t, projectId, ctx.userId, { title: "My Issue", assigneeId: ctx.userId });

    const result = await ctx.asUser.query(api.issues.queries.search, {
      query: "",
      projectId,
      assigneeId: "unassigned",
    });

    expect(result.page).toHaveLength(1);
    expect(result.page[0].title).toBe("Unassigned Issue");
  });

  it("should combine assigneeId and status filters", async () => {
    await createTestIssue(t, projectId, ctx.userId, {
      title: "My Todo",
      assigneeId: ctx.userId,
      status: "todo",
    });
    await createTestIssue(t, projectId, ctx.userId, {
      title: "My Done",
      assigneeId: ctx.userId,
      status: "done",
    });
    await createTestIssue(t, projectId, ctx.userId, {
      title: "Other Todo",
      assigneeId: otherUserId,
      status: "todo",
    });

    const result = await ctx.asUser.query(api.issues.queries.search, {
      query: "",
      projectId,
      assigneeId: ctx.userId,
      status: ["todo"],
    });

    expect(result.page).toHaveLength(1);
    expect(result.page[0].title).toBe("My Todo");
  });

  it("should return correct results when querying with status only", async () => {
    await createTestIssue(t, projectId, ctx.userId, { status: "todo", title: "Todo 1" });
    await createTestIssue(t, projectId, ctx.userId, {
      status: "inprogress",
      title: "In Progress 1",
    });

    const result = await ctx.asUser.query(api.issues.queries.search, {
      query: "",
      projectId,
      status: ["todo"],
    });

    expect(result.page).toHaveLength(1);
    expect(result.page[0].title).toBe("Todo 1");
  });

  it("should find issues reported by specific user", async () => {
    await createTestIssue(t, projectId, ctx.userId, {
      title: "Reported Issue",
    });
    await createTestIssue(t, projectId, otherUserId, {
      title: "Other Issue",
    });

    const result = await ctx.asUser.query(api.issues.queries.search, {
      query: "",
      projectId,
      reporterId: ctx.userId,
    });

    expect(result.page).toHaveLength(1);
    expect(result.page[0].title).toBe("Reported Issue");
  });

  it("should find issues in a specific sprint", async () => {
    const sprint1Id = await ctx.asUser.mutation(api.sprints.create, {
      name: "Sprint 1",
      startDate: 0,
      endDate: 0,
      projectId,
    });
    const sprint2Id = await ctx.asUser.mutation(api.sprints.create, {
      name: "Sprint 2",
      startDate: 0,
      endDate: 0,
      projectId,
    });

    await createTestIssue(t, projectId, ctx.userId, {
      title: "Issue in Sprint 1",
      sprintId: sprint1Id.sprintId,
    });
    await createTestIssue(t, projectId, ctx.userId, {
      title: "Issue in Sprint 2",
      sprintId: sprint2Id.sprintId,
    });

    const result = await ctx.asUser.query(api.issues.queries.search, {
      query: "",
      projectId,
      sprintId: sprint1Id.sprintId,
    });

    expect(result.page).toHaveLength(1);
    expect(result.page[0].title).toBe("Issue in Sprint 1");
  });

  it("should find issues in a specific epic", async () => {
    const epic1Id = await createTestIssue(t, projectId, ctx.userId, {
      title: "Epic 1",
      type: "epic",
    });
    const epic2Id = await createTestIssue(t, projectId, ctx.userId, {
      title: "Epic 2",
      type: "epic",
    });

    await createTestIssue(t, projectId, ctx.userId, { title: "Issue in Epic 1", epicId: epic1Id });
    await createTestIssue(t, projectId, ctx.userId, { title: "Issue in Epic 2", epicId: epic2Id });

    const result = await ctx.asUser.query(api.issues.queries.search, {
      query: "",
      projectId,
      epicId: epic1Id,
    });

    expect(result.page).toHaveLength(1);
    expect(result.page[0].title).toBe("Issue in Epic 1");
  });
});
