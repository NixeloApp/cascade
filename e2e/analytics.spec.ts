import { TEST_IDS } from "../src/lib/test-ids";
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

  test("analytics page displays key metrics", async ({ projectsPage, page }) => {
    const timestamp = Date.now();
    const projectKey = `ANLM${timestamp.toString().slice(-4)}`;

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Analytics Metrics WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Analytics Metrics Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    // Navigate to analytics tab
    const projectTabs = page.getByLabel("Tabs");
    const analyticsTab = projectTabs.getByRole("link", { name: /analytics/i });
    await expect(analyticsTab).toBeVisible();
    await analyticsTab.click();
    await expect(page).toHaveURL(/\/analytics/);
    console.log("✓ Navigated to analytics page");

    // Wait for loading to complete — target the analytics heading instead of generic skeleton class
    await expect(page.getByRole("heading", { name: /analytics dashboard/i })).toBeVisible();

    // Verify key metric cards are visible
    const totalIssuesCard = page.getByText("Total Issues");
    await expect(totalIssuesCard).toBeVisible();
    console.log("✓ Total Issues metric card visible");

    const unassignedCard = page.getByText("Unassigned");
    await expect(unassignedCard).toBeVisible();
    console.log("✓ Unassigned metric card visible");

    const avgVelocityCard = page.getByText("Avg Velocity");
    await expect(avgVelocityCard).toBeVisible();
    console.log("✓ Avg Velocity metric card visible");

    // Use test ID to avoid matching both the metric card label AND "No completed sprints yet" text
    const completedSprintsCard = page.getByTestId(TEST_IDS.ANALYTICS.METRIC_COMPLETED_SPRINTS);
    await expect(completedSprintsCard).toBeVisible();
    console.log("✓ Completed Sprints metric card visible");
  });

  test("analytics page displays chart sections", async ({ projectsPage, page }) => {
    const timestamp = Date.now();
    const projectKey = `ANLC${timestamp.toString().slice(-4)}`;

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Analytics Charts WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Analytics Charts Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    // Navigate to analytics - use force click for links
    const projectTabs = page.getByLabel("Tabs");
    const analyticsTab = projectTabs.getByRole("link", { name: /analytics/i });
    await expect(analyticsTab).toBeVisible();
    await analyticsTab.click();
    await expect(page).toHaveURL(/\/analytics/);

    // Wait for loading to complete — target analytics heading instead of generic skeleton class
    await expect(page.getByRole("heading", { name: /analytics dashboard/i })).toBeVisible();

    // Verify chart cards are visible
    const statusChart = page.getByText("Issues by Status");
    await expect(statusChart).toBeVisible();
    console.log("✓ Issues by Status chart visible");

    const typeChart = page.getByText("Issues by Type");
    await expect(typeChart).toBeVisible();
    console.log("✓ Issues by Type chart visible");

    const priorityChart = page.getByText("Issues by Priority");
    await expect(priorityChart).toBeVisible();
    console.log("✓ Issues by Priority chart visible");

    // Team Velocity chart - may need to scroll into view
    // Note: ChartCard uses Typography variant="large" which renders <p>, not a heading
    const velocityChart = page.getByText("Team Velocity (Last 10 Sprints)");
    await velocityChart.scrollIntoViewIfNeeded();
    await expect(velocityChart).toBeVisible();
    console.log("✓ Team Velocity chart visible");
  });

  test("analytics shows correct issue count after creating issues", async ({
    projectsPage,
    page,
  }) => {
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

    // Navigate to analytics
    const projectTabs = page.getByLabel("Tabs");
    const analyticsTab = projectTabs.getByRole("link", { name: /analytics/i });
    await analyticsTab.click();
    await expect(page).toHaveURL(/\/analytics/);

    // Wait for loading to complete — target analytics heading instead of generic skeleton class
    await expect(page.getByRole("heading", { name: /analytics dashboard/i })).toBeVisible();

    // Find the Total Issues metric card and verify count is at least 3
    // The card shows a number value next to "Total Issues"
    const totalIssuesCard = page.locator("text=Total Issues").locator("..").locator("..");
    const totalIssuesValue = totalIssuesCard.locator("text=/\\d+/").first();
    await expect(totalIssuesValue).toBeVisible();

    // Get the text and verify it's >= 3
    const valueText = await totalIssuesValue.textContent();
    const issueCount = Number.parseInt(valueText || "0", 10);
    expect(issueCount).toBeGreaterThanOrEqual(3);
    console.log(`✓ Total Issues count (${issueCount}) reflects created issues`);
  });

  test("analytics shows 'No completed sprints yet' when no sprints completed", async ({
    projectsPage,
    page,
  }) => {
    const timestamp = Date.now();
    const projectKey = `ANLS${timestamp.toString().slice(-4)}`;

    // Create a fresh project (no sprints)
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Analytics Sprints WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Analytics Sprints Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    // Navigate to analytics
    const projectTabs = page.getByLabel("Tabs");
    const analyticsTab = projectTabs.getByRole("link", { name: /analytics/i });
    await analyticsTab.click();
    await expect(page).toHaveURL(/\/analytics/);

    // Wait for loading to complete — target analytics heading instead of generic skeleton class
    await expect(page.getByRole("heading", { name: /analytics dashboard/i })).toBeVisible();

    // Verify "No completed sprints yet" message in velocity chart
    const noSprintsMessage = page.getByText("No completed sprints yet");
    await expect(noSprintsMessage).toBeVisible();
    console.log("✓ 'No completed sprints yet' message displayed");
  });

  test("analytics page header and description are visible", async ({ projectsPage, page }) => {
    const timestamp = Date.now();
    const projectKey = `ANLH${timestamp.toString().slice(-4)}`;

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Analytics Header WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Analytics Header Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    // Navigate to analytics
    const projectTabs = page.getByLabel("Tabs");
    const analyticsTab = projectTabs.getByRole("link", { name: /analytics/i });
    await analyticsTab.click();
    await expect(page).toHaveURL(/\/analytics/);

    // Wait for loading to complete — target analytics heading instead of generic skeleton class
    await expect(page.getByRole("heading", { name: /analytics dashboard/i })).toBeVisible();

    // Verify page header
    const pageHeader = page.getByRole("heading", { name: /analytics dashboard/i });
    await expect(pageHeader).toBeVisible();
    console.log("✓ Analytics Dashboard header visible");

    // Verify page description
    const pageDescription = page.getByText(/project insights.*velocity.*metrics/i);
    await expect(pageDescription).toBeVisible();
    console.log("✓ Page description visible");
  });
});
