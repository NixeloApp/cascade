import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestContext, createTestUser } from "./testUtils";

describe("Notification Preferences", () => {
  describe("get", () => {
    it("should return default preferences for user without saved preferences", async () => {
      const t = convexTest(schema, modules);
      const { asUser, userId } = await createTestContext(t);

      const prefs = await asUser.query(api.notificationPreferences.get, {});

      expect(prefs.userId).toBe(userId);
      expect(prefs.emailEnabled).toBe(true);
      expect(prefs.emailMentions).toBe(true);
      expect(prefs.emailAssignments).toBe(true);
      expect(prefs.emailComments).toBe(true);
      expect(prefs.emailStatusChanges).toBe(false); // Off by default
      expect(prefs.emailDigest).toBe("none");
    });

    it("should return saved preferences when they exist", async () => {
      const t = convexTest(schema, modules);
      const { asUser, userId } = await createTestContext(t);

      // Save preferences first
      await asUser.mutation(api.notificationPreferences.update, {
        emailEnabled: false,
        emailMentions: false,
      });

      const prefs = await asUser.query(api.notificationPreferences.get, {});

      expect(prefs.userId).toBe(userId);
      expect(prefs.emailEnabled).toBe(false);
      expect(prefs.emailMentions).toBe(false);
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(t.query(api.notificationPreferences.get, {})).rejects.toThrow(/authenticated/i);
    });
  });

  describe("update", () => {
    it("should create preferences for new user", async () => {
      const t = convexTest(schema, modules);
      const { asUser, userId } = await createTestContext(t);

      const prefId = await asUser.mutation(api.notificationPreferences.update, {
        emailEnabled: true,
        emailMentions: false,
        emailAssignments: true,
        emailComments: false,
        emailStatusChanges: true,
        emailDigest: "daily",
      });

      expect(prefId).toBeDefined();

      const prefs = await asUser.query(api.notificationPreferences.get, {});
      expect(prefs.userId).toBe(userId);
      expect(prefs.emailMentions).toBe(false);
      expect(prefs.emailComments).toBe(false);
      expect(prefs.emailStatusChanges).toBe(true);
      expect(prefs.emailDigest).toBe("daily");
    });

    it("should update existing preferences", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      // Create initial preferences
      await asUser.mutation(api.notificationPreferences.update, {
        emailEnabled: true,
      });

      // Update them
      await asUser.mutation(api.notificationPreferences.update, {
        emailEnabled: false,
        emailMentions: false,
      });

      const prefs = await asUser.query(api.notificationPreferences.get, {});
      expect(prefs.emailEnabled).toBe(false);
      expect(prefs.emailMentions).toBe(false);
    });

    it("should allow partial updates", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      // Create preferences with specific values
      await asUser.mutation(api.notificationPreferences.update, {
        emailEnabled: true,
        emailMentions: true,
        emailAssignments: true,
      });

      // Update only one field
      await asUser.mutation(api.notificationPreferences.update, {
        emailMentions: false,
      });

      const prefs = await asUser.query(api.notificationPreferences.get, {});
      expect(prefs.emailEnabled).toBe(true); // Unchanged
      expect(prefs.emailMentions).toBe(false); // Changed
      expect(prefs.emailAssignments).toBe(true); // Unchanged
    });

    it("should handle digest preferences", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      await asUser.mutation(api.notificationPreferences.update, {
        emailDigest: "weekly",
        digestDay: "monday",
        digestTime: "09:00",
      });

      const prefs = await asUser.query(api.notificationPreferences.get, {});
      expect(prefs.emailDigest).toBe("weekly");
      expect(prefs.digestDay).toBe("monday");
      expect(prefs.digestTime).toBe("09:00");
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(
        t.mutation(api.notificationPreferences.update, { emailEnabled: false }),
      ).rejects.toThrow(/authenticated/i);
    });
  });

  describe("preferences isolation", () => {
    it("should keep preferences separate for different users", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1", email: "user1@test.com" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });

      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      // User 1 disables email
      await asUser1.mutation(api.notificationPreferences.update, {
        emailEnabled: false,
      });

      // User 2 enables all
      await asUser2.mutation(api.notificationPreferences.update, {
        emailEnabled: true,
        emailMentions: true,
      });

      const prefs1 = await asUser1.query(api.notificationPreferences.get, {});
      const prefs2 = await asUser2.query(api.notificationPreferences.get, {});

      expect(prefs1.emailEnabled).toBe(false);
      expect(prefs2.emailEnabled).toBe(true);
    });
  });
});
