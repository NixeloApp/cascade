import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addProjectMember,
  addUserToOrganization,
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestUser,
} from "./testUtils";

describe("API Keys Security", () => {
  it("should prevent rotation if user has lost access to the project", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup: Creator creates org and project
    const creatorId = await createTestUser(t, { name: "Creator" });
    const { organizationId } = await createOrganizationAdmin(t, creatorId);
    const projectId = await createProjectInOrganization(t, creatorId, organizationId);
    const asCreator = asAuthenticatedUser(t, creatorId);

    // 2. Setup: Member joins project
    // Need a fixed email to add member by email
    const memberEmail = "member@example.com";
    const memberId = await createTestUser(t, { name: "Member", email: memberEmail });

    // Add member to organization first (required by security check)
    await addUserToOrganization(t, organizationId, memberId, creatorId);
    // Add member to project
    await asCreator.mutation(api.projects.addProjectMember, {
      projectId,
      userEmail: memberEmail,
      role: "viewer",
    });

    // 3. Member creates an API key for the project
    const asMember = asAuthenticatedUser(t, memberId);
    const { id: keyId } = await asMember.mutation(api.apiKeys.generate, {
      name: "Member Key",
      scopes: ["issues:read"],
      projectId,
    });

    // 4. Member is removed from the project
    await asCreator.mutation(api.projects.removeProjectMember, {
      projectId,
      memberId,
    });

    // 5. Member attempts to rotate the key
    await expect(async () => {
      await asMember.mutation(api.apiKeys.rotate, {
        keyId,
      });
    }).rejects.toThrow(/forbidden|not authorized/i);
  });

  it("should prevent privilege escalation via key rotation when user role is downgraded", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup: Admin user creates org
    const adminId = await createTestUser(t, { name: "Admin" });
    const { organizationId } = await createOrganizationAdmin(t, adminId);

    // 2. Setup: Project
    const projectId = await createProjectInOrganization(t, adminId, organizationId);

    // 3. Setup: Member user
    const memberId = await createTestUser(t, { name: "Member" });
    await addUserToOrganization(t, organizationId, memberId, adminId, "member");

    // Add Member as ADMIN of the project initially
    await addProjectMember(t, projectId, memberId, "admin", adminId);

    const asMember = asAuthenticatedUser(t, memberId);

    // 4. Member creates a high-privilege API key (issues:delete is restricted to admins)
    const { id: keyId } = await asMember.mutation(api.apiKeys.generate, {
      name: "High Priv Key",
      scopes: ["issues:delete"],
      projectId,
    });

    // 5. Downgrade Member to EDITOR
    await t.run(async (ctx) => {
      const memberRecord = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", memberId))
        .first();
      if (memberRecord) {
        await ctx.db.patch(memberRecord._id, { role: "editor" });
      }
    });

    // 6. Member attempts to rotate the key
    // This SHOULD fail because Editor role doesn't allow "issues:delete"
    await expect(async () => {
      await asMember.mutation(api.apiKeys.rotate, {
        keyId,
      });
    }).rejects.toThrow(/permission|forbidden/i);
  });

  it("should prevent privilege escalation via update", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    // 1. Create a global key with read-only scopes (allowed)
    const { id: keyId } = await asUser.mutation(api.apiKeys.generate, {
      name: "Global Read Key",
      scopes: ["issues:read"],
    });

    // 2. Attempt to update the key to include write scopes (should be FORBIDDEN for global keys)
    await expect(async () => {
      await asUser.mutation(api.apiKeys.update, {
        keyId,
        scopes: ["issues:read", "issues:write"],
      });
    }).rejects.toThrow(/Global API keys cannot have write permissions/);
  });
});
