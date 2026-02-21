import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestContext, createTestProject, createTestUser } from "./testUtils";

describe("Invites Security Reproduction", () => {
  beforeEach(() => {
    // Mock global fetch for email sending
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, message_ids: ["msg_123"] }), {
        status: 200,
        statusText: "OK",
      }),
    );
    process.env.SITE_URL = "http://localhost:3000";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should NOT add unverified user directly to project", async () => {
    const t = convexTest(schema, modules);
    const { userId: adminId, organizationId, asUser: asAdmin } = await createTestContext(t);

    // Create a project
    const projectId = await createTestProject(t, adminId);

    // Create an "attacker" user who has NOT verified their email
    const attackerEmail = "attacker@example.com";
    const attackerId = await createTestUser(t, { name: "Attacker", email: attackerEmail });

    // Manually unverify the attacker
    await t.run(async (ctx) => {
      await ctx.db.patch(attackerId, { emailVerificationTime: undefined });
    });

    const project = await t.run(async (ctx) => ctx.db.get(projectId));
    if (!project) throw new Error("Project not found");

    // Admin invites the attacker's email to the project
    // Expect it to fail with CONFLICT because user exists but is unverified
    // This confirms the security fix: the unverified user is NOT added directly.
    await expect(async () => {
      await asAdmin.mutation(api.invites.sendInvite, {
        email: attackerEmail,
        role: "user",
        organizationId: project.organizationId,
        projectId,
        projectRole: "editor",
      });
    }).rejects.toThrow("A user with this email already exists");

    // Check membership to be absolutely sure
    const member = await t.run(async (ctx) =>
      ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", attackerId))
        .first(),
    );

    // Assert that the vulnerability is FIXED (user NOT added directly)
    expect(member).toBeNull();
  });
});
