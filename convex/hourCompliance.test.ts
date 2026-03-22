import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import { WEEK } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createProjectInOrganization,
  createTestContext,
  createTestUser,
  expectThrowsAsync,
} from "./testUtils";

/** Sunday 2024-01-07T00:00:00Z — stable base for period arithmetic. */
const BASE_PERIOD_START = Date.UTC(2024, 0, 7);

describe("Hour Compliance", () => {
  test("detects under hours", async () => {
    const t = convexTest(schema, modules);
    const adminCtx = await createTestContext(t, { name: "Admin User" });
    const adminId = adminCtx.userId;

    // Make user an admin by creating a project
    await createProjectInOrganization(t, adminId, adminCtx.organizationId);

    const employeeId = await createTestUser(t, { name: "Employee User" });

    // Create user profile for employee
    await t.run(async (ctx) => {
      await ctx.db.insert("userProfiles", {
        userId: employeeId,
        employmentType: "employee",
        maxHoursPerWeek: 40,
        hasEquity: false,
        isActive: true,
        updatedAt: Date.now(),
        createdBy: adminId,
      });
    });

    const startOfWeek = new Date("2024-01-07T00:00:00Z").getTime(); // Sunday
    const endOfWeek = new Date("2024-01-13T23:59:59Z").getTime(); // Saturday

    // Insert 30 hours of work (5 days * 6 hours)
    await t.run(async (ctx) => {
      for (let i = 0; i < 5; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + 1 + i); // Mon-Fri

        await ctx.db.insert("timeEntries", {
          userId: employeeId,
          startTime: date.getTime(),
          duration: 6 * 3600, // 6 hours
          date: date.getTime(),
          currency: "USD",
          billable: true,
          billed: false,
          isEquityHour: false,
          isLocked: false,
          isApproved: false,
          updatedAt: Date.now(),
          tags: [],
        });
      }
    });

    // Run compliance check as admin
    const { recordId } = await adminCtx.asUser.mutation(api.hourCompliance.checkUserCompliance, {
      userId: employeeId,
      periodType: "week",
      periodStart: startOfWeek,
      periodEnd: endOfWeek,
    });

    const record = await t.run(async (ctx) => await ctx.db.get(recordId));

    expect(record).not.toBeNull();
    expect(record?.status).toBe("under_hours");
    expect(record?.totalHoursWorked).toBe(30);
    expect(record?.hoursDeficit).toBe(10);

    // Check notification
    const notifications = await t.run(async (ctx) => await ctx.db.query("notifications").collect());
    expect(notifications.length).toBeGreaterThan(0);
    const notification = notifications.find((n) => n.type === "hour_compliance");
    expect(notification).not.toBeUndefined();
    expect(notification?.title).toContain("Hour Requirement Not Met");
  });

  test("detects compliant status", async () => {
    const t = convexTest(schema, modules);
    const adminCtx = await createTestContext(t, { name: "Admin User" });
    const adminId = adminCtx.userId;

    // Make user an admin by creating a project
    await createProjectInOrganization(t, adminId, adminCtx.organizationId);

    const employeeId = await createTestUser(t, { name: "Employee User" });

    await t.run(async (ctx) => {
      await ctx.db.insert("userProfiles", {
        userId: employeeId,
        employmentType: "employee",
        maxHoursPerWeek: 40,
        hasEquity: false,
        isActive: true,
        updatedAt: Date.now(),
        createdBy: adminId,
      });
    });

    const startOfWeek = new Date("2024-01-07T00:00:00Z").getTime();
    const endOfWeek = new Date("2024-01-13T23:59:59Z").getTime();

    // Insert 40 hours of work (5 days * 8 hours)
    await t.run(async (ctx) => {
      for (let i = 0; i < 5; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + 1 + i);

        await ctx.db.insert("timeEntries", {
          userId: employeeId,
          startTime: date.getTime(),
          duration: 8 * 3600, // 8 hours
          date: date.getTime(),
          currency: "USD",
          billable: true,
          billed: false,
          isEquityHour: false,
          isLocked: false,
          isApproved: false,
          updatedAt: Date.now(),
          tags: [],
        });
      }
    });

    const { recordId } = await adminCtx.asUser.mutation(api.hourCompliance.checkUserCompliance, {
      userId: employeeId,
      periodType: "week",
      periodStart: startOfWeek,
      periodEnd: endOfWeek,
    });

    const record = await t.run(async (ctx) => await ctx.db.get(recordId));

    expect(record).not.toBeUndefined();
    expect(record?.status).toBe("compliant");
    expect(record?.totalHoursWorked).toBe(40);
  });

  test("detects over hours", async () => {
    const t = convexTest(schema, modules);
    const adminCtx = await createTestContext(t, { name: "Admin User" });
    const adminId = adminCtx.userId;

    // Make user an admin by creating a project
    await createProjectInOrganization(t, adminId, adminCtx.organizationId);

    const employeeId = await createTestUser(t, { name: "Employee User" });

    await t.run(async (ctx) => {
      await ctx.db.insert("userProfiles", {
        userId: employeeId,
        employmentType: "employee",
        maxHoursPerWeek: 40,
        hasEquity: false,
        isActive: true,
        updatedAt: Date.now(),
        createdBy: adminId,
      });
    });

    const startOfWeek = new Date("2024-01-07T00:00:00Z").getTime();
    const endOfWeek = new Date("2024-01-13T23:59:59Z").getTime();

    // Insert 50 hours of work (5 days * 10 hours)
    await t.run(async (ctx) => {
      for (let i = 0; i < 5; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + 1 + i);

        await ctx.db.insert("timeEntries", {
          userId: employeeId,
          startTime: date.getTime(),
          duration: 10 * 3600, // 10 hours
          date: date.getTime(),
          currency: "USD",
          billable: true,
          billed: false,
          isEquityHour: false,
          isLocked: false,
          isApproved: false,
          updatedAt: Date.now(),
          tags: [],
        });
      }
    });

    const { recordId } = await adminCtx.asUser.mutation(api.hourCompliance.checkUserCompliance, {
      userId: employeeId,
      periodType: "week",
      periodStart: startOfWeek,
      periodEnd: endOfWeek,
    });

    const record = await t.run(async (ctx) => await ctx.db.get(recordId));

    expect(record).not.toBeUndefined();
    expect(record?.status).toBe("over_hours");
    expect(record?.totalHoursWorked).toBe(50);
    expect(record?.hoursExcess).toBe(10);
  });

  test("enforces admin permissions", async () => {
    const t = convexTest(schema, modules);
    const adminCtx = await createTestContext(t, { name: "Admin User" });
    const adminId = adminCtx.userId;

    // Make user an admin by creating a project
    await createProjectInOrganization(t, adminId, adminCtx.organizationId);

    const employeeId = await createTestUser(t, { name: "Employee User" });
    const employee = asAuthenticatedUser(t, employeeId);

    await t.run(async (ctx) => {
      await ctx.db.insert("userProfiles", {
        userId: employeeId,
        employmentType: "employee",
        maxHoursPerWeek: 40,
        hasEquity: false,
        isActive: true,
        updatedAt: Date.now(),
        createdBy: adminId,
      });
    });

    const startOfWeek = new Date("2024-01-07T00:00:00Z").getTime();
    const endOfWeek = new Date("2024-01-13T23:59:59Z").getTime();

    await expectThrowsAsync(async () => {
      await employee.mutation(api.hourCompliance.checkUserCompliance, {
        userId: employeeId,
        periodType: "week",
        periodStart: startOfWeek,
        periodEnd: endOfWeek,
      });
    }, "admin"); // Expect "admin" in error message
  });

  describe("getComplianceSummary", () => {
    test("returns isTruncated=false when records fit within limit", async () => {
      const t = convexTest(schema, modules);
      const adminCtx = await createTestContext(t, { name: "Admin Summary" });
      const adminId = adminCtx.userId;

      // Make user an admin by creating a project
      await createProjectInOrganization(t, adminId, adminCtx.organizationId);

      // Insert a few compliance records
      await t.run(async (ctx) => {
        for (let i = 0; i < 3; i++) {
          await ctx.db.insert("hourComplianceRecords", {
            userId: adminId,
            periodType: "week",
            periodStart: BASE_PERIOD_START + i * WEEK,
            periodEnd: BASE_PERIOD_START + (i + 1) * WEEK,
            totalHoursWorked: 40,
            status: "compliant",
            notificationSent: false,
            updatedAt: Date.now(),
          });
        }
      });

      const summary = await adminCtx.asUser.query(api.hourCompliance.getComplianceSummary, {});

      expect(summary.totalRecords).toBe(3);
      expect(summary.compliant).toBe(3);
      expect(summary.complianceRate).toBe(100);
      expect(summary.isTruncated).toBe(false);
    });

    test("returns correct status breakdown", async () => {
      const t = convexTest(schema, modules);
      const adminCtx = await createTestContext(t, { name: "Admin Breakdown" });
      const adminId = adminCtx.userId;

      await createProjectInOrganization(t, adminId, adminCtx.organizationId);

      await t.run(async (ctx) => {
        const base = {
          userId: adminId,
          periodType: "week" as const,
          totalHoursWorked: 35,
          notificationSent: false,
          updatedAt: Date.now(),
        };

        await ctx.db.insert("hourComplianceRecords", {
          ...base,
          periodStart: BASE_PERIOD_START,
          periodEnd: BASE_PERIOD_START + WEEK,
          status: "compliant",
        });
        await ctx.db.insert("hourComplianceRecords", {
          ...base,
          periodStart: BASE_PERIOD_START + WEEK,
          periodEnd: BASE_PERIOD_START + 2 * WEEK,
          status: "under_hours",
          hoursDeficit: 5,
        });
        await ctx.db.insert("hourComplianceRecords", {
          ...base,
          periodStart: BASE_PERIOD_START + 2 * WEEK,
          periodEnd: BASE_PERIOD_START + 3 * WEEK,
          totalHoursWorked: 50,
          status: "over_hours",
          hoursExcess: 10,
        });
        await ctx.db.insert("hourComplianceRecords", {
          ...base,
          periodStart: BASE_PERIOD_START + 3 * WEEK,
          periodEnd: BASE_PERIOD_START + 4 * WEEK,
          status: "equity_under",
          equityHoursDeficit: 2,
        });
      });

      const summary = await adminCtx.asUser.query(api.hourCompliance.getComplianceSummary, {});

      expect(summary.totalRecords).toBe(4);
      expect(summary.compliant).toBe(1);
      expect(summary.underHours).toBe(1);
      expect(summary.overHours).toBe(1);
      expect(summary.equityUnder).toBe(1);
      expect(summary.complianceRate).toBe(25);
      expect(summary.isTruncated).toBe(false);
    });

    test("returns empty summary for non-admin", async () => {
      const t = convexTest(schema, modules);
      const viewerId = await createTestUser(t, { name: "Viewer" });
      const asViewer = asAuthenticatedUser(t, viewerId);

      const summary = await asViewer.query(api.hourCompliance.getComplianceSummary, {});

      expect(summary.totalRecords).toBe(0);
      expect(summary.isTruncated).toBe(false);
    });
  });
});
