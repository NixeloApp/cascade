import { v } from "convex/values";
import { authenticatedMutation, issueMutation, issueQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { notFound } from "./lib/errors";
import { validateAttachment } from "./lib/fileValidators";
import { logger } from "./lib/logger";

// Generate upload URL for files
export const generateUploadUrl = authenticatedMutation({
  args: {},
  returns: v.object({ uploadUrl: v.string() }),
  handler: async (ctx) => {
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return { uploadUrl };
  },
});

// Add attachment to an issue
export const addAttachment = issueMutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
  },
  returns: v.object({ storageId: v.id("_storage") }),
  handler: async (ctx, args) => {
    // Validate file type before linking
    await validateAttachment(ctx, args.storageId);

    const issue = ctx.issue;

    // Add to issue attachments array
    const currentAttachments = issue.attachments || [];
    await ctx.db.patch(issue._id, {
      attachments: [...currentAttachments, args.storageId],
      updatedAt: Date.now(),
    });

    // Log activity (store storageId in oldValue for reliable lookup)
    await ctx.db.insert("issueActivity", {
      issueId: issue._id,
      userId: ctx.userId,
      action: "attached",
      field: "attachment",
      oldValue: args.storageId, // Store storageId for direct lookup
      newValue: args.filename,
    });

    return { storageId: args.storageId };
  },
});

// Remove attachment from an issue
export const removeAttachment = issueMutation({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.object({ success: v.literal(true), deleted: v.literal(true) }),
  handler: async (ctx, args) => {
    const issue = ctx.issue;

    // Verify the attachment belongs to this issue
    if (!(issue.attachments || []).includes(args.storageId)) {
      throw notFound("attachment", args.storageId);
    }

    // Remove from issue attachments array first
    // We update the DB regardless of storage deletion success to prevent "ghost" attachments
    const updatedAttachments = (issue.attachments || []).filter((id) => id !== args.storageId);
    await ctx.db.patch(issue._id, {
      attachments: updatedAttachments,
      updatedAt: Date.now(),
    });

    // Attempt to delete the file from storage
    // If this fails (e.g. file already deleted), we log it but don't fail the mutation
    try {
      await ctx.storage.delete(args.storageId);
    } catch (error) {
      logger.error("Failed to delete file from storage during attachment removal", {
        storageId: args.storageId,
        issueId: issue._id,
        error,
      });
    }

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: issue._id,
      userId: ctx.userId,
      action: "removed",
      field: "attachment",
    });

    return { success: true, deleted: true } as const;
  },
});

// Get all attachments for an issue with metadata
export const getIssueAttachments = issueQuery({
  args: {},
  handler: async (ctx, _args) => {
    const issue = ctx.issue;
    if (!issue?.attachments) {
      return [];
    }

    // Query activity log ONCE to avoid N+1 queries
    const attachActivities = await ctx.db
      .query("issueActivity")
      .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
      .filter((q) => q.eq(q.field("action"), "attached"))
      .take(BOUNDED_LIST_LIMIT);

    // Build lookup map by storageId (stored in oldValue)
    const activityByStorageId = new Map(
      attachActivities.filter((a) => a.oldValue).map((a) => [a.oldValue, a]),
    );

    // Get all attachment URLs in parallel
    const urls = await Promise.all(
      issue.attachments.map((storageId) => ctx.storage.getUrl(storageId)),
    );

    // Build attachment details with direct lookup by storageId
    const attachmentDetails = issue.attachments.map((storageId, index) => {
      const activity = activityByStorageId.get(storageId);

      return {
        storageId,
        url: urls[index],
        filename: activity?.newValue ?? "Unknown",
        uploadedAt: activity?._creationTime ?? issue._creationTime,
        uploadedBy: activity?.userId,
      };
    });

    return attachmentDetails;
  },
});
