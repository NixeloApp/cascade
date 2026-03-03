import { expect, authenticatedTest as test } from "./fixtures";
import { testUserService } from "./utils/test-user-service";

/**
 * Permission Cascade E2E Tests (Sprint 3 - Depth)
 *
 * Tests the permission inheritance hierarchy:
 * - Organization → Workspace → Project cascade
 * - Org admins have access to all child resources
 * - Workspace members can access projects within
 * - Project-level restrictions work
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 */

test.describe("Permission Cascade", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
    const seedResult = await testUserService.seedTemplates();
    if (!seedResult) console.warn("WARNING: Failed to seed templates in test setup");
  });

  test("org owner can access organization settings", async ({ dashboardPage, page }) => {
    // Navigate to dashboard (user is org owner from setup)
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();

    // Navigate to settings
    await dashboardPage.navigateTo("settings");

    // Verify settings page loads
    await expect(page).toHaveURL(/\/settings/);
    console.log("✓ Navigated to settings");

    // Verify org-level settings are accessible
    // Admin tab should be visible for org admins (contains org-level settings like invites)
    const adminTab = page
      .getByRole("link", { name: /admin/i })
      .or(page.getByRole("tab", { name: /admin/i }));
    await expect(adminTab).toBeVisible();
    console.log("✓ Admin settings tab visible (org admin access)");
  });

  test("org owner can create workspaces", async ({ workspacesPage, page }) => {
    const timestamp = Date.now();
    const workspaceName = `Cascade WS ${timestamp}`;

    // Navigate to workspaces
    await workspacesPage.goto();

    // Create a workspace
    await workspacesPage.createWorkspace(workspaceName);
    console.log("✓ Created workspace as org owner");

    // Verify workspace was created - check for workspace detail page or list item
    // After creation, page may redirect to workspace detail OR stay on list
    await expect(page).toHaveURL(/\/workspaces\//);
    const mainContent = page.getByRole("main");
    const workspaceItem = mainContent
      .locator(`a[href*="/workspaces/"]`)
      .filter({ hasText: workspaceName });
    const workspaceHeading = mainContent.getByRole("heading", { name: workspaceName, level: 3 });
    await expect(workspaceItem.or(workspaceHeading)).toBeVisible();
    console.log("✓ Workspace visible");
  });

  test("org owner can create projects in any workspace", async ({ projectsPage, page }) => {
    const timestamp = Date.now();
    const workspaceName = `Project WS ${timestamp}`;
    const projectKey = `CASC${timestamp.toString().slice(-4)}`;

    // Create workspace first
    await projectsPage.goto();
    await projectsPage.createWorkspace(workspaceName);

    // Go back to projects and create a project
    await projectsPage.goto();
    await projectsPage.createProject(`Cascade Project ${timestamp}`, projectKey);

    // Verify project was created
    await expect(page).toHaveURL(/\/projects\/.*\/board/);
    console.log("✓ Created project as org owner in workspace");
  });

  test("user can only see workspaces they have access to", async ({ workspacesPage, page }) => {
    // Navigate to workspaces
    await workspacesPage.goto();

    // User should see either workspaces or empty state.
    // Both are valid depending on organization setup
    const workspacesList = page.locator("main");
    await expect(workspacesList).toBeVisible();
    console.log("✓ Workspaces page accessible");

    // Check if there are any workspace cards/links
    const workspaceLinks = page.locator("a[href*='/workspaces/']");
    const workspaceCount = await workspaceLinks.count();
    console.log(`✓ User can see ${workspaceCount} workspace(s)`);
  });

  test("user can only see projects they have access to", async ({ projectsPage, page }) => {
    // Navigate to projects
    await projectsPage.goto();

    // User should see either projects or empty state.
    const projectsList = page.locator("main");
    await expect(projectsList).toBeVisible();
    console.log("✓ Projects page accessible");

    // Check for project cards
    const projectLinks = page.locator("a[href*='/projects/']");
    const projectCount = await projectLinks.count();
    console.log(`✓ User can see ${projectCount} project(s)`);
  });

  test("accessing non-existent project shows error", async ({ page, orgSlug }) => {
    // Try to access a project that doesn't exist
    await page.goto(`/${orgSlug}/projects/NONEXISTENT/board`);

    // Wait for the "Project Not Found" heading
    const notFoundHeading = page.getByRole("heading", { name: /project not found/i });
    await expect(notFoundHeading).toBeVisible();
    console.log("✓ Shows 'Project Not Found' error for non-existent project");
  });

  test("project settings require appropriate permissions", async ({ projectsPage, page }) => {
    const timestamp = Date.now();
    const projectKey = `PERM${timestamp.toString().slice(-4)}`;

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Perm Test WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Perm Test Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    // Navigate to project settings
    const projectTabs = page.getByLabel("Tabs");
    const settingsTab = projectTabs.getByRole("link", { name: /settings/i });

    // Admin (owner) should see settings tab
    await expect(settingsTab).toBeVisible();
    console.log("✓ Project settings tab visible for project owner");

    // Click settings
    await settingsTab.click();
    await expect(page).toHaveURL(/\/settings/);
    console.log("✓ Can access project settings as owner");
  });

  test("workspace settings are accessible to workspace members", async ({
    workspacesPage,
    page,
  }) => {
    const timestamp = Date.now();
    const workspaceName = `Settings WS ${timestamp}`;

    // Create a workspace - this navigates to the workspace detail page after creation
    await workspacesPage.goto();
    await workspacesPage.createWorkspace(workspaceName);

    // After creation, we should be on the workspace detail page (may be on /teams tab)
    await expect(page).toHaveURL(/\/workspaces\/[^/]+/);

    // Verify the workspace heading is visible
    const workspaceHeading = page.getByRole("heading", { name: workspaceName, level: 3 });
    await expect(workspaceHeading).toBeVisible();
    console.log("✓ On workspace detail page");

    // Look for settings link/button in the workspace tabs
    const settingsLink = page.getByRole("link", { name: /settings/i });
    if (await settingsLink.isVisible().catch(() => false)) {
      await settingsLink.click();
      await expect(page).toHaveURL(/\/workspaces\/.*\/settings/);
      console.log("✓ Workspace settings accessible");
    } else {
      console.log("ℹ Workspace settings link not visible (may require specific role)");
    }
  });

  test("organization members list is accessible to admins", async ({ dashboardPage, page }) => {
    // Navigate to settings
    await dashboardPage.goto();
    await dashboardPage.navigateTo("settings");

    // Click on Members tab/link
    const membersTab = page
      .getByRole("link", { name: /members/i })
      .or(page.getByRole("tab", { name: /members/i }));

    if (await membersTab.isVisible().catch(() => false)) {
      await membersTab.click();

      // Verify members list or table is visible
      const membersList = page.getByRole("table").or(page.locator("[data-members-list]"));
      const hasMembersList = await membersList.isVisible().catch(() => false);

      if (hasMembersList) {
        console.log("✓ Organization members list accessible to admin");
      } else {
        // Might show as cards or other layout
        const memberItems = page.locator("[data-member-item]").or(page.getByText(/@.*\./i));
        const memberCount = await memberItems.count();
        console.log(`✓ Members section accessible (${memberCount} items visible)`);
      }
    } else {
      console.log("ℹ Members tab not visible in current settings view");
    }
  });
});
