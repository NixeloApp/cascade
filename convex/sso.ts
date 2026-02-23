import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalMutation, query } from "./_generated/server";
import {
  authenticatedMutation,
  authenticatedQuery,
  organizationAdminMutation,
  organizationQuery,
} from "./customFunctions";
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

/**
 * Validate SAML configuration is complete for enabling
 */
function validateSamlConfig(
  config:
    | {
        idpEntityId?: string;
        idpMetadataUrl?: string;
        idpSsoUrl?: string;
      }
    | undefined,
): string | null {
  if (!config?.idpEntityId || (!config?.idpMetadataUrl && !config?.idpSsoUrl)) {
    return "SAML configuration is incomplete. Please provide IdP Entity ID and SSO URL.";
  }
  return null;
}

/**
 * Validate OIDC configuration is complete for enabling
 */
function validateOidcConfig(
  config:
    | {
        clientId?: string;
        issuer?: string;
      }
    | undefined,
): string | null {
  if (!config?.clientId || !config?.issuer) {
    return "OIDC configuration is incomplete. Please provide Client ID and Issuer URL.";
  }
  return null;
}

// =============================================================================
// Queries
// =============================================================================

/**
 * List all SSO connections for an organization
 */
export const list = organizationQuery({
  args: {},
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
  handler: async (ctx) => {
    // Organizations typically have few SSO connections (1-5)
    const connections = await ctx.db
      .query("ssoConnections")
      .withIndex("by_organization", (q) => q.eq("organizationId", ctx.organizationId))
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
export const get = authenticatedQuery({
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
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      return null;
    }

    // Check admin access
    const isAdmin = await checkOrgAdmin(ctx, ctx.userId, connection.organizationId);
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
export const create = organizationAdminMutation({
  args: {
    type: ssoTypeValidator,
    name: v.string(),
  },
  returns: v.id("ssoConnections"),
  handler: async (ctx, args) => {
    const connectionId = await ctx.db.insert("ssoConnections", {
      organizationId: ctx.organizationId,
      type: args.type,
      name: args.name,
      isEnabled: false, // Start disabled until configured
      createdBy: ctx.userId,
      updatedAt: Date.now(),
    });

    return connectionId;
  },
});

/**
 * Update SAML configuration
 */
export const updateSamlConfig = authenticatedMutation({
  args: {
    connectionId: v.id("ssoConnections"),
    config: samlConfigValidator,
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      return { success: false, error: "Connection not found" };
    }

    if (connection.type !== "saml") {
      return { success: false, error: "This is not a SAML connection" };
    }

    // Check admin access
    const isAdmin = await checkOrgAdmin(ctx, ctx.userId, connection.organizationId);
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
export const updateOidcConfig = authenticatedMutation({
  args: {
    connectionId: v.id("ssoConnections"),
    config: oidcConfigValidator,
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      return { success: false, error: "Connection not found" };
    }

    if (connection.type !== "oidc") {
      return { success: false, error: "This is not an OIDC connection" };
    }

    // Check admin access
    const isAdmin = await checkOrgAdmin(ctx, ctx.userId, connection.organizationId);
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
export const setEnabled = authenticatedMutation({
  args: {
    connectionId: v.id("ssoConnections"),
    isEnabled: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      return { success: false, error: "Connection not found" };
    }

    // Check admin access
    const isAdmin = await checkOrgAdmin(ctx, ctx.userId, connection.organizationId);
    if (!isAdmin) {
      return { success: false, error: "Admin access required" };
    }

    // Validate configuration before enabling
    if (args.isEnabled) {
      const validationError =
        connection.type === "saml"
          ? validateSamlConfig(connection.samlConfig)
          : validateOidcConfig(connection.oidcConfig);

      if (validationError) {
        return { success: false, error: validationError };
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
export const updateDomains = authenticatedMutation({
  args: {
    connectionId: v.id("ssoConnections"),
    domains: v.array(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      return { success: false, error: "Connection not found" };
    }

    // Check admin access
    const isAdmin = await checkOrgAdmin(ctx, ctx.userId, connection.organizationId);
    if (!isAdmin) {
      return { success: false, error: "Admin access required" };
    }

    // Normalize domains (lowercase, trim whitespace)
    const normalizedDomains = args.domains
      .map((d) => d.toLowerCase().trim())
      .filter((d) => d.length > 0);

    // Get current domains for this connection
    const currentDomains = await ctx.db
      .query("ssoDomains")
      .withIndex("by_connection", (q) => q.eq("connectionId", args.connectionId))
      .take(BOUNDED_LIST_LIMIT);

    const currentDomainSet = new Set(currentDomains.map((d) => d.domain));
    const newDomainSet = new Set(normalizedDomains);

    const domainsToAdd = normalizedDomains.filter((d) => !currentDomainSet.has(d));
    const domainsToRemove = currentDomains.filter((d) => !newDomainSet.has(d.domain));

    // Check for conflicts for added domains
    const existingChecks = await Promise.all(
      domainsToAdd.map(async (domain) => {
        const existing = await ctx.db
          .query("ssoDomains")
          .withIndex("by_domain", (q) => q.eq("domain", domain))
          .first();
        return { domain, existing };
      }),
    );

    for (const { domain, existing } of existingChecks) {
      if (existing) {
        return {
          success: false,
          error: `Domain "${domain}" is already configured for another organization's SSO connection.`,
        };
      }
    }

    // Apply changes
    await Promise.all(domainsToRemove.map((d) => ctx.db.delete(d._id)));

    await Promise.all(
      domainsToAdd.map((domain) =>
        ctx.db.insert("ssoDomains", {
          domain,
          connectionId: args.connectionId,
          organizationId: connection.organizationId,
        }),
      ),
    );

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
export const remove = authenticatedMutation({
  args: {
    connectionId: v.id("ssoConnections"),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      return { success: false, error: "Connection not found" };
    }

    // Check admin access
    const isAdmin = await checkOrgAdmin(ctx, ctx.userId, connection.organizationId);
    if (!isAdmin) {
      return { success: false, error: "Admin access required" };
    }

    // Delete associated domains
    const domains = await ctx.db
      .query("ssoDomains")
      .withIndex("by_connection", (q) => q.eq("connectionId", args.connectionId))
      .take(BOUNDED_LIST_LIMIT);

    await Promise.all(domains.map((d) => ctx.db.delete(d._id)));

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

    // Look up domain directly
    const ssoDomain = await ctx.db
      .query("ssoDomains")
      .withIndex("by_domain", (q) => q.eq("domain", normalizedDomain))
      .first();

    if (ssoDomain) {
      const connection = await ctx.db.get(ssoDomain.connectionId);
      if (connection?.isEnabled) {
        const org = await ctx.db.get(connection.organizationId);
        if (org) {
          return {
            connectionId: connection._id,
            organizationId: connection.organizationId,
            organizationName: org.name,
            type: connection.type,
            name: connection.name,
          };
        }
      }
    }

    // Fallback: Find enabled connections with bounded query
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

/**
 * Migration: Populate ssoDomains table from ssoConnections.
 * Should be run once.
 */
export const migrateSSODomains = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    cursor: v.union(v.string(), v.null()),
    processed: v.number(),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;

    const { page, continueCursor, isDone } = await ctx.db
      .query("ssoConnections")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let processed = 0;

    for (const connection of page) {
      if (!connection.verifiedDomains) continue;

      await Promise.all(
        connection.verifiedDomains.map(async (domain) => {
          // Check if already exists to be idempotent
          const existing = await ctx.db
            .query("ssoDomains")
            .withIndex("by_domain", (q) => q.eq("domain", domain))
            .first();

          if (!existing) {
            await ctx.db.insert("ssoDomains", {
              domain,
              connectionId: connection._id,
              organizationId: connection.organizationId,
            });
          }
        }),
      );
      processed++;
    }

    return {
      cursor: isDone ? null : continueCursor,
      processed,
    };
  },
});
