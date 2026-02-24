import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { batchFetchProjects, batchFetchUsers, getUserName } from "./lib/batchHelpers";
import { BOUNDED_LIST_LIMIT, BOUNDED_RELATION_LIMIT } from "./lib/boundedQueries";
import { conflict, forbidden, notFound, validation } from "./lib/errors";
import { isOrganizationAdmin } from "./lib/organizationAccess";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SEARCH_PAGE_SIZE,
  FETCH_BUFFER_MULTIPLIER,
  MAX_OFFSET,
  MAX_PAGE_SIZE,
} from "./lib/queryLimits";
import { cascadeSoftDelete } from "./lib/relationships";
import { notDeleted, softDeleteFields } from "./lib/softDeleteHelpers";
import { isWorkspaceEditor } from "./lib/workspaceAccess";
import { assertCanAccessProject, assertCanEditProject, canAccessProject } from "./projectAccess";
import { enforceRateLimit } from "./rateLimits";

/**
 * Create a new document.
 *
 * Ensures the user has the necessary permissions:
 * - Must be a member of the organization.
 * - If linking to a project, must be a member of that project.
 * - If creating a public document, must have edit permissions on the project.
 * - If linking to a workspace, must be a workspace editor (unless org admin).
 *
 * @param title - The title of the document.
 * @param isPublic - Whether the document is visible to all organization members.
 * @param organizationId - The organization the document belongs to.
 * @param workspaceId - Optional workspace context.
 * @param projectId - Optional project context.
 * @param parentId - Optional parent document ID (for nesting).
 */
export const create = authenticatedMutation({
  args: {
    title: v.string(),
    isPublic: v.boolean(),
    organizationId: v.id("organizations"),
    workspaceId: v.optional(v.id("workspaces")),
    projectId: v.optional(v.id("projects")),
    parentId: v.optional(v.id("documents")),
  },
  returns: v.object({ documentId: v.id("documents") }),
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, "createDocument", ctx.userId);
    await validateOrganizationMembership(ctx, args.organizationId);
    await validateProjectIntegrity(ctx, args.projectId, args.organizationId, args.isPublic);
    await validateWorkspaceIntegrity(ctx, args.workspaceId, args.organizationId);

    // Validate parent document if provided
    let order = 0;
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent || parent.isDeleted) {
        throw notFound("parent document", args.parentId);
      }
      if (parent.organizationId !== args.organizationId) {
        throw validation("parentId", "Parent document must be in the same organization");
      }

      await assertDocumentAccess(ctx, parent);

      // Get max order among siblings (bounded)
      const siblings = await ctx.db
        .query("documents")
        .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
        .filter(notDeleted)
        .take(BOUNDED_RELATION_LIMIT);
      order = siblings.length > 0 ? Math.max(...siblings.map((s) => s.order ?? 0)) + 1 : 0;
    }

    const now = Date.now();
    const documentId = await ctx.db.insert("documents", {
      title: args.title,
      isPublic: args.isPublic,
      createdBy: ctx.userId,
      updatedAt: now,
      organizationId: args.organizationId,
      workspaceId: args.workspaceId,
      projectId: args.projectId,
      parentId: args.parentId,
      order,
    });

    return { documentId };
  },
});

/**
 * List documents with pagination and access control.
 *
 * Combines two sources of documents:
 * 1. Private documents created by the current user.
 * 2. Public documents in the organization (if organizationId is provided).
 *
 * Features:
 * - Deduplicates documents that appear in both queries (e.g., user's own public docs).
 * - Filters by project access permissions.
 * - Sorts by `updatedAt` descending.
 * - Supports cursor-based pagination.
 *
 * @param limit - Max number of documents to return (capped at MAX_PAGE_SIZE).
 * @param cursor - Pagination cursor (document ID).
 * @param organizationId - Filter by organization (required to see public docs).
 */
export const list = authenticatedQuery({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    // Cap limit to prevent abuse
    const requestedLimit = args.limit ?? DEFAULT_PAGE_SIZE;
    const limit = Math.min(requestedLimit, MAX_PAGE_SIZE);

    const allDocuments = await fetchAndMergeAccessibleDocuments(ctx, args.organizationId, limit);

    // Sort by updatedAt descending
    allDocuments.sort((a, b) => b.updatedAt - a.updatedAt);

    // Apply cursor-based pagination
    let startIndex = 0;
    if (args.cursor) {
      const cursorIndex = allDocuments.findIndex((doc) => doc._id === args.cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedDocs = allDocuments.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < allDocuments.length;
    const nextCursor =
      hasMore && paginatedDocs.length > 0 ? paginatedDocs[paginatedDocs.length - 1]._id : null;

    // Batch fetch creators to avoid N+1
    const creatorIds = [...new Set(paginatedDocs.map((doc) => doc.createdBy))];
    const creatorMap = await batchFetchUsers(ctx, creatorIds);

    const documents = paginatedDocs.map((doc) => {
      const creator = creatorMap.get(doc.createdBy);
      return {
        ...doc,
        creatorName: creator?.name || creator?.email || "Unknown",
        isOwner: doc.createdBy === ctx.userId,
      };
    });

    return { documents, nextCursor, hasMore };
  },
});

/**
 * Get a document by ID.
 * Returns null if the document is not found or user doesn't have access.
 */
export const getDocument = authenticatedQuery({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);

    if (!document || document.isDeleted) {
      return null;
    }

    // Check if user can access this document
    await assertDocumentAccess(ctx, document);

    const creator = await ctx.db.get(document.createdBy);
    return {
      ...document,
      creatorName: creator?.name || creator?.email || "Unknown",
      isOwner: document.createdBy === ctx.userId,
    };
  },
});

/**
 * @deprecated Use `getDocument` instead.
 */
export const get = getDocument;

export const updateTitle = authenticatedMutation({
  args: {
    id: v.id("documents"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document) {
      throw notFound("document", args.id);
    }

    if (document.createdBy !== ctx.userId) {
      throw forbidden(undefined, "Not authorized to edit this document");
    }

    await ctx.db.patch(args.id, {
      title: args.title,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const togglePublic = authenticatedMutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document) {
      throw notFound("document", args.id);
    }

    if (document.createdBy !== ctx.userId) {
      throw forbidden(undefined, "Not authorized to edit this document");
    }

    // Security Fix: Require EDITOR permission on project if changing visibility
    if (document.projectId) {
      await assertCanEditProject(ctx, document.projectId, ctx.userId);
    }

    await ctx.db.patch(args.id, {
      isPublic: !document.isPublic,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const deleteDocument = authenticatedMutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document) {
      throw notFound("document", args.id);
    }

    if (document.createdBy !== ctx.userId) {
      throw forbidden(undefined, "Not authorized to delete this document");
    }

    // Soft delete with automatic cascading
    const deletedAt = Date.now();
    await ctx.db.patch(args.id, softDeleteFields(ctx.userId));
    await cascadeSoftDelete(ctx, "documents", args.id, ctx.userId, deletedAt);

    return { success: true };
  },
});

export const restoreDocument = authenticatedMutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document) {
      throw notFound("document", args.id);
    }

    if (!document.isDeleted) {
      throw conflict("Document is not deleted");
    }

    if (document.createdBy !== ctx.userId) {
      throw forbidden(undefined, "Not authorized to restore this document");
    }

    // Restore document
    await ctx.db.patch(args.id, {
      isDeleted: undefined,
      deletedAt: undefined,
      deletedBy: undefined,
    });

    return { success: true };
  },
});

// Helper: Check if document matches creator filter
function matchesCreatorFilter(
  docCreatedBy: Id<"users">,
  filterCreatedBy: Id<"users"> | "me" | undefined,
  userId: Id<"users">,
): boolean {
  if (!filterCreatedBy) return true;
  if (filterCreatedBy === "me") return docCreatedBy === userId;
  return docCreatedBy === filterCreatedBy;
}

// Helper: Check if document matches date range filter
function matchesDateRange(creationTime: number, dateFrom?: number, dateTo?: number): boolean {
  if (dateFrom !== undefined && creationTime < dateFrom) return false;
  if (dateTo !== undefined && creationTime > dateTo) return false;
  return true;
}

// Helper: Check if document matches search filters
function matchesDocumentFilters(
  doc: {
    isPublic: boolean;
    createdBy: Id<"users">;
    projectId?: Id<"projects">;
    organizationId: Id<"organizations">;
    _creationTime: number;
  },
  filters: {
    projectId?: Id<"projects">;
    organizationId?: Id<"organizations">;
    createdBy?: Id<"users"> | "me";
    isPublic?: boolean;
    dateFrom?: number;
    dateTo?: number;
  },
  userId: Id<"users">,
): boolean {
  if (filters.projectId && doc.projectId !== filters.projectId) return false;
  if (filters.organizationId && doc.organizationId !== filters.organizationId) return false;
  if (!matchesCreatorFilter(doc.createdBy, filters.createdBy, userId)) return false;
  if (filters.isPublic !== undefined && doc.isPublic !== filters.isPublic) return false;
  return matchesDateRange(doc._creationTime, filters.dateFrom, filters.dateTo);
}

// Helper: Check if user has access to view document
async function canAccessDocument(
  ctx: QueryCtx & { userId: Id<"users"> },
  doc: {
    isPublic: boolean;
    createdBy: Id<"users">;
    organizationId: Id<"organizations">;
    projectId?: Id<"projects">;
  },
  myOrgIds?: Set<string>,
): Promise<boolean> {
  // Security: Always verify container access first, even for the creator.
  // This ensures that removed members lose access to their creations.

  // 1. Check Project Access (if linked)
  if (doc.projectId) {
    const canProject = await canAccessProject(ctx, doc.projectId, ctx.userId);
    if (!canProject) return false;
  }
  // 2. Check Organization Access (if NOT linked to a project)
  // Note: canAccessProject already handles org admin checks, so we only need explicit org check here
  else {
    let hasOrgAccess = false;
    if (myOrgIds) {
      hasOrgAccess = myOrgIds.has(doc.organizationId);
    } else {
      const membership = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization_user", (q) =>
          q.eq("organizationId", doc.organizationId).eq("userId", ctx.userId),
        )
        .first();
      hasOrgAccess = !!membership;
    }

    if (!hasOrgAccess) return false;
  }

  // 3. Check Document Permissions
  // If we reached here, the user has access to the CONTAINER (Project or Org).

  // Creator always has access (within valid container)
  if (doc.createdBy === ctx.userId) return true;

  // Public documents are accessible (within valid container)
  if (doc.isPublic) return true;

  // Otherwise, deny (e.g. private document created by someone else)
  return false;
}

async function validateOrganizationMembership(
  ctx: MutationCtx & { userId: Id<"users"> },
  organizationId: Id<"organizations">,
) {
  const membership = await ctx.db
    .query("organizationMembers")
    .withIndex("by_organization_user", (q) =>
      q.eq("organizationId", organizationId).eq("userId", ctx.userId),
    )
    .first();

  if (!membership) {
    throw forbidden(undefined, "You are not a member of this organization");
  }
}

async function validateProjectIntegrity(
  ctx: MutationCtx & { userId: Id<"users"> },
  projectId: Id<"projects"> | undefined,
  organizationId: Id<"organizations">,
  isPublic: boolean,
) {
  if (projectId) {
    const project = await ctx.db.get(projectId);
    if (!project) throw notFound("project", projectId);
    if (project.organizationId !== organizationId) {
      throw validation("projectId", "Project does not belong to the specified organization");
    }

    if (isPublic) {
      await assertCanEditProject(ctx, projectId, ctx.userId);
    } else {
      await assertCanAccessProject(ctx, projectId, ctx.userId);
    }
  }
}

async function validateWorkspaceIntegrity(
  ctx: MutationCtx & { userId: Id<"users"> },
  workspaceId: Id<"workspaces"> | undefined,
  organizationId: Id<"organizations">,
) {
  if (workspaceId) {
    const workspace = await ctx.db.get(workspaceId);
    if (!workspace) throw notFound("workspace", workspaceId);
    if (workspace.organizationId !== organizationId) {
      throw validation("workspaceId", "Workspace does not belong to the specified organization");
    }

    const isOrgAdmin = await isOrganizationAdmin(ctx, organizationId, ctx.userId);
    if (isOrgAdmin) return;

    const isEditor = await isWorkspaceEditor(ctx, workspaceId, ctx.userId);
    if (!isEditor) {
      throw forbidden(undefined, "You must be a workspace member to perform this action");
    }
  }
}

/**
 * Search for documents by title using full-text search.
 *
 * Implements a "fetch and filter" strategy:
 * 1. Fetches a buffer of results from the search index (`search_title`).
 * 2. Filters results in memory for:
 *    - Soft deletion.
 *    - Access permissions (project/org membership).
 *    - Advanced filters (date range, creator, etc.).
 *
 * Note on Pagination:
 * - `total` is accurate only for the current page of results.
 * - `totalIsApproximate` indicates if there might be more results than what was fetched.
 *
 * @param query - The search string.
 * @param limit - Max results to return.
 * @param offset - Pagination offset.
 * @param projectId - Filter by project.
 * @param organizationId - Filter by organization.
 * @param createdBy - Filter by creator ID or "me".
 * @param isPublic - Filter by visibility.
 * @param dateFrom - Filter by creation time (start).
 * @param dateTo - Filter by creation time (end).
 */
export const search = authenticatedQuery({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    projectId: v.optional(v.id("projects")),
    organizationId: v.optional(v.id("organizations")),
    createdBy: v.optional(v.union(v.id("users"), v.literal("me"))),
    isPublic: v.optional(v.boolean()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.query.trim()) {
      return { results: [], total: 0, hasMore: false };
    }

    // Cap pagination params to prevent abuse
    const offset = Math.min(args.offset ?? 0, MAX_OFFSET);
    const limit = Math.min(args.limit ?? DEFAULT_SEARCH_PAGE_SIZE, MAX_PAGE_SIZE);

    // Fetch buffer: account for filtering (permissions, filters may remove ~50% of results)
    // Fetch enough to satisfy offset + limit after filtering
    const fetchLimit = (offset + limit) * FETCH_BUFFER_MULTIPLIER;

    const results = await ctx.db
      .query("documents")
      .withSearchIndex("search_title", (q) => q.search("title", args.query))
      .filter(notDeleted)
      .take(fetchLimit);

    // Get user's organization memberships for validation
    // Bounded - users shouldn't be in more orgs than this
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .take(BOUNDED_RELATION_LIMIT);
    const myOrgIds = new Set(memberships.map((m) => m.organizationId));

    // Filter results based on access permissions and advanced filters
    const filtered = [];
    const targetCount = offset + limit + 1;

    // Optimized: Parallelize access checks to resolve N+1 latency
    const accessResults = await Promise.all(
      results.map((doc) => canAccessDocument(ctx, doc, myOrgIds)),
    );

    for (let i = 0; i < results.length; i++) {
      const doc = results[i];
      // Check access and filter conditions
      if (!accessResults[i]) continue;
      if (args.organizationId && doc.organizationId !== args.organizationId) continue;
      if (!matchesDocumentFilters(doc, args, ctx.userId)) continue;

      filtered.push(doc);
      if (filtered.length >= targetCount) break;
    }

    const total = filtered.length;

    // Apply pagination
    const paginatedResults = filtered.slice(offset, offset + limit);
    const hasMore = filtered.length > offset + limit;

    // Batch fetch all creators and projects (avoid N+1!)
    const creatorIds = paginatedResults.map((doc) => doc.createdBy);
    const projectIds = paginatedResults.map((doc) => doc.projectId);

    const [creatorMap, projectMap] = await Promise.all([
      batchFetchUsers(ctx, creatorIds),
      batchFetchProjects(ctx, projectIds),
    ]);

    // Enrich with pre-fetched data (no N+1)
    const enrichedResults = paginatedResults.map((doc) => {
      const creator = creatorMap.get(doc.createdBy);
      const project = doc.projectId ? projectMap.get(doc.projectId) : null;

      return {
        ...doc,
        creatorName: getUserName(creator),
        isOwner: doc.createdBy === ctx.userId,
        project: project
          ? {
              _id: project._id,
              name: project.name,
              key: project.key,
            }
          : null,
      };
    });

    return {
      results: enrichedResults,
      // Note: total is approximate when hasMore=true due to early exit optimization
      // The actual total could be higher than this count
      total,
      totalIsApproximate: hasMore,
      hasMore,
      offset,
      limit,
    };
  },
});

// =============================================================================
// NESTED PAGES
// =============================================================================

/**
 * List child documents of a parent (or root documents if parentId is null).
 *
 * Returns documents at a specific hierarchy level, sorted by their `order` field.
 * Also includes metadata about children counts (`hasChildren`, `childCount`).
 *
 * Access Control:
 * - Requires organization membership.
 * - Filters each document by project access (if linked to a project).
 *
 * @param organizationId - The organization to list documents from.
 * @param parentId - The parent document ID (null for root documents).
 */
export const listChildren = authenticatedQuery({
  args: {
    organizationId: v.id("organizations"),
    parentId: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    // Verify membership
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", ctx.userId),
      )
      .first();

    if (!membership) {
      throw forbidden(undefined, "You are not a member of this organization");
    }

    // Get documents at this level (bounded)
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_organization_parent", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("parentId", args.parentId)
          .lt("isDeleted", true),
      )
      .take(BOUNDED_RELATION_LIMIT);

    // Pre-build org IDs set to avoid N+1 membership queries
    const myOrgIds = new Set<string>([args.organizationId]);

    // Filter by access
    // Optimized: Parallelize access checks to resolve N+1 latency
    const accessResults = await Promise.all(
      documents.map((doc) => canAccessDocument(ctx, doc, myOrgIds)),
    );

    const accessible = documents.filter((_, i) => accessResults[i]);

    // Sort by order
    accessible.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Check if each document has children
    // Optimization: Parallel queries to check for existence of children
    const withChildInfo = await Promise.all(
      accessible.map(async (doc) => {
        // We only need to know if there's at least one child to show the expand arrow
        const firstChild = await ctx.db
          .query("documents")
          .withIndex("by_organization_parent", (q) =>
            q
              .eq("organizationId", args.organizationId)
              .eq("parentId", doc._id)
              .lt("isDeleted", true),
          )
          .first();

        return {
          ...doc,
          hasChildren: !!firstChild,
          childCount: firstChild ? 1 : 0, // Approximate, sufficient for UI
          isOwner: doc.createdBy === ctx.userId,
        };
      }),
    );

    return withChildInfo;
  },
});

/**
 * Get the full document tree for an organization.
 *
 * Constructs a recursive structure of all documents visible to the user.
 *
 * Returns:
 * - A list of root nodes.
 * - Each node contains a `children` array with its descendants.
 * - Each node includes a `depth` indicator (0 for root).
 *
 * @param organizationId - The organization ID.
 */
export const getTree = authenticatedQuery({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // Verify membership
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", ctx.userId),
      )
      .first();

    if (!membership) {
      throw forbidden(undefined, "You are not a member of this organization");
    }

    // Get all documents in org (bounded - most orgs won't have more than this)
    const allDocs = await ctx.db
      .query("documents")
      .withIndex("by_organization_deleted", (q) =>
        q.eq("organizationId", args.organizationId).lt("isDeleted", true),
      )
      .take(BOUNDED_RELATION_LIMIT);

    // Pre-build org IDs set to avoid N+1 membership queries
    const myOrgIds = new Set<string>([args.organizationId]);

    // Filter by access
    // Optimized: Parallelize access checks to resolve N+1 latency
    const accessResults = await Promise.all(
      allDocs.map((doc) => canAccessDocument(ctx, doc, myOrgIds)),
    );

    const accessible = allDocs.filter((_, i) => accessResults[i]);

    // Build tree structure
    const childrenByParent = new Map<Id<"documents"> | undefined, typeof accessible>();

    for (const doc of accessible) {
      const parentId = doc.parentId;
      if (!childrenByParent.has(parentId)) {
        childrenByParent.set(parentId, []);
      }
      childrenByParent.get(parentId)?.push(doc);
    }

    // Sort children by order
    for (const children of childrenByParent.values()) {
      children.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    // Build tree nodes
    type TreeNode = (typeof accessible)[0] & {
      children: TreeNode[];
      depth: number;
      isOwner: boolean;
    };

    const buildTree = (parentId: Id<"documents"> | undefined, depth: number): TreeNode[] => {
      const children = childrenByParent.get(parentId) || [];
      return children.map((doc) => ({
        ...doc,
        children: buildTree(doc._id, depth + 1),
        depth,
        isOwner: doc.createdBy === ctx.userId,
      }));
    };

    return buildTree(undefined, 0);
  },
});

/** Check if targetId is a descendant of ancestorId */
async function isDescendant(
  db: QueryCtx["db"],
  targetId: Id<"documents">,
  ancestorId: Id<"documents">,
): Promise<boolean> {
  let current = await db.get(targetId);
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    current = await db.get(current.parentId);
  }
  return false;
}

/** Validate new parent for document move */
async function validateNewParent(
  ctx: QueryCtx & { userId: Id<"users"> },
  docId: Id<"documents">,
  newParentId: Id<"documents">,
  organizationId: Id<"organizations">,
): Promise<void> {
  if (newParentId === docId) {
    throw validation("newParentId", "Cannot move document to itself");
  }
  if (await isDescendant(ctx.db, newParentId, docId)) {
    throw validation("newParentId", "Cannot move document to its own descendant");
  }
  const newParent = await ctx.db.get(newParentId);
  if (!newParent || newParent.isDeleted) {
    throw notFound("new parent document", newParentId);
  }
  if (newParent.organizationId !== organizationId) {
    throw validation("newParentId", "Cannot move document to different organization");
  }

  await assertDocumentAccess(ctx, newParent);
}

/**
 * Move a document to a new parent or reorder it among siblings.
 *
 * Validations:
 * - User must own the document.
 * - New parent cannot be the document itself (cycle prevention).
 * - New parent cannot be a descendant of the document (cycle prevention).
 * - New parent must belong to the same organization.
 *
 * @param id - The document to move.
 * @param newParentId - The new parent document ID (or undefined to make it a root).
 * @param newOrder - The new sort order index (optional).
 */
export const moveDocument = authenticatedMutation({
  args: {
    id: v.id("documents"),
    newParentId: v.optional(v.id("documents")),
    newOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document || document.isDeleted) {
      throw notFound("document", args.id);
    }

    if (document.createdBy !== ctx.userId) {
      throw forbidden(undefined, "Not authorized to move this document");
    }

    // Validate new parent if provided
    if (args.newParentId) {
      await validateNewParent(ctx, args.id, args.newParentId, document.organizationId);
    }

    // Calculate new order if not provided
    let newOrder = args.newOrder;
    if (newOrder === undefined) {
      const siblings = await ctx.db
        .query("documents")
        .withIndex("by_parent", (q) => q.eq("parentId", args.newParentId))
        .filter(notDeleted)
        .take(BOUNDED_RELATION_LIMIT);
      newOrder = siblings.length > 0 ? Math.max(...siblings.map((s) => s.order ?? 0)) + 1 : 0;
    }

    await ctx.db.patch(args.id, {
      parentId: args.newParentId,
      order: newOrder,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/** Reorder documents within the same parent */
export const reorderDocuments = authenticatedMutation({
  args: {
    documentIds: v.array(v.id("documents")),
    parentId: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    // Batch fetch all documents at once to avoid N+1
    const docs = await Promise.all(args.documentIds.map((id) => ctx.db.get(id)));

    // Validate all documents exist and user owns them
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      if (!doc || doc.isDeleted) {
        throw notFound("document", args.documentIds[i]);
      }
      if (doc.createdBy !== ctx.userId) {
        throw forbidden(undefined, "Not authorized to reorder this document");
      }
      if (doc.parentId !== args.parentId) {
        throw validation("documentIds", "All documents must have the same parent");
      }
    }

    // Update order for each document
    const now = Date.now();
    await Promise.all(
      args.documentIds.map((id, index) => ctx.db.patch(id, { order: index, updatedAt: now })),
    );

    return { success: true };
  },
});

/** Get breadcrumb path for a document */
export const getBreadcrumbs = authenticatedQuery({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document || document.isDeleted) {
      return [];
    }

    // Check access
    await assertDocumentAccess(ctx, document);

    // Build path by collecting all ancestor IDs first, then batch fetch
    const ancestorIds: Id<"documents">[] = [];
    let currentId: Id<"documents"> | undefined = document.parentId;
    const MAX_DEPTH = 20;

    // Collect ancestor IDs (this is bounded by MAX_DEPTH)
    while (currentId && ancestorIds.length < MAX_DEPTH) {
      ancestorIds.push(currentId);
      const parent = await ctx.db.get(currentId);
      if (!parent || parent.isDeleted) break;
      currentId = parent.parentId;
    }

    // Batch fetch all ancestors
    const ancestors = await Promise.all(ancestorIds.map((id) => ctx.db.get(id)));

    // Build path from root to current document
    const path: Array<{ _id: Id<"documents">; title: string }> = [];

    // Add ancestors (in reverse order, from root to parent)
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const ancestor = ancestors[i];
      if (ancestor && !ancestor.isDeleted) {
        path.push({ _id: ancestor._id, title: ancestor.title });
      }
    }

    // Add the current document
    path.push({ _id: document._id, title: document.title });

    return path;
  },
});

// =============================================================================
// DOCUMENT COMMENTS (Nixelo advantage - Plane has no page comments!)
// =============================================================================

/** Add a comment to a document */
export const addComment = authenticatedMutation({
  args: {
    documentId: v.id("documents"),
    content: v.string(),
    mentions: v.optional(v.array(v.id("users"))),
    parentId: v.optional(v.id("documentComments")),
  },
  returns: v.object({ commentId: v.id("documentComments") }),
  handler: async (ctx, args) => {
    // Rate limit: 60 comments per minute per user
    await enforceRateLimit(ctx, "addDocumentComment", ctx.userId);

    // Verify document exists and user has access
    await getAccessibleDocument(ctx, args.documentId);

    // If replying, verify parent comment exists
    if (args.parentId) {
      const parentComment = await ctx.db.get(args.parentId);
      if (!parentComment || parentComment.isDeleted) {
        throw notFound("parent comment", args.parentId);
      }
      if (parentComment.documentId !== args.documentId) {
        throw validation("parentId", "Parent comment must be on the same document");
      }
    }

    const now = Date.now();
    const mentions = args.mentions || [];

    const commentId = await ctx.db.insert("documentComments", {
      documentId: args.documentId,
      authorId: ctx.userId,
      content: args.content,
      mentions,
      updatedAt: now,
      parentId: args.parentId,
    });

    return { commentId };
  },
});

/** List comments for a document */
export const listComments = authenticatedQuery({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    // Verify document exists and user has access
    await getAccessibleDocument(ctx, args.documentId);

    // Get all comments for this document (bounded)
    const comments = await ctx.db
      .query("documentComments")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .take(BOUNDED_LIST_LIMIT);

    // Batch fetch authors to avoid N+1
    const authorIds = [...new Set(comments.map((c) => c.authorId))];
    const authorMap = await batchFetchUsers(ctx, authorIds);

    // Enrich comments with author info
    const enrichedComments = comments.map((comment) => {
      const author = authorMap.get(comment.authorId);
      return {
        ...comment,
        authorName: getUserName(author),
        authorImage: author?.image,
      };
    });

    // Sort by creation time (oldest first for threaded view)
    enrichedComments.sort((a, b) => a._creationTime - b._creationTime);

    return enrichedComments;
  },
});

/** Update a comment */
export const updateComment = authenticatedMutation({
  args: {
    commentId: v.id("documentComments"),
    content: v.string(),
    mentions: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment || comment.isDeleted) {
      throw notFound("comment", args.commentId);
    }

    await getAccessibleDocument(ctx, comment.documentId);

    // Only author can edit
    if (comment.authorId !== ctx.userId) {
      throw forbidden(undefined, "You can only edit your own comments");
    }

    await ctx.db.patch(args.commentId, {
      content: args.content,
      mentions: args.mentions ?? comment.mentions,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/** Delete a comment (soft delete) */
export const deleteComment = authenticatedMutation({
  args: {
    commentId: v.id("documentComments"),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment || comment.isDeleted) {
      throw notFound("comment", args.commentId);
    }

    await getAccessibleDocument(ctx, comment.documentId);

    // Only author can delete
    if (comment.authorId !== ctx.userId) {
      throw forbidden(undefined, "You can only delete your own comments");
    }

    await ctx.db.patch(args.commentId, {
      isDeleted: true,
    });

    return { success: true };
  },
});

/** Add a reaction to a comment */
export const addCommentReaction = authenticatedMutation({
  args: {
    commentId: v.id("documentComments"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment || comment.isDeleted) {
      throw notFound("comment", args.commentId);
    }

    await getAccessibleDocument(ctx, comment.documentId);

    // Check if reaction already exists
    const existing = await ctx.db
      .query("documentCommentReactions")
      .withIndex("by_comment_user_emoji", (q) =>
        q.eq("commentId", args.commentId).eq("userId", ctx.userId).eq("emoji", args.emoji),
      )
      .first();

    if (existing) {
      throw conflict("You have already reacted with this emoji");
    }

    await ctx.db.insert("documentCommentReactions", {
      commentId: args.commentId,
      userId: ctx.userId,
      emoji: args.emoji,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/** Remove a reaction from a comment */
export const removeCommentReaction = authenticatedMutation({
  args: {
    commentId: v.id("documentComments"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment || comment.isDeleted) {
      throw notFound("comment", args.commentId);
    }

    await getAccessibleDocument(ctx, comment.documentId);

    const reaction = await ctx.db
      .query("documentCommentReactions")
      .withIndex("by_comment_user_emoji", (q) =>
        q.eq("commentId", args.commentId).eq("userId", ctx.userId).eq("emoji", args.emoji),
      )
      .first();

    if (!reaction) {
      throw notFound("reaction", args.commentId);
    }

    await ctx.db.delete(reaction._id);

    return { success: true };
  },
});

/** Get reactions for comments (batch) */
export const getCommentReactions = authenticatedQuery({
  args: {
    commentIds: v.array(v.id("documentComments")),
  },
  handler: async (ctx, args) => {
    // 1. Fetch all unique comments to identify documents
    const uniqueCommentIds = [...new Set(args.commentIds)];
    const comments = await Promise.all(uniqueCommentIds.map((id) => ctx.db.get(id)));

    // 2. Resolve documents and check access
    const { commentToDocMap, accessibleDocIds } = await getAccessibleDocuments(ctx, comments);

    // 3. Fetch reactions for all valid comments at once
    const reactionsByComment = new Map<Id<"documentComments">, Doc<"documentCommentReactions">[]>();

    // Optimize: Fetch reactions for all comments in parallel (avoid N+1)
    const reactionResults = await Promise.all(
      uniqueCommentIds.map(async (commentId) => {
        const docId = commentToDocMap.get(commentId);
        // Skip if comment doesn't exist, was deleted, or document is inaccessible
        if (!docId || !accessibleDocIds.has(docId)) return null;

        const reactions = await ctx.db
          .query("documentCommentReactions")
          .withIndex("by_comment", (q) => q.eq("commentId", commentId))
          .take(BOUNDED_LIST_LIMIT);
        return { commentId, reactions };
      }),
    );

    for (const result of reactionResults) {
      if (result) {
        reactionsByComment.set(result.commentId, result.reactions);
      }
    }

    // Transform to summary format
    const result: Record<string, Array<{ emoji: string; count: number; hasReacted: boolean }>> = {};

    for (const [commentId, reactions] of reactionsByComment) {
      const emojiCounts = new Map<string, { count: number; hasReacted: boolean }>();

      for (const reaction of reactions) {
        const existing = emojiCounts.get(reaction.emoji) ?? { count: 0, hasReacted: false };
        existing.count++;
        if (reaction.userId === ctx.userId) {
          existing.hasReacted = true;
        }
        emojiCounts.set(reaction.emoji, existing);
      }

      result[commentId] = Array.from(emojiCounts.entries()).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        hasReacted: data.hasReacted,
      }));
    }

    return result;
  },
});

// Helper: Check if user can access document
async function assertDocumentAccess(
  ctx: QueryCtx & { userId: Id<"users"> },
  document: Doc<"documents">,
) {
  const allowed = await canAccessDocument(ctx, document);
  if (!allowed) {
    throw forbidden(undefined, "Not authorized to access this document");
  }
}

// Helper: Fetch document, ensure it exists/not-deleted, and verify access
async function getAccessibleDocument(
  ctx: QueryCtx & { userId: Id<"users"> },
  documentId: Id<"documents">,
): Promise<Doc<"documents">> {
  const document = await ctx.db.get(documentId);
  if (!document || document.isDeleted) {
    throw notFound("document", documentId);
  }
  await assertDocumentAccess(ctx, document);
  return document;
}

// Helper: Filter accessible documents for comments
async function getAccessibleDocuments(
  ctx: QueryCtx & { userId: Id<"users"> },
  comments: (Doc<"documentComments"> | null)[],
) {
  const documentIds = new Set<Id<"documents">>();
  const commentToDocMap = new Map<string, Id<"documents">>();

  for (const comment of comments) {
    if (comment && !comment.isDeleted) {
      documentIds.add(comment.documentId);
      commentToDocMap.set(comment._id, comment.documentId);
    }
  }

  const uniqueDocIds = [...documentIds];
  const documents = await Promise.all(uniqueDocIds.map((id) => ctx.db.get(id)));
  const accessibleDocIds = new Set<string>();

  // Optimized: Parallelize access checks
  await Promise.all(
    documents.map(async (doc) => {
      if (!doc || doc.isDeleted) return;
      // This throws forbidden() if user doesn't have access
      await assertDocumentAccess(ctx, doc);
      accessibleDocIds.add(doc._id);
    }),
  );

  return { commentToDocMap, accessibleDocIds };
}

// Helper: Fetch, combine, and filter accessible documents
async function fetchAndMergeAccessibleDocuments(
  ctx: QueryCtx & { userId: Id<"users"> },
  organizationId: Id<"organizations"> | undefined,
  limit: number,
) {
  // Fetch buffer: get more than needed to handle deduplication between private/public
  // Buffer size scales with limit to ensure we have enough results
  const fetchBuffer = limit * FETCH_BUFFER_MULTIPLIER;

  // Get user's private documents (their own non-public docs)
  const privateDocuments = await fetchPrivateDocuments(
    ctx,
    ctx.userId,
    organizationId,
    fetchBuffer,
  );

  // Get public documents (must be scoped to organization)
  const publicDocuments = await fetchPublicDocuments(ctx, ctx.userId, organizationId, fetchBuffer);

  // Combine and deduplicate (user's public docs appear in both queries)
  const seenIds = new Set<string>();
  const combinedDocuments = [...privateDocuments, ...publicDocuments].filter((doc) => {
    if (seenIds.has(doc._id)) return false;
    seenIds.add(doc._id);
    return true;
  });

  // Filter by access (specifically project access)
  // Pre-build org IDs set to avoid N+1 membership queries
  const myOrgIds = organizationId ? new Set<string>([organizationId]) : undefined;

  // Optimized: Parallelize access checks to resolve N+1 latency
  const accessResults = await Promise.all(
    combinedDocuments.map((doc) => canAccessDocument(ctx, doc, myOrgIds)),
  );

  const accessibleDocuments = combinedDocuments.filter((_, i) => accessResults[i]);

  return accessibleDocuments;
}

async function fetchPrivateDocuments(
  ctx: QueryCtx,
  userId: Id<"users">,
  organizationId: Id<"organizations"> | undefined,
  limit: number,
) {
  if (organizationId) {
    return await ctx.db
      .query("documents")
      .withIndex("by_org_creator_public_updated", (q) =>
        q.eq("organizationId", organizationId).eq("createdBy", userId).eq("isPublic", false),
      )
      .order("desc")
      .filter(notDeleted)
      .take(limit);
  }

  return await ctx.db
    .query("documents")
    .withIndex("by_creator_public_updated", (q) => q.eq("createdBy", userId).eq("isPublic", false))
    .order("desc")
    .filter(notDeleted)
    .take(limit);
}

async function fetchPublicDocuments(
  ctx: QueryCtx,
  userId: Id<"users">,
  organizationId: Id<"organizations"> | undefined,
  limit: number,
) {
  if (!organizationId) {
    // If no organizationId, we DO NOT return any public documents to prevent cross-tenant leaks.
    // Users must be in an organization context to see shared documents.
    return [];
  }

  // If organizationId is provided, first verify user is a member
  const membership = await ctx.db
    .query("organizationMembers")
    .withIndex("by_organization_user", (q) =>
      q.eq("organizationId", organizationId).eq("userId", userId),
    )
    .first();

  if (!membership) {
    return [];
  }

  // Efficiently fetch public docs for that org
  return await ctx.db
    .query("documents")
    .withIndex("by_organization_public", (q) =>
      q.eq("organizationId", organizationId).eq("isPublic", true),
    )
    .order("desc")
    .filter(notDeleted)
    .take(limit);
}
