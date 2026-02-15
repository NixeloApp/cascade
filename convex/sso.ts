import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { BOUNDED_LIST_LIMIT, BOUNDED_SELECT_LIMIT } from "./lib/boundedQueries";

// =============================================================================
// Types
// =============================================================================

const ssoTypeValidator = v.union(v.literal("saml"), v.literal("oidc"));

const samlConfigValidator = v.object({
  idpMetadataUrl: v.optional(v.string()),
  idpMetadataXml: v.optional(v.string()),
  idpEntityId: v.optional(v.string()),
  idpSsoUrl: v.optional(v.string()),
  idpCertificate: v.optional(v.string()),
  spEntityId: v.optional(v.string()),
  spAcsUrl: v.optional(v.string()),
  nameIdFormat: v.optional(v.string()),
  signRequest: v.optional(v.boolean()),
});

const oidcConfigValidator = v.object({
  issuer: v.optional(v.string()),
  clientId: v.optional(v.string()),
  clientSecret: v.optional(v.string()),
  scopes: v.optional(v.array(v.string())),
  authorizationUrl: v.optional(v.string()),
  tokenUrl: v.optional(v.string()),
  userInfoUrl: v.optional(v.string()),
});

// =============================================================================
// Helper Functions
// =============================================================================

async function checkOrgAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  organizationId: Id<"organizations">,
): Promise<boolean> {
  // Check if user is an admin or owner of the organization
  const membership = await ctx.db
    .query("organizationMembers")
    .withIndex("by_organization_user", (q) =>
      q.eq("organizationId", organizationId).eq("userId", userId),
    )
    .first();

  return membership?.role === "admin" || membership?.role === "owner";
}

// =============================================================================
// Queries
// =============================================================================

/**
 * List all SSO connections for an organization
 */
export const list = query({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.array(
    v.object({
      _id: v.id("ssoConnections"),
      _creationTime: v.number(),
      type: ssoTypeValidator,
      name: v.string(),
      isEnabled: v.boolean(),
      verifiedDomains: v.optional(v.array(v.string())),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check user has access to this organization
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", userId),
      )
      .first();

    if (!membership) {
      throw new Error("Not a member of this organization");
    }

    // Organizations typically have few SSO connections (1-5)
    const connections = await ctx.db
      .query("ssoConnections")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .take(BOUNDED_SELECT_LIMIT);

    // Return sanitized data (no secrets)
    return connections.map((conn) => ({
      _id: conn._id,
      _creationTime: conn._creationTime,
      type: conn.type,
      name: conn.name,
      isEnabled: conn.isEnabled,
      verifiedDomains: conn.verifiedDomains,
      updatedAt: conn.updatedAt,
    }));
  },
});

/**
 * Get a single SSO connection with full details (admin only)
 */
export const get = query({
  args: {
    connectionId: v.id("ssoConnections"),
  },
  returns: v.union(
    v.object({
      _id: v.id("ssoConnections"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      type: ssoTypeValidator,
      name: v.string(),
      isEnabled: v.boolean(),
      samlConfig: v.optional(samlConfigValidator),
      oidcConfig: v.optional(
        v.object({
          issuer: v.optional(v.string()),
          clientId: v.optional(v.string()),
          // Note: clientSecret is not returned for security
          scopes: v.optional(v.array(v.string())),
          authorizationUrl: v.optional(v.string()),
          tokenUrl: v.optional(v.string()),
          userInfoUrl: v.optional(v.string()),
        }),
      ),
      verifiedDomains: v.optional(v.array(v.string())),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      return null;
    }

    // Check admin access
    const isAdmin = await checkOrgAdmin(ctx, userId, connection.organizationId);
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    // Return data without clientSecret
    return {
      _id: connection._id,
      _creationTime: connection._creationTime,
      organizationId: connection.organizationId,
      type: connection.type,
      name: connection.name,
      isEnabled: connection.isEnabled,
      samlConfig: connection.samlConfig,
      oidcConfig: connection.oidcConfig
        ? {
            issuer: connection.oidcConfig.issuer,
            clientId: connection.oidcConfig.clientId,
            scopes: connection.oidcConfig.scopes,
            authorizationUrl: connection.oidcConfig.authorizationUrl,
            tokenUrl: connection.oidcConfig.tokenUrl,
            userInfoUrl: connection.oidcConfig.userInfoUrl,
          }
        : undefined,
      verifiedDomains: connection.verifiedDomains,
      updatedAt: connection.updatedAt,
    };
  },
});

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create a new SSO connection
 */
export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    type: ssoTypeValidator,
    name: v.string(),
  },
  returns: v.id("ssoConnections"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check admin access
    const isAdmin = await checkOrgAdmin(ctx, userId, args.organizationId);
    if (!isAdmin) {
      throw new Error("Admin access required to create SSO connections");
    }

    const connectionId = await ctx.db.insert("ssoConnections", {
      organizationId: args.organizationId,
      type: args.type,
      name: args.name,
      isEnabled: false, // Start disabled until configured
      createdBy: userId,
      updatedAt: Date.now(),
    });

    return connectionId;
  },
});

/**
 * Update SAML configuration
 */
export const updateSamlConfig = mutation({
  args: {
    connectionId: v.id("ssoConnections"),
    config: samlConfigValidator,
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      return { success: false, error: "Connection not found" };
    }

    if (connection.type !== "saml") {
      return { success: false, error: "This is not a SAML connection" };
    }

    // Check admin access
    const isAdmin = await checkOrgAdmin(ctx, userId, connection.organizationId);
    if (!isAdmin) {
      return { success: false, error: "Admin access required" };
    }

    await ctx.db.patch(args.connectionId, {
      samlConfig: args.config,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update OIDC configuration
 */
export const updateOidcConfig = mutation({
  args: {
    connectionId: v.id("ssoConnections"),
    config: oidcConfigValidator,
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      return { success: false, error: "Connection not found" };
    }

    if (connection.type !== "oidc") {
      return { success: false, error: "This is not an OIDC connection" };
    }

    // Check admin access
    const isAdmin = await checkOrgAdmin(ctx, userId, connection.organizationId);
    if (!isAdmin) {
      return { success: false, error: "Admin access required" };
    }

    await ctx.db.patch(args.connectionId, {
      oidcConfig: args.config,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Enable or disable an SSO connection
 */
export const setEnabled = mutation({
  args: {
    connectionId: v.id("ssoConnections"),
    isEnabled: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      return { success: false, error: "Connection not found" };
    }

    // Check admin access
    const isAdmin = await checkOrgAdmin(ctx, userId, connection.organizationId);
    if (!isAdmin) {
      return { success: false, error: "Admin access required" };
    }

    // Validate configuration before enabling
    if (args.isEnabled) {
      if (connection.type === "saml") {
        const config = connection.samlConfig;
        if (!config?.idpEntityId || (!config?.idpMetadataUrl && !config?.idpSsoUrl)) {
          return {
            success: false,
            error: "SAML configuration is incomplete. Please provide IdP Entity ID and SSO URL.",
          };
        }
      } else if (connection.type === "oidc") {
        const config = connection.oidcConfig;
        if (!config?.clientId || !config?.issuer) {
          return {
            success: false,
            error: "OIDC configuration is incomplete. Please provide Client ID and Issuer URL.",
          };
        }
      }
    }

    await ctx.db.patch(args.connectionId, {
      isEnabled: args.isEnabled,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update verified domains for automatic SSO routing
 */
export const updateDomains = mutation({
  args: {
    connectionId: v.id("ssoConnections"),
    domains: v.array(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      return { success: false, error: "Connection not found" };
    }

    // Check admin access
    const isAdmin = await checkOrgAdmin(ctx, userId, connection.organizationId);
    if (!isAdmin) {
      return { success: false, error: "Admin access required" };
    }

    // Normalize domains (lowercase, trim whitespace)
    const normalizedDomains = args.domains
      .map((d) => d.toLowerCase().trim())
      .filter((d) => d.length > 0);

    await ctx.db.patch(args.connectionId, {
      verifiedDomains: normalizedDomains,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete an SSO connection
 */
export const remove = mutation({
  args: {
    connectionId: v.id("ssoConnections"),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      return { success: false, error: "Connection not found" };
    }

    // Check admin access
    const isAdmin = await checkOrgAdmin(ctx, userId, connection.organizationId);
    if (!isAdmin) {
      return { success: false, error: "Admin access required" };
    }

    await ctx.db.delete(args.connectionId);

    return { success: true };
  },
});

/**
 * Get SSO connection for a domain (for automatic SSO routing on sign-in)
 */
export const getForDomain = query({
  args: {
    domain: v.string(),
  },
  returns: v.union(
    v.object({
      connectionId: v.id("ssoConnections"),
      organizationId: v.id("organizations"),
      organizationName: v.string(),
      type: ssoTypeValidator,
      name: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const normalizedDomain = args.domain.toLowerCase().trim();

    // Find enabled connections with bounded query
    // Most deployments have <100 SSO connections total
    const connections = await ctx.db
      .query("ssoConnections")
      .withIndex("by_organization_enabled")
      .filter((q) => q.eq(q.field("isEnabled"), true))
      .take(BOUNDED_LIST_LIMIT);

    // Find first connection with matching domain
    const matchingConn = connections.find((conn) =>
      conn.verifiedDomains?.includes(normalizedDomain),
    );

    if (!matchingConn) {
      return null;
    }

    // Single org lookup for the matching connection
    const org = await ctx.db.get(matchingConn.organizationId);
    if (!org) {
      return null;
    }

    return {
      connectionId: matchingConn._id,
      organizationId: matchingConn.organizationId,
      organizationName: org.name,
      type: matchingConn.type,
      name: matchingConn.name,
    };
  },
});
