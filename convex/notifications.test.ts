import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Notifications", () => {
  describe("list", () => {
    it("should return notifications for authenticated user", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const actorId = await createTestUser(t, { name: "Actor" });

      // Create a notification directly
      await t.run(async (ctx) => {
        await ctx.db.insert("notifications", {
          userId,
          type: "issue_assigned",
          title: "Issue assigned to you",
          message: "You have been assigned to a new issue",
          isRead: false,
          actorId,
        });
      });

      const asUser = asAuthenticatedUser(t, userId);
      const notifications = await asUser.query(api.notifications.list, {
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(notifications.page).toHaveLength(1);
      expect(notifications.page[0]?.type).toBe("issue_assigned");
      expect(notifications.page[0]?.actorName).toBeDefined();
    });

    it("should respect limit parameter", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create multiple notifications
      await t.run(async (ctx) => {
        for (let i = 0; i < 10; i++) {
          await ctx.db.insert("notifications", {
            userId,
            type: "test",
            title: `Notification ${i}`,
            message: "Test notification",
            isRead: false,
          });
        }
      });

      const asUser = asAuthenticatedUser(t, userId);
      const notifications = await asUser.query(api.notifications.list, {
        paginationOpts: { numItems: 5, cursor: null },
      });

      expect(notifications.page.length).toBeLessThanOrEqual(5);
    });

    it("should filter unread notifications when onlyUnread is true", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create read and unread notifications
      await t.run(async (ctx) => {
        await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Unread 1",
          message: "Test",
          isRead: false,
        });
        await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Read 1",
          message: "Test",
          isRead: true,
        });
        await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Unread 2",
          message: "Test",
          isRead: false,
        });
      });

      const asUser = asAuthenticatedUser(t, userId);
      const unreadNotifications = await asUser.query(api.notifications.list, {
        paginationOpts: { numItems: 10, cursor: null },
        onlyUnread: true,
      });

      expect(unreadNotifications.page).toHaveLength(2);
      expect(unreadNotifications.page.every((n) => !n.isRead)).toBe(true);
    });

    it("should return all notifications when onlyUnread is false", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      await t.run(async (ctx) => {
        await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Unread",
          message: "Test",
          isRead: false,
        });
        await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Read",
          message: "Test",
          isRead: true,
        });
      });

      const asUser = asAuthenticatedUser(t, userId);
      const allNotifications = await asUser.query(api.notifications.list, {
        paginationOpts: { numItems: 10, cursor: null },
        onlyUnread: false,
      });

      expect(allNotifications.page).toHaveLength(2);
    });

    it("should return empty array for user with no notifications", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const notifications = await asUser.query(api.notifications.list, {
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(notifications.page).toEqual([]);
    });

    it("should only return notifications for current user", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });

      // Create notifications for both users
      await t.run(async (ctx) => {
        await ctx.db.insert("notifications", {
          userId: user1,
          type: "test",
          title: "For User 1",
          message: "Test",
          isRead: false,
        });
        await ctx.db.insert("notifications", {
          userId: user2,
          type: "test",
          title: "For User 2",
          message: "Test",
          isRead: false,
        });
      });

      // User 1 queries notifications
      const asUser1 = asAuthenticatedUser(t, user1);
      const user1Notifications = await asUser1.query(api.notifications.list, {
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(user1Notifications.page).toHaveLength(1);
      expect(user1Notifications.page[0]?.title).toBe("For User 1");
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(async () => {
        await t.query(api.notifications.list, {
          paginationOpts: { numItems: 10, cursor: null },
        });
      }).rejects.toThrow("Not authenticated");
    });
  });

  describe("getUnreadCount", () => {
    it("should return count of unread notifications", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create unread notifications
      await t.run(async (ctx) => {
        for (let i = 0; i < 3; i++) {
          await ctx.db.insert("notifications", {
            userId,
            type: "test",
            title: `Unread ${i}`,
            message: "Test",
            isRead: false,
          });
        }
        // Create read notification
        await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Read",
          message: "Test",
          isRead: true,
        });
      });

      const asUser = asAuthenticatedUser(t, userId);
      const count = await asUser.query(api.notifications.getUnreadCount, {});

      expect(count).toBe(3);
    });

    it("should cap unread count at 100", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create 105 unread notifications
      await t.run(async (ctx) => {
        for (let i = 0; i < 105; i++) {
          await ctx.db.insert("notifications", {
            userId,
            type: "test",
            title: `Unread ${i}`,
            message: "Test",
            isRead: false,
          });
        }
      });

      const asUser = asAuthenticatedUser(t, userId);
      const count = await asUser.query(api.notifications.getUnreadCount, {});

      expect(count).toBe(100);
    });

    it("should return zero for user with no notifications", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const count = await asUser.query(api.notifications.getUnreadCount, {});

      expect(count).toBe(0);
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(t.query(api.notifications.getUnreadCount, {})).rejects.toThrow(
        "Not authenticated",
      );
    });
  });

  describe("markAsRead", () => {
    it("should mark notification as read", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create unread notification
      const notificationId = await t.run(async (ctx) => {
        return await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Test",
          message: "Test notification",
          isRead: false,
        });
      });

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.notifications.markAsRead, { id: notificationId });

      const notification = await t.run(async (ctx) => {
        return await ctx.db.get(notificationId);
      });

      expect(notification?.isRead).toBe(true);
    });

    it("should deny marking other user's notification as read", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });

      // Create notification for user1
      const notificationId = await t.run(async (ctx) => {
        return await ctx.db.insert("notifications", {
          userId: user1,
          type: "test",
          title: "Test",
          message: "Test",
          isRead: false,
        });
      });

      // User2 tries to mark it as read
      const asUser2 = asAuthenticatedUser(t, user2);
      await expect(async () => {
        await asUser2.mutation(api.notifications.markAsRead, { id: notificationId });
      }).rejects.toThrow("Not authorized");
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const notificationId = await t.run(async (ctx) => {
        return await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Test",
          message: "Test",
          isRead: false,
        });
      });

      await expect(async () => {
        await t.mutation(api.notifications.markAsRead, { id: notificationId });
      }).rejects.toThrow("Not authenticated");
    });

    it("should throw error for non-existent notification", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);

      // Create and delete to get valid non-existent ID
      const notificationId = await t.run(async (ctx) => {
        return await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Test",
          message: "Test",
          isRead: false,
        });
      });
      await t.run(async (ctx) => {
        await ctx.db.delete(notificationId);
      });

      await expect(async () => {
        await asUser.mutation(api.notifications.markAsRead, { id: notificationId });
      }).rejects.toThrow("Notification not found");
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all unread notifications as read", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create multiple unread notifications
      await t.run(async (ctx) => {
        for (let i = 0; i < 3; i++) {
          await ctx.db.insert("notifications", {
            userId,
            type: "test",
            title: `Test ${i}`,
            message: "Test",
            isRead: false,
          });
        }
      });

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.notifications.markAllAsRead, {});

      const unreadCount = await asUser.query(api.notifications.getUnreadCount, {});

      expect(unreadCount).toBe(0);
    });

    it("should not affect already read notifications", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create read and unread notifications
      await t.run(async (ctx) => {
        await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Read",
          message: "Test",
          isRead: true,
        });
        await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Unread",
          message: "Test",
          isRead: false,
        });
      });

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.notifications.markAllAsRead, {});

      const allNotifications = await asUser.query(api.notifications.list, {
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(allNotifications.page).toHaveLength(2);
      expect(allNotifications.page.every((n) => n.isRead)).toBe(true);
    });

    it("should only mark current user's notifications", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });

      // Create unread notifications for both users
      await t.run(async (ctx) => {
        await ctx.db.insert("notifications", {
          userId: user1,
          type: "test",
          title: "User 1 notification",
          message: "Test",
          isRead: false,
        });
        await ctx.db.insert("notifications", {
          userId: user2,
          type: "test",
          title: "User 2 notification",
          message: "Test",
          isRead: false,
        });
      });

      // User 1 marks all as read
      const asUser1 = asAuthenticatedUser(t, user1);
      await asUser1.mutation(api.notifications.markAllAsRead, {});

      // User 2's notification should still be unread
      const asUser2 = asAuthenticatedUser(t, user2);
      const user2UnreadCount = await asUser2.query(api.notifications.getUnreadCount, {});

      expect(user2UnreadCount).toBe(1);
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(async () => {
        await t.mutation(api.notifications.markAllAsRead, {});
      }).rejects.toThrow("Not authenticated");
    });
  });

  describe("softDelete", () => {
    it("should delete notification", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create notification
      const notificationId = await t.run(async (ctx) => {
        return await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Test",
          message: "Test notification",
          isRead: false,
        });
      });

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.notifications.softDeleteNotification, { id: notificationId });

      const notification = await t.run(async (ctx) => {
        return await ctx.db.get(notificationId);
      });

      expect(notification?.isDeleted).toBe(true);
    });

    it("should deny deleting other user's notification", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });

      // Create notification for user1
      const notificationId = await t.run(async (ctx) => {
        return await ctx.db.insert("notifications", {
          userId: user1,
          type: "test",
          title: "Test",
          message: "Test",
          isRead: false,
        });
      });

      // User2 tries to delete it
      const asUser2 = asAuthenticatedUser(t, user2);
      await expect(async () => {
        await asUser2.mutation(api.notifications.softDeleteNotification, { id: notificationId });
      }).rejects.toThrow("Not authorized");
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const notificationId = await t.run(async (ctx) => {
        return await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Test",
          message: "Test",
          isRead: false,
        });
      });

      await expect(async () => {
        await t.mutation(api.notifications.softDeleteNotification, { id: notificationId });
      }).rejects.toThrow("Not authenticated");
    });

    it("should throw error for non-existent notification", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);

      // Create and delete to get valid non-existent ID
      const notificationId = await t.run(async (ctx) => {
        return await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Test",
          message: "Test",
          isRead: false,
        });
      });
      await t.run(async (ctx) => {
        await ctx.db.delete(notificationId);
      });

      await expect(async () => {
        await asUser.mutation(api.notifications.softDeleteNotification, { id: notificationId });
      }).rejects.toThrow("Notification not found");
    });
  });

  describe("internal mutations", () => {
    it("create - should create a notification", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const actorId = await createTestUser(t, { name: "Actor" });

      // Call internal mutation directly

      await t.mutation(internal.notifications.createNotification, {
        userId,
        type: "issue_assigned",
        title: "Issue assigned",
        message: "You have been assigned to an issue",
        actorId,
      });

      // Verify notification was created
      const asUser = asAuthenticatedUser(t, userId);
      const notifications = await asUser.query(api.notifications.list, {
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(notifications.page).toHaveLength(1);
      expect(notifications.page[0]?.type).toBe("issue_assigned");
      expect(notifications.page[0]?.actorId).toBe(actorId);
    });

    it("create - should not create notification if user is actor", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Call internal mutation with userId === actorId

      await t.mutation(internal.notifications.createNotification, {
        userId,
        type: "test",
        title: "Test",
        message: "Test",
        actorId: userId,
      });

      // Verify no notification was created
      const asUser = asAuthenticatedUser(t, userId);
      const notifications = await asUser.query(api.notifications.list, {
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(notifications.page).toHaveLength(0);
    });

    it("createBulk - should create notifications for multiple users", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });
      const user3 = await createTestUser(t, { name: "User 3" });
      const actor = await createTestUser(t, { name: "Actor" });

      // Call internal bulk mutation
      await t.mutation(internal.notifications.createBulk, {
        userIds: [user1, user2, user3],
        type: "project_update",
        title: "Project updated",
        message: "The project has been updated",
        actorId: actor,
      });

      // Verify all users got notifications
      const asUser1 = asAuthenticatedUser(t, user1);
      const user1Notifications = await asUser1.query(api.notifications.list, {
        paginationOpts: { numItems: 10, cursor: null },
      });
      expect(user1Notifications.page).toHaveLength(1);

      const asUser2 = asAuthenticatedUser(t, user2);
      const user2Notifications = await asUser2.query(api.notifications.list, {
        paginationOpts: { numItems: 10, cursor: null },
      });
      expect(user2Notifications.page).toHaveLength(1);

      const asUser3 = asAuthenticatedUser(t, user3);
      const user3Notifications = await asUser3.query(api.notifications.list, {
        paginationOpts: { numItems: 10, cursor: null },
      });
      expect(user3Notifications.page).toHaveLength(1);
    });

    it("createBulk - should skip actor in recipients", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });
      const actor = await createTestUser(t, { name: "Actor" });

      // Include actor in recipients
      await t.mutation(internal.notifications.createBulk, {
        userIds: [user1, user2, actor],
        type: "test",
        title: "Test",
        message: "Test",
        actorId: actor,
      });

      // Verify actor didn't get notification
      const asActor = asAuthenticatedUser(t, actor);
      const actorNotifications = await asActor.query(api.notifications.list, {
        paginationOpts: { numItems: 10, cursor: null },
      });
      expect(actorNotifications.page).toHaveLength(0);

      // But other users did
      const asUser1 = asAuthenticatedUser(t, user1);
      const user1Notifications = await asUser1.query(api.notifications.list, {
        paginationOpts: { numItems: 10, cursor: null },
      });
      expect(user1Notifications.page).toHaveLength(1);
    });
  });
});
