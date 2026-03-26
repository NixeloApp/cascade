import type { Id } from "@convex/_generated/dataModel";

/** Apply queued offline read mutations to the inbox unread badge without using the visible list slice. */
export function getOptimisticUnreadCount(args: {
  queuedReadIds: ReadonlySet<Id<"notifications">>;
  unreadCount: number | null | undefined;
  unreadNotificationState:
    | {
        hasMore: boolean;
        ids: readonly Id<"notifications">[];
      }
    | undefined;
}): number | null | undefined {
  const { queuedReadIds, unreadCount, unreadNotificationState } = args;

  if (unreadCount == null) {
    return unreadCount;
  }

  if (
    !unreadNotificationState ||
    unreadNotificationState.hasMore ||
    !Array.isArray(unreadNotificationState.ids) ||
    unreadNotificationState.ids.length === 0 ||
    queuedReadIds.size === 0
  ) {
    return unreadCount;
  }

  const unreadIdSet = new Set(unreadNotificationState.ids);
  let queuedUnreadCount = 0;

  for (const queuedReadId of queuedReadIds) {
    if (unreadIdSet.has(queuedReadId)) {
      queuedUnreadCount += 1;
    }
  }

  return Math.max(0, unreadCount - queuedUnreadCount);
}
