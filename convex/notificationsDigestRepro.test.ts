import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestUser } from "./testUtils";

describe("Notifications Digest Repro", () => {
  it("should currently include unsupported types like calendar_reminder", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);

    // Create a calendar_reminder notification (unsupported by digest email)
    const calendarReminderId = await t.run(async (ctx) => {
      return await ctx.db.insert("notifications", {
        userId,
        type: "calendar_reminder",
        title: "Event Reminder",
        message: "Starting soon",
        isRead: false,
      });
    });

    // Create an assigned notification (supported but with potential type mismatch)
    const assignedId = await t.run(async (ctx) => {
      return await ctx.db.insert("notifications", {
        userId,
        type: "assigned",
        title: "Assigned to Issue",
        message: "You have been assigned",
        isRead: false,
      });
    });

    // Query for digest
    const result = await t.query(internal.notifications.listForDigest, {
      userId,
      startTime: 0,
    });

    const resultIds = result.map((n) => n._id);

    // Assert fixed behavior: calendar_reminder is EXCLUDED, assigned is INCLUDED
    expect(resultIds).not.toContain(calendarReminderId);
    expect(resultIds).toContain(assignedId);

    // Assert that assigned notification has correct structure
    const assigned = result.find(n => n._id === assignedId);
    expect(assigned).toBeDefined();
    // type should be "assigned" (which is now supported by DigestEmail)
    expect(assigned?.type).toBe("assigned");
  });
});
