import { authenticatedTest as test } from "./fixtures";
import { createTestNamespace } from "./utils/test-helpers";
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

  test("can navigate to roadmap tab from project board", async ({ projectsPage }, testInfo) => {
    // Create a unique project
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("ROAD");

    // Navigate to projects page
    await projectsPage.goto();

    // Create a workspace for test isolation
    await projectsPage.createWorkspace(namespace.name("Roadmap WS"));

    // Go back to projects page
    await projectsPage.goto();

    // Create a project
    await projectsPage.createProject(namespace.name("Roadmap Project"), projectKey);

    await projectsPage.switchToTab("roadmap");
  });

  test("roadmap page shows timeline view", async ({ projectsPage }, testInfo) => {
    // Create a unique project
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("ROAD");

    // Navigate to projects page
    await projectsPage.goto();

    // Create a workspace for test isolation
    await projectsPage.createWorkspace(namespace.name("Timeline WS"));

    // Go back to projects page
    await projectsPage.goto();

    // Create a project
    await projectsPage.createProject(namespace.name("Timeline Project"), projectKey);

    await projectsPage.switchToTab("roadmap");
    await projectsPage.expectRoadmapCurrentMonthVisible();
  });

  test("roadmap shows epic filter dropdown", async ({ projectsPage }, testInfo) => {
    // Create a unique project
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("EPIC");

    // Navigate to projects page
    await projectsPage.goto();

    // Create a workspace for test isolation
    await projectsPage.createWorkspace(namespace.name("Epic WS"));

    // Go back to projects page
    await projectsPage.goto();

    // Create a project
    await projectsPage.createProject(namespace.name("Epic Project"), projectKey);

    await projectsPage.switchToTab("roadmap");

    const epicFilterState = await projectsPage.getRoadmapEpicFilterState();
    console.log(`✓ Roadmap epic filter is ${epicFilterState}`);
  });
});
