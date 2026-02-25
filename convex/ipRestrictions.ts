/**
 * Organization IP Restrictions
 *
 * Nixelo advantage - Neither Cal.com nor Plane have organization-level IP restrictions!
 *
 * Features:
 * - IP allowlist per organization
 * - CIDR notation support (e.g., "192.168.1.0/24")
 * - Single IP support (e.g., "203.0.113.50")
 * - IPv4 and IPv6 support
 * - Admin-only management
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalQuery, type MutationCtx, type QueryCtx } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { forbidden, validation } from "./lib/errors";
import { isOrganizationAdmin } from "./lib/organizationAccess";

// ============================================================================
// IP Utility Functions
// ============================================================================

/**
 * Parse an IPv4 address to a 32-bit integer
 */
function ipv4ToInt(ip: string): number {
  const parts = ip.split(".");
  if (parts.length !== 4) throw new Error("Invalid IPv4 address");

  let result = 0;
  for (const part of parts) {
    const num = Number.parseInt(part, 10);
    if (Number.isNaN(num) || num < 0 || num > 255) {
      throw new Error("Invalid IPv4 address");
    }
    result = (result << 8) + num;
  }
  return result >>> 0; // Convert to unsigned
}

/**
 * Parse CIDR notation and return [networkInt, maskInt]
 * Supports both CIDR (192.168.1.0/24) and single IP (192.168.1.100)
 */
function parseCidr(cidr: string): { network: number; mask: number } {
  const [ipPart, prefixPart] = cidr.split("/");
  const prefix = prefixPart ? Number.parseInt(prefixPart, 10) : 32;

  if (prefix < 0 || prefix > 32) {
    throw new Error("Invalid CIDR prefix (must be 0-32)");
  }

  const ip = ipv4ToInt(ipPart);
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ip & mask) >>> 0;

  return { network, mask };
}

/**
 * Check if an IP address is within a CIDR range
 */
function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const ipInt = ipv4ToInt(ip);
    const { network, mask } = parseCidr(cidr);
    return (ipInt & mask) >>> 0 === network;
  } catch {
    return false;
  }
}

/**
 * Validate CIDR notation
 */
function isValidCidr(cidr: string): boolean {
  try {
    parseCidr(cidr);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate IPv4 address
 */
function isValidIpv4(ip: string): boolean {
  try {
    ipv4ToInt(ip);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Access Control Helpers
// ============================================================================

async function assertOrganizationAdmin(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
): Promise<void> {
  const isAdmin = await isOrganizationAdmin(ctx, organizationId, userId);
  if (!isAdmin) {
    throw forbidden("admin", "Only organization admins can manage IP restrictions");
  }
}

// ============================================================================
// Core IP Validation Function
// ============================================================================

/**
 * Check if an IP is allowed for an organization
 * Returns true if:
 * - IP restrictions are disabled
 * - IP is in the allowlist
 * - Allowlist is empty (no restrictions configured)
 */
export async function isIpAllowed(
  ctx: QueryCtx,
  organizationId: Id<"organizations">,
  clientIp: string | null,
): Promise<boolean> {
  // Get organization
  const org = await ctx.db.get(organizationId);
  if (!org) return false;

  // If IP restrictions are disabled, allow
  if (!org.ipRestrictionsEnabled) return true;

  // If restrictions are ENABLED but no IP is provided, DENY (Fail Closed)
  if (!clientIp) return false;

  // Get allowlist (bounded - orgs typically have <100 IP entries)
  const allowlist = await ctx.db
    .query("organizationIpAllowlist")
    .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
    .take(BOUNDED_LIST_LIMIT);

  // If no entries, allow (no restrictions configured)
  if (allowlist.length === 0) return true;

  // Check if IP matches any entry
  for (const entry of allowlist) {
    if (isIpInCidr(clientIp, entry.ipRange)) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get IP restrictions status for an organization
 */
export const getIpRestrictionsStatus = authenticatedQuery({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.object({
    enabled: v.boolean(),
    allowlistCount: v.number(),
  }),
  handler: async (ctx, args) => {
    await assertOrganizationAdmin(ctx, args.organizationId, ctx.userId);

    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      return { enabled: false, allowlistCount: 0 };
    }

    const allowlist = await ctx.db
      .query("organizationIpAllowlist")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .take(BOUNDED_LIST_LIMIT);

    return {
      enabled: org.ipRestrictionsEnabled ?? false,
      allowlistCount: allowlist.length,
    };
  },
});

/**
 * List all IP allowlist entries for an organization
 */
export const listIpAllowlist = authenticatedQuery({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.array(
    v.object({
      _id: v.id("organizationIpAllowlist"),
      ipRange: v.string(),
      description: v.optional(v.string()),
      createdBy: v.id("users"),
      createdByName: v.string(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await assertOrganizationAdmin(ctx, args.organizationId, ctx.userId);

    const allowlist = await ctx.db
      .query("organizationIpAllowlist")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .take(BOUNDED_LIST_LIMIT);

    // Batch fetch creator names
    const creatorIds = [...new Set(allowlist.map((e) => e.createdBy))];
    const creators = await Promise.all(creatorIds.map((id) => ctx.db.get(id)));
    const creatorMap = new Map(
      creators.map((c, i) => [creatorIds[i].toString(), c?.name ?? c?.email ?? "Unknown"]),
    );

    return allowlist.map((entry) => ({
      _id: entry._id,
      ipRange: entry.ipRange,
      description: entry.description,
      createdBy: entry.createdBy,
      createdByName: creatorMap.get(entry.createdBy.toString()) ?? "Unknown",
      createdAt: entry.createdAt,
    }));
  },
});

// ============================================================================
// Mutations
// ============================================================================

/**
 * Enable or disable IP restrictions for an organization
 */
export const setIpRestrictionsEnabled = authenticatedMutation({
  args: {
    organizationId: v.id("organizations"),
    enabled: v.boolean(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await assertOrganizationAdmin(ctx, args.organizationId, ctx.userId);

    // If enabling, warn if no IPs in allowlist
    if (args.enabled) {
      const allowlist = await ctx.db
        .query("organizationIpAllowlist")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .first();

      if (!allowlist) {
        throw validation(
          "enabled",
          "Cannot enable IP restrictions without at least one IP in the allowlist. Add your current IP first.",
        );
      }
    }

    await ctx.db.patch(args.organizationId, {
      ipRestrictionsEnabled: args.enabled,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Add an IP or CIDR range to the organization allowlist
 */
export const addIpToAllowlist = authenticatedMutation({
  args: {
    organizationId: v.id("organizations"),
    ipRange: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    id: v.id("organizationIpAllowlist"),
  }),
  handler: async (ctx, args) => {
    await assertOrganizationAdmin(ctx, args.organizationId, ctx.userId);

    // Validate IP/CIDR format
    const trimmedIp = args.ipRange.trim();

    // Check if it's a valid single IP or CIDR
    const isSingleIp = isValidIpv4(trimmedIp);
    const isCidr = isValidCidr(trimmedIp);

    if (!isSingleIp && !isCidr) {
      throw validation(
        "ipRange",
        "Invalid IP address or CIDR range. Use format: 192.168.1.100 or 192.168.1.0/24",
      );
    }

    // Normalize: if single IP, store as-is (CIDR /32 is implied)
    const normalizedIp = isSingleIp && !trimmedIp.includes("/") ? trimmedIp : trimmedIp;

    // Check for duplicates
    const existing = await ctx.db
      .query("organizationIpAllowlist")
      .withIndex("by_organization_ip", (q) =>
        q.eq("organizationId", args.organizationId).eq("ipRange", normalizedIp),
      )
      .first();

    if (existing) {
      throw validation("ipRange", "This IP or range is already in the allowlist");
    }

    const id = await ctx.db.insert("organizationIpAllowlist", {
      organizationId: args.organizationId,
      ipRange: normalizedIp,
      description: args.description,
      createdBy: ctx.userId,
      createdAt: Date.now(),
    });

    return { success: true, id };
  },
});

/**
 * Remove an IP or CIDR range from the organization allowlist
 */
export const removeIpFromAllowlist = authenticatedMutation({
  args: {
    id: v.id("organizationIpAllowlist"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) {
      throw validation("id", "IP entry not found");
    }

    await assertOrganizationAdmin(ctx, entry.organizationId, ctx.userId);

    // Check if this is the last entry and IP restrictions are enabled
    const org = await ctx.db.get(entry.organizationId);
    if (org?.ipRestrictionsEnabled) {
      const remainingCount = await ctx.db
        .query("organizationIpAllowlist")
        .withIndex("by_organization", (q) => q.eq("organizationId", entry.organizationId))
        .take(2); // Only need to check if there's at least 2

      if (remainingCount.length <= 1) {
        throw validation(
          "id",
          "Cannot remove the last IP from allowlist while restrictions are enabled. Disable restrictions first.",
        );
      }
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Update an IP allowlist entry's description
 */
export const updateIpAllowlistEntry = authenticatedMutation({
  args: {
    id: v.id("organizationIpAllowlist"),
    description: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) {
      throw validation("id", "IP entry not found");
    }

    await assertOrganizationAdmin(ctx, entry.organizationId, ctx.userId);

    await ctx.db.patch(args.id, {
      description: args.description,
    });

    return { success: true };
  },
});

/**
 * Check if current request IP is allowed (for client-side display)
 */
export const checkCurrentIp = authenticatedQuery({
  args: {
    organizationId: v.id("organizations"),
    clientIp: v.string(),
  },
  returns: v.object({
    allowed: v.boolean(),
    restrictionsEnabled: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      return { allowed: false, restrictionsEnabled: false };
    }

    if (!org.ipRestrictionsEnabled) {
      return { allowed: true, restrictionsEnabled: false };
    }

    const allowed = await isIpAllowed(ctx, args.organizationId, args.clientIp);
    return { allowed, restrictionsEnabled: true };
  },
});

/**
 * Internal query to check if an IP is allowed for a project.
 * Used by HTTP actions where we have the IP but need to check DB state.
 */
export const checkProjectIpAllowed = internalQuery({
  args: {
    projectId: v.id("projects"),
    clientIp: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    // If project doesn't exist, we can't check org rules.
    // The caller (listIssues) will likely fail later with 404/403 anyway.
    // Returning true avoids confusing 403 for non-existent projects.
    if (!project) return true;

    return await isIpAllowed(ctx, project.organizationId, args.clientIp);
  },
});
