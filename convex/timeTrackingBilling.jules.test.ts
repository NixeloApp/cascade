import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { HOUR } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Time Tracking Billing Security", () => {
  it("should prevent updating billed time entries", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    const now = Date.now();

    // 1. Create a time entry
    const { entryId } = await asUser.mutation(api.timeTracking.createTimeEntry, {
      startTime: now - HOUR,
      endTime: now,
      description: "Original work",
      billable: true,
    });

    // 2. Mark it as billed (simulating invoicing process)
    await t.run(async (ctx) => {
      await ctx.db.patch(entryId, { billed: true });
    });

    // 3. Attempt to update it - should fail
    await expect(
      asUser.mutation(api.timeTracking.updateTimeEntry, {
        entryId,
        description: "Trying to change billed work",
      }),
    ).rejects.toThrow(/billed/i);
  });
});
