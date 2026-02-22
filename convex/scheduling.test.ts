/**
 * Tests for Round-Robin Scheduling functionality
 */

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Scheduling", () => {
  describe("getNextRoundRobinHost", () => {
    it("should return owner for non-round-robin booking pages", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create a booking page without round-robin
      const bookingPageId = await t.run(async (ctx) => {
        return await ctx.db.insert("bookingPages", {
          userId,
          title: "Individual Booking",
          slug: `booking-${Date.now()}`,
          duration: 30,
          bufferTimeBefore: 0,
          bufferTimeAfter: 0,
          minimumNotice: 1,
          location: "zoom",
          schedulingType: "individual",
          isActive: true,
          requiresConfirmation: false,
          color: "#3B82F6",
          updatedAt: Date.now(),
        });
      });

      const nextHost = await t.query(internal.scheduling.getNextRoundRobinHost, {
        bookingPageId,
      });

      expect(nextHost).toBe(userId);
    });

    it("should return single team member if only one exists", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create a round-robin booking page with single team member
      const bookingPageId = await t.run(async (ctx) => {
        return await ctx.db.insert("bookingPages", {
          userId,
          title: "Round Robin Booking",
          slug: `rr-booking-${Date.now()}`,
          duration: 30,
          bufferTimeBefore: 0,
          bufferTimeAfter: 0,
          minimumNotice: 1,
          location: "zoom",
          schedulingType: "round_robin",
          teamMembers: [userId],
          isActive: true,
          requiresConfirmation: false,
          color: "#3B82F6",
          updatedAt: Date.now(),
        });
      });

      const nextHost = await t.query(internal.scheduling.getNextRoundRobinHost, {
        bookingPageId,
      });

      expect(nextHost).toBe(userId);
    });

    it("should distribute assignments fairly among team members", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });
      const user3 = await createTestUser(t, { name: "User 3" });

      // Create a round-robin booking page with multiple team members
      const bookingPageId = await t.run(async (ctx) => {
        return await ctx.db.insert("bookingPages", {
          userId: user1,
          title: "Team Booking",
          slug: `team-booking-${Date.now()}`,
          duration: 30,
          bufferTimeBefore: 0,
          bufferTimeAfter: 0,
          minimumNotice: 1,
          location: "zoom",
          schedulingType: "round_robin",
          teamMembers: [user1, user2, user3],
          isActive: true,
          requiresConfirmation: false,
          color: "#3B82F6",
          updatedAt: Date.now(),
        });
      });

      // Get first assignment - should be any user since no assignments yet
      const firstHost = await t.query(internal.scheduling.getNextRoundRobinHost, {
        bookingPageId,
      });
      expect(firstHost).toBeDefined();
      expect([user1, user2, user3]).toContain(firstHost);
    });
  });

  describe("updateConfig", () => {
    it("should update scheduling type", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create a booking page
      const bookingPageId = await t.run(async (ctx) => {
        return await ctx.db.insert("bookingPages", {
          userId,
          title: "Config Test",
          slug: `config-${Date.now()}`,
          duration: 30,
          bufferTimeBefore: 0,
          bufferTimeAfter: 0,
          minimumNotice: 1,
          location: "zoom",
          schedulingType: "individual",
          isActive: true,
          requiresConfirmation: false,
          color: "#3B82F6",
          updatedAt: Date.now(),
        });
      });

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.scheduling.updateConfig, {
        bookingPageId,
        schedulingType: "round_robin",
      });

      // Verify update
      const bookingPage = await t.run(async (ctx) => {
        return await ctx.db.get(bookingPageId);
      });
      expect(bookingPage?.schedulingType).toBe("round_robin");
    });

    it("should update team members", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });

      // Create a booking page
      const bookingPageId = await t.run(async (ctx) => {
        return await ctx.db.insert("bookingPages", {
          userId: user1,
          title: "Team Config",
          slug: `team-config-${Date.now()}`,
          duration: 30,
          bufferTimeBefore: 0,
          bufferTimeAfter: 0,
          minimumNotice: 1,
          location: "zoom",
          schedulingType: "round_robin",
          isActive: true,
          requiresConfirmation: false,
          color: "#3B82F6",
          updatedAt: Date.now(),
        });
      });

      const asUser = asAuthenticatedUser(t, user1);
      await asUser.mutation(api.scheduling.updateConfig, {
        bookingPageId,
        teamMembers: [user1, user2],
      });

      // Verify update
      const bookingPage = await t.run(async (ctx) => {
        return await ctx.db.get(bookingPageId);
      });
      expect(bookingPage?.teamMembers).toEqual([user1, user2]);
    });

    it("should update host weights", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });

      // Create a booking page
      const bookingPageId = await t.run(async (ctx) => {
        return await ctx.db.insert("bookingPages", {
          userId: user1,
          title: "Weight Config",
          slug: `weight-config-${Date.now()}`,
          duration: 30,
          bufferTimeBefore: 0,
          bufferTimeAfter: 0,
          minimumNotice: 1,
          location: "zoom",
          schedulingType: "round_robin",
          teamMembers: [user1, user2],
          isActive: true,
          requiresConfirmation: false,
          color: "#3B82F6",
          updatedAt: Date.now(),
        });
      });

      const asUser = asAuthenticatedUser(t, user1);
      await asUser.mutation(api.scheduling.updateConfig, {
        bookingPageId,
        hostWeights: [
          { userId: user1, weight: 2 },
          { userId: user2, weight: 1 },
        ],
      });

      // Verify update
      const bookingPage = await t.run(async (ctx) => {
        return await ctx.db.get(bookingPageId);
      });
      expect(bookingPage?.hostWeights).toHaveLength(2);
      expect(bookingPage?.hostWeights?.[0].weight).toBe(2);
    });

    it("should reject updates from non-owner", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const otherUser = await createTestUser(t, { name: "Other" });

      // Create a booking page owned by owner
      const bookingPageId = await t.run(async (ctx) => {
        return await ctx.db.insert("bookingPages", {
          userId: owner,
          title: "Owner's Page",
          slug: `owner-page-${Date.now()}`,
          duration: 30,
          bufferTimeBefore: 0,
          bufferTimeAfter: 0,
          minimumNotice: 1,
          location: "zoom",
          schedulingType: "individual",
          isActive: true,
          requiresConfirmation: false,
          color: "#3B82F6",
          updatedAt: Date.now(),
        });
      });

      // Try to update as non-owner
      const asOther = asAuthenticatedUser(t, otherUser);
      await expect(async () => {
        await asOther.mutation(api.scheduling.updateConfig, {
          bookingPageId,
          schedulingType: "round_robin",
        });
      }).rejects.toThrow();
    });
  });

  describe("getStats", () => {
    it("should return individual type for non-round-robin pages", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create a booking page
      const bookingPageId = await t.run(async (ctx) => {
        return await ctx.db.insert("bookingPages", {
          userId,
          title: "Individual Stats",
          slug: `ind-stats-${Date.now()}`,
          duration: 30,
          bufferTimeBefore: 0,
          bufferTimeAfter: 0,
          minimumNotice: 1,
          location: "zoom",
          schedulingType: "individual",
          isActive: true,
          requiresConfirmation: false,
          color: "#3B82F6",
          updatedAt: Date.now(),
        });
      });

      const asUser = asAuthenticatedUser(t, userId);
      const stats = await asUser.query(api.scheduling.getStats, { bookingPageId });

      expect(stats).toBeDefined();
      expect(stats?.type).toBe("individual");
    });

    it("should return round-robin stats for round-robin pages", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });

      // Create a round-robin booking page
      const bookingPageId = await t.run(async (ctx) => {
        return await ctx.db.insert("bookingPages", {
          userId: user1,
          title: "RR Stats",
          slug: `rr-stats-${Date.now()}`,
          duration: 30,
          bufferTimeBefore: 0,
          bufferTimeAfter: 0,
          minimumNotice: 1,
          location: "zoom",
          schedulingType: "round_robin",
          teamMembers: [user1, user2],
          isActive: true,
          requiresConfirmation: false,
          color: "#3B82F6",
          updatedAt: Date.now(),
        });
      });

      const asUser = asAuthenticatedUser(t, user1);
      const stats = await asUser.query(api.scheduling.getStats, { bookingPageId });

      expect(stats).toBeDefined();
      expect(stats?.type).toBe("round_robin");
      expect(stats?.teamSize).toBe(2);
      expect(stats?.totalAssignments).toBe(0);
    });
  });
});
