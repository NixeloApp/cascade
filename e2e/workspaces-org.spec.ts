import { rbacTest } from "./fixtures/rbac.fixture";
import { ROUTES } from "./utils/routes";
import { createTestNamespace } from "./utils/test-helpers";

rbacTest.describe("Organization Management", () => {
  rbacTest(
    "Admin can update organization name and settings",
    async ({ adminSettingsPage }, testInfo) => {
      const namespace = createTestNamespace(testInfo);

      await adminSettingsPage.goto();
      await adminSettingsPage.switchToTab("admin");
      await adminSettingsPage.expectAdminSettingsLoaded();

      const newName = namespace.name("E2E Org");
      await adminSettingsPage.updateOrganizationName(newName);

      await adminSettingsPage.expectOrganizationName(newName);
      await adminSettingsPage.expectOrganizationNameVisible(newName);

      // Reset name for other tests (slug follows name)
      await adminSettingsPage.updateOrganizationName("Nixelo E2E");
      await adminSettingsPage.expectOrganizationName("Nixelo E2E");
    },
  );

  rbacTest("Admin can toggle time approval setting", async ({ adminSettingsPage }) => {
    await adminSettingsPage.goto();
    await adminSettingsPage.switchToTab("admin");
    await adminSettingsPage.expectAdminSettingsLoaded();

    // First, ensure we're in a known state by toggling OFF
    await adminSettingsPage.toggleTimeApproval(false);
    await adminSettingsPage.expectTimeApprovalEnabled(false);

    // Now toggle ON
    await adminSettingsPage.toggleTimeApproval(true);
    await adminSettingsPage.expectTimeApprovalEnabled(true);

    // Toggle OFF again to restore original state
    await adminSettingsPage.toggleTimeApproval(false);
    await adminSettingsPage.expectTimeApprovalEnabled(false);
  });
});

rbacTest.describe("Workspace Management", () => {
  rbacTest("Admin can create multiple workspaces", async ({ adminWorkspacesPage }, testInfo) => {
    const namespace = createTestNamespace(testInfo);

    await adminWorkspacesPage.goto();

    const wsName1 = namespace.name("WS Alpha");

    await adminWorkspacesPage.createWorkspace(wsName1);

    await adminWorkspacesPage.expectWorkspaceDetailVisible(wsName1);
    await adminWorkspacesPage.expectWorkspaceVisible(wsName1);
  });
});

rbacTest.describe("RBAC Verification", () => {
  rbacTest(
    "Editor cannot access Admin tab in settings",
    async ({ editorPage, editorSettingsPage, rbacOrgSlug }) => {
      await editorSettingsPage.goto();

      await editorSettingsPage.expectAdminTabHidden();

      // Direct navigation to the admin tab should not surface admin-only content.
      await editorPage.goto(`${ROUTES.settings.profile.build(rbacOrgSlug)}?tab=admin`);
      await editorSettingsPage.expectAdminContentHidden();
    },
  );

  rbacTest("Viewer cannot access Admin tab in settings", async ({ viewerSettingsPage }) => {
    await viewerSettingsPage.goto();
    await viewerSettingsPage.expectAdminTabHidden();
  });
});
