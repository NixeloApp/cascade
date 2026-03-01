/**
 * File Attachments
 *
 * Issue attachment management with secure file storage.
 * Handles upload URL generation and attachment CRUD.
 * Validates file types and tracks upload activity.
 */

import { v } from "convex/values";
import { authenticatedMutation, issueMutation, issueQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { notFound } from "./lib/errors";
import { validateAttachment } from "./lib/fileValidators";

/**
 * Generates a short-lived URL for uploading files to Convex storage.
 *
 * Used primarily for handling user uploads (e.g. avatars, issue attachments).
 * The returned URL is meant to be used by the frontend to POST the file content.
 *
 * @returns An object containing the secure `uploadUrl`.
 */
export const generateUploadUrl = authenticatedMutation({
  args: {},
  returns: v.object({ uploadUrl: v.string() }),
  handler: async (ctx) => {
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return { uploadUrl };
  },
});

/**
 * Links a previously uploaded file to an issue as an attachment.
 *
 * Performs file validation (size, type) using `validateAttachment` before linking.
 * If successful, it appends the `storageId` to the issue's `attachments` array and logs
 * the action in the `issueActivity` log for auditing and display purposes.
 *
 * @param storageId - The unique storage identifier obtained after uploading the file.
 * @param filename - The original name of the uploaded file.
 * @param contentType - The MIME type of the file.
 * @param size - The size of the file in bytes.
 * @returns A success status containing the `storageId` on success, or an error message if validation fails.
 */
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

/**
 * Removes an attachment link from a specific issue.
 *
 * Note: This deliberately unlinks the file from the issue's `attachments` array but
 * **does NOT** delete the actual file from Convex storage. This is to prevent cross-project
 * reference hijacking if the same file is linked elsewhere.
 *
 * @param storageId - The unique storage identifier of the attachment to remove.
 * @throws `notFound` if the specified attachment does not belong to the issue.
 * @returns A status object indicating success and whether storage was deleted (always false).
 */
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

/**
 * Retrieves all attachments for a specific issue along with their metadata.
 *
 * Optimizes retrieval by executing a single bounded query against `issueActivity`
 * to gather metadata (like uploader and filename) instead of causing N+1 query issues.
 * Generates signed temporary download URLs for all attachments in parallel.
 *
 * @returns An array of attachment objects containing URL, filename, uploader, and timestamp.
 */
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
