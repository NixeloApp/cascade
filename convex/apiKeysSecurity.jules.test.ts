import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addProjectMember,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestUser,
  expectThrowsAsync,
} from "./testUtils";

describe("API Key Security", () => {
  it("prevents viewer from generating write-access API key (VULNERABILITY FIXED)", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup: Create admin, org, and project
    const adminId = await createTestUser(t, { name: "Admin" });
    const { organizationId } = await createOrganizationAdmin(t, adminId);
    const projectId = await createProjectInOrganization(t, adminId, organizationId);

    // 2. Create Viewer user
    const viewerId = await createTestUser(t, { name: "Viewer" });
    await addProjectMember(t, projectId, viewerId, "viewer", adminId);

    // 3. Authenticate as Viewer
    const viewer = t.withIdentity({ subject: viewerId });

    // 4. Attempt to generate API key with write access (should be forbidden)
    await expectThrowsAsync(async () => {
      await viewer.mutation(api.apiKeys.generate, {
        name: "Viewer Key",
        scopes: ["issues:write"],
        projectId,
      });
    }, "You do not have permission to generate keys with scopes");
  });

  it("allows editor to generate write-access API key but prevents delete access", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup
    const adminId = await createTestUser(t, { name: "Admin" });
    const { organizationId } = await createOrganizationAdmin(t, adminId);
    const projectId = await createProjectInOrganization(t, adminId, organizationId);

    // 2. Create Editor user
    const editorId = await createTestUser(t, { name: "Editor" });
    await addProjectMember(t, projectId, editorId, "editor", adminId);

    // 3. Authenticate as Editor
    const editor = t.withIdentity({ subject: editorId });

    // 4. Should allow issues:write
    const writeKey = await editor.mutation(api.apiKeys.generate, {
      name: "Editor Write Key",
      scopes: ["issues:write"],
      projectId,
    });
    expect(writeKey).toBeDefined();
    expect(writeKey.scopes).toContain("issues:write");

    // 5. Should DENY issues:delete
    await expectThrowsAsync(async () => {
      await editor.mutation(api.apiKeys.generate, {
        name: "Editor Delete Key",
        scopes: ["issues:delete"],
        projectId,
      });
    }, "You do not have permission to generate keys with scopes");
  });

  it("allows admin to generate all scopes", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup
    const adminId = await createTestUser(t, { name: "Admin" });
    const { organizationId } = await createOrganizationAdmin(t, adminId);
    const projectId = await createProjectInOrganization(t, adminId, organizationId);

    // 2. Authenticate as Admin (creator is admin)
    const admin = t.withIdentity({ subject: adminId });

    // 3. Should allow issues:delete
    const deleteKey = await admin.mutation(api.apiKeys.generate, {
      name: "Admin Delete Key",
      scopes: ["issues:delete", "issues:write", "issues:read"],
      projectId,
    });
    expect(deleteKey).toBeDefined();
    expect(deleteKey.scopes).toContain("issues:delete");
  });
});
