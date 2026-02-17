import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Push Notifications", () => {
  const validSubscription = {
    endpoint: "https://fcm.googleapis.com/fcm/send/example-token-12345",
    p256dh:
      "BLc4xRzKlKORKWlbdgFaBrrPK3ydWAHo4M0gs0i1oEKgPpWC5cW8OCzVrOQRv-1npXRWk8udnW3oYhIO4475rds",
    auth: "5I2Bu2oKdyy9CwL8QVF0NQ",
    userAgent: "Mozilla/5.0 Test Browser",
  };

  describe("subscribe", () => {
    it("should create new push subscription", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const result = await asUser.mutation(api.pushNotifications.subscribe, validSubscription);

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();

      // Verify subscription was stored
      const subscription = await t.run(async (ctx) => ctx.db.get(result.id));
      expect(subscription?.endpoint).toBe(validSubscription.endpoint);
      expect(subscription?.p256dh).toBe(validSubscription.p256dh);
      expect(subscription?.userId).toBe(userId);
    });

    it("should update existing subscription with same endpoint", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      // First subscription
      const result1 = await asUser.mutation(api.pushNotifications.subscribe, validSubscription);

      // Second subscription with same endpoint but different keys
      const result2 = await asUser.mutation(api.pushNotifications.subscribe, {
        ...validSubscription,
        p256dh: "updated-key-12345",
        auth: "updated-auth",
      });

      // Should return same ID (updated, not created new)
      expect(result2.id).toBe(result1.id);

      // Verify keys were updated
      const subscription = await t.run(async (ctx) => ctx.db.get(result1.id));
      expect(subscription?.p256dh).toBe("updated-key-12345");
      expect(subscription?.auth).toBe("updated-auth");
    });

    it("should reject invalid endpoint URL", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await expect(
        asUser.mutation(api.pushNotifications.subscribe, {
          ...validSubscription,
          endpoint: "not-a-valid-url",
        }),
      ).rejects.toThrow(/endpoint/i);
    });

    it("should enable push in preferences when subscribing", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      // Create preferences with push disabled
      await t.run(async (ctx) => {
        await ctx.db.insert("notificationPreferences", {
          userId,
          emailEnabled: true,
          emailMentions: true,
          emailAssignments: true,
          emailComments: true,
          emailStatusChanges: true,
          emailDigest: "daily",
          pushEnabled: false,
          pushMentions: true,
          pushAssignments: true,
          pushComments: true,
          pushStatusChanges: true,
          updatedAt: Date.now(),
        });
      });

      await asUser.mutation(api.pushNotifications.subscribe, validSubscription);

      // Verify push was enabled
      const prefs = await t.run(async (ctx) =>
        ctx.db
          .query("notificationPreferences")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first(),
      );
      expect(prefs?.pushEnabled).toBe(true);
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(t.mutation(api.pushNotifications.subscribe, validSubscription)).rejects.toThrow(
        /authenticated/i,
      );
    });
  });

  describe("unsubscribe", () => {
    it("should remove subscription by endpoint", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { id } = await asUser.mutation(api.pushNotifications.subscribe, validSubscription);

      const result = await asUser.mutation(api.pushNotifications.unsubscribe, {
        endpoint: validSubscription.endpoint,
      });

      expect(result.success).toBe(true);

      // Verify subscription was deleted
      const subscription = await t.run(async (ctx) => ctx.db.get(id));
      expect(subscription).toBeNull();
    });

    it("should not remove another user's subscription", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1", email: "user1@test.com" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });

      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      // User 1 creates subscription
      const { id } = await asUser1.mutation(api.pushNotifications.subscribe, validSubscription);

      // User 2 tries to unsubscribe using same endpoint
      await asUser2.mutation(api.pushNotifications.unsubscribe, {
        endpoint: validSubscription.endpoint,
      });

      // Subscription should still exist
      const subscription = await t.run(async (ctx) => ctx.db.get(id));
      expect(subscription).not.toBeNull();
    });

    it("should succeed even if subscription doesn't exist", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const result = await asUser.mutation(api.pushNotifications.unsubscribe, {
        endpoint: "https://nonexistent.endpoint.com/token",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("unsubscribeAll", () => {
    it("should remove all subscriptions for user", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      // Create multiple subscriptions
      await asUser.mutation(api.pushNotifications.subscribe, validSubscription);
      await asUser.mutation(api.pushNotifications.subscribe, {
        ...validSubscription,
        endpoint: "https://fcm.googleapis.com/fcm/send/different-token",
      });

      const result = await asUser.mutation(api.pushNotifications.unsubscribeAll, {});

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });

    it("should disable push in preferences when unsubscribing all", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      // Create preferences first
      await t.run(async (ctx) => {
        await ctx.db.insert("notificationPreferences", {
          userId,
          emailEnabled: true,
          emailMentions: true,
          emailAssignments: true,
          emailComments: true,
          emailStatusChanges: true,
          emailDigest: "daily",
          pushEnabled: true,
          pushMentions: true,
          pushAssignments: true,
          pushComments: true,
          pushStatusChanges: true,
          updatedAt: Date.now(),
        });
      });

      // Create subscription
      await asUser.mutation(api.pushNotifications.subscribe, validSubscription);

      // Unsubscribe all
      await asUser.mutation(api.pushNotifications.unsubscribeAll, {});

      // Verify push was disabled
      const prefs = await t.run(async (ctx) =>
        ctx.db
          .query("notificationPreferences")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first(),
      );
      expect(prefs?.pushEnabled).toBe(false);
    });
  });

  describe("hasSubscription", () => {
    it("should return true when user has subscription", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.pushNotifications.subscribe, validSubscription);

      const hasSubscription = await asUser.query(api.pushNotifications.hasSubscription, {});
      expect(hasSubscription).toBe(true);
    });

    it("should return false when user has no subscription", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const hasSubscription = await asUser.query(api.pushNotifications.hasSubscription, {});
      expect(hasSubscription).toBe(false);
    });
  });

  describe("listSubscriptions", () => {
    it("should list user's subscriptions", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.pushNotifications.subscribe, validSubscription);
      await asUser.mutation(api.pushNotifications.subscribe, {
        ...validSubscription,
        endpoint: "https://fcm.googleapis.com/fcm/send/another-token",
        userAgent: "Different Browser",
      });

      const subscriptions = await asUser.query(api.pushNotifications.listSubscriptions, {});

      expect(subscriptions.length).toBe(2);
      expect(subscriptions[0].endpoint).toBeDefined();
      expect(subscriptions[0].userAgent).toBeDefined();
      expect(subscriptions[0].createdAt).toBeDefined();
    });

    it("should not include other users' subscriptions", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1", email: "user1@test.com" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });

      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      await asUser1.mutation(api.pushNotifications.subscribe, validSubscription);
      await asUser2.mutation(api.pushNotifications.subscribe, {
        ...validSubscription,
        endpoint: "https://fcm.googleapis.com/fcm/send/user2-token",
      });

      const user1Subs = await asUser1.query(api.pushNotifications.listSubscriptions, {});
      const user2Subs = await asUser2.query(api.pushNotifications.listSubscriptions, {});

      expect(user1Subs.length).toBe(1);
      expect(user2Subs.length).toBe(1);
      expect(user1Subs[0].endpoint).toBe(validSubscription.endpoint);
    });
  });

  describe("getPreferences", () => {
    it("should return default preferences when none exist", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const prefs = await asUser.query(api.pushNotifications.getPreferences, {});

      expect(prefs.pushEnabled).toBe(true);
      expect(prefs.pushMentions).toBe(true);
      expect(prefs.pushAssignments).toBe(true);
      expect(prefs.pushComments).toBe(true);
      expect(prefs.pushStatusChanges).toBe(true);
    });

    it("should return stored preferences", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      // Create preferences with custom settings
      await t.run(async (ctx) => {
        await ctx.db.insert("notificationPreferences", {
          userId,
          emailEnabled: true,
          emailMentions: true,
          emailAssignments: true,
          emailComments: true,
          emailStatusChanges: true,
          emailDigest: "daily",
          pushEnabled: true,
          pushMentions: false,
          pushAssignments: true,
          pushComments: false,
          pushStatusChanges: true,
          updatedAt: Date.now(),
        });
      });

      const prefs = await asUser.query(api.pushNotifications.getPreferences, {});

      expect(prefs.pushMentions).toBe(false);
      expect(prefs.pushComments).toBe(false);
      expect(prefs.pushAssignments).toBe(true);
    });
  });

  describe("updatePreferences", () => {
    it("should update push preferences", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      // Create initial preferences
      await t.run(async (ctx) => {
        await ctx.db.insert("notificationPreferences", {
          userId,
          emailEnabled: true,
          emailMentions: true,
          emailAssignments: true,
          emailComments: true,
          emailStatusChanges: true,
          emailDigest: "daily",
          pushEnabled: true,
          pushMentions: true,
          pushAssignments: true,
          pushComments: true,
          pushStatusChanges: true,
          updatedAt: Date.now(),
        });
      });

      const result = await asUser.mutation(api.pushNotifications.updatePreferences, {
        pushMentions: false,
        pushComments: false,
      });

      expect(result.success).toBe(true);

      const prefs = await asUser.query(api.pushNotifications.getPreferences, {});
      expect(prefs.pushMentions).toBe(false);
      expect(prefs.pushComments).toBe(false);
      expect(prefs.pushAssignments).toBe(true); // Unchanged
    });

    it("should create preferences if they don't exist", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.pushNotifications.updatePreferences, {
        pushEnabled: false,
      });

      const prefs = await asUser.query(api.pushNotifications.getPreferences, {});
      expect(prefs.pushEnabled).toBe(false);
    });

    it("should disable all push when pushEnabled is false", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.pushNotifications.updatePreferences, {
        pushEnabled: false,
      });

      const prefs = await asUser.query(api.pushNotifications.getPreferences, {});
      expect(prefs.pushEnabled).toBe(false);
    });
  });
});
