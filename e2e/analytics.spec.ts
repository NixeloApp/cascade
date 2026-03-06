import { expect, authenticatedTest as test } from "./fixtures";
import { testUserService } from "./utils/test-user-service";

/**
 * Analytics E2E Tests (Sprint 3 - Depth)
 *
 * Tests the project analytics dashboard in depth:
 * - Analytics page loads with data
 * - Metric cards display values
 * - Charts render correctly
 * - Data reflects created issues
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 */

test.describe("Analytics Dashboard", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
    const seedResult = await testUserService.seedTemplates();
    if (!seedResult) console.warn("WARNING: Failed to seed templates in test setup");
  });

  test("analytics page displays key metrics", async ({ projectsPage }) => {
    const timestamp = Date.now();
    const projectKey = `ANLM${timestamp.toString().slice(-4)}`;

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Analytics Metrics WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Analytics Metrics Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    // Navigate to analytics tab
    await projectsPage.switchToTab("analytics");
    console.log("✓ Navigated to analytics page");

    await projectsPage.expectAnalyticsMetricsVisible();
    console.log("✓ Analytics metric cards visible");
  });

  test("analytics page displays chart sections", async ({ projectsPage }) => {
    const timestamp = Date.now();
    const projectKey = `ANLC${timestamp.toString().slice(-4)}`;

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Analytics Charts WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Analytics Charts Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    await projectsPage.switchToTab("analytics");

    await projectsPage.expectAnalyticsChartsVisible();
    console.log("✓ Analytics chart sections visible");
  });

  test("analytics shows correct issue count after creating issues", async ({ projectsPage }) => {
    const timestamp = Date.now();
    const projectKey = `ANLI${timestamp.toString().slice(-4)}`;

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Analytics Issues WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Analytics Issues Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    // Create multiple issues
    await projectsPage.createIssue(`Analytics Test Issue 1 ${timestamp}`);
    await projectsPage.createIssue(`Analytics Test Issue 2 ${timestamp}`);
    await projectsPage.createIssue(`Analytics Test Issue 3 ${timestamp}`);
    console.log("✓ Created 3 issues");

    await projectsPage.switchToTab("analytics");

    const issueCount = await projectsPage.getAnalyticsTotalIssuesCount();
    expect(issueCount).toBeGreaterThanOrEqual(3);
    console.log(`✓ Total Issues count (${issueCount}) reflects created issues`);
  });

  test("analytics shows 'No completed sprints yet' when no sprints completed", async ({
    projectsPage,
  }) => {
    const timestamp = Date.now();
    const projectKey = `ANLS${timestamp.toString().slice(-4)}`;

    // Create a fresh project (no sprints)
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Analytics Sprints WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Analytics Sprints Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    await projectsPage.switchToTab("analytics");

    await projectsPage.expectAnalyticsNoCompletedSprintsVisible();
    console.log("✓ 'No completed sprints yet' message displayed");
  });

  test("analytics page header and description are visible", async ({ projectsPage }) => {
    const timestamp = Date.now();
    const projectKey = `ANLH${timestamp.toString().slice(-4)}`;

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Analytics Header WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Analytics Header Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    await projectsPage.switchToTab("analytics");

    await projectsPage.expectAnalyticsHeaderAndDescriptionVisible();
    console.log("✓ Analytics page header and description visible");
  });
});
