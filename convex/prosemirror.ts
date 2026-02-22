import { getAuthUserId } from "@convex-dev/auth/server";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { components } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { forbidden, notFound, unauthenticated, validation } from "./lib/errors";
import { MINUTE } from "./lib/timeUtils";
import type { ProseMirrorSnapshot } from "./validators";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

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

export const { getSnapshot, submitSnapshot, latestVersion, getSteps, submitSteps } =
  prosemirrorSync.syncApi<DataModel>({
    checkRead: checkPermissions,
    checkWrite: checkWritePermissions,
    onSnapshot: async (ctx, id, snapshot, version) => {
      let parsedSnapshot: ProseMirrorSnapshot;
      try {
        parsedSnapshot =
          typeof snapshot === "string"
            ? (JSON.parse(snapshot) as ProseMirrorSnapshot)
            : (snapshot as ProseMirrorSnapshot);
      } catch (_e) {
        return;
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
