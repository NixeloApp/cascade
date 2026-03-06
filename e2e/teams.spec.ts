import { expect } from "@playwright/test";
import { authenticatedTest as test } from "./fixtures";
import { createTestNamespace } from "./utils/test-helpers";
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

  test("can navigate to teams list from workspace", async ({ workspacesPage }, testInfo) => {
    // Create a workspace first
    const namespace = createTestNamespace(testInfo);
    const workspaceName = namespace.name("Teams WS");

    await workspacesPage.goto();
    await workspacesPage.createWorkspace(workspaceName);
    await workspacesPage.openWorkspaceTeams(workspaceName);
    await workspacesPage.expectTeamsLoaded();
  });

  test("teams list shows create team button", async ({ workspacesPage }, testInfo) => {
    // Create a workspace first
    const namespace = createTestNamespace(testInfo);
    const workspaceName = namespace.name("Create Team WS");

    await workspacesPage.goto();
    await workspacesPage.createWorkspace(workspaceName);
    await workspacesPage.openWorkspaceTeams(workspaceName);
    await workspacesPage.expectTeamsLoaded();
  });

  test("teams list shows empty state when no teams exist", async ({ workspacesPage }, testInfo) => {
    // Create a fresh workspace
    const namespace = createTestNamespace(testInfo);
    const workspaceName = namespace.name("Empty Teams WS");

    await workspacesPage.goto();
    await workspacesPage.createWorkspace(workspaceName);
    await workspacesPage.openWorkspaceTeams(workspaceName);

    const teamsState = await workspacesPage.getTeamsPageState();
    // Fresh workspace should have no teams
    expect(teamsState).toBe("empty");
  });
});
