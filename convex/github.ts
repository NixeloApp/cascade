import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { decrypt, encrypt } from "./lib/encryption";
import { conflict, forbidden, notFound, validation } from "./lib/errors";
import { notDeleted } from "./lib/softDeleteHelpers";
import { ciStatuses, prStates } from "./validators";

/** Connect a GitHub account via OAuth callback. Encrypts and stores access tokens. */
export const connectGitHub = authenticatedMutation({
  args: {
    githubUserId: v.string(),
    githubUsername: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Encrypt tokens before storage
    const encryptedAccessToken = await encrypt(args.accessToken);
    const encryptedRefreshToken = args.refreshToken ? await encrypt(args.refreshToken) : undefined;

    // Check if connection already exists
    const existing = await ctx.db
      .query("githubConnections")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        githubUserId: args.githubUserId,
        githubUsername: args.githubUsername,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: args.expiresAt,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new connection
    return await ctx.db.insert("githubConnections", {
      userId: ctx.userId,
      githubUserId: args.githubUserId,
      githubUsername: args.githubUsername,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt: args.expiresAt,
      updatedAt: now,
    });
  },
});

/** Get the current user's GitHub connection status without exposing tokens. */
export const getConnection = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const connection = await ctx.db
      .query("githubConnections")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .first();

    if (!connection) return null;

    // Return connection without exposing tokens to frontend
    return {
      _id: connection._id,
      _creationTime: connection._creationTime,
      userId: connection.userId,
      githubUserId: connection.githubUserId,
      githubUsername: connection.githubUsername,
      expiresAt: connection.expiresAt,
      updatedAt: connection.updatedAt,
      // Don't expose tokens to frontend
      hasAccessToken: !!connection.accessToken,
      hasRefreshToken: !!connection.refreshToken,
    };
  },
});

/** Retrieve decrypted GitHub OAuth tokens for a user. Internal use only for API calls. */
export const getDecryptedGitHubTokens = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("githubConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!connection) return null;

    return {
      accessToken: await decrypt(connection.accessToken),
      refreshToken: connection.refreshToken ? await decrypt(connection.refreshToken) : undefined,
      expiresAt: connection.expiresAt,
    };
  },
});

/** Disconnect and delete the current user's GitHub connection. */
export const disconnectGitHub = authenticatedMutation({
  args: {},
  handler: async (ctx) => {
    const connection = await ctx.db
      .query("githubConnections")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .first();

    if (connection) {
      await ctx.db.delete(connection._id);
    }
  },
});

/** Link a GitHub repository to a project for PR/commit tracking. Requires editor role or higher. */
export const linkRepository = authenticatedMutation({
  args: {
    projectId: v.id("projects"),
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.string(),
    syncPRs: v.optional(v.boolean()),
    syncIssues: v.optional(v.boolean()),
    autoLinkCommits: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify user has access to project
    const project = await ctx.db.get(args.projectId);
    if (!project) throw notFound("project", args.projectId);

    // Check permission (at least editor)
    const member = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", ctx.userId),
      )
      .filter(notDeleted)
      .first();

    if (!member && project.createdBy !== ctx.userId) {
      throw forbidden("project member");
    }

    if (member && member.role === "viewer") {
      throw forbidden("editor");
    }

    // Check if repo already linked
    const repoFullName = `${args.repoOwner}/${args.repoName}`;
    const existing = await ctx.db
      .query("githubRepositories")
      .withIndex("by_repo_full_name", (q) => q.eq("repoFullName", repoFullName))
      .first();

    if (existing) {
      throw conflict("This repository is already linked to a project");
    }

    const now = Date.now();

    return await ctx.db.insert("githubRepositories", {
      projectId: args.projectId,
      repoOwner: args.repoOwner,
      repoName: args.repoName,
      repoFullName,
      repoId: args.repoId,
      syncPRs: args.syncPRs ?? true,
      syncIssues: args.syncIssues ?? false,
      autoLinkCommits: args.autoLinkCommits ?? true,
      linkedBy: ctx.userId,
      updatedAt: now,
    });
  },
});

/** Unlink a GitHub repository from its project. Requires admin role. */
export const unlinkRepository = authenticatedMutation({
  args: {
    repositoryId: v.id("githubRepositories"),
  },
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repositoryId);
    if (!repo) throw notFound("repository", args.repositoryId);

    const project = await ctx.db.get(repo.projectId);
    if (!project) throw notFound("project", repo.projectId);

    // Check permission (admin only)
    const member = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", repo.projectId).eq("userId", ctx.userId),
      )
      .filter(notDeleted)
      .first();

    const isAdmin = project.createdBy === ctx.userId || member?.role === "admin";
    if (!isAdmin) {
      throw forbidden("admin");
    }

    await ctx.db.delete(args.repositoryId);
  },
});

/** List all GitHub repositories linked to a project. */
export const listRepositories = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Verify access to project
    const project = await ctx.db.get(args.projectId);
    if (!project) return [];

    if (!project.isPublic) {
      const member = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) =>
          q.eq("projectId", args.projectId).eq("userId", ctx.userId),
        )
        .filter(notDeleted)
        .first();

      if (!member && project.createdBy !== ctx.userId) {
        return [];
      }
    }

    return await ctx.db
      .query("githubRepositories")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter(notDeleted)
      .take(BOUNDED_LIST_LIMIT);
  },
});

/** Create or update a GitHub pull request record. Called from GitHub webhook events. Auto-links to issues by key. */
export const upsertPullRequest = mutation({
  args: {
    repositoryId: v.id("githubRepositories"),
    prNumber: v.number(),
    prId: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    state: prStates,
    mergedAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    authorUsername: v.string(),
    authorAvatarUrl: v.optional(v.string()),
    htmlUrl: v.string(),
    checksStatus: v.optional(ciStatuses),
    issueKey: v.optional(v.string()), // e.g., "PROJ-123"
  },
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repositoryId);
    if (!repo) throw notFound("repository", args.repositoryId);

    const now = Date.now();

    // Try to link to issue if issueKey provided
    let issueId: Id<"issues"> | undefined;
    if (args.issueKey) {
      const issue = await ctx.db
        .query("issues")
        .withIndex("by_project", (q) => q.eq("projectId", repo.projectId))
        .filter((q) => q.eq(q.field("key"), args.issueKey))
        .filter(notDeleted)
        .first();

      if (issue) {
        issueId = issue._id;
      }
    }

    // Check if PR already exists
    const existing = await ctx.db
      .query("githubPullRequests")
      .withIndex("by_repository_pr_number", (q) =>
        q.eq("repositoryId", args.repositoryId).eq("prNumber", args.prNumber),
      )
      .first();

    if (existing) {
      // Update existing PR
      await ctx.db.patch(existing._id, {
        title: args.title,
        body: args.body,
        state: args.state,
        mergedAt: args.mergedAt,
        closedAt: args.closedAt,
        checksStatus: args.checksStatus,
        issueId,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new PR
    return await ctx.db.insert("githubPullRequests", {
      issueId,
      projectId: repo.projectId,
      repositoryId: args.repositoryId,
      prNumber: args.prNumber,
      prId: args.prId,
      title: args.title,
      body: args.body,
      state: args.state,
      mergedAt: args.mergedAt,
      closedAt: args.closedAt,
      authorUsername: args.authorUsername,
      authorAvatarUrl: args.authorAvatarUrl,
      htmlUrl: args.htmlUrl,
      checksStatus: args.checksStatus,
      updatedAt: now,
    });
  },
});

/** Manually link a GitHub pull request to a project issue. Both must belong to the same project. */
export const linkPRToIssue = authenticatedMutation({
  args: {
    prId: v.id("githubPullRequests"),
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const pr = await ctx.db.get(args.prId);
    if (!pr) throw notFound("pull request", args.prId);

    const issue = await ctx.db.get(args.issueId);
    if (!issue) throw notFound("issue", args.issueId);

    // Verify project match
    if (!issue.projectId) throw validation("issue", "Issue has no project");
    if (pr.projectId !== issue.projectId) {
      throw validation("project", "PR and issue must be in the same project");
    }

    await ctx.db.patch(args.prId, {
      issueId: args.issueId,
      updatedAt: Date.now(),
    });
  },
});

/** Get all GitHub pull requests linked to an issue. */
export const getPullRequests = authenticatedQuery({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) return [];

    // Check access
    if (!issue.projectId) return [];
    const project = await ctx.db.get(issue.projectId);
    if (!project) return [];

    if (!project.isPublic) {
      const member = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) =>
          q.eq("projectId", issue.projectId as Id<"projects">).eq("userId", ctx.userId),
        )
        .filter(notDeleted)
        .first();

      if (!member && project.createdBy !== ctx.userId) {
        return [];
      }
    }

    return await ctx.db
      .query("githubPullRequests")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .filter(notDeleted)
      .take(BOUNDED_LIST_LIMIT);
  },
});

/** Create or update a GitHub commit record. Called from webhooks. Auto-links to issues by key in commit message. */
export const upsertCommit = mutation({
  args: {
    repositoryId: v.id("githubRepositories"),
    sha: v.string(),
    message: v.string(),
    authorUsername: v.string(),
    authorAvatarUrl: v.optional(v.string()),
    htmlUrl: v.string(),
    committedAt: v.number(),
    issueKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repositoryId);
    if (!repo) throw notFound("repository", args.repositoryId);

    const _now = Date.now();

    // Try to link to issue if issueKey provided
    let issueId: Id<"issues"> | undefined;
    if (args.issueKey) {
      const issue = await ctx.db
        .query("issues")
        .withIndex("by_project", (q) => q.eq("projectId", repo.projectId))
        .filter((q) => q.eq(q.field("key"), args.issueKey))
        .filter(notDeleted)
        .first();

      if (issue) {
        issueId = issue._id;
      }
    }

    // Check if commit already exists
    const existing = await ctx.db
      .query("githubCommits")
      .withIndex("by_sha", (q) => q.eq("sha", args.sha))
      .first();

    if (existing) {
      // Update if issue linking changed
      if (issueId && existing.issueId !== issueId) {
        await ctx.db.patch(existing._id, { issueId });
      }
      return existing._id;
    }

    // Create new commit
    return await ctx.db.insert("githubCommits", {
      issueId,
      projectId: repo.projectId,
      repositoryId: args.repositoryId,
      sha: args.sha,
      message: args.message,
      authorUsername: args.authorUsername,
      authorAvatarUrl: args.authorAvatarUrl,
      htmlUrl: args.htmlUrl,
      committedAt: args.committedAt,
    });
  },
});

/** Get all GitHub commits linked to an issue. */
export const getCommits = authenticatedQuery({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) return [];

    // Check access
    if (!issue.projectId) return [];
    const project = await ctx.db.get(issue.projectId);
    if (!project) return [];

    if (!project.isPublic) {
      const member = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) =>
          q.eq("projectId", issue.projectId as Id<"projects">).eq("userId", ctx.userId),
        )
        .filter(notDeleted)
        .first();

      if (!member && project.createdBy !== ctx.userId) {
        return [];
      }
    }

    return await ctx.db
      .query("githubCommits")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .order("desc")
      .filter(notDeleted)
      .take(BOUNDED_LIST_LIMIT);
  },
});
