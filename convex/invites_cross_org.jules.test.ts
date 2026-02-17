import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createOrganizationAdmin, createTestContext, createTestUser } from "./testUtils";

describe("Invites Security - Cross Organization", () => {
  const originalEnv: Record<string, string | undefined> = {};
  const envKeys = [
    "SITE_URL",
    "MAILTRAP_API_TOKEN",
    "MAILTRAP_INBOX_ID",
    "MAILTRAP_FROM_EMAIL",
    "MAILTRAP_MODE",
  ];

  beforeEach(() => {
    // Save original env vars
    for (const key of envKeys) {
      originalEnv[key] = process.env[key];
    }

    // Mock global fetch for email sending
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, message_ids: ["msg_123"] }), {
        status: 200,
        statusText: "OK",
      }),
    );

    // Mock env vars required by invites.ts and email providers
    process.env.SITE_URL = "http://localhost:3000";
    process.env.MAILTRAP_API_TOKEN = "mock_token";
    process.env.MAILTRAP_INBOX_ID = "123";
    process.env.MAILTRAP_FROM_EMAIL = "test@example.com";
    process.env.MAILTRAP_MODE = "sandbox";
  });

  afterEach(() => {
    vi.restoreAllMocks();

    // Restore original env vars
    for (const key of envKeys) {
      const value = originalEnv[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("should reproduce cross-org invite vulnerability: Attacker (Org A) invites Victim to Project A but scopes invite to Org B", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Attacker in Organization A with Project A
    const attackerCtx = await createTestContext(t, {
      name: "Attacker",
      email: "attacker@org-a.com",
    });

    // Use createProjectInOrganization to put project in Attacker's org
    const projectAId = await t.run(async (ctx) => {
      return ctx.db.insert("projects", {
        name: "Project A",
        key: "PRJA",
        organizationId: attackerCtx.organizationId,
        workspaceId: attackerCtx.workspaceId,
        teamId: attackerCtx.teamId,
        ownerId: attackerCtx.userId,
        createdBy: attackerCtx.userId,
        updatedAt: Date.now(),
        boardType: "kanban",
        workflowStates: [],
      });
    });

    // Add attacker as project admin
    await t.run(async (ctx) => {
      await ctx.db.insert("projectMembers", {
        projectId: projectAId,
        userId: attackerCtx.userId,
        role: "admin",
        addedBy: attackerCtx.userId,
      });
    });

    const projectA = await t.run(async (ctx) => ctx.db.get(projectAId));
    if (!projectA) throw new Error("Project A not found");
    expect(projectA.organizationId).toEqual(attackerCtx.organizationId);

    // 2. Setup Victim Organization B (Attacker is NOT a member)
    const victimAdminId = await createTestUser(t, {
      name: "Victim Admin",
      email: "admin@org-b.com",
    });
    const { organizationId: orgBId } = await createOrganizationAdmin(t, victimAdminId, {
      name: "Org B",
    });

    // Verify Attacker is NOT in Org B
    const attackerInOrgB = await t.run(async (ctx) =>
      ctx.db
        .query("organizationMembers")
        .withIndex("by_organization_user", (q) =>
          q.eq("organizationId", orgBId).eq("userId", attackerCtx.userId),
        )
        .first(),
    );
    expect(attackerInOrgB).toBeNull();

    // 3. Attacker attempts to send invite to Victim for Project A, but claims it's for Org B
    // Attacker IS Project Admin for Project A (so hasProjectAdmin is true)
    // Attacker is NOT Org Admin for Org B (so isPlatAdmin is false)
    // The check passes because of OR condition.

    // 4. Verify Vulnerability is blocked
    await expect(async () => {
      await attackerCtx.asUser.mutation(api.invites.sendInvite, {
        email: "victim@example.com",
        role: "user",
        organizationId: orgBId, // Maliciously scoping to Org B
        projectId: projectAId, // But inviting to Project A (Org A)
        projectRole: "viewer",
      });
    }).rejects.toThrow("Project does not belong to the specified organization");
  });
});
