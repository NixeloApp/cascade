import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestContext, createTestUser } from "./testUtils";

describe("User Settings", () => {
  describe("get", () => {
    it("should return null for user without settings", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      const settings = await asUser.query(api.userSettings.get, {});

      expect(settings).toBeNull();
    });

    it("should return saved settings when they exist", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      // Create settings first
      await asUser.mutation(api.userSettings.update, {
        theme: "dark",
        sidebarCollapsed: true,
      });

      const settings = await asUser.query(api.userSettings.get, {});

      expect(settings).not.toBeNull();
      expect(settings?.theme).toBe("dark");
      expect(settings?.sidebarCollapsed).toBe(true);
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(t.query(api.userSettings.get, {})).rejects.toThrow(/authenticated/i);
    });
  });

  describe("update", () => {
    it("should create settings for new user", async () => {
      const t = convexTest(schema, modules);
      const { asUser, userId } = await createTestContext(t);

      await asUser.mutation(api.userSettings.update, {
        theme: "light",
        sidebarCollapsed: false,
        emailNotifications: true,
        desktopNotifications: true,
        timezone: "America/New_York",
      });

      const settings = await asUser.query(api.userSettings.get, {});

      expect(settings?.userId).toBe(userId);
      expect(settings?.theme).toBe("light");
      expect(settings?.sidebarCollapsed).toBe(false);
      expect(settings?.emailNotifications).toBe(true);
      expect(settings?.desktopNotifications).toBe(true);
      expect(settings?.timezone).toBe("America/New_York");
    });

    it("should update existing settings", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      // Create initial settings
      await asUser.mutation(api.userSettings.update, {
        theme: "light",
        sidebarCollapsed: false,
      });

      // Update them
      await asUser.mutation(api.userSettings.update, {
        theme: "dark",
        sidebarCollapsed: true,
      });

      const settings = await asUser.query(api.userSettings.get, {});
      expect(settings?.theme).toBe("dark");
      expect(settings?.sidebarCollapsed).toBe(true);
    });

    it("should allow partial updates", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      // Create settings
      await asUser.mutation(api.userSettings.update, {
        theme: "light",
        sidebarCollapsed: false,
        timezone: "UTC",
      });

      // Update only theme
      await asUser.mutation(api.userSettings.update, {
        theme: "dark",
      });

      const settings = await asUser.query(api.userSettings.get, {});
      expect(settings?.theme).toBe("dark");
      expect(settings?.sidebarCollapsed).toBe(false); // Unchanged
      expect(settings?.timezone).toBe("UTC"); // Unchanged
    });

    it("should update timestamp on changes", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      await asUser.mutation(api.userSettings.update, {
        theme: "light",
      });

      const settings1 = await asUser.query(api.userSettings.get, {});
      expect(settings1?.updatedAt).toBeDefined();
      const updatedAt1 = settings1?.updatedAt;
      if (!updatedAt1) throw new Error("Expected updatedAt to be defined");

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      await asUser.mutation(api.userSettings.update, {
        theme: "dark",
      });

      const settings2 = await asUser.query(api.userSettings.get, {});
      expect(settings2?.updatedAt).toBeGreaterThan(updatedAt1);
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(t.mutation(api.userSettings.update, { theme: "dark" })).rejects.toThrow(
        /authenticated/i,
      );
    });
  });

  describe("settings isolation", () => {
    it("should keep settings separate for different users", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1", email: "user1@test.com" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });

      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      // User 1 prefers dark mode
      await asUser1.mutation(api.userSettings.update, {
        theme: "dark",
        sidebarCollapsed: true,
      });

      // User 2 prefers light mode
      await asUser2.mutation(api.userSettings.update, {
        theme: "light",
        sidebarCollapsed: false,
      });

      const settings1 = await asUser1.query(api.userSettings.get, {});
      const settings2 = await asUser2.query(api.userSettings.get, {});

      expect(settings1?.theme).toBe("dark");
      expect(settings1?.sidebarCollapsed).toBe(true);
      expect(settings2?.theme).toBe("light");
      expect(settings2?.sidebarCollapsed).toBe(false);
    });
  });

  describe("timezone handling", () => {
    it("should accept valid IANA timezone", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      await asUser.mutation(api.userSettings.update, {
        timezone: "Europe/London",
      });

      const settings = await asUser.query(api.userSettings.get, {});
      expect(settings?.timezone).toBe("Europe/London");
    });

    it("should accept various timezone formats", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      const timezones = ["America/New_York", "Asia/Tokyo", "Pacific/Auckland", "UTC"];

      for (const tz of timezones) {
        await asUser.mutation(api.userSettings.update, { timezone: tz });
        const settings = await asUser.query(api.userSettings.get, {});
        expect(settings?.timezone).toBe(tz);
      }
    });
  });
});
