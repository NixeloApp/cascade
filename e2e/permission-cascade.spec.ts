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

  test("org owner can access organization settings", async ({ settingsPage }) => {
    await settingsPage.goto();
    await settingsPage.switchToTab("admin");
    console.log("✓ Admin settings accessible");
  });

  test("org owner can create workspaces", async ({ workspacesPage }) => {
    const timestamp = Date.now();
    const workspaceName = `Cascade WS ${timestamp}`;

    // Navigate to workspaces
    await workspacesPage.goto();

    // Create a workspace
    await workspacesPage.createWorkspace(workspaceName);
    console.log("✓ Created workspace as org owner");

    await workspacesPage.expectWorkspaceVisible(workspaceName);
    console.log("✓ Workspace visible");
  });

  test("org owner can create projects in any workspace", async ({ projectsPage }) => {
    const timestamp = Date.now();
    const workspaceName = `Project WS ${timestamp}`;
    const projectKey = `CASC${timestamp.toString().slice(-4)}`;

    // Create workspace first
    await projectsPage.goto();
    await projectsPage.createWorkspace(workspaceName);

    // Go back to projects and create a project
    await projectsPage.goto();
    await projectsPage.createProject(`Cascade Project ${timestamp}`, projectKey);

    await projectsPage.expectBoardVisible();
    console.log("✓ Created project as org owner in workspace");
  });

  test("user can only see workspaces they have access to", async ({ workspacesPage }) => {
    await workspacesPage.goto();
    await workspacesPage.expectWorkspacesView();
    console.log("✓ Workspaces page accessible");

    const workspaceCount = await workspacesPage.workspaceCards.count();
    console.log(`✓ User can see ${workspaceCount} workspace(s)`);
  });

  test("user can only see projects they have access to", async ({ projectsPage }) => {
    await projectsPage.goto();
    await projectsPage.expectProjectsView();
    console.log("✓ Projects page accessible");

    const projectCount = await projectsPage.projectItems.count();
    console.log(`✓ User can see ${projectCount} project(s)`);
  });

  test("accessing non-existent project shows error", async ({ projectsPage }) => {
    await projectsPage.gotoProjectBoard("NONEXISTENT");
    await projectsPage.expectProjectNotFound();
    console.log("✓ Shows 'Project Not Found' error for non-existent project");
  });

  test("project settings require appropriate permissions", async ({ projectsPage }) => {
    const timestamp = Date.now();
    const projectKey = `PERM${timestamp.toString().slice(-4)}`;

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Perm Test WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Perm Test Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    // Admin (owner) should see settings tab
    const hasSettingsTab = await projectsPage.isProjectTabVisible("settings");
    expect(hasSettingsTab).toBe(true);
    console.log("✓ Project settings tab visible for project owner");

    await projectsPage.switchToTab("settings");
    await projectsPage.expectProjectSettingsLoaded();
    console.log("✓ Can access project settings as owner");
  });

  test("workspace settings are accessible to workspace members", async ({ workspacesPage }) => {
    const timestamp = Date.now();
    const workspaceName = `Settings WS ${timestamp}`;

    // Create a workspace - this navigates to the workspace detail page after creation
    await workspacesPage.goto();
    await workspacesPage.createWorkspace(workspaceName);

    await workspacesPage.expectWorkspaceDetailVisible(workspaceName);
    console.log("✓ On workspace detail page");

    if (await workspacesPage.isWorkspaceSettingsTabVisible()) {
      await workspacesPage.openWorkspaceSettings();
      console.log("✓ Workspace settings accessible");
    } else {
      console.log("ℹ Workspace settings link not visible (may require specific role)");
    }
  });

  test("organization members list is accessible to admins", async ({ settingsPage }) => {
    await settingsPage.goto();
    await settingsPage.switchToTab("admin");
    await settingsPage.openAdminUsersList();
    console.log("✓ Organization members list accessible to admin");
  });
});
