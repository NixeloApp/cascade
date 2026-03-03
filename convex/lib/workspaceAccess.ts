/**
 * Workspace Access Control Helpers
 *
 * This module provides workspace-level access checks.
 * Separated from workspaces.ts to avoid circular dependencies with customFunctions.
 */

import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Get user's role in a workspace
 * Returns null if user is not a member
 */
export async function getWorkspaceRole(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  userId: Id<"users">,
): Promise<"admin" | "editor" | "member" | null> {
  const membership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_workspace_user", (q) => q.eq("workspaceId", workspaceId).eq("userId", userId))
    .first();

  return membership?.role ?? null;
}

/**
 * Check if user is workspace admin
 */
export async function isWorkspaceAdmin(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  userId: Id<"users">,
): Promise<boolean> {
  const role = await getWorkspaceRole(ctx, workspaceId, userId);
  return role === "admin";
}

/**
 * Check if user has editor access to workspace (admin or editor role)
 */
export async function isWorkspaceEditor(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  userId: Id<"users">,
): Promise<boolean> {
  const role = await getWorkspaceRole(ctx, workspaceId, userId);
  return role === "admin" || role === "editor";
}

/**
 * Check if user is a workspace member (any role)
 */
export async function isWorkspaceMember(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  userId: Id<"users">,
): Promise<boolean> {
  const role = await getWorkspaceRole(ctx, workspaceId, userId);
  return role !== null;
}

/**
 * Get a user's default workspace context for creating records.
 * Returns the first org/workspace the user belongs to, or null if none.
 *
 * Use this when creating records that need workspace scope but the user
 * hasn't explicitly selected a workspace (e.g., booking confirmations,
 * calendar sync from external sources).
 */
export async function getUserWorkspaceContext(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<{ organizationId: Id<"organizations">; workspaceId: Id<"workspaces"> } | null> {
  // Get user's first organization membership
  const orgMembership = await ctx.db
    .query("organizationMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (!orgMembership) return null;

  // Get first workspace in that organization
  const workspace = await ctx.db
    .query("workspaces")
    .withIndex("by_organization", (q) => q.eq("organizationId", orgMembership.organizationId))
    .first();

  if (!workspace) return null;

  return {
    organizationId: orgMembership.organizationId,
    workspaceId: workspace._id,
  };
}
