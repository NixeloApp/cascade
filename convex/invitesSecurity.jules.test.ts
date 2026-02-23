import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser, expectThrowsAsync } from "./testUtils";

describe("Invite Security", () => {
  beforeEach(() => {
    // Mock fetch for email sending
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

  it("should prevent unverified users from accepting invites", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Admin and Organization
    const adminId = await createTestUser(t, { name: "Admin", email: "admin@example.com" });
    const asAdmin = asAuthenticatedUser(t, adminId);

    // Create org
    const orgId = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Test Org",
        slug: "test-org",
        timezone: "America/New_York",
        createdBy: adminId,
        updatedAt: Date.now(),
        settings: {
          defaultMaxHoursPerWeek: 40,
          defaultMaxHoursPerDay: 8,
          requiresTimeApproval: false,
          billingEnabled: false,
        },
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId: orgId,
        userId: adminId,
        role: "owner",
        joinedAt: Date.now(),
        addedBy: adminId,
      });
    });

    // 2. Admin sends an invite to victim@example.com
    const inviteEmail = "victim@example.com";

    // We expect sendInvite to return { inviteId, token }
    const result = await asAdmin.mutation(api.invites.sendInvite, {
      email: inviteEmail,
      role: "user",
      organizationId: orgId,
    });

    // Type narrowing/assertion
    if (!("token" in result)) {
      throw new Error("Expected invite token");
    }
    const { inviteId, token } = result;

    // 3. Create an unverified user with the same email (simulating attacker who signed up but didn't verify)
    // We manually insert the user to ensure emailVerificationTime is undefined
    const attackerId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Attacker",
        email: inviteEmail,
        // emailVerificationTime is intentionally omitted to simulate unverified status
      });
    });

    // 4. Try to accept the invite as the unverified user
    const asAttacker = asAuthenticatedUser(t, attackerId);

    // This should now FAIL because the user is not verified
    await expectThrowsAsync(async () => {
      await asAttacker.mutation(api.invites.acceptInvite, { token });
    }, "You must verify your email address before accepting an invitation");

    // Verify invite was NOT accepted
    const invite = await t.run(async (ctx) => ctx.db.get(inviteId));
    if (invite === null) {
      throw new Error("Invite not found");
    }
    expect(invite.status).toBe("pending");
    expect(invite.acceptedBy).toBeUndefined();
  });
});
