import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { type ApiAuthContext, hashApiKey } from "./lib/apiAuth";
import { logAudit } from "./lib/audit";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { forbidden, notFound, requireOwned, validation } from "./lib/errors";
import { notDeleted } from "./lib/softDeleteHelpers";
import { DAY, HOUR, WEEK } from "./lib/timeUtils";
import { computeProjectAccess } from "./projectAccess";

/**
 * API Key Management
 *
 * Provides secure API key generation and management for CLI/external integrations.
 * Keys follow format: sk_casc_<random_32_chars>
 */

// Generate a cryptographically secure random API key
function generateApiKey(): string {
  const prefix = "sk_casc";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = new Uint32Array(32);
  crypto.getRandomValues(randomValues);
  const randomPart = Array.from(randomValues)
    .map((val) => chars.charAt(val % chars.length))
    .join("");
  return `${prefix}_${randomPart}`;
}

// Define valid scopes
const validScopes = [
  "issues:read",
  "issues:write",
  "issues:delete",
  "projects:read",
  "projects:write",
  "comments:read",
  "comments:write",
  "documents:read",
  "documents:write",
  "search:read",
];

function getRoleAllowedScopes(role: "admin" | "editor" | "viewer" | null): string[] {
  if (role === "admin") {
    return validScopes; // All scopes
  }
  if (role === "editor") {
    // Editor can read everything and write issues/comments/documents/projects
    // Editor CANNOT delete issues (issues:delete)
    return validScopes.filter((s) => s !== "issues:delete");
  }
  if (role === "viewer") {
    // Viewer can only read
    return ["issues:read", "projects:read", "comments:read", "documents:read", "search:read"];
  }
  return [];
}

async function validateKeyGeneration(
  ctx: MutationCtx & { userId: Id<"users"> },
  projectId: Id<"projects"> | undefined,
  requestedScopes: string[],
) {
  // Validate basic scope format
  for (const scope of requestedScopes) {
    if (!validScopes.includes(scope)) {
      throw validation("scopes", `Invalid scope: ${scope}`);
    }
  }

  // If projectId is specified, verify user has access AND enforce role-based scope restrictions
  if (projectId) {
    const project = await ctx.db.get(projectId);
    if (!project) throw notFound("project", projectId);

    // Use computeProjectAccess to get the effective role (handles ownership, org admin, team membership, etc.)
    const access = await computeProjectAccess(ctx, projectId, ctx.userId);

    if (!access.canAccess) {
      throw forbidden(); // User cannot access the project at all
    }

    const allowedScopes = getRoleAllowedScopes(access.role);

    // Check if all requested scopes are allowed
    const invalidScopes = requestedScopes.filter((scope) => !allowedScopes.includes(scope));
    if (invalidScopes.length > 0) {
      throw forbidden(
        `You do not have permission to generate keys with scopes: ${invalidScopes.join(", ")}`,
      );
    }
  } else {
    // If no projectId is specified (global key), only allow read-only scopes
    // Write/Delete operations require specific project context to enforce permissions
    const writeScopes = requestedScopes.filter(
      (scope) => scope.endsWith(":write") || scope.endsWith(":delete"),
    );

    if (writeScopes.length > 0) {
      throw validation(
        "scopes",
        `Global API keys cannot have write permissions. Please specify a project for scopes: ${writeScopes.join(", ")}`,
      );
    }
  }
}

/** Validates an API key for HTTP actions, returning auth context if valid and active. */
export const validateApiKey = internalQuery({
  args: {
    keyHash: v.string(),
  },
  handler: async (ctx, args): Promise<ApiAuthContext | null> => {
    // Find key by hash
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", args.keyHash))
      .first();

    if (!key) return null;
    if (!key.isActive) return null;
    if (key.expiresAt && key.expiresAt < Date.now()) return null;

    return {
      userId: key.userId,
      keyId: key._id,
      scopes: key.scopes,
      projectId: key.projectId,
      rateLimit: key.rateLimit,
    };
  },
});

/**
 * Generate a new API key
 */
export const generate = authenticatedMutation({
  args: {
    name: v.string(),
    scopes: v.array(v.string()),
    projectId: v.optional(v.id("projects")),
    rateLimit: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Generate API key
    const apiKey = generateApiKey();
    const keyHash = await hashApiKey(apiKey);
    const keyPrefix = apiKey.substring(0, 16); // "sk_casc_AbCdEfGh"

    // Validate request
    await validateKeyGeneration(ctx, args.projectId, args.scopes);

    // Create API key record
    const keyId = await ctx.db.insert("apiKeys", {
      userId: ctx.userId,
      name: args.name,
      keyHash,
      keyPrefix,
      scopes: args.scopes,
      projectId: args.projectId,
      rateLimit: args.rateLimit ?? 100, // Default 100 req/min
      isActive: true,
      usageCount: 0,
      expiresAt: args.expiresAt,
    });

    // Audit log: API key creation is a sensitive operation
    await logAudit(ctx, {
      action: "api_key.created",
      actorId: ctx.userId,
      targetId: keyId,
      targetType: "apiKey",
      metadata: {
        name: args.name,
        scopes: args.scopes,
        ...(args.projectId && { projectId: args.projectId }),
      },
    });

    // Return the API key (ONLY time it's shown in plain text)
    return {
      id: keyId,
      apiKey, // ⚠️ User must save this - won't be shown again
      name: args.name,
      scopes: args.scopes,
      keyPrefix,
    };
  },
});

/**
 * List user's API keys
 */
export const list = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .filter(notDeleted)
      .take(BOUNDED_LIST_LIMIT);

    // Return keys with sensitive data removed
    return keys.map((key) => ({
      id: key._id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      scopes: key.scopes,
      projectId: key.projectId,
      rateLimit: key.rateLimit,
      isActive: key.isActive,
      lastUsedAt: key.lastUsedAt,
      usageCount: key.usageCount,
      expiresAt: key.expiresAt,
      createdAt: key._creationTime,
      revokedAt: key.revokedAt,
      // Rotation info
      rotatedFromId: key.rotatedFromId,
      rotatedAt: key.rotatedAt,
    }));
  },
});

/**
 * Revoke an API key
 */
export const revoke = authenticatedMutation({
  args: {
    keyId: v.id("apiKeys"),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const key = requireOwned(await ctx.db.get(args.keyId), ctx.userId, "apiKey");

    await ctx.db.patch(args.keyId, {
      isActive: false,
      revokedAt: Date.now(),
    });

    // Audit log: API key revocation is a sensitive operation
    await logAudit(ctx, {
      action: "api_key.revoked",
      actorId: ctx.userId,
      targetId: args.keyId,
      targetType: "apiKey",
      metadata: {
        name: key.name,
        keyPrefix: key.keyPrefix,
      },
    });

    return { success: true } as const;
  },
});

/**
 * Delete an API key permanently
 */
export const remove = authenticatedMutation({
  args: {
    keyId: v.id("apiKeys"),
  },
  returns: v.object({ success: v.literal(true), deleted: v.literal(true) }),
  handler: async (ctx, args) => {
    const _key = requireOwned(await ctx.db.get(args.keyId), ctx.userId, "apiKey");

    await ctx.db.delete(args.keyId);

    return { success: true, deleted: true } as const;
  },
});

/**
 * Update API key settings
 */
export const update = authenticatedMutation({
  args: {
    keyId: v.id("apiKeys"),
    name: v.optional(v.string()),
    scopes: v.optional(v.array(v.string())),
    rateLimit: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const _key = requireOwned(await ctx.db.get(args.keyId), ctx.userId, "apiKey");

    const updates: Partial<{
      name: string;
      scopes: string[];
      rateLimit: number;
      expiresAt: number;
    }> = {};

    if (args.name !== undefined) updates.name = args.name;
    if (args.scopes !== undefined) updates.scopes = args.scopes;
    if (args.rateLimit !== undefined) updates.rateLimit = args.rateLimit;
    if (args.expiresAt !== undefined) updates.expiresAt = args.expiresAt;

    await ctx.db.patch(args.keyId, updates);

    return { success: true } as const;
  },
});

/** Default grace period for rotated keys (24 hours) */
const DEFAULT_ROTATION_GRACE_PERIOD = DAY;

/**
 * Rotate an API key - creates a new key and sets up grace period for old key
 *
 * The old key remains valid for a grace period (default 24h) to allow
 * systems to transition to the new key without downtime.
 *
 * @returns The new API key (must be saved - won't be shown again)
 */
export const rotate = authenticatedMutation({
  args: {
    keyId: v.id("apiKeys"),
    gracePeriodMs: v.optional(v.number()), // Custom grace period (default 24h)
  },
  handler: async (ctx, args) => {
    const oldKey = requireOwned(await ctx.db.get(args.keyId), ctx.userId, "apiKey");

    if (!oldKey.isActive) {
      throw validation("keyId", "Cannot rotate an inactive key");
    }

    if (oldKey.rotatedAt) {
      throw validation("keyId", "This key has already been rotated");
    }

    // Verify access if project-scoped
    // Use validateKeyGeneration to re-check scopes against current permissions
    // This prevents privilege escalation if user role was downgraded
    await validateKeyGeneration(ctx, oldKey.projectId, oldKey.scopes);

    // Generate new API key
    const newApiKey = generateApiKey();
    const newKeyHash = await hashApiKey(newApiKey);
    const newKeyPrefix = newApiKey.substring(0, 16);

    const now = Date.now();
    const gracePeriod = args.gracePeriodMs ?? DEFAULT_ROTATION_GRACE_PERIOD;

    // Create new key with same settings
    const newKeyId = await ctx.db.insert("apiKeys", {
      userId: ctx.userId,
      name: `${oldKey.name} (rotated)`,
      keyHash: newKeyHash,
      keyPrefix: newKeyPrefix,
      scopes: oldKey.scopes,
      projectId: oldKey.projectId,
      rateLimit: oldKey.rateLimit,
      isActive: true,
      usageCount: 0,
      expiresAt: oldKey.expiresAt, // Inherit expiration
      rotatedFromId: args.keyId, // Link to old key
    });

    // Mark old key as rotated with grace period expiration
    await ctx.db.patch(args.keyId, {
      rotatedAt: now,
      expiresAt: now + gracePeriod, // Old key expires after grace period
    });

    return {
      id: newKeyId,
      apiKey: newApiKey, // ⚠️ User must save this - won't be shown again
      name: `${oldKey.name} (rotated)`,
      scopes: oldKey.scopes,
      keyPrefix: newKeyPrefix,
      oldKeyExpiresAt: now + gracePeriod,
      gracePeriodMs: gracePeriod,
    };
  },
});

/**
 * Get keys expiring soon (for notifications/warnings)
 * Returns keys expiring within the specified window
 */
export const listExpiringSoon = authenticatedQuery({
  args: {
    withinMs: v.optional(v.number()), // Default: 7 days
  },
  handler: async (ctx, args) => {
    const withinMs = args.withinMs ?? WEEK;
    const now = Date.now();
    const threshold = now + withinMs;

    // Get all user's active keys
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user_active", (q) => q.eq("userId", ctx.userId).eq("isActive", true))
      .take(BOUNDED_LIST_LIMIT);

    // Filter to expiring keys
    const expiring = keys.filter((key) => key.expiresAt && key.expiresAt <= threshold);

    return expiring.map((key) => ({
      id: key._id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      expiresAt: key.expiresAt,
      daysUntilExpiry: key.expiresAt ? Math.ceil((key.expiresAt - now) / DAY) : null,
      wasRotated: !!key.rotatedAt,
    }));
  },
});

/**
 * Validate API key (used by HTTP endpoints)
 * Returns user ID and key metadata if valid
 */
export const validate = internalQuery({
  args: {
    keyHash: v.string(),
  },
  handler: async (ctx, args) => {
    // Find key by hash
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", args.keyHash))
      .first();

    if (!key) {
      return { valid: false, error: "Invalid API key" };
    }

    if (!key.isActive) {
      return { valid: false, error: "API key has been revoked" };
    }

    if (key.expiresAt && key.expiresAt < Date.now()) {
      return { valid: false, error: "API key has expired" };
    }

    // Return validation result
    return {
      valid: true,
      userId: key.userId,
      keyId: key._id,
      scopes: key.scopes,
      projectId: key.projectId,
      rateLimit: key.rateLimit,
    };
  },
});

/**
 * Record API key usage (called by HTTP endpoints)
 * Protected as internalMutation to prevent public tampering.
 */
export const recordUsage = internalMutation({
  args: {
    keyId: v.id("apiKeys"),
    method: v.string(),
    endpoint: v.string(),
    statusCode: v.number(),
    responseTime: v.number(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const key = await ctx.db.get(args.keyId);
    if (!key) return { success: true } as const;

    // Update key usage stats
    await ctx.db.patch(args.keyId, {
      lastUsedAt: Date.now(),
      usageCount: key.usageCount + 1,
    });

    // Log usage
    await ctx.db.insert("apiUsageLogs", {
      apiKeyId: args.keyId,
      userId: key.userId,
      method: args.method,
      endpoint: args.endpoint,
      statusCode: args.statusCode,
      responseTime: args.responseTime,
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
      error: args.error,
    });

    return { success: true } as const;
  },
});

/**
 * Get API usage statistics
 */
export const getUsageStats = authenticatedQuery({
  args: {
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const key = requireOwned(await ctx.db.get(args.keyId), ctx.userId, "apiKey");

    // Get recent usage logs
    const logs = await ctx.db
      .query("apiUsageLogs")
      .withIndex("by_api_key", (q) => q.eq("apiKeyId", args.keyId))
      .order("desc")
      .take(100);

    // Calculate stats
    const now = Date.now();
    const oneHourAgo = now - HOUR;
    const oneDayAgo = now - DAY;

    const recentLogs = logs.filter((log) => log._creationTime > oneDayAgo);
    const lastHourLogs = logs.filter((log) => log._creationTime > oneHourAgo);

    const successCount = recentLogs.filter((log) => log.statusCode < 400).length;
    const errorCount = recentLogs.filter((log) => log.statusCode >= 400).length;
    const avgResponseTime =
      recentLogs.length > 0
        ? recentLogs.reduce((sum, log) => sum + log.responseTime, 0) / recentLogs.length
        : 0;

    return {
      totalCalls: key.usageCount,
      last24Hours: recentLogs.length,
      lastHour: lastHourLogs.length,
      successCount,
      errorCount,
      avgResponseTime: Math.round(avgResponseTime),
      recentLogs: logs.slice(0, 10).map((log) => ({
        method: log.method,
        endpoint: log.endpoint,
        statusCode: log.statusCode,
        responseTime: log.responseTime,
        error: log.error,
        createdAt: log._creationTime,
      })),
    };
  },
});
