import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { getPortalValidationRateLimitKeys } from "./clientPortal";
import { DAY } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addUserToOrganization,
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestContext,
  createTestIssue,
  createTestUser,
} from "./testUtils";

const clientsApi = anyApi.clients;
const clientPortalApi = anyApi.clientPortal;

describe("clientPortal", () => {
  it("builds requester-scoped portal validation rate-limit keys", () => {
    expect(getPortalValidationRateLimitKeys("abcdefgh12345678", "Client-Session-1")).toEqual({
      global: "portal:global",
      requester: "portal:req:client-session-1",
      token: "portal:req:client-session-1:token:abcdefgh",
    });

    expect(getPortalValidationRateLimitKeys("xyz", "   ")).toEqual({
      global: "portal:global",
      requester: "portal:req:anonymous",
      token: "portal:req:anonymous:token:xyz",
    });

    expect(getPortalValidationRateLimitKeys("abcdef12", " Client Session !@# 42 ")).toEqual({
      global: "portal:global",
      requester: "portal:req:client_session_42",
      token: "portal:req:client_session_42:token:abcdef12",
    });

    expect(
      getPortalValidationRateLimitKeys("deadbeef00", `${"A".repeat(80)}-suffix`),
    ).toMatchObject({
      global: "portal:global",
      requester: `portal:req:${"a".repeat(64)}`,
      token: `portal:req:${"a".repeat(64)}:token:deadbeef`,
    });
  });

  it("allows org admin to generate, validate, and revoke portal tokens", async () => {
    const t = convexTest(schema, modules);
    const { asUser, organizationId, userId } = await createTestContext(t);

    const { clientId } = await asUser.mutation(clientsApi.create, {
      organizationId,
      name: "Portal Client",
      email: "portal@example.com",
    });

    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Portal Project",
      key: "PORT",
    });

    const generated = await asUser.mutation(clientPortalApi.generateToken, {
      organizationId,
      clientId,
      projectIds: [projectId],
      permissions: {
        viewIssues: true,
        viewDocuments: false,
        viewTimeline: true,
        addComments: false,
      },
    });

    expect(generated.success).toBe(true);
    expect(generated.portalPath).toContain("/portal/");

    const validated = await t.mutation(clientPortalApi.validateToken, {
      token: generated.token,
    });
    expect(validated?.clientId).toBe(clientId);
    expect(validated?.projectIds).toEqual([projectId]);

    const listed = await asUser.mutation(clientPortalApi.listTokensByClient, {
      organizationId,
      clientId,
    });
    expect(listed).toHaveLength(1);

    await asUser.mutation(clientPortalApi.revokeToken, {
      organizationId,
      tokenId: generated.tokenId,
    });

    const revoked = await t.mutation(clientPortalApi.validateToken, {
      token: generated.token,
    });
    expect(revoked).toBeNull();
  });

  it("prevents non-admin members from generating portal tokens", async () => {
    const t = convexTest(schema, modules);
    const ownerId = await createTestUser(t, { name: "Owner" });
    const { organizationId } = await createOrganizationAdmin(t, ownerId);
    const memberId = await createTestUser(t, { name: "Member" });
    await addUserToOrganization(t, organizationId, memberId, ownerId, "member");

    const owner = asAuthenticatedUser(t, ownerId);
    const member = asAuthenticatedUser(t, memberId);

    const { clientId } = await owner.mutation(clientsApi.create, {
      organizationId,
      name: "Client",
      email: "client@example.com",
    });

    const projectId = await createProjectInOrganization(t, ownerId, organizationId, {
      name: "Scoped Project",
      key: "SCP",
    });

    await expect(
      member.mutation(clientPortalApi.generateToken, {
        organizationId,
        clientId,
        projectIds: [projectId],
        permissions: {
          viewIssues: true,
          viewDocuments: false,
          viewTimeline: true,
          addComments: false,
        },
      }),
    ).rejects.toThrow(/admin/i);
  });

  it("returns only scoped project issues for valid tokens", async () => {
    const t = convexTest(schema, modules);
    const { asUser, organizationId, userId } = await createTestContext(t);

    const { clientId } = await asUser.mutation(clientsApi.create, {
      organizationId,
      name: "Issue Client",
      email: "issues@example.com",
    });

    const allowedProjectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Allowed",
      key: "ALW",
    });
    const blockedProjectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Blocked",
      key: "BLK",
    });

    await createTestIssue(t, allowedProjectId, userId, {
      title: "Visible issue",
    });
    await createTestIssue(t, blockedProjectId, userId, {
      title: "Hidden issue",
    });

    const generated = await asUser.mutation(clientPortalApi.generateToken, {
      organizationId,
      clientId,
      projectIds: [allowedProjectId],
      permissions: {
        viewIssues: true,
        viewDocuments: false,
        viewTimeline: false,
        addComments: false,
      },
    });

    const visible = await t.query(clientPortalApi.getIssuesForToken, {
      token: generated.token,
      projectId: allowedProjectId,
    });
    const hidden = await t.query(clientPortalApi.getIssuesForToken, {
      token: generated.token,
      projectId: blockedProjectId,
    });

    expect(visible).toHaveLength(1);
    expect(visible[0]?.title).toBe("Visible issue");
    expect(hidden).toHaveLength(0);
  });

  it("rejects malformed portal tokens without returning context", async () => {
    const t = convexTest(schema, modules);

    const validated = await t.mutation(clientPortalApi.validateToken, {
      token: "not-a-valid-portal-token",
    });
    expect(validated).toBeNull();

    const projects = await t.query(clientPortalApi.getProjectsForToken, {
      token: "not-a-valid-portal-token",
    });
    expect(projects).toEqual([]);
  });

  it("excludes soft-deleted projects from portal token access", async () => {
    const t = convexTest(schema, modules);
    const { asUser, organizationId, userId } = await createTestContext(t);

    const { clientId } = await asUser.mutation(clientsApi.create, {
      organizationId,
      name: "Archived Project Client",
      email: "archived@example.com",
    });

    const activeProjectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Active",
      key: "ACT",
    });
    const archivedProjectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Archived",
      key: "ARC",
    });

    const generated = await asUser.mutation(clientPortalApi.generateToken, {
      organizationId,
      clientId,
      projectIds: [activeProjectId, archivedProjectId],
      permissions: {
        viewIssues: true,
        viewDocuments: false,
        viewTimeline: false,
        addComments: false,
      },
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(archivedProjectId, { isDeleted: true });
    });

    const validated = await t.mutation(clientPortalApi.validateToken, {
      token: generated.token,
    });
    expect(validated?.projectIds).toEqual([activeProjectId]);

    const listedProjects = await t.query(clientPortalApi.getProjectsForToken, {
      token: generated.token,
    });
    expect(listedProjects).toHaveLength(1);
    expect(listedProjects[0]?._id).toBe(activeProjectId);

    const hiddenIssues = await t.query(clientPortalApi.getIssuesForToken, {
      token: generated.token,
      projectId: archivedProjectId,
    });
    expect(hiddenIssues).toEqual([]);
  });

  it("rejects token generation when any requested project is deleted", async () => {
    const t = convexTest(schema, modules);
    const { asUser, organizationId, userId } = await createTestContext(t);

    const { clientId } = await asUser.mutation(clientsApi.create, {
      organizationId,
      name: "Deleted Project Client",
      email: "deleted-project@example.com",
    });

    const activeProjectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Active Scope",
      key: "ASC",
    });
    const deletedProjectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Deleted Scope",
      key: "DSC",
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(deletedProjectId, { isDeleted: true });
    });

    await expect(
      asUser.mutation(clientPortalApi.generateToken, {
        organizationId,
        clientId,
        projectIds: [activeProjectId, deletedProjectId],
        permissions: {
          viewIssues: true,
          viewDocuments: false,
          viewTimeline: false,
          addComments: false,
        },
      }),
    ).rejects.toThrow(/deleted projects/i);
  });

  it("rejects portal token expiry values that are past or too far in the future", async () => {
    const t = convexTest(schema, modules);
    const { asUser, organizationId, userId } = await createTestContext(t);

    const { clientId } = await asUser.mutation(clientsApi.create, {
      organizationId,
      name: "Expiry Validation Client",
      email: "expiry@example.com",
    });

    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Expiry Scope",
      key: "EXP",
    });

    const now = Date.now();

    await expect(
      asUser.mutation(clientPortalApi.generateToken, {
        organizationId,
        clientId,
        projectIds: [projectId],
        permissions: {
          viewIssues: true,
          viewDocuments: false,
          viewTimeline: false,
          addComments: false,
        },
        expiresAt: now - 1,
      }),
    ).rejects.toThrow(/in the future/i);

    await expect(
      asUser.mutation(clientPortalApi.generateToken, {
        organizationId,
        clientId,
        projectIds: [projectId],
        permissions: {
          viewIssues: true,
          viewDocuments: false,
          viewTimeline: false,
          addComments: false,
        },
        expiresAt: now + 366 * DAY,
      }),
    ).rejects.toThrow(/one year/i);
  });

  it("accepts valid future portal token expiry values within one year", async () => {
    const t = convexTest(schema, modules);
    const { asUser, organizationId, userId } = await createTestContext(t);

    const { clientId } = await asUser.mutation(clientsApi.create, {
      organizationId,
      name: "Valid Expiry Client",
      email: "valid-expiry@example.com",
    });

    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Valid Expiry Scope",
      key: "VES",
    });

    const now = Date.now();

    const atLimit = await asUser.mutation(clientPortalApi.generateToken, {
      organizationId,
      clientId,
      projectIds: [projectId],
      permissions: {
        viewIssues: true,
        viewDocuments: false,
        viewTimeline: false,
        addComments: false,
      },
      expiresAt: now + 365 * DAY,
    });
    expect(atLimit.success).toBe(true);

    const nearTerm = await asUser.mutation(clientPortalApi.generateToken, {
      organizationId,
      clientId,
      projectIds: [projectId],
      permissions: {
        viewIssues: true,
        viewDocuments: false,
        viewTimeline: false,
        addComments: false,
      },
      expiresAt: now + DAY,
    });
    expect(nearTerm.success).toBe(true);
  });
});
