import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestProject, createTestUser } from "./testUtils";

describe("intake", () => {
  it("should create an inbox issue from external submission", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    // Create an intake token manually (since createToken needs projectQuery context)
    const token = `intake_${crypto.randomUUID().replace(/-/g, "")}`;
    await t.run(async (ctx) => {
      await ctx.db.insert("intakeTokens", {
        projectId,
        token,
        isRevoked: false,
        createdBy: userId,
        updatedAt: Date.now(),
      });
    });

    // Submit externally
    const result = await t.mutation(api.intake.createExternal, {
      token,
      title: "Bug report from customer",
      description: "The login page is broken",
      submitterEmail: "customer@example.com",
      submitterName: "Jane Customer",
    });

    expect(typeof result.inboxIssueId).toBe("string");

    // Verify inbox issue was created
    const inboxIssue = await t.run(async (ctx) => ctx.db.get(result.inboxIssueId));
    expect(inboxIssue?.status).toBe("pending");
    expect(inboxIssue?.source).toBe("api");
    expect(inboxIssue?.sourceEmail).toBe("customer@example.com");
  });

  it("should reject invalid tokens", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(api.intake.createExternal, {
        token: "invalid_token",
        title: "Test",
      }),
    ).rejects.toThrow("Invalid or revoked intake token");
  });

  it("should reject revoked tokens", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    const token = `intake_${crypto.randomUUID().replace(/-/g, "")}`;
    await t.run(async (ctx) => {
      await ctx.db.insert("intakeTokens", {
        projectId,
        token,
        isRevoked: true,
        revokedAt: Date.now(),
        createdBy: userId,
        updatedAt: Date.now(),
      });
    });

    await expect(
      t.mutation(api.intake.createExternal, {
        token,
        title: "Should fail",
      }),
    ).rejects.toThrow("Invalid or revoked intake token");
  });
});
