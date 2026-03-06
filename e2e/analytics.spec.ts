import { expect, authenticatedTest as test } from "./fixtures";
import { createTestNamespace } from "./utils/test-helpers";
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

  test("analytics page displays key metrics", async ({ projectsPage }, testInfo) => {
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("ANLM");

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(namespace.name("Analytics Metrics WS"));
    await projectsPage.goto();
    await projectsPage.createProject(namespace.name("Analytics Metrics Project"), projectKey);
    await projectsPage.waitForBoardInteractive();

    // Navigate to analytics tab
    await projectsPage.switchToTab("analytics");
    console.log("✓ Navigated to analytics page");

    await projectsPage.expectAnalyticsMetricsVisible();
    console.log("✓ Analytics metric cards visible");
  });

  test("analytics page displays chart sections", async ({ projectsPage }, testInfo) => {
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("ANLC");

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(namespace.name("Analytics Charts WS"));
    await projectsPage.goto();
    await projectsPage.createProject(namespace.name("Analytics Charts Project"), projectKey);
    await projectsPage.waitForBoardInteractive();

    await projectsPage.switchToTab("analytics");

    await projectsPage.expectAnalyticsChartsVisible();
    console.log("✓ Analytics chart sections visible");
  });

  test("analytics shows correct issue count after creating issues", async ({
    projectsPage,
  }, testInfo) => {
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("ANLI");

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(namespace.name("Analytics Issues WS"));
    await projectsPage.goto();
    await projectsPage.createProject(namespace.name("Analytics Issues Project"), projectKey);
    await projectsPage.waitForBoardInteractive();

    // Create multiple issues
    await projectsPage.createIssue(namespace.name("Analytics Test Issue 1"));
    await projectsPage.createIssue(namespace.name("Analytics Test Issue 2"));
    await projectsPage.createIssue(namespace.name("Analytics Test Issue 3"));
    console.log("✓ Created 3 issues");

    await projectsPage.switchToTab("analytics");

    const issueCount = await projectsPage.getAnalyticsTotalIssuesCount();
    expect(issueCount).toBeGreaterThanOrEqual(3);
    console.log(`✓ Total Issues count (${issueCount}) reflects created issues`);
  });

  test("analytics shows 'No completed sprints yet' when no sprints completed", async ({
    projectsPage,
  }, testInfo) => {
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("ANLS");

    // Create a fresh project (no sprints)
    await projectsPage.goto();
    await projectsPage.createWorkspace(namespace.name("Analytics Sprints WS"));
    await projectsPage.goto();
    await projectsPage.createProject(namespace.name("Analytics Sprints Project"), projectKey);
    await projectsPage.waitForBoardInteractive();

    await projectsPage.switchToTab("analytics");

    await projectsPage.expectAnalyticsNoCompletedSprintsVisible();
    console.log("✓ 'No completed sprints yet' message displayed");
  });

  test("analytics page header and description are visible", async ({ projectsPage }, testInfo) => {
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("ANLH");

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(namespace.name("Analytics Header WS"));
    await projectsPage.goto();
    await projectsPage.createProject(namespace.name("Analytics Header Project"), projectKey);
    await projectsPage.waitForBoardInteractive();

    await projectsPage.switchToTab("analytics");

    await projectsPage.expectAnalyticsHeaderAndDescriptionVisible();
    console.log("✓ Analytics page header and description visible");
  });
});
