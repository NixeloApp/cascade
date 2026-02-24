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

    // 1. Setup
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

    const asMember = asAuthenticatedUser(t, memberId);
    const { id: keyId } = await asMember.mutation(api.apiKeys.generate, {
      name: "Member Key",
      scopes: ["issues:read"],
      projectId,
    });

    // 3. Remove member
    await asCreator.mutation(api.projects.removeProjectMember, {
      projectId,
      memberId,
    });

    // 4. Attempt rotation (should fail)
    await expect(async () => {
      await asMember.mutation(api.apiKeys.rotate, { keyId });
    }).rejects.toThrow(/forbidden|not authorized/i);
  });

  it("should prevent update if user has lost access to the project", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup
    const creatorId = await createTestUser(t, { name: "Creator" });
    const { organizationId } = await createOrganizationAdmin(t, creatorId);
    const projectId = await createProjectInOrganization(t, creatorId, organizationId);

    // 2. Setup: Member joins project
    const memberEmail = "member@example.com";
    const memberId = await createTestUser(t, { name: "Member", email: memberEmail });

    // Add member to organization first (required by security check)
    await addUserToOrganization(t, organizationId, memberId, creatorId);
    const asCreator = asAuthenticatedUser(t, creatorId);
    // Add member to project directly using helper (avoiding API call issues in tests)
    await addProjectMember(t, projectId, memberId, "viewer", creatorId);

    const asMember = asAuthenticatedUser(t, memberId);
    const { id: keyId } = await asMember.mutation(api.apiKeys.generate, {
      name: "Member Key",
      scopes: ["issues:read"],
      projectId,
    });

    // 3. Remove member
    await asCreator.mutation(api.projects.removeProjectMember, {
      projectId,
      memberId,
    });

    // 4. Attempt update (should fail)
    await expect(async () => {
      await asMember.mutation(api.apiKeys.update, {
        keyId,
        name: "Updated Key Name",
      });
    }).rejects.toThrow(/forbidden|not authorized/i);
  });
});
