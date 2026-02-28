import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { asyncMap } from "convex-helpers";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, internalQuery } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { batchFetchIssues, batchFetchUsers } from "./lib/batchHelpers";
import { boundedCount } from "./lib/boundedQueries";
import { requireOwned } from "./lib/errors";
import { fetchPaginatedQuery } from "./lib/queryHelpers";
import { notDeleted, softDeleteFields } from "./lib/softDeleteHelpers";

/** Get paginated notifications for the current user, optionally filtered to unread only. */
export const list = authenticatedQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    onlyUnread: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const onlyUnread = args.onlyUnread ?? false;
    const now = Date.now();

    const results = await fetchPaginatedQuery<Doc<"notifications">>(ctx, {
      paginationOpts: args.paginationOpts,
      query: (db) => {
        if (onlyUnread) {
          // Optimization: Use by_user_read index which includes isDeleted
          // to avoid fetching deleted documents
          return db
            .query("notifications")
            .withIndex("by_user_read", (q) =>
              q.eq("userId", ctx.userId).eq("isRead", false).lt("isDeleted", true),
            )
            .filter((q) =>
              q.and(
                q.neq(q.field("isArchived"), true),
                // Filter out currently snoozed notifications
                q.or(q.eq(q.field("snoozedUntil"), undefined), q.lt(q.field("snoozedUntil"), now)),
              ),
            );
        }
        return db
          .query("notifications")
          .withIndex("by_user_active", (q) => q.eq("userId", ctx.userId).lt("isDeleted", true))
          .filter((q) =>
            q.and(
              q.neq(q.field("isArchived"), true),
              // Filter out currently snoozed notifications
              q.or(q.eq(q.field("snoozedUntil"), undefined), q.lt(q.field("snoozedUntil"), now)),
            ),
          );
      },
    });

    // Batch fetch all actors (avoid N+1!)
    const actorIds = results.page.map((n) => n.actorId);
    const actorMap = await batchFetchUsers(ctx, actorIds);

    // Enrich with pre-fetched data (no N+1)
    const enrichedPage = results.page.map((notification) => {
      const actor = notification.actorId ? actorMap.get(notification.actorId) : null;
      return {
        ...notification,
        actorName: actor?.name,
      };
    });

    return {
      ...results,
      page: enrichedPage,
    };
  },
});

/** Get the unread notification count for the current user, capped at 100 for display purposes. */
export const getUnreadCount = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    // Cap at 100 - UI typically shows "99+" anyway
    const MAX_UNREAD_COUNT = 100;

    // Use boundedCount to stop scanning after 100 items
    // efficientCount() uses .count() which scans all items (O(N)), which is wasteful here
    const { count } = await boundedCount(
      ctx.db
        .query("notifications")
        .withIndex("by_user_read", (q) =>
          q.eq("userId", ctx.userId).eq("isRead", false).lt("isDeleted", true),
        )
        .filter((q) => q.neq(q.field("isArchived"), true)),
      { limit: MAX_UNREAD_COUNT },
    );

    return count;
  },
});

/** Mark a single notification as read. Only the notification owner can perform this action. */
export const markAsRead = authenticatedMutation({
  args: { id: v.id("notifications") },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    requireOwned(notification, ctx.userId, "notification");

    await ctx.db.patch(args.id, { isRead: true });

    return { success: true } as const;
  },
});

/** Mark all unread notifications as read, up to 500 per call. Returns whether more remain. */
export const markAllAsRead = authenticatedMutation({
  args: {},
  returns: v.object({ marked: v.number(), hasMore: v.boolean() }),
  handler: async (ctx) => {
    // Limit per mutation call - can be called multiple times if needed
    const MAX_TO_MARK = 500;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", ctx.userId).eq("isRead", false).lt("isDeleted", true),
      )
      .take(MAX_TO_MARK);

    // Batch update all notifications in parallel
    await asyncMap(unread, (n) => ctx.db.patch(n._id, { isRead: true }));

    // Return count so client knows if more remain
    return { marked: unread.length, hasMore: unread.length === MAX_TO_MARK };
  },
});

/** Soft-delete a notification. Only the notification owner can perform this action. */
export const softDeleteNotification = authenticatedMutation({
  args: { id: v.id("notifications") },
  returns: v.object({ success: v.literal(true), deleted: v.literal(true) }),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    requireOwned(notification, ctx.userId, "notification");

    await ctx.db.patch(args.id, softDeleteFields(ctx.userId));

    return { success: true, deleted: true } as const;
  },
});

/** Archive a notification. Archived notifications are hidden but can be restored. */
export const archiveNotification = authenticatedMutation({
  args: { id: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    requireOwned(notification, ctx.userId, "notification");

    await ctx.db.patch(args.id, {
      isArchived: true,
      archivedAt: Date.now(),
    });

    return null;
  },
});

/** Unarchive a notification. */
export const unarchiveNotification = authenticatedMutation({
  args: { id: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    requireOwned(notification, ctx.userId, "notification");

    await ctx.db.patch(args.id, {
      isArchived: undefined,
      archivedAt: undefined,
    });

    return null;
  },
});

/** Snooze a notification until a specified time. */
export const snoozeNotification = authenticatedMutation({
  args: {
    id: v.id("notifications"),
    snoozedUntil: v.number(), // Timestamp when notification should reappear
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    requireOwned(notification, ctx.userId, "notification");

    // Validate snooze time is in the future
    if (args.snoozedUntil <= Date.now()) {
      throw new Error("Snooze time must be in the future");
    }

    await ctx.db.patch(args.id, {
      snoozedUntil: args.snoozedUntil,
    });

    return null;
  },
});

/** Unsnooze a notification (make it visible immediately). */
export const unsnoozeNotification = authenticatedMutation({
  args: { id: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    requireOwned(notification, ctx.userId, "notification");

    await ctx.db.patch(args.id, {
      snoozedUntil: undefined,
    });

    return null;
  },
});

/** Archive all notifications for the current user. */
export const archiveAllNotifications = authenticatedMutation({
  args: {},
  returns: v.object({ archivedCount: v.number() }),
  handler: async (ctx) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_active", (q) => q.eq("userId", ctx.userId).eq("isDeleted", false))
      .filter((q) => q.neq(q.field("isArchived"), true))
      .take(500);

    const now = Date.now();
    await asyncMap(notifications, (n) =>
      ctx.db.patch(n._id, {
        isArchived: true,
        archivedAt: now,
      }),
    );

    return { archivedCount: notifications.length };
  },
});

/** List archived notifications for the current user. */
export const listArchived = authenticatedQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("notifications"),
      _creationTime: v.number(),
      userId: v.id("users"),
      type: v.string(),
      title: v.string(),
      message: v.string(),
      issueId: v.optional(v.id("issues")),
      projectId: v.optional(v.id("projects")),
      documentId: v.optional(v.id("documents")),
      actorId: v.optional(v.id("users")),
      isRead: v.boolean(),
      isArchived: v.optional(v.boolean()),
      archivedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_archived", (q) => q.eq("userId", ctx.userId).eq("isArchived", true))
      .filter(notDeleted)
      .order("desc")
      .take(100);

    return notifications.map((n) => ({
      _id: n._id,
      _creationTime: n._creationTime,
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      issueId: n.issueId,
      projectId: n.projectId,
      documentId: n.documentId,
      actorId: n.actorId,
      isRead: n.isRead,
      isArchived: n.isArchived,
      archivedAt: n.archivedAt,
    }));
  },
});

/** List snoozed notifications for the current user. */
export const listSnoozed = authenticatedQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("notifications"),
      _creationTime: v.number(),
      userId: v.id("users"),
      type: v.string(),
      title: v.string(),
      message: v.string(),
      issueId: v.optional(v.id("issues")),
      projectId: v.optional(v.id("projects")),
      documentId: v.optional(v.id("documents")),
      actorId: v.optional(v.id("users")),
      isRead: v.boolean(),
      snoozedUntil: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const now = Date.now();
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_snoozed", (q) => q.eq("userId", ctx.userId).gt("snoozedUntil", now))
      .filter(notDeleted)
      .order("desc")
      .take(100);

    return notifications.map((n) => ({
      _id: n._id,
      _creationTime: n._creationTime,
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      issueId: n.issueId,
      projectId: n.projectId,
      documentId: n.documentId,
      actorId: n.actorId,
      isRead: n.isRead,
      snoozedUntil: n.snoozedUntil as number,
    }));
  },
});

/** Create a notification for a user. Skips creation if the actor is the recipient. */
export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    issueId: v.optional(v.id("issues")),
    projectId: v.optional(v.id("projects")),
    documentId: v.optional(v.id("documents")),
    actorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Don't create notification if user is the actor
    if (args.actorId === args.userId) {
      return;
    }

    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      issueId: args.issueId,
      projectId: args.projectId,
      documentId: args.documentId,
      actorId: args.actorId,
      isRead: false,
      isDeleted: false,
    });
  },
});

/** Create notifications for multiple users in parallel. Skips the actor if included in the list. */
export const createBulk = internalMutation({
  args: {
    userIds: v.array(v.id("users")),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    issueId: v.optional(v.id("issues")),
    projectId: v.optional(v.id("projects")),
    documentId: v.optional(v.id("documents")),
    actorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.userIds.map((userId) => {
        // Don't create notification if user is the actor
        if (args.actorId === userId) {
          return Promise.resolve();
        }

        return ctx.db.insert("notifications", {
          userId,
          type: args.type,
          title: args.title,
          message: args.message,
          issueId: args.issueId,
          projectId: args.projectId,
          documentId: args.documentId,
          actorId: args.actorId,
          isRead: false,
          isDeleted: false,
        });
      }),
    );
  },
});

/** Get recent notifications for a user since a given timestamp, enriched with actor and issue data. Used for digest emails. */
export const listForDigest = internalQuery({
  args: {
    userId: v.id("users"),
    startTime: v.number(),
  },
  handler: async (ctx, args) => {
    // Limit for digest - most recent notifications since startTime
    const MAX_DIGEST_NOTIFICATIONS = 100;

    // Optimization: Manual scan using index order to stop early.
    // The "by_user" index is ordered by userId, then _creationTime.
    // By iterating in descending order, we see newest items first.
    // We can stop scanning as soon as we see an item older than startTime.
    // This avoids scanning the entire notification history for the user when there are no recent notifications.
    const notifications: Doc<"notifications">[] = [];
    for await (const notification of ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")) {
      if (notification._creationTime < args.startTime) {
        break;
      }
      if (notification.isDeleted) {
        continue;
      }
      if (!["mention", "assigned", "comment"].includes(notification.type)) {
        continue;
      }

      notifications.push(notification);
      if (notifications.length >= MAX_DIGEST_NOTIFICATIONS) {
        break;
      }
    }

    // Batch fetch all actors and issues (avoid N+1!)
    const actorIds = notifications.map((n) => n.actorId);
    const issueIds = notifications.map((n) => n.issueId);

    const [actorMap, issueMap] = await Promise.all([
      batchFetchUsers(ctx, actorIds),
      batchFetchIssues(ctx, issueIds),
    ]);

    // Enrich with pre-fetched data (no N+1)
    return notifications.map((notification) => {
      const actor = notification.actorId ? actorMap.get(notification.actorId) : null;
      const issue = notification.issueId ? issueMap.get(notification.issueId) : null;

      return {
        ...notification,
        actorName: actor?.name,
        issueKey: issue?.key,
      };
    });
  },
});
