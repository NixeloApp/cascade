import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { canAccessProject } from "../projectAccess";

export type StoredOutOfOfficeStatus = NonNullable<Doc<"users">["outOfOffice"]>;

/**
 * Determine whether a stored out-of-office window is currently active.
 */
export function isOutOfOfficeActive(
  status: StoredOutOfOfficeStatus | undefined,
  now = Date.now(),
): boolean {
  if (!status) {
    return false;
  }

  return status.startsAt <= now && status.endsAt >= now;
}

/**
 * Return the active out-of-office status for a user, if one is currently in effect.
 */
export function getActiveOutOfOfficeStatus(
  user: Doc<"users"> | null | undefined,
  now = Date.now(),
): StoredOutOfOfficeStatus | undefined {
  const status = user?.outOfOffice;
  if (!status) {
    return undefined;
  }

  return isOutOfOfficeActive(status, now) ? status : undefined;
}

/**
 * Return the active delegate for a user when their out-of-office window is in effect.
 */
export async function getActiveOutOfOfficeDelegateUserId(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  now = Date.now(),
): Promise<Id<"users"> | undefined> {
  const user = await ctx.db.get(userId);
  const status = getActiveOutOfOfficeStatus(user, now);
  const delegateUserId = status?.delegateUserId;

  if (!delegateUserId || delegateUserId === userId) {
    return undefined;
  }

  const delegateUser = await ctx.db.get(delegateUserId);
  return delegateUser ? delegateUserId : undefined;
}

/**
 * Redirect assignee selection to an active delegate when the requested user is out of office.
 * Falls back to the original user when no active delegate is configured or the delegate
 * cannot access the target project.
 */
export async function resolveOutOfOfficeDelegateUserId(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  projectId: Id<"projects">,
  now = Date.now(),
): Promise<Id<"users">> {
  const delegateUserId = await getActiveOutOfOfficeDelegateUserId(ctx, userId, now);

  if (!delegateUserId) {
    return userId;
  }

  const delegateHasProjectAccess = await canAccessProject(ctx, projectId, delegateUserId);
  return delegateHasProjectAccess ? delegateUserId : userId;
}
