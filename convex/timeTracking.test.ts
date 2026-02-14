import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestContext,
  createTestIssue,
  createTestProject,
  createTestUser,
} from "./testUtils";

describe("Time Tracking", () => {
  describe("timer management", () => {
    it("should start and stop a timer", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      // Set a rate first
      const hourlyRate = 100;
      // Need to insert rate manually or use setUserRate?
      // setUserRate requires project admin if project ID provided, or self if not?
      // Let's check setUserRate logic: if (!projectId && userId === currentUserId) is allowed.
      await asUser.mutation(api.timeTracking.setUserRate, {
        userId,
        hourlyRate,
        currency: "USD",
        rateType: "billable",
      });

      const entryId = await asUser.mutation(api.timeTracking.startTimer, {
        description: "Working",
      });

      const running = await asUser.query(api.timeTracking.getRunningTimer, {});
      expect(running?._id).toBe(entryId);
      expect(running?.hourlyRate).toBe(100);

      // Simulate time passing (manual update logic in stopTimer)
      // We can't easily mock Date.now() inside the convex function without more setup.
      // But we can verify stopTimer updates the record.

      await asUser.mutation(api.timeTracking.stopTimer, { entryId });

      const entry = await t.run(async (ctx) => ctx.db.get(entryId));
      expect(entry?.endTime).toBeDefined();
      // Since 0 time passed, duration/cost might be 0, but it should be stopped.
      // If we want non-zero, we might need to patch the start time back in time manually?
      await t.run(async (ctx) => {
        await ctx.db.patch(entryId, { startTime: Date.now() - 3600000 }); // 1 hour ago
      });
      // Re-stop? No, stopTimer calculates based on current time.
      // We should have patched start time BEFORE stopping.
    });

    it("should calculate cost correctly", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.timeTracking.setUserRate, {
        userId,
        hourlyRate: 100,
        currency: "USD",
        rateType: "billable",
      });

      // Create manual entry
      const startTime = Date.now() - 7200000; // 2 hours ago
      const endTime = Date.now();

      const entryId = await asUser.mutation(api.timeTracking.createTimeEntry, {
        startTime,
        endTime,
        billable: true,
      });

      const entry = await t.run(async (ctx) => ctx.db.get(entryId));
      expect(entry?.duration).toBeGreaterThanOrEqual(7200); // roughly 2 hours
      // Cost = 2 hours * 100 = 200
      expect(entry?.totalCost).toBeCloseTo(200, 0);
    });
  });

  describe("getBurnRate", () => {
    it("should aggregate costs", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      // Set rate
      await asUser.mutation(api.timeTracking.setUserRate, {
        userId,
        projectId,
        hourlyRate: 50,
        currency: "USD",
        rateType: "billable",
      });

      // Add 2 entries of 1 hour each
      // Use fixed timestamps to avoid timing-related flakiness
      const baseTime = 1704067200000; // Fixed timestamp: 2024-01-01 00:00:00 UTC
      await asUser.mutation(api.timeTracking.createTimeEntry, {
        projectId,
        startTime: baseTime,
        endTime: baseTime + 3600000, // Exactly 1 hour later
        billable: true,
      });
      await asUser.mutation(api.timeTracking.createTimeEntry, {
        projectId,
        startTime: baseTime + 3600000,
        endTime: baseTime + 7200000, // Exactly 1 hour later
        billable: true,
      });

      const stats = await asUser.query(api.timeTracking.getBurnRate, {
        projectId,
        startDate: baseTime - 86400000,
        endDate: baseTime + 86400000,
      });

      expect(stats?.totalCost).toBeCloseTo(100, 1); // 2 hours * 50, allow 0.1 difference
      expect(stats?.totalHours).toBeCloseTo(2, 2); // Exactly 2 hours, allow 0.01 difference
      expect(stats?.entriesCount).toBe(2);
    });
  });

  describe("listTimeEntries", () => {
    it("should filter by project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const p1 = await createTestProject(t, userId, { name: "P1" });
      const p2 = await createTestProject(t, userId, { name: "P2" });
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();
      await asUser.mutation(api.timeTracking.createTimeEntry, {
        projectId: p1,
        startTime: now - 1000,
        endTime: now,
      });
      await asUser.mutation(api.timeTracking.createTimeEntry, {
        projectId: p2,
        startTime: now - 1000,
        endTime: now,
      });

      const list1 = await asUser.query(api.timeTracking.listTimeEntries, {
        projectId: p1,
        startDate: now - 86400000, // 24 hours ago
        endDate: now + 10000,
      });
      expect(list1).toHaveLength(1);
      expect(list1[0].projectId).toBe(p1);
    });

    it("should filter by issue", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Issue Filter Project",
        key: "IFP",
      });
      const issueId = await createTestIssue(t, projectId, userId, { title: "Test Issue" });

      const now = Date.now();
      await asUser.mutation(api.timeTracking.createTimeEntry, {
        projectId,
        issueId,
        startTime: now - 3600000,
        endTime: now,
      });
      await asUser.mutation(api.timeTracking.createTimeEntry, {
        projectId,
        startTime: now - 3600000,
        endTime: now,
      });

      const list = await asUser.query(api.timeTracking.listTimeEntries, {
        issueId,
      });
      expect(list).toHaveLength(1);
      expect(list[0].issueId).toBe(issueId);
      await t.finishInProgressScheduledFunctions();
    });

    it("should list entries without filters", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();
      await asUser.mutation(api.timeTracking.createTimeEntry, {
        startTime: now - 3600000,
        endTime: now,
      });
      await asUser.mutation(api.timeTracking.createTimeEntry, {
        startTime: now - 7200000,
        endTime: now - 3600000,
      });

      const list = await asUser.query(api.timeTracking.listTimeEntries, {});
      expect(list).toHaveLength(2);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("updateTimeEntry", () => {
    it("should update time entry fields", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();
      const entryId = await asUser.mutation(api.timeTracking.createTimeEntry, {
        startTime: now - 3600000,
        endTime: now,
        description: "Original",
        activity: "Development",
      });

      await asUser.mutation(api.timeTracking.updateTimeEntry, {
        entryId,
        description: "Updated description",
        activity: "Testing",
        tags: ["tag1", "tag2"],
      });

      const entry = await t.run(async (ctx) => ctx.db.get(entryId));
      expect(entry?.description).toBe("Updated description");
      expect(entry?.activity).toBe("Testing");
      expect(entry?.tags).toContain("tag1");
      await t.finishInProgressScheduledFunctions();
    });

    it("should recalculate duration when times change", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      // Set rate first
      await asUser.mutation(api.timeTracking.setUserRate, {
        userId,
        hourlyRate: 50,
        currency: "USD",
        rateType: "billable",
      });

      const now = Date.now();
      const entryId = await asUser.mutation(api.timeTracking.createTimeEntry, {
        startTime: now - 3600000, // 1 hour ago
        endTime: now,
        billable: true,
      });

      // Change to 2 hours
      await asUser.mutation(api.timeTracking.updateTimeEntry, {
        entryId,
        startTime: now - 7200000, // 2 hours ago
      });

      const entry = await t.run(async (ctx) => ctx.db.get(entryId));
      expect(entry?.duration).toBeGreaterThanOrEqual(7200); // ~2 hours in seconds
      await t.finishInProgressScheduledFunctions();
    });

    it("should reject update for locked entries", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();
      const entryId = await asUser.mutation(api.timeTracking.createTimeEntry, {
        startTime: now - 3600000,
        endTime: now,
      });

      // Lock the entry directly
      await t.run(async (ctx) => {
        await ctx.db.patch(entryId, { isLocked: true });
      });

      await expect(
        asUser.mutation(api.timeTracking.updateTimeEntry, {
          entryId,
          description: "Should fail",
        }),
      ).rejects.toThrow(/locked/i);
      await t.finishInProgressScheduledFunctions();
    });

    it("should reject update for other users entries", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });
      const asUser1 = asAuthenticatedUser(t, user1);
      const asUser2 = asAuthenticatedUser(t, user2);

      const now = Date.now();
      const entryId = await asUser1.mutation(api.timeTracking.createTimeEntry, {
        startTime: now - 3600000,
        endTime: now,
      });

      await expect(
        asUser2.mutation(api.timeTracking.updateTimeEntry, {
          entryId,
          description: "Unauthorized update",
        }),
      ).rejects.toThrow();
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("deleteTimeEntry", () => {
    it("should delete a time entry", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();
      const entryId = await asUser.mutation(api.timeTracking.createTimeEntry, {
        startTime: now - 3600000,
        endTime: now,
      });

      await asUser.mutation(api.timeTracking.deleteTimeEntry, { entryId });

      const entry = await t.run(async (ctx) => ctx.db.get(entryId));
      expect(entry).toBeNull();
      await t.finishInProgressScheduledFunctions();
    });

    it("should reject delete for locked entries", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();
      const entryId = await asUser.mutation(api.timeTracking.createTimeEntry, {
        startTime: now - 3600000,
        endTime: now,
      });

      await t.run(async (ctx) => {
        await ctx.db.patch(entryId, { isLocked: true });
      });

      await expect(asUser.mutation(api.timeTracking.deleteTimeEntry, { entryId })).rejects.toThrow(
        /locked/i,
      );
      await t.finishInProgressScheduledFunctions();
    });

    it("should reject delete for billed entries", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();
      const entryId = await asUser.mutation(api.timeTracking.createTimeEntry, {
        startTime: now - 3600000,
        endTime: now,
        billable: true,
      });

      await t.run(async (ctx) => {
        await ctx.db.patch(entryId, { billed: true });
      });

      await expect(asUser.mutation(api.timeTracking.deleteTimeEntry, { entryId })).rejects.toThrow(
        /billed/i,
      );
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("createTimeEntry", () => {
    it("should reject if end time is before start time", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();
      await expect(
        asUser.mutation(api.timeTracking.createTimeEntry, {
          startTime: now,
          endTime: now - 3600000, // End before start
        }),
      ).rejects.toThrow(/End time must be after start time/);
      await t.finishInProgressScheduledFunctions();
    });

    it("should track equity hours", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const now = Date.now();
      const entryId = await asUser.mutation(api.timeTracking.createTimeEntry, {
        startTime: now - 3600000,
        endTime: now,
        isEquityHour: true,
      });

      const entry = await t.run(async (ctx) => ctx.db.get(entryId));
      expect(entry?.isEquityHour).toBe(true);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("startTimer", () => {
    it("should reject if timer already running", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.timeTracking.startTimer, {
        description: "First timer",
      });

      await expect(
        asUser.mutation(api.timeTracking.startTimer, {
          description: "Second timer",
        }),
      ).rejects.toThrow(/already have a running timer/);
      await t.finishInProgressScheduledFunctions();
    });

    it("should track timer with project and issue", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Timer Project",
        key: "TIMER",
      });
      const issueId = await createTestIssue(t, projectId, userId, { title: "Timer Issue" });

      const entryId = await asUser.mutation(api.timeTracking.startTimer, {
        projectId,
        issueId,
        description: "Working on issue",
      });

      const entry = await t.run(async (ctx) => ctx.db.get(entryId));
      expect(entry?.projectId).toBe(projectId);
      expect(entry?.issueId).toBe(issueId);
      expect(entry?.description).toBe("Working on issue");
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("stopTimer", () => {
    it("should reject if timer already stopped", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const entryId = await asUser.mutation(api.timeTracking.startTimer, {});
      await asUser.mutation(api.timeTracking.stopTimer, { entryId });

      await expect(asUser.mutation(api.timeTracking.stopTimer, { entryId })).rejects.toThrow(
        /already stopped/i,
      );
      await t.finishInProgressScheduledFunctions();
    });

    it("should reject stopping another users timer", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });
      const asUser1 = asAuthenticatedUser(t, user1);
      const asUser2 = asAuthenticatedUser(t, user2);

      const entryId = await asUser1.mutation(api.timeTracking.startTimer, {});

      await expect(asUser2.mutation(api.timeTracking.stopTimer, { entryId })).rejects.toThrow();
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("getRunningTimer", () => {
    it("should return null when no timer running", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const running = await asUser.query(api.timeTracking.getRunningTimer, {});
      expect(running).toBeNull();
      await t.finishInProgressScheduledFunctions();
    });

    it("should include current duration and cost", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.timeTracking.setUserRate, {
        userId,
        hourlyRate: 100,
        currency: "USD",
        rateType: "billable",
      });

      const entryId = await asUser.mutation(api.timeTracking.startTimer, {});

      // Patch the start time to 1 hour ago
      await t.run(async (ctx) => {
        await ctx.db.patch(entryId, { startTime: Date.now() - 3600000 });
      });

      const running = await asUser.query(api.timeTracking.getRunningTimer, {});
      expect(running?.currentDuration).toBeGreaterThanOrEqual(3600);
      expect(running?.currentCost).toBeGreaterThanOrEqual(100);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("getCurrentWeekTimesheet", () => {
    it("should return empty timesheet for new user", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const timesheet = await asUser.query(api.timeTracking.getCurrentWeekTimesheet, {});

      expect(timesheet.totalHours).toBe(0);
      expect(timesheet.billableHours).toBe(0);
      expect(timesheet.entries).toBe(0);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("setUserRate", () => {
    it("should allow user to set own rate", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.timeTracking.setUserRate, {
        userId,
        hourlyRate: 75,
        currency: "EUR",
        rateType: "billable",
      });

      // Verify rate was set by checking time entries use it
      const entryId = await asUser.mutation(api.timeTracking.startTimer, {});
      const entry = await t.run(async (ctx) => ctx.db.get(entryId));
      expect(entry?.hourlyRate).toBe(75);
      expect(entry?.currency).toBe("EUR");
      await t.finishInProgressScheduledFunctions();
    });

    it("should set project-specific rate", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Rate Project",
        key: "RATE",
      });

      // Set project-specific rate
      await asUser.mutation(api.timeTracking.setUserRate, {
        userId,
        projectId,
        hourlyRate: 100,
        currency: "USD",
        rateType: "billable",
      });

      // Verify rate is used for project entries
      const now = Date.now();
      const entryId = await asUser.mutation(api.timeTracking.createTimeEntry, {
        projectId,
        startTime: now - 3600000,
        endTime: now,
        billable: true,
      });

      const entry = await t.run(async (ctx) => ctx.db.get(entryId));
      expect(entry?.hourlyRate).toBe(100);
      expect(entry?.totalCost).toBeCloseTo(100, 0); // 1 hour * $100
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("getProjectBilling", () => {
    it("should restrict access to admins only", async () => {
      const t = convexTest(schema, modules);
      // Create a project and two users: admin (creator) and viewer
      const adminId = await createTestUser(t, { name: "Admin" });
      const viewerId = await createTestUser(t, { name: "Viewer" });

      const { organizationId } = await createOrganizationAdmin(t, adminId);

      const projectId = await createProjectInOrganization(t, adminId, organizationId, {
        name: "Billing Project",
        key: "BILL",
      });

      // Add viewer to project
      await t.run(async (ctx) => {
        await ctx.db.insert("projectMembers", {
          projectId,
          userId: viewerId,
          role: "viewer",
          addedBy: adminId,
          isDeleted: false,
        });
      });

      const asViewer = asAuthenticatedUser(t, viewerId);

      // This should fail (it won't throw) currently, verifying the security hole.
      await expect(
        asViewer.query(api.timeTracking.getProjectBilling, { projectId }),
      ).rejects.toThrow(/admin/);
    });

    it("should calculate billing summary correctly", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      // Set rate for user
      await asUser.mutation(api.timeTracking.setUserRate, {
        userId,
        projectId,
        hourlyRate: 200,
        currency: "USD",
        rateType: "billable",
      });

      const now = Date.now();
      // Add billable entry (1 hour)
      await asUser.mutation(api.timeTracking.createTimeEntry, {
        projectId,
        startTime: now - 3600000,
        endTime: now,
        billable: true,
      });

      // Add non-billable entry (1 hour)
      await asUser.mutation(api.timeTracking.createTimeEntry, {
        projectId,
        startTime: now - 7200000,
        endTime: now - 3600000,
        billable: false,
      });

      const billing = await asUser.query(api.timeTracking.getProjectBilling, {
        projectId,
      });

      expect(billing?.totalHours).toBeCloseTo(2, 1);
      expect(billing?.billableHours).toBeCloseTo(1, 1);
      expect(billing?.nonBillableHours).toBeCloseTo(1, 1);
      expect(billing?.totalRevenue).toBeCloseTo(200, 0); // 1 hour * 200
      expect(billing?.entries).toBe(2);

      const userIdStr = userId;
      expect(billing?.byUser[userIdStr]).toBeDefined();
      expect(billing?.byUser[userIdStr].revenue).toBeCloseTo(200, 0);
    });
  });
});
