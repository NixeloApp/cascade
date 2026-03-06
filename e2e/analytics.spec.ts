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

    // Verify key metric cards are visible
    await expect(projectsPage.analyticsTotalIssuesMetric).toBeVisible();
    console.log("✓ Total Issues metric card visible");

    await expect(projectsPage.analyticsUnassignedMetric).toBeVisible();
    console.log("✓ Unassigned metric card visible");

    await expect(projectsPage.analyticsAvgVelocityMetric).toBeVisible();
    console.log("✓ Avg Velocity metric card visible");

    await expect(projectsPage.analyticsCompletedSprintsMetric).toBeVisible();
    console.log("✓ Completed Sprints metric card visible");
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

    // Verify chart cards are visible
    await expect(projectsPage.analyticsIssuesByStatusChart).toBeVisible();
    console.log("✓ Issues by Status chart visible");

    await expect(projectsPage.analyticsIssuesByTypeChart).toBeVisible();
    console.log("✓ Issues by Type chart visible");

    await expect(projectsPage.analyticsIssuesByPriorityChart).toBeVisible();
    console.log("✓ Issues by Priority chart visible");

    // Team Velocity chart - may need to scroll into view
    // Note: ChartCard uses Typography variant="large" which renders <p>, not a heading
    await projectsPage.analyticsTeamVelocityChart.scrollIntoViewIfNeeded();
    await expect(projectsPage.analyticsTeamVelocityChart).toBeVisible();
    console.log("✓ Team Velocity chart visible");
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
    await expect(projectsPage.createIssueModal).not.toBeVisible();
    await projectsPage.createIssue(`Analytics Test Issue 2 ${timestamp}`);
    await expect(projectsPage.createIssueModal).not.toBeVisible();
    await projectsPage.createIssue(`Analytics Test Issue 3 ${timestamp}`);
    await expect(projectsPage.createIssueModal).not.toBeVisible();
    console.log("✓ Created 3 issues");

    await projectsPage.switchToTab("analytics");

    // Find the Total Issues metric by stable test id and parse the displayed number.
    await expect(projectsPage.analyticsTotalIssuesMetric).toBeVisible();
    const valueText = (await projectsPage.analyticsTotalIssuesMetric.textContent()) ?? "";
    const issueCount = Number.parseInt(valueText.match(/\d+/)?.[0] ?? "0", 10);
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

    // Verify "No completed sprints yet" message in velocity chart
    await expect(projectsPage.analyticsNoCompletedSprintsMessage).toBeVisible();
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

    // Verify page header
    await expect(projectsPage.analyticsPageHeader).toBeVisible();
    console.log("✓ Analytics Dashboard header visible");

    // Verify page description
    await expect(projectsPage.analyticsPageDescription).toBeVisible();
    console.log("✓ Page description visible");
  });
});
