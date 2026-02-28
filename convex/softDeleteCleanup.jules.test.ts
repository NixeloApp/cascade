import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import { MONTH } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestIssue,
  createTestUser,
} from "./testUtils";

describe("Soft Delete Cleanup", () => {
  it("should permanently delete issues soft-deleted more than 30 days ago", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const projectId = await createProjectInOrganization(t, userId, organizationId);

    // Create an issue
    const issueId = await createTestIssue(t, projectId, userId);

    // Soft delete it with a date > 30 days ago
    const oldDate = Date.now() - MONTH - 1000; // 30 days + 1 second ago
    await t.run(async (ctx) => {
      await ctx.db.patch(issueId, {
        isDeleted: true,
        deletedAt: oldDate,
        deletedBy: userId,
      });
    });

    // Run cleanup
    const result = await t.mutation(internal.softDeleteCleanup.permanentlyDeleteOld, {});

    // Verify result stats
    expect(result.deleted).toBeGreaterThan(0);
    expect(result.deletedByTable["issues"]).toBe(1);

    // Verify issue is gone
    const issue = await t.run(async (ctx) => {
      return await ctx.db.get(issueId);
    });
    expect(issue).toBeNull();
  });

  it("should NOT delete issues soft-deleted less than 30 days ago", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const projectId = await createProjectInOrganization(t, userId, organizationId);

    // Create an issue
    const issueId = await createTestIssue(t, projectId, userId);

    // Soft delete it with a date < 30 days ago
    const recentDate = Date.now() - MONTH + 10000; // 30 days - 10 seconds ago
    await t.run(async (ctx) => {
      await ctx.db.patch(issueId, {
        isDeleted: true,
        deletedAt: recentDate,
        deletedBy: userId,
      });
    });

    // Run cleanup
    const result = await t.mutation(internal.softDeleteCleanup.permanentlyDeleteOld, {});

    // Verify nothing deleted
    expect(result.deleted).toBe(0);

    // Verify issue still exists
    const issue = await t.run(async (ctx) => {
      return await ctx.db.get(issueId);
    });
    expect(issue).not.toBeNull();
    expect(issue?.isDeleted).toBe(true);
  });

  it("should cascade delete child records (issueActivity)", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const projectId = await createProjectInOrganization(t, userId, organizationId);

    // Create an issue
    const issueId = await createTestIssue(t, projectId, userId);

    // Create activity logs
    await t.run(async (ctx) => {
      await ctx.db.insert("issueActivity", {
        issueId,
        userId,
        action: "created",
      });
    });

    // Verify log exists
    const logsBefore = await t.run(async (ctx) => {
      return await ctx.db
        .query("issueActivity")
        .filter((q) => q.eq(q.field("issueId"), issueId))
        .collect();
    });
    expect(logsBefore.length).toBe(1);

    // Soft delete issue (old enough)
    const oldDate = Date.now() - MONTH - 1000;
    await t.run(async (ctx) => {
      await ctx.db.patch(issueId, {
        isDeleted: true,
        deletedAt: oldDate,
        deletedBy: userId,
      });
    });

    // Run cleanup
    await t.mutation(internal.softDeleteCleanup.permanentlyDeleteOld, {});

    // Verify issue is gone
    const issue = await t.run(async (ctx) => {
      return await ctx.db.get(issueId);
    });
    expect(issue).toBeNull();

    // Verify logs are gone (cascaded)
    const logsAfter = await t.run(async (ctx) => {
      return await ctx.db
        .query("issueActivity")
        .filter((q) => q.eq(q.field("issueId"), issueId))
        .collect();
    });
    expect(logsAfter.length).toBe(0);
  });
});
