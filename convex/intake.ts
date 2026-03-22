/**
 * External Intake
 *
 * Handles public issue submissions from external users.
 * Uses project-specific intake tokens for access control.
 * Creates inbox issues in the project's triage queue.
 */

import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { projectAdminMutation, projectQuery } from "./customFunctions";
import { getNextIssueKey } from "./issues/helpers";

/** Generate a secure intake token */
function generateIntakeToken(): string {
  return `intake_${crypto.randomUUID().replace(/-/g, "")}`;
}

/** Create an intake token for a project (admin only). */
export const createToken = projectAdminMutation({
  args: {},
  returns: v.object({ token: v.string() }),
  handler: async (ctx) => {
    // Check if token already exists for this project
    const existing = await ctx.db
      .query("intakeTokens")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .filter((q) => q.eq(q.field("isRevoked"), false))
      .first();

    if (existing) {
      return { token: existing.token };
    }

    const token = generateIntakeToken();
    await ctx.db.insert("intakeTokens", {
      projectId: ctx.projectId,
      token,
      isRevoked: false,
      createdBy: ctx.userId,
      updatedAt: Date.now(),
    });

    return { token };
  },
});

/** Revoke an intake token (admin only). */
export const revokeToken = projectAdminMutation({
  args: {},
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx) => {
    const token = await ctx.db
      .query("intakeTokens")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .filter((q) => q.eq(q.field("isRevoked"), false))
      .first();

    if (token) {
      await ctx.db.patch(token._id, {
        isRevoked: true,
        revokedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true } as const;
  },
});

/** Get the active intake token for a project (admin only). */
export const getToken = projectAdminMutation({
  args: {},
  returns: v.union(v.object({ token: v.string() }), v.null()),
  handler: async (ctx) => {
    const token = await ctx.db
      .query("intakeTokens")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .filter((q) => q.eq(q.field("isRevoked"), false))
      .first();

    return token ? { token: token.token } : null;
  },
});

/** Query whether an active intake token exists for this project (admin-only). */
export const getTokenStatus = projectQuery({
  args: {},
  handler: async (ctx) => {
    // Only admins can see token details — matches createToken/revokeToken guard.
    if (ctx.role !== "admin") {
      return { exists: false as const, token: null, createdAt: null };
    }

    const token = await ctx.db
      .query("intakeTokens")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .filter((q) => q.eq(q.field("isRevoked"), false))
      .first();

    return token
      ? { exists: true as const, token: token.token, createdAt: token._creationTime }
      : { exists: false as const, token: null, createdAt: null };
  },
});

/** Submit an external intake request (no auth required — uses token). */
export const createExternal = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    submitterEmail: v.optional(v.string()),
    submitterName: v.optional(v.string()),
  },
  returns: v.object({ inboxIssueId: v.id("inboxIssues") }),
  handler: async (ctx, args) => {
    // Validate token
    const tokenRecord = await ctx.db
      .query("intakeTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenRecord || tokenRecord.isRevoked) {
      throw new Error("Invalid or revoked intake token");
    }

    const project = await ctx.db.get(tokenRecord.projectId);
    if (!project || project.isDeleted) {
      throw new Error("Project not found");
    }

    const now = Date.now();

    // Atomically allocate the next issue key via the project's sequence counter.
    const { key, number: issueNumber } = await getNextIssueKey(
      ctx,
      tokenRecord.projectId,
      project.key,
    );
    const defaultStatus = project.workflowStates[0]?.id ?? "todo";

    const issueId = await ctx.db.insert("issues", {
      projectId: tokenRecord.projectId,
      organizationId: project.organizationId,
      workspaceId: project.workspaceId,
      key,
      title: args.title,
      description: args.description ?? "",
      type: "task",
      status: defaultStatus,
      priority: "medium",
      labels: [],
      linkedDocuments: [],
      attachments: [],
      reporterId: tokenRecord.createdBy,
      updatedAt: now,
      version: 1,
      order: issueNumber,
    });

    // Create inbox issue for triage
    const inboxIssueId = await ctx.db.insert("inboxIssues", {
      projectId: tokenRecord.projectId,
      issueId,
      status: "pending",
      source: "api",
      sourceEmail: args.submitterEmail,
      triageNotes: args.submitterName
        ? `Submitted by ${args.submitterName}${args.submitterEmail ? ` (${args.submitterEmail})` : ""}`
        : undefined,
      createdBy: tokenRecord.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    // Update token last-used timestamp
    await ctx.db.patch(tokenRecord._id, { updatedAt: now });

    return { inboxIssueId };
  },
});
