import { v } from "convex/values";
import { authenticatedMutation, authenticatedQuery, issueMutation } from "./customFunctions";
import { forbidden, notFound } from "./lib/errors";
import { validateAttachment } from "./lib/fileValidators";
import { canAccessProject } from "./projectAccess";

/**
 * Generate upload URL for file attachment
 * Requires authentication
 */
export const generateUploadUrl = authenticatedMutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Attach uploaded file to an issue
 * Requires editor role on issue's project
 */
export const attachToIssue = issueMutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
  },
  returns: v.union(
    v.object({ success: v.literal(true) }),
    v.object({ success: v.literal(false), error: v.string() }),
  ),
  handler: async (ctx, args) => {
    // Validate file type before linking
    const result = await validateAttachment(ctx, args.storageId);
    if (!result.valid) {
      return { success: false as const, error: result.error };
    }

    // Add attachment to issue
    await ctx.db.patch(ctx.issue._id, {
      attachments: [...(ctx.issue.attachments || []), args.storageId],
      updatedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: ctx.issue._id,
      userId: ctx.userId,
      action: "attached",
      field: "attachment",
      newValue: args.filename,
    });

    return { success: true } as const;
  },
});

/**
 * Remove attachment from issue
 * Requires editor role on issue's project
 */
export const removeAttachment = issueMutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // Remove attachment from issue
    await ctx.db.patch(ctx.issue._id, {
      attachments: (ctx.issue.attachments || []).filter((id) => id !== args.storageId),
      updatedAt: Date.now(),
    });

    // Delete the file from storage
    await ctx.storage.delete(args.storageId);

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: ctx.issue._id,
      userId: ctx.userId,
      action: "removed",
      field: "attachment",
    });

    return { success: true };
  },
});

/**
 * Get attachment URL
 * Requires authentication and access to the associated issue
 */
export const getAttachment = authenticatedQuery({
  args: {
    storageId: v.id("_storage"),
    issueId: v.optional(v.id("issues")),
  },
  handler: async (ctx, args) => {
    // Require issue context to enforce permissions
    if (!args.issueId) {
      throw forbidden("Access denied: issueId required for verification");
    }

    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw notFound("issue");
    }

    // Verify user has access to the project/issue
    const hasAccess = await canAccessProject(ctx, issue.projectId, ctx.userId);
    if (!hasAccess) {
      throw forbidden("Access denied");
    }

    // Verify the attachment actually belongs to this issue
    if (!issue.attachments?.includes(args.storageId)) {
      throw forbidden("Attachment does not belong to this issue");
    }

    return await ctx.storage.getUrl(args.storageId);
  },
});
