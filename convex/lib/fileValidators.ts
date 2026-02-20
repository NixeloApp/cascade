import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

// Common safe MIME types
export const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // Documents
  "application/pdf",
  "text/plain",
  "text/csv",
  "text/markdown",
  // Microsoft Office
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  // OpenDocument
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  // Archives (optional, but can contain malware so be careful. omitting for now unless needed)
]);

/**
 * Validates a file attachment by checking its storage metadata.
 * Ensures the file exists and has an allowed MIME type.
 *
 * If validation fails, the file is deleted from storage to prevent clutter
 * and potential misuse.
 *
 * @param ctx Mutation context
 * @param storageId Storage ID of the file
 * @returns The file metadata if valid
 * @throws Error if file not found or invalid type
 */
export async function validateAttachment(ctx: MutationCtx, storageId: Id<"_storage">) {
  const metadata = await ctx.storage.getMetadata(storageId);

  if (!metadata) {
    throw new Error("File not found in storage");
  }

  const { contentType } = metadata;

  if (!contentType || !ALLOWED_MIME_TYPES.has(contentType)) {
    // Clean up the invalid file
    await ctx.storage.delete(storageId);
    throw new Error(
      `Invalid file type: ${contentType || "unknown"}. Allowed types: images, PDF, text, Office docs.`,
    );
  }

  return metadata;
}
