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

export type ValidationResult =
  | {
      valid: true;
      metadata: NonNullable<Awaited<ReturnType<MutationCtx["storage"]["getMetadata"]>>>;
    }
  | { valid: false; error: string };

/**
 * Validates a file attachment by checking its storage metadata.
 * Ensures the file exists and has an allowed MIME type.
 *
 * If validation fails, the file is deleted from storage to prevent clutter
 * and potential misuse.
 *
 * @param ctx Mutation context
 * @param storageId Storage ID of the file
 * @returns The validation result
 */
export async function validateAttachment(
  ctx: MutationCtx,
  storageId: Id<"_storage">,
): Promise<ValidationResult> {
  const metadata = await ctx.storage.getMetadata(storageId);

  if (!metadata) {
    return { valid: false, error: "File not found in storage" };
  }

  const { contentType } = metadata;

  if (!contentType || !ALLOWED_MIME_TYPES.has(contentType)) {
    // Clean up the invalid file
    await ctx.storage.delete(storageId);
    return {
      valid: false,
      error: `Invalid file type: ${contentType || "unknown"}. Allowed types: images, PDF, text, Office docs.`,
    };
  }

  return { valid: true, metadata };
}
