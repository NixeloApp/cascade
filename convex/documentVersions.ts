import { v } from "convex/values";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { batchFetchUsers } from "./lib/batchHelpers";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { forbidden, notFound } from "./lib/errors";
import { getUserName } from "./lib/userUtils";

// List all versions for a document
export const listVersions = authenticatedQuery({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    // Check if user can access this document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw notFound("document", args.documentId);
    }

    if (!document.isPublic && document.createdBy !== ctx.userId) {
      throw forbidden();
    }

    // Get all versions for this document
    const versions = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .order("desc")
      .take(BOUNDED_LIST_LIMIT);

    // Batch fetch users to avoid N+1 queries
    const userIds = versions.map((v) => v.createdBy);
    const userMap = await batchFetchUsers(ctx, userIds);

    // Enrich with pre-fetched data (no N+1)
    return versions.map((version) => {
      const user = userMap.get(version.createdBy);
      return {
        ...version,
        createdByName: getUserName(user),
      };
    });
  },
});

// Get a specific version
export const getVersion = authenticatedQuery({
  args: {
    documentId: v.id("documents"),
    versionId: v.id("documentVersions"),
  },
  handler: async (ctx, args) => {
    // Check if user can access this document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw notFound("document", args.documentId);
    }

    if (!document.isPublic && document.createdBy !== ctx.userId) {
      throw forbidden();
    }

    // Get the version
    const version = await ctx.db.get(args.versionId);
    if (!version || version.documentId !== args.documentId) {
      throw notFound("version", args.versionId);
    }

    const user = await ctx.db.get(version.createdBy);
    return {
      ...version,
      createdByName: getUserName(user),
    };
  },
});

// Restore a previous version
export const restoreVersion = authenticatedMutation({
  args: {
    documentId: v.id("documents"),
    versionId: v.id("documentVersions"),
  },
  handler: async (ctx, args) => {
    // Check if user can edit this document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw notFound("document", args.documentId);
    }

    // Only owner can restore versions
    if (document.createdBy !== ctx.userId) {
      throw forbidden();
    }

    // Get the version to restore
    const version = await ctx.db.get(args.versionId);
    if (!version || version.documentId !== args.documentId) {
      throw notFound("version", args.versionId);
    }

    // Return the version snapshot and version number
    // The UI will handle submitting this snapshot to ProseMirror
    return {
      snapshot: version.snapshot,
      version: version.version,
      title: version.title,
    };
  },
});

// Delete a specific version (optional cleanup feature)
export const deleteVersion = authenticatedMutation({
  args: { versionId: v.id("documentVersions") },
  handler: async (ctx, args) => {
    const version = await ctx.db.get(args.versionId);
    if (!version) {
      throw notFound("version", args.versionId);
    }

    // Check if user owns the document
    const document = await ctx.db.get(version.documentId);
    if (!document || document.createdBy !== ctx.userId) {
      throw forbidden();
    }

    await ctx.db.delete(args.versionId);
  },
});

// Get version count for a document
export const getVersionCount = authenticatedQuery({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      return 0;
    }

    if (!document.isPublic && document.createdBy !== ctx.userId) {
      return 0;
    }

    const versions = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .take(BOUNDED_LIST_LIMIT);

    return versions.length;
  },
});
