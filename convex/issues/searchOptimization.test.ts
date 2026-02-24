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

  beforeEach(async () => {
    t = convexTest(schema, modules);
    ctx = await createTestContext(t);
    projectId = await createProjectInOrganization(t, ctx.userId, ctx.organizationId);
  });

  it("should filter by assignee in search index", async () => {
    const assignee = await createTestUser(t);
    const issue1 = await createTestIssue(t, projectId, ctx.userId, {
      title: "Assigned Task",
      assigneeId: assignee,
    });
    const issue2 = await createTestIssue(t, projectId, ctx.userId, {
      title: "Unassigned Task",
    });

    // Search with assignee filter
    const result = await ctx.asUser.query(api.issues.queries.search, {
      query: "Task",
      projectId,
      assigneeId: assignee,
    });

    expect(result.page).toHaveLength(1);
    expect(result.page[0]._id).toBe(issue1);
    expect(result.page[0].title).toBe("Assigned Task");
  });

  it("should filter by reporter in search index", async () => {
    const reporter2 = await createTestUser(t);

    // Issue reported by ctx.userId (default)
    const issue1 = await createTestIssue(t, projectId, ctx.userId, {
      title: "My Report",
    });

    // Issue reported by reporter2
    const issue2 = await createTestIssue(t, projectId, reporter2, {
      title: "Other Report",
    });

    // Search with reporter filter
    const result = await ctx.asUser.query(api.issues.queries.search, {
      query: "Report",
      projectId,
      reporterId: reporter2,
    });

    expect(result.page).toHaveLength(1);
    expect(result.page[0]._id).toBe(issue2);
    expect(result.page[0].title).toBe("Other Report");
  });

  it("should handle 'me' as assignee filter", async () => {
    const issue1 = await createTestIssue(t, projectId, ctx.userId, {
      title: "Assigned to Me",
      assigneeId: ctx.userId,
    });
    const issue2 = await createTestIssue(t, projectId, ctx.userId, {
      title: "Unassigned",
    });

    const result = await ctx.asUser.query(api.issues.queries.search, {
      query: "",
      projectId,
      assigneeId: "me",
    });

    expect(result.page).toHaveLength(1);
    expect(result.page[0]._id).toBe(issue1);
  });

  it("should find issues reported by specific user", async () => {
    const otherUserId = await createTestUser(t);
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
});
