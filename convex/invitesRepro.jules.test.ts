import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, it, vi } from "vitest";
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

describe("Invites Privilege Escalation Repro", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, message_ids: ["msg_123"] }), {
        status: 200,
        statusText: "OK",
      }),
    );
    process.env.SITE_URL = "http://localhost:3000";
    process.env.MAILTRAP_API_TOKEN = "mock_token";
    process.env.MAILTRAP_INBOX_ID = "123";
    process.env.MAILTRAP_FROM_EMAIL = "test@example.com";
    process.env.MAILTRAP_MODE = "sandbox";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should NOT allow a Project Admin to create an Organization Admin via invite", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Org and Org Admin
    const { organizationId, userId: orgAdminId } = await createTestContext(t);

    // 2. Create a Regular User (Org Member)
    const projectAdminId = await createTestUser(t, {
      name: "Project Admin",
      email: "padmin@example.com",
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: projectAdminId,
        role: "member",
        addedBy: orgAdminId,
      });
    });

    // 3. Create a Project in the SAME organization and make Regular User the Project Admin
    const projectId = await createProjectInOrganization(t, orgAdminId, organizationId);

    await t.run(async (ctx) => {
      // Add projectAdminId as admin of the project
      await ctx.db.insert("projectMembers", {
        projectId,
        userId: projectAdminId,
        role: "admin",
        addedBy: orgAdminId,
      });
    });

    // 4. Project Admin sends invite with role: "superAdmin"
    const asProjectAdmin = asAuthenticatedUser(t, projectAdminId);

    // This should now FAIL
    await expectThrowsAsync(async () => {
      await asProjectAdmin.mutation(api.invites.sendInvite, {
        email: "attacker@example.com",
        role: "superAdmin", // Trying to escalate privilege
        organizationId,
        projectId,
        projectRole: "viewer",
      });
    }, "Only organization admins can invite other admins");
  });
});
