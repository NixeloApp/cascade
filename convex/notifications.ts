import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { asyncMap } from "convex-helpers";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, internalQuery } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { batchFetchIssues, batchFetchUsers } from "./lib/batchHelpers";
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
            );
        }
        // Optimization: Use by_user_deleted index to avoid scanning deleted notifications
        return db
          .query("notifications")
          .withIndex("by_user_deleted", (q) => q.eq("userId", ctx.userId).lt("isDeleted", true));
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

    // Optimization: explicitly use .take(limit).length instead of efficientCount()
    // efficientCount() uses .count() which scans all matching index entries (O(N)),
    // whereas .take(limit) stops after finding enough matches (O(limit)).
    // For users with thousands of unread notifications, this is much faster.
    const items = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", ctx.userId).eq("isRead", false).lt("isDeleted", true),
      )
      .take(MAX_UNREAD_COUNT);

    return items.length;
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
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    requireOwned(notification, ctx.userId, "notification");

    await ctx.db.patch(args.id, softDeleteFields(ctx.userId));

    return { success: true } as const;
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

    // Optimization: Use range query on _creationTime (implicit in by_user index)
    // The "by_user" index is ordered by userId, then _creationTime.
    // .gt("_creationTime", args.startTime) efficiently seeks and scans only relevant items.
    // .filter(notDeleted) excludes deleted items while scanning.
    // .take(MAX_DIGEST_NOTIFICATIONS) caps the result size.

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId).gt("_creationTime", args.startTime))
      .order("desc")
      .filter(notDeleted)
      .take(MAX_DIGEST_NOTIFICATIONS);

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
