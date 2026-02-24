import { getAuthUserId } from "@convex-dev/auth/server";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { components } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { forbidden, notFound, unauthenticated, validation } from "./lib/errors";
import { logger } from "./lib/logger";
import { MINUTE } from "./lib/timeUtils";
import type { ProseMirrorSnapshot } from "./validators";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

/**
 * Checks if a user has permission to read a document.
 *
 * @param ctx - The Convex query or mutation context.
 * @param documentId - The ID of the document to check.
 * @throws {ConvexError} "unauthenticated" if the user is not logged in.
 * @throws {ConvexError} "notFound" if the document does not exist.
 * @throws {ConvexError} "forbidden" if the document is private and the user is not the creator.
 */
async function checkPermissions(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  documentId: string,
) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw unauthenticated();
  }

  const document = await ctx.db.get(documentId as Id<"documents">);
  if (!document) {
    throw notFound("document", documentId);
  }

  // Check if user can access this document
  if (!("isPublic" in document && "createdBy" in document)) {
    throw validation("document", "Invalid document");
  }

  if (!document.isPublic && document.createdBy !== userId) {
    throw forbidden();
  }
}

/**
 * Checks if a user has permission to write to a document.
 *
 * @param ctx - The Convex mutation context.
 * @param documentId - The ID of the document to check.
 * @throws {ConvexError} "unauthenticated" if the user is not logged in.
 * @throws {ConvexError} "notFound" if the document does not exist.
 * @throws {ConvexError} "forbidden" if the document is private and the user is not the creator.
 */
async function checkWritePermissions(ctx: GenericMutationCtx<DataModel>, documentId: string) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw unauthenticated();
  }

  const document = await ctx.db.get(documentId as Id<"documents">);
  if (!document) {
    throw notFound("document", documentId);
  }

  // Check if user can write to this document
  if (!("isPublic" in document && "createdBy" in document)) {
    throw validation("document", "Invalid document");
  }

  // Only allow writes to public documents or documents owned by the user
  if (!document.isPublic && document.createdBy !== userId) {
    throw forbidden();
  }
}

const syncApi = prosemirrorSync.syncApi<DataModel>({
  checkRead: checkPermissions,
  checkWrite: checkWritePermissions,
  onSnapshot: async (ctx, id, snapshot, version) => {
    let parsedSnapshot: ProseMirrorSnapshot;
    try {
      parsedSnapshot =
        typeof snapshot === "string"
          ? (JSON.parse(snapshot) as ProseMirrorSnapshot)
          : (snapshot as ProseMirrorSnapshot);
    } catch (e) {
      logger.error(`Failed to parse snapshot for document ${id}:`, { error: e });
      throw validation("content", "Invalid document snapshot");
    }
    // Update the document's updatedAt timestamp when content changes
    const document = await ctx.db.get(id as Id<"documents">);
    const userId = await getAuthUserId(ctx);

    if (document && userId) {
      const now = Date.now();

      await ctx.db.patch(id as Id<"documents">, {
        updatedAt: now,
      });

      // Save version history (throttle: only save if >1 minute since last version)
      const lastVersion = await ctx.db
        .query("documentVersions")
        .withIndex("by_document", (q) => q.eq("documentId", id as Id<"documents">))
        .order("desc")
        .first();

      // Save version if:
      // 1. No previous version exists, OR
      // 2. More than 1 minute has passed since last version
      const shouldSaveVersion = !lastVersion || now - lastVersion._creationTime > MINUTE; // 1 minute

      if (shouldSaveVersion) {
        await ctx.db.insert("documentVersions", {
          documentId: id as Id<"documents">,
          version,
          snapshot: parsedSnapshot,
          title: document.title,
          createdBy: userId,
        });

        // Keep only last 50 versions per document (optional cleanup)
        const versions = await ctx.db
          .query("documentVersions")
          .withIndex("by_document", (q) => q.eq("documentId", id as Id<"documents">))
          .order("desc")
          .take(BOUNDED_LIST_LIMIT);

        if (versions.length > 50) {
          // Delete oldest versions beyond 50
          const toDelete = versions.slice(50);
          for (const v of toDelete) {
            await ctx.db.delete(v._id);
          }
        }
      }
    }
  },
});

/**
 * Retrieves the current ProseMirror snapshot for a document.
 * Verifies read permissions (Public or Creator) before returning.
 *
 * @param documentId - The ID of the document.
 * @returns The ProseMirror snapshot object.
 */
export const getSnapshot = syncApi.getSnapshot;

/**
 * Submits a new ProseMirror snapshot for a document.
 *
 * Side effects:
 * - Validates the snapshot content.
 * - Updates the document's `updatedAt` timestamp.
 * - Creates a new `documentVersion` entry if more than 1 minute has passed since the last version.
 * - Automatically cleans up old versions, keeping only the most recent 50.
 *
 * @param documentId - The ID of the document.
 * @param snapshot - The new ProseMirror snapshot (object or JSON string).
 * @param version - The version number associated with this snapshot.
 */
export const submitSnapshot = syncApi.submitSnapshot;

/**
 * Retrieves the latest version number for a document.
 * Useful for checking if the client is out of sync.
 *
 * @param documentId - The ID of the document.
 * @returns The latest version number (integer).
 */
export const latestVersion = syncApi.latestVersion;

/**
 * Retrieves a list of steps (changes) for a document within a version range.
 * Used by clients to catch up to the latest state.
 *
 * @param documentId - The ID of the document.
 * @param fromVersion - The starting version number (exclusive).
 * @returns An array of steps.
 */
export const getSteps = syncApi.getSteps;

/**
 * Submits a list of steps to apply to the document.
 *
 * @param documentId - The ID of the document.
 * @param version - The expected current version of the document.
 * @param steps - The list of steps to apply.
 * @param clientID - The unique ID of the client submitting the steps.
 */
export const submitSteps = syncApi.submitSteps;
