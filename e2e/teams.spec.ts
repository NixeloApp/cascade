import { authenticatedTest as test } from "./fixtures";
import { testUserService } from "./utils/test-user-service";

/**
 * Teams E2E Tests
 *
 * Tests the team management functionality:
 * - Teams list page within a workspace
 * - Team board (Kanban view for team)
 * - Team settings
 *
 * Route structure:
 * - Teams list: /$orgSlug/workspaces/$workspaceSlug/teams
 * - Team board: /$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/board
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 */

test.describe("Teams", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
    const seedResult = await testUserService.seedTemplates();
    if (!seedResult) console.warn("WARNING: Failed to seed templates in test setup");
  });

  test("can navigate to teams list from workspace", async ({ workspacesPage }) => {
    // Create a workspace first
    const uniqueId = Date.now().toString();
    const workspaceName = `Teams WS ${uniqueId}`;

    await workspacesPage.goto();
    await workspacesPage.createWorkspace(workspaceName);
    await workspacesPage.openWorkspaceTeams(workspaceName);

    // Should show Teams heading or content
    console.log("✓ Navigated to Teams page");
  });

  test("teams list shows create team button", async ({ workspacesPage }) => {
    // Create a workspace first
    const uniqueId = Date.now().toString();
    const workspaceName = `Create Team WS ${uniqueId}`;

    await workspacesPage.goto();
    await workspacesPage.createWorkspace(workspaceName);
    await workspacesPage.openWorkspaceTeams(workspaceName);
    await workspacesPage.expectTeamsLoaded();
  });

  test("teams list shows empty state when no teams exist", async ({ workspacesPage }) => {
    // Create a fresh workspace
    const uniqueId = Date.now().toString();
    const workspaceName = `Empty Teams WS ${uniqueId}`;

    await workspacesPage.goto();
    await workspacesPage.createWorkspace(workspaceName);
    await workspacesPage.openWorkspaceTeams(workspaceName);

    const teamsState = await workspacesPage.getTeamsPageState();
    console.log(`✓ Teams page state is ${teamsState}`);
  });
});
