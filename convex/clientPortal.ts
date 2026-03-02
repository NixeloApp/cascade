/**
 * Client Portal
 *
 * Magic-link token lifecycle for external client read-only project views.
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, type QueryCtx, query } from "./_generated/server";
import { organizationAdminMutation } from "./customFunctions";
import { forbidden, notFound } from "./lib/errors";
import { rateLimit } from "./rateLimits";

function buildPortalToken(): string {
  const first = crypto.randomUUID().replaceAll("-", "");
  const second = crypto.randomUUID().replaceAll("-", "");
  return `${first}${second}`;
}

async function assertClientForOrganization(
  db: QueryCtx["db"] | MutationCtx["db"],
  organizationId: Id<"organizations">,
  clientId: Id<"clients">,
) {
  const client = await db.get(clientId);
  if (!client || client.organizationId !== organizationId) {
    throw notFound("client", clientId);
  }
  return client;
}

async function assertProjectsForOrganization(
  db: QueryCtx["db"] | MutationCtx["db"],
  organizationId: Id<"organizations">,
  projectIds: Id<"projects">[],
) {
  const projects = await Promise.all(projectIds.map((projectId) => db.get(projectId)));
  if (projects.some((project) => !project || project.organizationId !== organizationId)) {
    throw forbidden("admin", "All portal projects must belong to the same organization");
  }
}

function isTokenExpired(expiresAt?: number): boolean {
  return typeof expiresAt === "number" && expiresAt <= Date.now();
}

async function resolveTokenContext(ctx: { db: QueryCtx["db"] | MutationCtx["db"] }, token: string) {
  const portalToken = await ctx.db
    .query("clientPortalTokens")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!portalToken || portalToken.isRevoked || isTokenExpired(portalToken.expiresAt)) {
    return null;
  }

  const client = await ctx.db.get(portalToken.clientId);
  if (!client) {
    return null;
  }

  const projects = await Promise.all(
    portalToken.projectIds.map((projectId) => ctx.db.get(projectId)),
  );
  const availableProjects = projects.filter(
    (project): project is NonNullable<typeof project> => !!project,
  );

  return {
    portalToken,
    client,
    projects: availableProjects,
  };
}

export const generateToken = organizationAdminMutation({
  args: {
    clientId: v.id("clients"),
    projectIds: v.array(v.id("projects")),
    permissions: v.object({
      viewIssues: v.boolean(),
      viewDocuments: v.boolean(),
      viewTimeline: v.boolean(),
      addComments: v.boolean(),
    }),
    expiresAt: v.optional(v.number()),
  },
  returns: v.object({
    success: v.literal(true),
    tokenId: v.id("clientPortalTokens"),
    token: v.string(),
    portalPath: v.string(),
  }),
  handler: async (ctx, args) => {
    if (args.projectIds.length === 0) {
      throw forbidden("admin", "At least one project is required for client portal access");
    }

    await assertClientForOrganization(ctx.db, ctx.organizationId, args.clientId);
    await assertProjectsForOrganization(ctx.db, ctx.organizationId, args.projectIds);

    const token = buildPortalToken();
    const now = Date.now();
    const tokenId = await ctx.db.insert("clientPortalTokens", {
      organizationId: ctx.organizationId,
      clientId: args.clientId,
      token,
      projectIds: args.projectIds,
      permissions: args.permissions,
      expiresAt: args.expiresAt,
      lastAccessedAt: undefined,
      isRevoked: false,
      revokedAt: undefined,
      createdBy: ctx.userId,
      updatedAt: now,
    });

    return {
      success: true,
      tokenId,
      token,
      portalPath: `/portal/${token}`,
    } as const;
  },
});

export const validateToken = mutation({
  args: {
    token: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      tokenId: v.id("clientPortalTokens"),
      organizationId: v.id("organizations"),
      clientId: v.id("clients"),
      clientName: v.string(),
      permissions: v.object({
        viewIssues: v.boolean(),
        viewDocuments: v.boolean(),
        viewTimeline: v.boolean(),
        addComments: v.boolean(),
      }),
      projectIds: v.array(v.id("projects")),
      expiresAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    if (!process.env.IS_TEST_ENV) {
      await rateLimit(ctx, "clientPortalValidation", {
        key: `portal:${args.token.slice(0, 16)}`,
        throws: true,
      });
    }

    const context = await resolveTokenContext(ctx, args.token);
    if (!context) {
      return null;
    }

    await ctx.db.patch(context.portalToken._id, {
      lastAccessedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      tokenId: context.portalToken._id,
      organizationId: context.portalToken.organizationId,
      clientId: context.portalToken.clientId,
      clientName: context.client.name,
      permissions: context.portalToken.permissions,
      projectIds: context.portalToken.projectIds,
      expiresAt: context.portalToken.expiresAt,
    };
  },
});

export const getProjectsForToken = query({
  args: {
    token: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("projects"),
      name: v.string(),
      key: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const context = await resolveTokenContext(ctx, args.token);
    if (!context) {
      return [];
    }

    return context.projects.map((project) => ({
      _id: project._id,
      name: project.name,
      key: project.key,
    }));
  },
});

export const getIssuesForToken = query({
  args: {
    token: v.string(),
    projectId: v.id("projects"),
  },
  returns: v.array(
    v.object({
      _id: v.id("issues"),
      key: v.string(),
      title: v.string(),
      status: v.string(),
      priority: v.union(
        v.literal("lowest"),
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("highest"),
      ),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const context = await resolveTokenContext(ctx, args.token);
    if (!context || !context.portalToken.permissions.viewIssues) {
      return [];
    }

    if (!context.portalToken.projectIds.includes(args.projectId)) {
      return [];
    }

    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return issues
      .filter((issue) => issue.isDeleted !== true)
      .map((issue) => ({
        _id: issue._id,
        key: issue.key,
        title: issue.title,
        status: issue.status,
        priority: issue.priority,
        updatedAt: issue.updatedAt,
      }));
  },
});

export const revokeToken = organizationAdminMutation({
  args: {
    tokenId: v.id("clientPortalTokens"),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const portalToken = await ctx.db.get(args.tokenId);
    if (!portalToken || portalToken.organizationId !== ctx.organizationId) {
      throw notFound("clientPortalToken", args.tokenId);
    }

    await ctx.db.patch(args.tokenId, {
      isRevoked: true,
      revokedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true } as const;
  },
});

export const listTokensByClient = organizationAdminMutation({
  args: {
    clientId: v.id("clients"),
  },
  returns: v.array(
    v.object({
      _id: v.id("clientPortalTokens"),
      projectIds: v.array(v.id("projects")),
      permissions: v.object({
        viewIssues: v.boolean(),
        viewDocuments: v.boolean(),
        viewTimeline: v.boolean(),
        addComments: v.boolean(),
      }),
      expiresAt: v.optional(v.number()),
      lastAccessedAt: v.optional(v.number()),
      isRevoked: v.boolean(),
      revokedAt: v.optional(v.number()),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await assertClientForOrganization(ctx.db, ctx.organizationId, args.clientId);

    const tokens = await ctx.db
      .query("clientPortalTokens")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    return tokens
      .filter((token) => token.organizationId === ctx.organizationId)
      .map((token) => ({
        _id: token._id,
        projectIds: token.projectIds,
        permissions: token.permissions,
        expiresAt: token.expiresAt,
        lastAccessedAt: token.lastAccessedAt,
        isRevoked: token.isRevoked,
        revokedAt: token.revokedAt,
        updatedAt: token.updatedAt,
      }));
  },
});
