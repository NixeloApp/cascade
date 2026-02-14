import { MINUTE } from "@convex-dev/rate-limiter";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { batchFetchProjects, batchFetchUsers, getUserName } from "./lib/batchHelpers";
import { BOUNDED_RELATION_LIMIT } from "./lib/boundedQueries";
import { conflict, forbidden, notFound, rateLimited, validation } from "./lib/errors";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SEARCH_PAGE_SIZE,
  FETCH_BUFFER_MULTIPLIER,
  MAX_OFFSET,
  MAX_PAGE_SIZE,
} from "./lib/queryLimits";
import { cascadeSoftDelete } from "./lib/relationships";
import { notDeleted, softDeleteFields } from "./lib/softDeleteHelpers";
import { assertCanAccessProject, assertCanEditProject } from "./projectAccess";

export const create = authenticatedMutation({
  args: {
    title: v.string(),
    isPublic: v.boolean(),
    organizationId: v.id("organizations"),
    workspaceId: v.optional(v.id("workspaces")),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    // Rate limit: 20 documents per minute per user
    // Skip in test environment (convex-test doesn't support components)
    // Rate limit: 60 documents per minute per user with burst of 15
    if (!process.env.IS_TEST_ENV) {
      const rateLimitResult = await ctx.runQuery(components.rateLimiter.lib.checkRateLimit, {
        name: `createDocument:${ctx.userId}`,
        config: {
          kind: "token bucket",
          rate: 60,
          period: MINUTE,
          capacity: 15,
        },
      });
      if (!rateLimitResult.ok) {
        throw rateLimited(rateLimitResult.retryAfter);
      }

      await ctx.runMutation(components.rateLimiter.lib.rateLimit, {
        name: `createDocument:${ctx.userId}`,
        config: {
          kind: "token bucket",
          rate: 60,
          period: MINUTE,
          capacity: 15,
        },
      });
    }

    // Validate organization membership
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", ctx.userId),
      )
      .first();

    if (!membership) {
      throw forbidden(undefined, "You are not a member of this organization");
    }

    // Validate integrity: Project must belong to the specified organization
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project) throw notFound("project", args.projectId);
      if (project.organizationId !== args.organizationId) {
        throw validation("projectId", "Project does not belong to the specified organization");
      }

      // Security Fix: Require EDITOR permission if creating a public document in a project
      if (args.isPublic) {
        await assertCanEditProject(ctx, args.projectId, ctx.userId);
      } else {
        await assertCanAccessProject(ctx, args.projectId, ctx.userId);
      }
    }

    // Validate integrity: Workspace must belong to the specified organization
    if (args.workspaceId) {
      const workspace = await ctx.db.get(args.workspaceId);
      if (!workspace) throw notFound("workspace", args.workspaceId);
      if (workspace.organizationId !== args.organizationId) {
        throw validation("workspaceId", "Workspace does not belong to the specified organization");
      }
    }

    const now = Date.now();
    return await ctx.db.insert("documents", {
      title: args.title,
      isPublic: args.isPublic,
      createdBy: ctx.userId,
      updatedAt: now,
      organizationId: args.organizationId,
      workspaceId: args.workspaceId,
      projectId: args.projectId,
    });
  },
});

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

    // Fetch buffer: get more than needed to handle deduplication between private/public
    // Buffer size scales with limit to ensure we have enough results
    const fetchBuffer = limit * FETCH_BUFFER_MULTIPLIER;

    // Get user's private documents (their own non-public docs)
    // If organizationId is provided, filter by it
    let privateDocumentsQuery = ctx.db
      .query("documents")
      .withIndex("by_creator_updated", (q) => q.eq("createdBy", ctx.userId))
      .filter((q) => q.eq(q.field("isPublic"), false));

    if (args.organizationId) {
      privateDocumentsQuery = privateDocumentsQuery.filter((q) =>
        q.eq(q.field("organizationId"), args.organizationId),
      );
    }

    const privateDocuments = await privateDocumentsQuery
      .order("desc")
      .filter(notDeleted)
      .take(fetchBuffer);

    // Get public documents (must be scoped to organization)
    let publicDocuments: typeof privateDocuments = [];

    if (args.organizationId) {
      const orgId = args.organizationId;
      // If organizationId is provided, first verify user is a member
      const membership = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization_user", (q) =>
          q.eq("organizationId", orgId).eq("userId", ctx.userId),
        )
        .first();

      if (membership) {
        // Efficiently fetch public docs for that org
        publicDocuments = await ctx.db
          .query("documents")
          .withIndex("by_organization_public", (q) =>
            q.eq("organizationId", orgId).eq("isPublic", true),
          )
          .order("desc")
          .filter(notDeleted)
          .take(fetchBuffer);
      }
    } else {
      // If no organizationId, we DO NOT return any public documents to prevent cross-tenant leaks.
      // Users must be in an organization context to see shared documents.
      publicDocuments = [];
    }

    // Combine and deduplicate (user's public docs appear in both queries)
    const seenIds = new Set<string>();
    const allDocuments = [...privateDocuments, ...publicDocuments].filter((doc) => {
      if (seenIds.has(doc._id)) return false;
      seenIds.add(doc._id);
      return true;
    });

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

export const get = authenticatedQuery({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);

    if (!document || document.isDeleted) {
      return null;
    }

    // Check if user can access this document
    const isCreator = document.createdBy === ctx.userId;

    if (!isCreator) {
      if (!document.isPublic) {
        throw forbidden(undefined, "Not authorized to access this document");
      }

      // If public, user MUST be a member of the organization
      const membership = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization_user", (q) =>
          q.eq("organizationId", document.organizationId).eq("userId", ctx.userId),
        )
        .first();

      if (!membership) {
        throw forbidden(undefined, "You are not a member of this organization");
      }
    }

    const creator = await ctx.db.get(document.createdBy);
    return {
      ...document,
      creatorName: creator?.name || creator?.email || "Unknown",
      isOwner: document.createdBy === ctx.userId,
    };
  },
});

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
  if (dateFrom && creationTime < dateFrom) return false;
  if (dateTo && creationTime > dateTo) return false;
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
function hasDocumentAccess(
  doc: { isPublic: boolean; createdBy: Id<"users">; organizationId: Id<"organizations"> },
  userId: Id<"users">,
  myOrgIds: Set<Id<"organizations">>,
): boolean {
  if (doc.createdBy === userId) return true;
  if (!doc.isPublic) return false;
  return myOrgIds.has(doc.organizationId);
}

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

    for (const doc of results) {
      // Check access and filter conditions
      if (!hasDocumentAccess(doc, ctx.userId, myOrgIds)) continue;
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
