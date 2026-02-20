/**
 * Organization Access Control Helpers
 *
 * This module provides organization-level access checks.
 * Separated from organizations.ts to avoid circular dependencies with customFunctions.
 */

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { MAX_PAGE_SIZE } from "./queryLimits";

// Cache for organization members per user per request
// WeakMap keyed by context -> Map keyed by userId string -> Promise of result
const orgMembershipsCache = new WeakMap<
  object,
  Map<string, Promise<{ items: Doc<"organizationMembers">[]; hasMore: boolean }>>
>();

/**
 * Get all organization memberships for a user (cached).
 *
 * This avoids redundant DB queries when checking permissions across multiple organizations
 * or when multiple permission checks occur in the same request.
 *
 * @param ctx - Query or Mutation context
 * @param userId - The user ID to fetch memberships for
 */
export async function getOrganizationMemberships(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<{ items: Doc<"organizationMembers">[]; hasMore: boolean }> {
  let userCache = orgMembershipsCache.get(ctx);
  if (!userCache) {
    userCache = new Map();
    orgMembershipsCache.set(ctx, userCache);
  }

  const userIdStr = userId.toString();
  let promise = userCache.get(userIdStr);
  if (!promise) {
    promise = ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(MAX_PAGE_SIZE + 1)
      .then((items) => ({
        items: items.slice(0, MAX_PAGE_SIZE),
        hasMore: items.length > MAX_PAGE_SIZE,
      }));
    userCache.set(userIdStr, promise);
  }
  return promise;
}

/**
 * Retrieve a user's role within an organization.
 *
 * @returns The user's role — `owner`, `admin`, or `member` — if they belong to the organization, `null` otherwise.
 */
export async function getOrganizationRole(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
): Promise<"owner" | "admin" | "member" | null> {
  // Use cached memberships to avoid N+1 queries
  const { items, hasMore } = await getOrganizationMemberships(ctx, userId);
  const membership = items.find((m) => m.organizationId === organizationId);

  if (membership) {
    return membership.role;
  }

  // If not found in cache and we have more memberships than cached, fall back to DB
  if (hasMore) {
    const directMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", organizationId).eq("userId", userId),
      )
      .first();
    return directMembership?.role ?? null;
  }

  return null;
}

/**
 * Determine whether a user has an owner or admin role within an organization.
 *
 * @returns `true` if the user has role `"owner"` or `"admin"` in the organization, `false` otherwise.
 */
export async function isOrganizationAdmin(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
): Promise<boolean> {
  const role = await getOrganizationRole(ctx, organizationId, userId);
  return role === "owner" || role === "admin";
}

/**
 * Determines whether a user is a member of the specified organization.
 *
 * @returns `true` if the user has any role in the organization, `false` otherwise.
 */
export async function isOrganizationMember(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
): Promise<boolean> {
  const role = await getOrganizationRole(ctx, organizationId, userId);
  return role !== null;
}
