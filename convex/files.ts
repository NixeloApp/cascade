import { v } from "convex/values";
import { authenticatedMutation, issueMutation, issueQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";

// Generate upload URL for files
export const generateUploadUrl = authenticatedMutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
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
  handler: async (ctx, args) => {
    const issue = ctx.issue;

    // Add to issue attachments array
    const currentAttachments = issue.attachments || [];
    await ctx.db.patch(issue._id, {
      attachments: [...currentAttachments, args.storageId],
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

    return args.storageId;
  },
});

// Remove attachment from an issue
export const removeAttachment = issueMutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const issue = ctx.issue;

    // Remove from issue attachments array
    const updatedAttachments = (issue.attachments || []).filter((id) => id !== args.storageId);
    await ctx.db.patch(issue._id, {
      attachments: updatedAttachments,
    });

    // Delete the file from storage
    await ctx.storage.delete(args.storageId);

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: issue._id,
      userId: ctx.userId,
      action: "removed",
      field: "attachment",
    });

    return true;
  },
});

// Get all attachments for an issue with metadata
export const getIssueAttachments = issueQuery({
  args: {},
  handler: async (ctx, args) => {
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
