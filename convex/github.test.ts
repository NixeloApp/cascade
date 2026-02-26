import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("GitHub Integration", () => {
  describe("connectGitHub", () => {
    it("should create a new connection", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.github.connectGitHub, {
        githubUserId: "12345",
        githubUsername: "testuser",
        accessToken: "gho_token",
      });

      const connection = await asUser.query(api.github.getConnection, {});
      expect(connection?.githubUsername).toBe("testuser");
      // Tokens are encrypted and not exposed to frontend
      expect(connection?.hasAccessToken).toBe(true);
    });

    it("should update existing connection", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.github.connectGitHub, {
        githubUserId: "12345",
        githubUsername: "testuser",
        accessToken: "token1",
      });

      await asUser.mutation(api.github.connectGitHub, {
        githubUserId: "12345",
        githubUsername: "testuser",
        accessToken: "token2",
      });

      const connection = await asUser.query(api.github.getConnection, {});
      // Tokens are encrypted and not exposed - just verify connection exists
      expect(connection?.hasAccessToken).toBe(true);

      // Check no duplicate
      const connections = await t.run(async (ctx) => ctx.db.query("githubConnections").collect());
      expect(connections).toHaveLength(1);
    });
  });

  describe("repository management", () => {
    it("should link repository for admins", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      const { repositoryId: repoId } = await asUser.mutation(api.github.linkRepository, {
        projectId,
        repoOwner: "owner",
        repoName: "repo",
        repoId: "123",
      });

      expect(repoId).toBeDefined();

      const repos = await asUser.query(api.github.listRepositories, { projectId });
      expect(repos).toHaveLength(1);
      expect(repos[0].repoName).toBe("repo");
    });

    it("should unlink repository", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      const { repositoryId: repoId } = await asUser.mutation(api.github.linkRepository, {
        projectId,
        repoOwner: "owner",
        repoName: "repo",
        repoId: "123",
      });

      await asUser.mutation(api.github.unlinkRepository, { repositoryId: repoId });

      const repos = await asUser.query(api.github.listRepositories, { projectId });
      expect(repos).toHaveLength(0);
    });

    it("should prevent duplicate links", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.github.linkRepository, {
        projectId,
        repoOwner: "owner",
        repoName: "repo",
        repoId: "123",
      });

      await expect(async () => {
        await asUser.mutation(api.github.linkRepository, {
          projectId,
          repoOwner: "owner",
          repoName: "repo",
          repoId: "123",
        });
      }).rejects.toThrow("This repository is already linked to a project");
    });
  });

  describe("webhooks", () => {
    it("should upsert PR", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      const { repositoryId } = await asUser.mutation(api.github.linkRepository, {
        projectId,
        repoOwner: "owner",
        repoName: "repo",
        repoId: "123",
      });

      // Creates new PR
      const { prId } = await t.mutation(internal.github.upsertPullRequest, {
        repositoryId,
        prNumber: 1,
        prId: "pr_1",
        title: "Feat: New thing",
        state: "open",
        authorUsername: "user",
        htmlUrl: "http://github.com/...",
      });

      // Updates PR
      await t.mutation(internal.github.upsertPullRequest, {
        repositoryId,
        prNumber: 1,
        prId: "pr_1",
        title: "Feat: New thing (updated)",
        state: "closed",
        closedAt: Date.now(),
        authorUsername: "user",
        htmlUrl: "http://github.com/...",
      });

      const pr = await t.run(async (ctx) => ctx.db.get(prId));
      expect(pr?.title).toBe("Feat: New thing (updated)");
      expect(pr?.state).toBe("closed");
      expect(pr?.closedAt).toBeDefined();
    });

    it("should upsert commit and link to issue", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId, { key: "PROJ" });
      const asUser = asAuthenticatedUser(t, userId);

      const { repositoryId } = await asUser.mutation(api.github.linkRepository, {
        projectId,
        repoOwner: "owner",
        repoName: "repo",
        repoId: "123",
      });

      // Create issue
      const issueId = await t.run(async (ctx) => {
        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");
        if (!(project.workspaceId && project.teamId)) {
          throw new Error("Project missing workspace or team");
        }

        return await ctx.db.insert("issues", {
          projectId,
          organizationId: project.organizationId,
          workspaceId: project.workspaceId,
          teamId: project.teamId,
          key: "PROJ-1",
          title: "Task 1",
          status: "todo",
          type: "task",
          priority: "medium",
          reporterId: userId,
          updatedAt: Date.now(),
          labels: [],
          linkedDocuments: [],
          attachments: [],
          order: 1,
        });
      });

      // Upsert commit with issue key
      const { commitId } = await t.mutation(internal.github.upsertCommit, {
        repositoryId,
        sha: "sha123",
        message: "Fixes PROJ-1: bugs",
        authorUsername: "dev",
        htmlUrl: "url",
        committedAt: Date.now(),
        issueKey: "PROJ-1",
      });

      const commit = await t.run(async (ctx) => ctx.db.get(commitId));
      expect(commit?.issueId).toBe(issueId);

      // Verify can list commits for issue
      const commits = await asUser.query(api.github.getCommits, { issueId });
      expect(commits).toHaveLength(1);
      expect(commits[0].sha).toBe("sha123");
    });
  });
});
