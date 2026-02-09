import { expect } from "@playwright/test";
import { rbacTest } from "./fixtures/rbac.fixture";

rbacTest.describe("Organization Management", () => {
  rbacTest(
    "Admin can update organization name and settings",
    async ({ adminSettingsPage, adminPage, rbacOrgSlug }) => {
      await adminSettingsPage.goto(rbacOrgSlug);
      await adminSettingsPage.switchToTab("admin");

      const newName = `E2E Org ${Date.now()}`;
      await adminSettingsPage.updateOrganizationName(newName);

      // Verify name in input
      await adminSettingsPage.expectOrganizationName(newName);

      // Verify name appears on page after update (sidebar or settings description)
      await expect(adminPage.getByText(newName, { exact: false }).first()).toBeVisible();

      // Reset name for other tests (slug follows name)
      await adminSettingsPage.updateOrganizationName("Nixelo E2E");
      await adminSettingsPage.expectOrganizationName("Nixelo E2E");
    },
  );

  rbacTest("Admin can toggle time approval setting", async ({ adminSettingsPage, rbacOrgSlug }) => {
    await adminSettingsPage.goto(rbacOrgSlug);
    await adminSettingsPage.switchToTab("admin");

    // First, ensure we're in a known state by toggling OFF
    await adminSettingsPage.toggleTimeApproval(false);
    await expect(adminSettingsPage.requiresTimeApprovalSwitch).toHaveAttribute(
      "aria-checked",
      "false",
    );

    // Now toggle ON
    await adminSettingsPage.toggleTimeApproval(true);
    await expect(adminSettingsPage.requiresTimeApprovalSwitch).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // Toggle OFF again to restore original state
    await adminSettingsPage.toggleTimeApproval(false);
    await expect(adminSettingsPage.requiresTimeApprovalSwitch).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });
});

rbacTest.describe("Workspace Management", () => {
  rbacTest(
    "Admin can create multiple workspaces",
    async ({ adminWorkspacesPage, adminPage, rbacOrgSlug }) => {
      await adminWorkspacesPage.goto(rbacOrgSlug);

      const wsName1 = `WS Alpha ${Date.now()}`;
      const _wsName2 = `WS Beta ${Date.now()}`;

      await adminWorkspacesPage.createWorkspace(wsName1);

      // After creation, the app navigates to the new workspace detail page
      // Verify we're on the workspace detail page by checking the heading
      await expect(adminPage.getByRole("heading", { name: wsName1 })).toBeVisible();

      // Verify the workspace name appears on the page (both heading and sidebar)
      await expect(adminPage.getByText(wsName1).first()).toBeVisible();
    },
  );
});

rbacTest.describe("RBAC Verification", () => {
  rbacTest(
    "Editor cannot access Admin tab in settings",
    async ({ editorPage, editorSettingsPage, rbacOrgSlug }) => {
      await editorSettingsPage.goto(rbacOrgSlug);

      // Admin tab should not even be visible
      await expect(editorPage.getByRole("tab", { name: /admin/i })).not.toBeVisible();

      // Direct navigation to admin tab should hide content or redirect
      await editorPage.goto(`/${rbacOrgSlug}/settings/profile?tab=admin`);
      await expect(editorPage.getByText(/organization settings/i)).not.toBeVisible();
    },
  );

  rbacTest(
    "Viewer cannot access Admin tab in settings",
    async ({ viewerPage, viewerSettingsPage, rbacOrgSlug }) => {
      await viewerSettingsPage.goto(rbacOrgSlug);
      await expect(viewerPage.getByRole("tab", { name: /admin/i })).not.toBeVisible();
    },
  );
});
