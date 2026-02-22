import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Reactions", () => {
  it("should toggle reactions on a comment", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    const asUser = asAuthenticatedUser(t, userId);

    // Create issue
    const issueId = await asUser.mutation(api.issues.create, {
      projectId,
      title: "Test Issue",
      type: "task",
      priority: "medium",
    });

    // Add comment
    const commentId = await asUser.mutation(api.issues.addComment, {
      issueId,
      content: "Nice work!",
    });

    // Toggle reaction (add)
    const result1 = await asUser.mutation(api.reactions.toggleReaction, {
      commentId,
      emoji: "🚀",
    });
    expect(result1.action).toBe("added");

    // Verify reaction in query
    const comments = await asUser.query(api.issues.listComments, {
      issueId,
      paginationOpts: { numItems: 10, cursor: null },
    });
    expect(comments.page[0].reactions).toHaveLength(1);
    expect(comments.page[0].reactions[0].emoji).toBe("🚀");
    expect(comments.page[0].reactions[0].userIds).toContain(userId);

    // Toggle reaction (remove)
    const result2 = await asUser.mutation(api.reactions.toggleReaction, {
      commentId,
      emoji: "🚀",
    });
    expect(result2.action).toBe("removed");

    // Verify reaction removed
    const commentsAfter = await asUser.query(api.issues.listComments, {
      issueId,
      paginationOpts: { numItems: 10, cursor: null },
    });
    expect(commentsAfter.page[0].reactions).toHaveLength(0);
  });

  it("should handle multiple users reacting with the same emoji", async () => {
    const t = convexTest(schema, modules);
    const user1Id = await createTestUser(t, { name: "User 1", email: "user1@test.com" });
    const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });
    const projectId = await createTestProject(t, user1Id);

    // Add user2 to project
    const asUser1 = asAuthenticatedUser(t, user1Id);
    await asUser1.mutation(api.projects.addProjectMember, {
      projectId,
      userEmail: "user2@test.com",
      role: "editor",
    });

    // Create issue and comment
    const issueId = await asUser1.mutation(api.issues.create, {
      projectId,
      title: "Test Issue",
      type: "task",
      priority: "medium",
    });
    const commentId = await asUser1.mutation(api.issues.addComment, {
      issueId,
      content: "Shared comment",
    });

    // User 1 reacts
    await asUser1.mutation(api.reactions.toggleReaction, {
      commentId,
      emoji: "❤️",
    });

    // User 2 reacts
    const asUser2 = asAuthenticatedUser(t, user2Id);
    await asUser2.mutation(api.reactions.toggleReaction, {
      commentId,
      emoji: "❤️",
    });

    // Verify results
    const comments = await asUser1.query(api.issues.listComments, {
      issueId,
      paginationOpts: { numItems: 10, cursor: null },
    });
    expect(comments.page[0].reactions).toHaveLength(1);
    expect(comments.page[0].reactions[0].emoji).toBe("❤️");
    expect(comments.page[0].reactions[0].userIds).toHaveLength(2);
    expect(comments.page[0].reactions[0].userIds).toContain(user1Id);
    expect(comments.page[0].reactions[0].userIds).toContain(user2Id);
  });
});
