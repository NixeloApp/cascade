import { expect, authenticatedTest as test } from "./fixtures";
import { testUserService } from "./utils/test-user-service";

/**
 * Issues E2E Tests
 *
 * Tests the issue management functionality:
 * - Issue creation
 * - Issue detail view
 * - Issue updates
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 * Convex uses single-use refresh tokens - when Test 1 refreshes tokens,
 * Test 2 loading stale tokens from file will fail.
 */

test.describe("Issues", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });

  // Re-authenticate if tokens were invalidated
  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
    // Ensure templates are seeded for project creation tests
    const seedResult = await testUserService.seedTemplates();
    if (!seedResult) console.warn("WARNING: Failed to seed templates in test setup");
  });

  test.describe("Issue Creation", () => {
    test("can create an issue from board view", async ({ dashboardPage, projectsPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      // Create project first
      const uniqueId = Date.now().toString();
      const projectKey = `PROJ${uniqueId.slice(-4)}`;
      const issueTitle = "Test Issue";

      // Use direct URL navigation to projects page to access Create Project functionality
      await projectsPage.goto();

      // Create a unique workspace for this test run to avoid dependency on global state
      // which might be cleared by other tests (e.g., cleanup-workspaces)
      await projectsPage.createWorkspace(`WS ${uniqueId}`);

      // Go back to projects page as createWorkspace navigates away
      await projectsPage.goto();

      // Create a project (waits for board to be interactive)
      await projectsPage.createProject(`Project ${uniqueId}`, projectKey);

      // Create an issue
      await projectsPage.createIssue(issueTitle);

      // For Scrum projects (default template), new issues go to Backlog
      // Switch to Backlog tab to verify
      await projectsPage.switchToTab("backlog");

      // Verify issue appears in backlog
      const issueCard = projectsPage.getIssueCard(issueTitle);
      await expect(issueCard).toBeVisible();
    });
  });

  test.describe("Issue Detail", () => {
    test("can open issue detail dialog", async ({ projectsPage }) => {
      // Create project first
      const uniqueId = Date.now().toString();
      const projectKey = `PROJ${uniqueId.slice(-4)}`;
      const issueTitle = "Detail Test Issue";

      // Navigate to projects page
      await projectsPage.goto();

      // Create a unique workspace for this test to ensure isolation
      await projectsPage.createWorkspace(`Detail WS ${uniqueId}`);

      // Go back to projects page after workspace creation
      await projectsPage.goto();

      // Create a project (waits for board to be interactive)
      await projectsPage.createProject(`Project ${uniqueId}`, projectKey);

      // Create an issue
      await projectsPage.createIssue(issueTitle);

      // For Scrum projects (default template), new issues go to Backlog
      // Switch to Backlog tab to find the issue
      await projectsPage.switchToTab("backlog");

      // Open detail dialog
      await projectsPage.openIssueDetail(issueTitle);

      // Verify dialog visible
      await expect(projectsPage.issueDetailDialog).toBeVisible();
    });

    test("can edit an issue title from the detail dialog", async ({ page, projectsPage }) => {
      const uniqueId = Date.now().toString();
      const projectKey = `EDIT${uniqueId.slice(-4)}`;
      const originalTitle = `Editable Issue ${uniqueId}`;
      const updatedTitle = `Updated Issue ${uniqueId}`;

      await projectsPage.goto();
      await projectsPage.createWorkspace(`Edit WS ${uniqueId}`);
      await projectsPage.goto();
      await projectsPage.createProject(`Project ${uniqueId}`, projectKey);

      await projectsPage.createIssue(originalTitle);
      await projectsPage.switchToTab("backlog");
      await projectsPage.openIssueDetail(originalTitle);

      await projectsPage.editIssueTitle(updatedTitle);

      await page.keyboard.press("Escape");
      await expect(projectsPage.issueDetailDialog).not.toBeVisible();

      await expect(projectsPage.getIssueCard(updatedTitle)).toBeVisible();
      await expect(projectsPage.getIssueCard(originalTitle)).toHaveCount(0);
    });

    test("issue detail shows timer controls", async ({ projectsPage }) => {
      // Create project first
      const uniqueId = Date.now().toString();
      const projectKey = `PROJ${uniqueId.slice(-4)}`;
      const issueTitle = "Timer Test Issue";

      // Navigate to projects page
      await projectsPage.goto();

      // Create a unique workspace for this test to ensure isolation
      await projectsPage.createWorkspace(`Timer WS ${uniqueId}`);

      // Go back to projects page after workspace creation
      await projectsPage.goto();

      // Create a project (waits for board to be interactive)
      await projectsPage.createProject(`Project ${uniqueId}`, projectKey);

      // Create an issue
      await projectsPage.createIssue(issueTitle);

      // For Scrum projects (default template), new issues go to Backlog
      // Switch to Backlog tab to find the issue
      await projectsPage.switchToTab("backlog");

      // Open detail dialog
      await projectsPage.openIssueDetail(issueTitle);

      // Verify timer controls
      await expect(projectsPage.startTimerButton).toBeVisible();
    });
  });
});
