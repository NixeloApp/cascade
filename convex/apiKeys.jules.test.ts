import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
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
    await asCreator.mutation(api.projectMembers.add, {
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
    await asCreator.mutation(api.projectMembers.remove, {
      projectId,
      memberId,
    });

    // 5. Member attempts to rotate the key
    // This SHOULD fail, but currently succeeds (vulnerability)
    // I expect this to throw "Not authorized" or "Forbidden" once fixed.
    // Currently, it will pass (fail the expectation).
    await expect(async () => {
      await asMember.mutation(api.apiKeys.rotate, {
        keyId,
      });
    }).rejects.toThrow(/forbidden|not authorized/i);
  });

  it("should prevent update if user has lost access to the project", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup: Creator creates org and project
    const creatorId = await createTestUser(t, { name: "Creator" });
    const { organizationId } = await createOrganizationAdmin(t, creatorId);
    const projectId = await createProjectInOrganization(t, creatorId, organizationId);
    const asCreator = asAuthenticatedUser(t, creatorId);

    // 2. Setup: Member joins project
    const memberEmail = "member@example.com";
    const memberId = await createTestUser(t, { name: "Member", email: memberEmail });

    // Add member to organization first
    await addUserToOrganization(t, organizationId, memberId, creatorId);

    // Creator adds member to project
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

    // 5. Member attempts to update the key
    await expect(async () => {
      await asMember.mutation(api.apiKeys.update, {
        keyId,
        name: "Renamed Key",
      });
    }).rejects.toThrow(/forbidden|not authorized/i);
  });

  it("should validate scopes on update", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    const key = await asUser.mutation(api.apiKeys.generate, {
      name: "Test Key",
      scopes: ["issues:read"],
    });

    // Attempt to update with invalid scope
    await expect(async () => {
      await asUser.mutation(api.apiKeys.update, {
        keyId: key.id,
        scopes: ["invalid:scope"],
      });
    }).rejects.toThrow(/Invalid scope/i);
  });
});
