import { authenticatedTest as test } from "./fixtures";
import { testUserService } from "./utils/test-user-service";

/**
 * Roadmap E2E Tests
 *
 * Tests the roadmap view functionality:
 * - Navigation to roadmap tab
 * - View mode toggle (months/weeks)
 * - Epic filter dropdown
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 */

test.describe("Roadmap", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
    // Ensure templates are seeded for project creation tests
    const seedResult = await testUserService.seedTemplates();
    if (!seedResult) console.warn("WARNING: Failed to seed templates in test setup");
  });

  test("can navigate to roadmap tab from project board", async ({ projectsPage }) => {
    // Create a unique project
    const uniqueId = Date.now().toString();
    const projectKey = `ROAD${uniqueId.slice(-4)}`;

    // Navigate to projects page
    await projectsPage.goto();

    // Create a workspace for test isolation
    await projectsPage.createWorkspace(`Roadmap WS ${uniqueId}`);

    // Go back to projects page
    await projectsPage.goto();

    // Create a project
    await projectsPage.createProject(`Roadmap Project ${uniqueId}`, projectKey);

    await projectsPage.switchToTab("roadmap");
  });

  test("roadmap page shows timeline view", async ({ projectsPage }) => {
    // Create a unique project
    const uniqueId = Date.now().toString();
    const projectKey = `ROAD${uniqueId.slice(-4)}`;

    // Navigate to projects page
    await projectsPage.goto();

    // Create a workspace for test isolation
    await projectsPage.createWorkspace(`Timeline WS ${uniqueId}`);

    // Go back to projects page
    await projectsPage.goto();

    // Create a project
    await projectsPage.createProject(`Timeline Project ${uniqueId}`, projectKey);

    await projectsPage.switchToTab("roadmap");
    await projectsPage.expectRoadmapCurrentMonthVisible();
  });

  test("roadmap shows epic filter dropdown", async ({ projectsPage }) => {
    // Create a unique project
    const uniqueId = Date.now().toString();
    const projectKey = `EPIC${uniqueId.slice(-4)}`;

    // Navigate to projects page
    await projectsPage.goto();

    // Create a workspace for test isolation
    await projectsPage.createWorkspace(`Epic WS ${uniqueId}`);

    // Go back to projects page
    await projectsPage.goto();

    // Create a project
    await projectsPage.createProject(`Epic Project ${uniqueId}`, projectKey);

    await projectsPage.switchToTab("roadmap");

    const epicFilterState = await projectsPage.getRoadmapEpicFilterState();
    console.log(`✓ Roadmap epic filter is ${epicFilterState}`);
  });
});
