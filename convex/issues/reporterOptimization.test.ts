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

describe("issue reporter optimization", () => {
  let t: ReturnType<typeof convexTest>;
  let ctx: TestContext;
  let projectId: Id<"projects">;
  let reporterId: Id<"users">;

  beforeEach(async () => {
    t = convexTest(schema, modules);
    ctx = await createTestContext(t);
    projectId = await createProjectInOrganization(t, ctx.userId, ctx.organizationId);
    reporterId = await createTestUser(t);
  });

  it("should return issues filtered by reporter", async () => {
    // Create noise issues reported by main user (ctx.userId)
    await createTestIssue(t, projectId, ctx.userId, { title: "Noise 1" });
    await createTestIssue(t, projectId, ctx.userId, { title: "Noise 2" });

    // Create target issue reported by specific reporter
    // Note: createTestIssue take reporterId as 3rd argument
    const targetIssueId = await createTestIssue(t, projectId, reporterId, {
      title: "Target Issue",
    });

    // Query with reporterId filter
    const result = await ctx.asUser.query(api.issues.queries.search, {
      query: "",
      projectId,
      reporterId: reporterId,
    });

    expect(result.page).toHaveLength(1);
    expect(result.page[0]._id).toBe(targetIssueId);
    expect(result.page[0].title).toBe("Target Issue");
  });

  it("should prioritize reporter index over status scan when filtering by both", async () => {
    // Create many issues with status 'todo' reported by main user
    for (let i = 0; i < 5; i++) {
      await createTestIssue(t, projectId, ctx.userId, {
        title: `Noise Todo ${i}`,
        status: "todo",
      });
    }

    // Create one issue with status 'todo' reported by target reporter
    const targetIssueId = await createTestIssue(t, projectId, reporterId, {
      title: "Target Todo",
      status: "todo",
    });

    // Query with reporterId AND status
    const result = await ctx.asUser.query(api.issues.queries.search, {
      query: "",
      projectId,
      reporterId: reporterId,
      status: ["todo"],
    });

    expect(result.page).toHaveLength(1);
    expect(result.page[0]._id).toBe(targetIssueId);
  });

  it("should find old issue by reporter even if buried under limit", async () => {
    // 1. Create target issue (old) by reporter
    const targetIssueId = await createTestIssue(t, projectId, reporterId, {
      title: "Target Issue Old",
    });

    // 2. Create limit + 10 noise issues (new) by other users
    // fetchLimit is 50. So create 60 issues.
    // This pushes the target issue to index 60 (0-based) in desc order (created later = newer).
    // Wait, createTestIssue uses Date.now().
    // If we run this fast, timestamps might be same.
    // But inserted later usually means "newer" in _creationTime / _id.
    // So target (created first) is OLDER.
    // order("desc") returns NEWER first.
    // So [Noise 59, ..., Noise 0, Target].
    // Target is last.
    for (let i = 0; i < 60; i++) {
      await createTestIssue(t, projectId, ctx.userId, {
        title: `Noise ${i}`,
      });
    }

    // 3. Search by reporter
    const result = await ctx.asUser.query(api.issues.queries.search, {
      query: "",
      projectId,
      reporterId: reporterId,
    });

    expect(result.page).toHaveLength(1);
    expect(result.page[0]._id).toBe(targetIssueId);
  });
});
