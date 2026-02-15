import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestUser } from "./testUtils";

describe("Pumble", () => {
  it("should update stats when called internally", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);

    const webhookId = await t.run(async (ctx) => {
      return await ctx.db.insert("pumbleWebhooks", {
        userId,
        name: "Test",
        webhookUrl: "https://pumble.com/api/...",
        events: ["issue.created"],
        isActive: true,
        sendMentions: true,
        sendAssignments: true,
        sendStatusChanges: true,
        messagesSent: 0,
        updatedAt: Date.now(),
      });
    });

    // Call internal mutation directly
    await t.mutation(internal.pumble.updateWebhookStats, {
      webhookId,
      success: true,
    });

    const webhook = await t.run(async (ctx) => {
      return await ctx.db.get(webhookId);
    });

    expect(webhook?.messagesSent).toBe(1);
  });
});
