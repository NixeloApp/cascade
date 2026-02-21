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
 * Get all organization memberships for a user (cached per request).
 *
 * This function uses a `WeakMap` keyed by the request context (`ctx`) to cache results.
 * This prevents redundant database queries when checking permissions multiple times
 * within a single request (e.g., checking multiple organizations or validating access
 * in nested functions).
 *
 * The cache is automatically cleared when the request context is garbage collected
 * (i.e., when the request finishes).
 *
 * @param ctx - Query or Mutation context used as the cache key.
 * @param userId - The user ID to fetch memberships for.
 * @returns A promise resolving to the user's organization memberships and a `hasMore` flag.
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
 * This function first checks the request-scoped cache via {@link getOrganizationMemberships}.
 * If the user has many organization memberships (more than `MAX_PAGE_SIZE`) and the role
 * is not found in the cache, it falls back to a direct database query to ensure accuracy.
 *
 * @param ctx - Query or Mutation context.
 * @param organizationId - The ID of the organization to check.
 * @param userId - The ID of the user to check.
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
  // This handles the edge case where a user is in >100 orgs and the target org
  // wasn't in the first page of results.
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

/**
 * Checks if two users share at least one organization.
 *
 * This is useful for privacy checks where users can only see profiles of people
 * they share an organization with.
 *
 * @param ctx - Query or Mutation context.
 * @param userId1 - The first user ID.
 * @param userId2 - The second user ID.
 * @returns `true` if the users share at least one organization, `false` otherwise.
 */
export async function hasSharedOrganization(
  ctx: QueryCtx | MutationCtx,
  userId1: Id<"users">,
  userId2: Id<"users">,
): Promise<boolean> {
  // Get memberships for the first user
  const { items: orgs1 } = await getOrganizationMemberships(ctx, userId1);

  // Optimization: If the first user has no organizations, they can't share any.
  if (orgs1.length === 0) {
    return false;
  }

  // Get memberships for the second user
  const { items: orgs2 } = await getOrganizationMemberships(ctx, userId2);

  if (orgs2.length === 0) {
    return false;
  }

  // Check for intersection
  const orgIds1 = new Set(orgs1.map((m) => m.organizationId));
  return orgs2.some((m) => orgIds1.has(m.organizationId));
}
