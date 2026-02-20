/**
 * Y.js Backend Functions
 *
 * Handles Y.js document state synchronization for real-time collaboration.
 * Stores Y.js updates and state vectors for document persistence.
 */

import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, type MutationCtx, type QueryCtx } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { batchFetchUsers } from "./lib/batchHelpers";
import { forbidden } from "./lib/errors";
import { canAccessProject, canEditProject } from "./projectAccess";

/**
 * Assert that the user has read access to the document.
 * Checks:
 * 1. Creator
 * 2. Project read access (if linked to project)
 * 3. Organization read access (if public)
 */
async function assertDocumentAccess(
  ctx: QueryCtx & { userId: Id<"users"> },
  document: Doc<"documents">,
) {
  // 1. Creator always has access
  if (document.createdBy === ctx.userId) {
    return;
  }

  // 2. Project-level access
  if (document.projectId) {
    const hasAccess = await canAccessProject(ctx, document.projectId, ctx.userId);
    if (!hasAccess) {
      throw forbidden(undefined, "Not authorized to access this document's project");
    }
    return;
  }

  // 3. Public document in organization
  if (document.isPublic) {
    // Must be a member of the organization
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", document.organizationId).eq("userId", ctx.userId),
      )
      .first();

    if (!membership) {
      throw forbidden(undefined, "You are not a member of this organization");
    }
    return;
  }

  // Otherwise forbidden
  throw forbidden(undefined, "Not authorized to access this document");
}

/**
 * Assert that the user has write access to the document.
 * Checks:
 * 1. Creator
 * 2. Project write access (if linked to project)
 * 3. Organization read access (if public - treating public docs as wiki-like)
 */
async function assertDocumentWriteAccess(
  ctx: MutationCtx & { userId: Id<"users"> },
  document: Doc<"documents">,
) {
  // 1. Creator always has access
  if (document.createdBy === ctx.userId) {
    return;
  }

  // 2. Project-level access
  if (document.projectId) {
    const canEdit = await canEditProject(ctx, document.projectId, ctx.userId);
    if (!canEdit) {
      throw forbidden("editor", "You need editor access to this project");
    }
    return;
  }

  // 3. Public document in organization (Wiki style - members can edit)
  if (document.isPublic) {
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", document.organizationId).eq("userId", ctx.userId),
      )
      .first();

    if (!membership) {
      throw forbidden(undefined, "You are not a member of this organization");
    }
    // Organization members can edit public documents (default assumption for collaborative docs)
    return;
  }

  // Otherwise forbidden
  throw forbidden(undefined, "Not authorized to edit this document");
}

/**
 * Get Y.js document state for a document
 * Returns the state vector and pending updates
 */
export const getDocumentState = authenticatedQuery({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    // Check if document exists
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Check access
    await assertDocumentAccess(ctx, document);

    // Get Y.js state
    const yjsDoc = await ctx.db
      .query("yjsDocuments")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .first();

    if (!yjsDoc) {
      // Return empty state for new documents
      return {
        stateVector: null,
        updates: [],
        version: 0,
      };
    }

    return {
      stateVector: yjsDoc.stateVector,
      updates: yjsDoc.updates,
      version: yjsDoc.version,
    };
  },
});

/**
 * Apply Y.js updates to a document
 * Used by clients to sync their local changes
 */
export const applyUpdates = authenticatedMutation({
  args: {
    documentId: v.id("documents"),
    updates: v.array(v.string()), // Base64 encoded Y.js updates
    clientVersion: v.number(), // Client's current version
  },
  handler: async (ctx, args) => {
    // Check if document exists
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Check write access
    await assertDocumentWriteAccess(ctx, document);

    // Get current Y.js state
    const existingDoc = await ctx.db
      .query("yjsDocuments")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .first();

    const now = Date.now();

    if (!existingDoc) {
      // Create new Y.js document state
      await ctx.db.insert("yjsDocuments", {
        documentId: args.documentId,
        stateVector: "", // Will be computed by client
        updates: args.updates,
        version: 1,
        lastModifiedBy: ctx.userId,
        updatedAt: now,
      });

      // Update document timestamp
      await ctx.db.patch(args.documentId, { updatedAt: now });

      return { version: 1, conflict: false };
    }

    // Check for version conflict
    if (args.clientVersion < existingDoc.version) {
      // Client is behind - they need to fetch and merge
      return {
        version: existingDoc.version,
        conflict: true,
        updates: existingDoc.updates,
      };
    }

    // Append new updates (batch them for performance)
    const newUpdates = [...existingDoc.updates, ...args.updates];

    // Limit the number of stored updates (compact periodically)
    // In production, you'd want to merge updates periodically
    const MAX_UPDATES = 100;
    const updatesToStore =
      newUpdates.length > MAX_UPDATES ? newUpdates.slice(-MAX_UPDATES) : newUpdates;

    const newVersion = existingDoc.version + 1;

    await ctx.db.patch(existingDoc._id, {
      updates: updatesToStore,
      version: newVersion,
      lastModifiedBy: ctx.userId,
      updatedAt: now,
    });

    // Update document timestamp
    await ctx.db.patch(args.documentId, { updatedAt: now });

    return { version: newVersion, conflict: false };
  },
});

/**
 * Update the state vector after client computes it
 * Called after client merges updates to update the stored state vector
 */
export const updateStateVector = authenticatedMutation({
  args: {
    documentId: v.id("documents"),
    stateVector: v.string(), // Base64 encoded Y.js state vector
    version: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if document exists and user has access
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }
    await assertDocumentWriteAccess(ctx, document);

    const yjsDoc = await ctx.db
      .query("yjsDocuments")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .first();

    if (!yjsDoc) {
      throw new Error("Y.js document not found");
    }

    // Only update if version matches (optimistic concurrency)
    if (yjsDoc.version !== args.version) {
      return { success: false, reason: "version_mismatch" };
    }

    await ctx.db.patch(yjsDoc._id, {
      stateVector: args.stateVector,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Compact updates by replacing with a single merged update
 * Called periodically to reduce storage and improve sync performance
 */
export const compactUpdates = authenticatedMutation({
  args: {
    documentId: v.id("documents"),
    mergedUpdate: v.string(), // Base64 encoded merged Y.js update
    newStateVector: v.string(), // Base64 encoded state vector after merge
  },
  handler: async (ctx, args) => {
    // Check if document exists and user has access
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }
    await assertDocumentWriteAccess(ctx, document);

    const yjsDoc = await ctx.db
      .query("yjsDocuments")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .first();

    if (!yjsDoc) {
      throw new Error("Y.js document not found");
    }

    await ctx.db.patch(yjsDoc._id, {
      stateVector: args.newStateVector,
      updates: [args.mergedUpdate], // Replace all updates with single merged one
      version: yjsDoc.version + 1,
      lastModifiedBy: ctx.userId,
      updatedAt: Date.now(),
    });

    return { success: true, version: yjsDoc.version + 1 };
  },
});

// ============================================================================
// Awareness (cursor positions, user presence)
// ============================================================================

/**
 * Update user's awareness state (cursor position, selection)
 */
export const updateAwareness = authenticatedMutation({
  args: {
    documentId: v.id("documents"),
    clientId: v.number(),
    awarenessData: v.string(), // JSON string of awareness state
  },
  handler: async (ctx, args) => {
    // Check if document exists and user has access
    // Viewers can update awareness (presence)
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }
    await assertDocumentAccess(ctx, document);

    const now = Date.now();

    // Check if awareness record exists for this user+document
    const existing = await ctx.db
      .query("yjsAwareness")
      .withIndex("by_document_user", (q) =>
        q.eq("documentId", args.documentId).eq("userId", ctx.userId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        clientId: args.clientId,
        awarenessData: args.awarenessData,
        lastSeenAt: now,
      });
    } else {
      await ctx.db.insert("yjsAwareness", {
        documentId: args.documentId,
        userId: ctx.userId,
        clientId: args.clientId,
        awarenessData: args.awarenessData,
        lastSeenAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Get all active awareness states for a document
 * Returns other users' cursor positions
 */
export const getAwareness = authenticatedQuery({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    // Check if document exists and user has access
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }
    await assertDocumentAccess(ctx, document);

    // Get awareness states from the last 30 seconds (active users)
    const cutoff = Date.now() - 30 * 1000;

    const awarenessRecords = await ctx.db
      .query("yjsAwareness")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.gt(q.field("lastSeenAt"), cutoff))
      .take(200);

    // Batch fetch users to avoid N+1 queries
    const userIds = awarenessRecords.map((r) => r.userId);
    const userMap = await batchFetchUsers(ctx, userIds);

    // Get user info for each awareness record
    const usersWithAwareness = awarenessRecords.map((record) => {
      const user = userMap.get(record.userId);
      return {
        userId: record.userId,
        clientId: record.clientId,
        awarenessData: record.awarenessData,
        userName: user?.name || "Anonymous",
        userImage: user?.image,
        isCurrentUser: record.userId === ctx.userId,
      };
    });

    return usersWithAwareness;
  },
});

/**
 * Remove user's awareness (when they leave the document)
 */
export const removeAwareness = authenticatedMutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    // Check if document exists
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      // Document already deleted - just clean up awareness silently
      // No security issue: user is authenticated and can only remove their own presence
      const existing = await ctx.db
        .query("yjsAwareness")
        .withIndex("by_document_user", (q) =>
          q.eq("documentId", args.documentId).eq("userId", ctx.userId),
        )
        .first();
      if (existing) {
        await ctx.db.delete(existing._id);
      }
      return { success: true };
    }
    await assertDocumentAccess(ctx, document);

    const existing = await ctx.db
      .query("yjsAwareness")
      .withIndex("by_document_user", (q) =>
        q.eq("documentId", args.documentId).eq("userId", ctx.userId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { success: true };
  },
});

/**
 * Cleanup stale awareness records (run periodically via cron)
 */
export const cleanupStaleAwareness = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Remove awareness records older than 1 minute
    const cutoff = Date.now() - 60 * 1000;

    const staleRecords = await ctx.db
      .query("yjsAwareness")
      .withIndex("by_last_seen", (q) => q.lt("lastSeenAt", cutoff))
      .take(100); // Process in batches

    for (const record of staleRecords) {
      await ctx.db.delete(record._id);
    }

    return { deleted: staleRecords.length };
  },
});
