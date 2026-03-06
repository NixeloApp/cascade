import { authenticatedTest as test } from "./fixtures";

/**
 * Sprints E2E Tests
 */
test.describe("Sprints", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });

  // Re-authenticate if tokens were invalidated
  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  test.describe("Sprint Navigation", () => {
    test("can navigate to sprints tab in project", async ({ dashboardPage, projectsPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      // Use direct URL navigation to access projects
      await projectsPage.goto();

      // Create a project first
      const uniqueId = Date.now();
      const projectKey = `PROJ${uniqueId.toString().slice(-4)}`;
      await projectsPage.createProject(`Sprint Test ${uniqueId}`, projectKey);
      await projectsPage.expectBoardVisible();

      await projectsPage.switchToTab("sprints");
      await projectsPage.expectSprintsLoaded();
    });

    test("sprints tab shows sprint management UI", async ({ dashboardPage, projectsPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      // Use direct URL navigation to access projects
      await projectsPage.goto();

      // Create a project first
      const uniqueId = Date.now();
      const projectKey = `PROJ${uniqueId.toString().slice(-4)}`;
      await projectsPage.createProject(`Sprint Test ${uniqueId}`, projectKey);
      await projectsPage.expectBoardVisible();

      // Navigate to sprints tab
      await projectsPage.switchToTab("sprints");
      await projectsPage.expectCreateSprintVisible();
    });
  });

  test.describe("Backlog Navigation", () => {
    test("can navigate to backlog tab in project", async ({ dashboardPage, projectsPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      // Use direct URL navigation to access projects
      await projectsPage.goto();

      // Create a project first
      const uniqueId = Date.now();
      const projectKey = `PROJ${uniqueId.toString().slice(-4)}`;
      await projectsPage.createProject(`Backlog Test ${uniqueId}`, projectKey);
      await projectsPage.expectBoardVisible();

      // Navigate to backlog tab
      // Check for button enabled state as proxy for existence and interactivity
      // Note: This relies on the specific UI implementation of the backlog tab/button
      await projectsPage.switchToTab("backlog");
      await projectsPage.expectBacklogLoaded();
    });
  });
});
