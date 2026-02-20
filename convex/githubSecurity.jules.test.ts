import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestProject, createTestUser } from "./testUtils";

describe("GitHub Security", () => {
  it("REGRESSION: internal upsertPullRequest should still work for internal callers", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    // Setup: link a repository
    const repoId = await t.run(async (ctx) => {
      return await ctx.db.insert("githubRepositories", {
        projectId,
        repoOwner: "owner",
        repoName: "repo",
        repoFullName: "owner/repo",
        repoId: "123",
        syncPRs: true,
        syncIssues: false,
        autoLinkCommits: true,
        linkedBy: userId,
        updatedAt: Date.now(),
      });
    });

    // Call upsertPullRequest using internal reference (simulating webhook handler)
    await t.mutation(internal.github.upsertPullRequest, {
      repositoryId: repoId,
      prNumber: 999,
      prId: "safe_pr",
      title: "Safe PR",
      state: "open",
      authorUsername: "bot",
      htmlUrl: "http://github.com/...",
    });

    const pr = await t.run(async (ctx) => ctx.db.query("githubPullRequests").first());
    expect(pr?.title).toBe("Safe PR");

    // Note: We cannot easily test "api.github.upsertPullRequest throws error" here because
    // it would be a compile-time error if the type definitions are updated,
    // or a runtime "undefined" error if checked dynamically.
    // The security fix is verified by the code change (mutation -> internalMutation).
  });
});
