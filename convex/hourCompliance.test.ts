import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createProjectInOrganization,
  createTestContext,
  createTestUser,
  expectThrowsAsync,
} from "./testUtils";

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

    expect(record).toBeDefined();
    // biome-ignore lint/style/noNonNullAssertion: asserted above
    expect(record!.status).toBe("under_hours");
    // biome-ignore lint/style/noNonNullAssertion: asserted above
    expect(record!.totalHoursWorked).toBe(30);
    // biome-ignore lint/style/noNonNullAssertion: asserted above
    expect(record!.hoursDeficit).toBe(10);

    // Check notification
    const notifications = await t.run(async (ctx) => await ctx.db.query("notifications").collect());
    expect(notifications.length).toBeGreaterThan(0);
    const notification = notifications.find((n) => n.type === "hour_compliance");
    expect(notification).toBeDefined();
    // biome-ignore lint/style/noNonNullAssertion: asserted above
    expect(notification!.title).toContain("Hour Requirement Not Met");
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

    expect(record).toBeDefined();
    // biome-ignore lint/style/noNonNullAssertion: asserted above
    expect(record!.status).toBe("compliant");
    // biome-ignore lint/style/noNonNullAssertion: asserted above
    expect(record!.totalHoursWorked).toBe(40);
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

    expect(record).toBeDefined();
    // biome-ignore lint/style/noNonNullAssertion: asserted above
    expect(record!.status).toBe("over_hours");
    // biome-ignore lint/style/noNonNullAssertion: asserted above
    expect(record!.totalHoursWorked).toBe(50);
    // biome-ignore lint/style/noNonNullAssertion: asserted above
    expect(record!.hoursExcess).toBe(10);
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
});
