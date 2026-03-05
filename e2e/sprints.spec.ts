import { expect, authenticatedTest as test } from "./fixtures";

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
    test("can navigate to sprints tab in project", async ({
      dashboardPage,
      projectsPage,
      page,
    }) => {
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

      // Verify Sprints heading is visible (state-based UI, URL doesn't change)
      await expect(page.getByRole("heading", { name: /sprint management/i })).toBeVisible();
    });

    test("sprints tab shows sprint management UI", async ({
      dashboardPage,
      projectsPage,
      page,
    }) => {
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

      // Verify create sprint button is visible
      await expect(
        page
          .getByRole("main")
          .getByRole("button", { name: /create sprint/i })
          .first(),
      ).toBeVisible();
    });
  });

  test.describe("Backlog Navigation", () => {
    test("can navigate to backlog tab in project", async ({
      dashboardPage,
      projectsPage,
      page,
    }) => {
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
      // Verify Backlog UI element is visible (the column heading)
      await expect(page.getByRole("heading", { name: "Backlog", exact: true })).toBeVisible();
    });
  });
});
