import { v } from "convex/values";
import { authenticatedMutation, issueMutation, issueQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { notFound } from "./lib/errors";
import { validateAttachment } from "./lib/fileValidators";

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
  returns: v.union(
    v.object({ success: v.literal(true), storageId: v.id("_storage") }),
    v.object({ success: v.literal(false), error: v.string() }),
  ),
  handler: async (ctx, args) => {
    // Validate file type before linking
    const result = await validateAttachment(ctx, args.storageId);
    if (!result.valid) {
      return { success: false as const, error: result.error };
    }

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

    return { success: true as const, storageId: args.storageId };
  },
});

// Remove attachment from an issue
export const removeAttachment = issueMutation({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.object({
    success: v.literal(true),
    deleted: v.literal(true),
    storageDeleted: v.boolean(),
  }),
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

    // Security: Do NOT delete the file from storage.
    // Files might be referenced by other issues (via Copy/Paste ID or legitimate sharing).
    // Deleting the file here would cause data loss for other references (Cross-Project Reference Hijacking).
    // Orphaned files should be cleaned up by a separate garbage collection process if needed.
    const storageDeleted = false;

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: issue._id,
      userId: ctx.userId,
      action: "removed",
      field: "attachment",
    });

    return { success: true, deleted: true, storageDeleted } as const;
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
