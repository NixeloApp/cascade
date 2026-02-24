import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { DAY, MINUTE } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Booking Pages", () => {
  describe("create", () => {
    it("should create a booking page", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { pageId } = await asUser.mutation(api.bookingPages.create, {
        slug: "my-meeting",
        title: "30 Minute Meeting",
        description: "A quick sync",
        duration: 30,
        location: "zoom",
      });

      expect(pageId).toBeDefined();

      const page = await t.run(async (ctx) => ctx.db.get(pageId));
      expect(page?.slug).toBe("my-meeting");
      expect(page?.title).toBe("30 Minute Meeting");
      expect(page?.duration).toBe(30);
      expect(page?.isActive).toBe(true);
      expect(page?.minimumNotice).toBe(24); // Default value
    });

    it("should create page with all options", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { pageId } = await asUser.mutation(api.bookingPages.create, {
        slug: "full-meeting",
        title: "Full Options Meeting",
        duration: 60,
        bufferTimeBefore: 10,
        bufferTimeAfter: 5,
        minimumNotice: 48,
        maxBookingsPerDay: 4,
        location: "meet",
        locationDetails: "Link sent after booking",
        questions: [
          { label: "Phone Number", type: "phone", required: true },
          { label: "Company", type: "text", required: false },
        ],
        requiresConfirmation: true,
        color: "#FF5733",
      });

      const page = await t.run(async (ctx) => ctx.db.get(pageId));
      expect(page?.bufferTimeBefore).toBe(10);
      expect(page?.bufferTimeAfter).toBe(5);
      expect(page?.minimumNotice).toBe(48);
      expect(page?.maxBookingsPerDay).toBe(4);
      expect(page?.requiresConfirmation).toBe(true);
      expect(page?.questions?.length).toBe(2);
    });

    it("should reject duplicate slug", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.bookingPages.create, {
        slug: "unique-slug",
        title: "First Page",
        duration: 30,
        location: "zoom",
      });

      await expect(
        asUser.mutation(api.bookingPages.create, {
          slug: "unique-slug",
          title: "Second Page",
          duration: 30,
          location: "zoom",
        }),
      ).rejects.toThrow(/already taken/i);
    });

    it("should reject invalid slug format", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await expect(
        asUser.mutation(api.bookingPages.create, {
          slug: "Invalid Slug!", // Contains spaces and uppercase
          title: "Page",
          duration: 30,
          location: "zoom",
        }),
      ).rejects.toThrow(/lowercase/i);
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(
        t.mutation(api.bookingPages.create, {
          slug: "test",
          title: "Test",
          duration: 30,
          location: "zoom",
        }),
      ).rejects.toThrow(/authenticated/i);
    });
  });

  describe("getBySlug", () => {
    it("should return active booking page by slug", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "Test Host", email: "host@test.com" });
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.bookingPages.create, {
        slug: "my-page",
        title: "My Meeting",
        duration: 30,
        location: "zoom",
      });

      // Public query - no auth required
      const page = await t.query(api.bookingPages.getBySlug, { slug: "my-page" });

      expect(page).not.toBeNull();
      expect(page?.title).toBe("My Meeting");
      expect(page?.hostName).toBe("Test Host");
      expect(page?.hostEmail).toBe("host@test.com");
    });

    it("should return null for inactive page", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { pageId } = await asUser.mutation(api.bookingPages.create, {
        slug: "inactive-page",
        title: "Inactive",
        duration: 30,
        location: "zoom",
      });

      // Deactivate the page
      await asUser.mutation(api.bookingPages.toggleActive, {
        id: pageId,
        isActive: false,
      });

      const page = await t.query(api.bookingPages.getBySlug, { slug: "inactive-page" });
      expect(page).toBeNull();
    });

    it("should return null for non-existent slug", async () => {
      const t = convexTest(schema, modules);

      const page = await t.query(api.bookingPages.getBySlug, { slug: "does-not-exist" });
      expect(page).toBeNull();
    });
  });

  describe("listMine", () => {
    it("should list user's booking pages", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.bookingPages.create, {
        slug: "page-1",
        title: "Page 1",
        duration: 30,
        location: "zoom",
      });

      await asUser.mutation(api.bookingPages.create, {
        slug: "page-2",
        title: "Page 2",
        duration: 60,
        location: "meet",
      });

      const pages = await asUser.query(api.bookingPages.listMine, {});

      expect(pages.length).toBe(2);
    });

    it("should not include other users' pages", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1", email: "user1@test.com" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });

      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      await asUser1.mutation(api.bookingPages.create, {
        slug: "user1-page",
        title: "User 1 Page",
        duration: 30,
        location: "zoom",
      });

      await asUser2.mutation(api.bookingPages.create, {
        slug: "user2-page",
        title: "User 2 Page",
        duration: 30,
        location: "zoom",
      });

      const user1Pages = await asUser1.query(api.bookingPages.listMine, {});
      const user2Pages = await asUser2.query(api.bookingPages.listMine, {});

      expect(user1Pages.length).toBe(1);
      expect(user1Pages[0].slug).toBe("user1-page");

      expect(user2Pages.length).toBe(1);
      expect(user2Pages[0].slug).toBe("user2-page");
    });
  });

  describe("update", () => {
    it("should update booking page fields", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { pageId } = await asUser.mutation(api.bookingPages.create, {
        slug: "update-test",
        title: "Original Title",
        duration: 30,
        location: "zoom",
      });

      await asUser.mutation(api.bookingPages.update, {
        id: pageId,
        title: "Updated Title",
        description: "New description",
        duration: 45,
        requiresConfirmation: true,
      });

      const page = await t.run(async (ctx) => ctx.db.get(pageId));
      expect(page?.title).toBe("Updated Title");
      expect(page?.description).toBe("New description");
      expect(page?.duration).toBe(45);
      expect(page?.requiresConfirmation).toBe(true);
    });

    it("should reject updating another user's page", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1", email: "user1@test.com" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });

      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      const { pageId } = await asUser1.mutation(api.bookingPages.create, {
        slug: "user1-only",
        title: "User 1 Only",
        duration: 30,
        location: "zoom",
      });

      await expect(
        asUser2.mutation(api.bookingPages.update, {
          id: pageId,
          title: "Hijacked",
        }),
      ).rejects.toThrow(/FORBIDDEN/i);
    });
  });

  describe("remove", () => {
    it("should delete booking page without active bookings", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { pageId } = await asUser.mutation(api.bookingPages.create, {
        slug: "to-delete",
        title: "To Delete",
        duration: 30,
        location: "zoom",
      });

      await asUser.mutation(api.bookingPages.remove, { id: pageId });

      const page = await t.run(async (ctx) => ctx.db.get(pageId));
      expect(page).toBeNull();
    });

    it("should reject deleting page with active bookings", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { pageId } = await asUser.mutation(api.bookingPages.create, {
        slug: "has-bookings",
        title: "Has Bookings",
        duration: 30,
        location: "zoom",
      });

      // Create an active booking
      await t.run(async (ctx) => {
        await ctx.db.insert("bookings", {
          bookingPageId: pageId,
          hostId: userId,
          bookerName: "Guest",
          bookerEmail: "guest@test.com",
          startTime: Date.now() + DAY,
          endTime: Date.now() + DAY + 30 * MINUTE,
          timezone: "UTC",
          location: "zoom",
          status: "confirmed",
          reminderSent: false,
          updatedAt: Date.now(),
        });
      });

      await expect(asUser.mutation(api.bookingPages.remove, { id: pageId })).rejects.toThrow(
        /active bookings/i,
      );
    });

    it("should allow deleting page with cancelled bookings", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { pageId } = await asUser.mutation(api.bookingPages.create, {
        slug: "cancelled-bookings",
        title: "Cancelled Bookings",
        duration: 30,
        location: "zoom",
      });

      // Create a cancelled booking
      await t.run(async (ctx) => {
        await ctx.db.insert("bookings", {
          bookingPageId: pageId,
          hostId: userId,
          bookerName: "Guest",
          bookerEmail: "guest@test.com",
          startTime: Date.now() + DAY,
          endTime: Date.now() + DAY + 30 * MINUTE,
          timezone: "UTC",
          location: "zoom",
          status: "cancelled",
          reminderSent: false,
          updatedAt: Date.now(),
        });
      });

      await asUser.mutation(api.bookingPages.remove, { id: pageId });

      const page = await t.run(async (ctx) => ctx.db.get(pageId));
      expect(page).toBeNull();
    });

    it("should reject deleting another user's page", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1", email: "user1@test.com" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });

      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      const { pageId } = await asUser1.mutation(api.bookingPages.create, {
        slug: "protected-page",
        title: "Protected",
        duration: 30,
        location: "zoom",
      });

      await expect(asUser2.mutation(api.bookingPages.remove, { id: pageId })).rejects.toThrow(
        /FORBIDDEN/i,
      );
    });
  });

  describe("toggleActive", () => {
    it("should toggle page active status", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { pageId } = await asUser.mutation(api.bookingPages.create, {
        slug: "toggle-test",
        title: "Toggle Test",
        duration: 30,
        location: "zoom",
      });

      // Deactivate
      await asUser.mutation(api.bookingPages.toggleActive, {
        id: pageId,
        isActive: false,
      });

      let page = await t.run(async (ctx) => ctx.db.get(pageId));
      expect(page?.isActive).toBe(false);

      // Reactivate
      await asUser.mutation(api.bookingPages.toggleActive, {
        id: pageId,
        isActive: true,
      });

      page = await t.run(async (ctx) => ctx.db.get(pageId));
      expect(page?.isActive).toBe(true);
    });

    it("should reject toggling another user's page", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1", email: "user1@test.com" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });

      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      const { pageId } = await asUser1.mutation(api.bookingPages.create, {
        slug: "user1-page",
        title: "User 1 Page",
        duration: 30,
        location: "zoom",
      });

      await expect(
        asUser2.mutation(api.bookingPages.toggleActive, {
          id: pageId,
          isActive: false,
        }),
      ).rejects.toThrow(/FORBIDDEN/i);
    });
  });

  describe("location types", () => {
    it("should support all location types", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const locations: Array<"phone" | "zoom" | "meet" | "teams" | "in-person" | "custom"> = [
        "phone",
        "zoom",
        "meet",
        "teams",
        "in-person",
        "custom",
      ];

      // Note: Sequential execution required - each iteration depends on query result
      for (const location of locations) {
        const { pageId } = await asUser.mutation(api.bookingPages.create, {
          slug: `${location}-meeting`,
          title: `${location} Meeting`,
          duration: 30,
          location,
          locationDetails: location === "custom" ? "Custom details here" : undefined,
        });

        const page = await t.run(async (ctx) => ctx.db.get(pageId));
        expect(page?.location).toBe(location);
      }
    });
  });
});
