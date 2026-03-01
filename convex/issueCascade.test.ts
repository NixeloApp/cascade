import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import { MONTH, SECOND } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "./testUtils";

describe("Issue Cascade Deletion", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should cascade delete custom field values and comment reactions when issue is permanently deleted", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    vi.setSystemTime(now);

    const OLD_DELETED_AT = now - MONTH - SECOND; // 30 days + 1 second ago

    // 1. Setup User & Org
    const { userId, organizationId, workspaceId, teamId } = await createTestContext(t);

    // 2. Create Project
    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Test Project",
      key: "TEST",
    });

    // 3. Create Custom Field
    const fieldId = await t.run(async (ctx) => {
      return await ctx.db.insert("customFields", {
        projectId,
        name: "Test Field",
        fieldKey: "test_field",
        fieldType: "text",
        isRequired: false,
        createdBy: userId,
      });
    });

    // 4. Create Issue (soft deleted > 30 days ago)
    const issueId = await t.run(async (ctx) => {
      return await ctx.db.insert("issues", {
        projectId,
        organizationId,
        workspaceId,
        teamId,
        key: "TEST-1",
        title: "Test Issue",
        type: "task",
        status: "todo",
        priority: "medium",
        reporterId: userId,
        updatedAt: now,
        labels: [],
        linkedDocuments: [],
        attachments: [],
        loggedHours: 0,
        order: 0,
        version: 1,
        searchContent: "Test Issue",
        isDeleted: true,
        deletedAt: OLD_DELETED_AT,
        deletedBy: userId,
      });
    });

    // 5. Create Custom Field Value
    const valueId = await t.run(async (ctx) => {
      return await ctx.db.insert("customFieldValues", {
        issueId,
        fieldId,
        value: "Test Value",
        updatedAt: now,
      });
    });

    // 6. Create Comment
    const commentId = await t.run(async (ctx) => {
      return await ctx.db.insert("issueComments", {
        issueId,
        authorId: userId,
        content: "Test Comment",
        mentions: [],
        updatedAt: now,
      });
    });

    // 7. Create Reaction on Comment
    const reactionId = await t.run(async (ctx) => {
      return await ctx.db.insert("issueCommentReactions", {
        commentId,
        userId,
        emoji: "👍",
        createdAt: now,
      });
    });

    // 8. Run Cleanup
    const result = await t.mutation(internal.softDeleteCleanup.permanentlyDeleteOld);

    expect(result.deleted).toBeGreaterThan(0);

    // 9. Verify
    await t.run(async (ctx) => {
      // Issue should be gone
      const issue = await ctx.db.get(issueId);
      expect(issue).toBeNull();

      // Custom Field Value should be gone (Cascade from Issue)
      const value = await ctx.db.get(valueId);
      expect(value).toBeNull();

      // Comment should be gone (Cascade from Issue)
      const comment = await ctx.db.get(commentId);
      expect(comment).toBeNull();

      // Reaction should be gone (Cascade from Comment)
      // This is expected to fail initially
      const reaction = await ctx.db.get(reactionId);
      expect(reaction).toBeNull();
    });
  });
});
