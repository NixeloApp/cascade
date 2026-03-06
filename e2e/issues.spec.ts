import { expect, authenticatedTest as test } from "./fixtures";
import { createTestNamespace } from "./utils/test-helpers";
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
    test("can reopen project creation dialog after canceling", async ({
      projectsPage,
    }, testInfo) => {
      const namespace = createTestNamespace(testInfo);

      await projectsPage.goto();
      await projectsPage.createWorkspace(namespace.name("Project Modal WS"));
      await projectsPage.goto();

      await projectsPage.openCreateProjectForm();
      await projectsPage.cancelCreateProject();
      await expect(projectsPage.createProjectForm).not.toBeVisible();

      // Verify dialog can be reopened after canceling
      await projectsPage.openCreateProjectForm();
      await expect(projectsPage.createProjectForm).toBeVisible();
      await projectsPage.cancelCreateProject();
    });

    test("can create an issue from board view", async ({
      dashboardPage,
      projectsPage,
    }, testInfo) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      // Create project first
      const namespace = createTestNamespace(testInfo);
      const projectKey = namespace.projectKey("PROJ");
      const issueTitle = namespace.name("Test Issue");

      // Use direct URL navigation to projects page to access Create Project functionality
      await projectsPage.goto();

      // Create a unique workspace for this test run to avoid dependency on global state
      // which might be cleared by other tests (e.g., cleanup-workspaces)
      await projectsPage.createWorkspace(namespace.name("WS"));

      // Go back to projects page as createWorkspace navigates away
      await projectsPage.goto();

      // Create a project (waits for board to be interactive)
      await projectsPage.createProject(namespace.name("Project"), projectKey);

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
    test("can open issue detail dialog", async ({ projectsPage }, testInfo) => {
      // Create project first
      const namespace = createTestNamespace(testInfo);
      const projectKey = namespace.projectKey("PROJ");
      const issueTitle = namespace.name("Detail Test Issue");

      // Navigate to projects page
      await projectsPage.goto();

      // Create a unique workspace for this test to ensure isolation
      await projectsPage.createWorkspace(namespace.name("Detail WS"));

      // Go back to projects page after workspace creation
      await projectsPage.goto();

      // Create a project (waits for board to be interactive)
      await projectsPage.createProject(namespace.name("Project"), projectKey);

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

    test("can edit an issue title from the detail dialog", async ({ projectsPage }, testInfo) => {
      const namespace = createTestNamespace(testInfo);
      const projectKey = namespace.projectKey("EDIT");
      const originalTitle = namespace.name("Editable Issue");
      const updatedTitle = namespace.name("Updated Issue");

      await projectsPage.goto();
      await projectsPage.createWorkspace(namespace.name("Edit WS"));
      await projectsPage.goto();
      await projectsPage.createProject(namespace.name("Project"), projectKey);

      await projectsPage.createIssue(originalTitle);
      await projectsPage.switchToTab("backlog");
      await projectsPage.openIssueDetail(originalTitle);

      await projectsPage.editIssueTitle(updatedTitle);

      await projectsPage.closeIssueDetail();

      await expect(projectsPage.getIssueCard(updatedTitle)).toBeVisible();
      await expect(projectsPage.getIssueCard(originalTitle)).toHaveCount(0);
    });

    test("can edit issue description and priority from the detail dialog", async ({
      projectsPage,
    }, testInfo) => {
      const namespace = createTestNamespace(testInfo);
      const projectKey = namespace.projectKey("META");
      const issueTitle = namespace.name("Metadata Issue");
      const updatedDescription = namespace.name("Updated issue description");

      await projectsPage.goto();
      await projectsPage.createWorkspace(namespace.name("Metadata WS"));
      await projectsPage.goto();
      await projectsPage.createProject(namespace.name("Project"), projectKey);

      await projectsPage.createIssue(issueTitle);
      await projectsPage.switchToTab("backlog");
      await projectsPage.openIssueDetail(issueTitle);

      await projectsPage.editIssueDescription(updatedDescription);
      await projectsPage.changeIssuePriority("High");

      await projectsPage.closeIssueDetail();

      await projectsPage.openIssueDetail(issueTitle);
      await expect(projectsPage.issueDetailDescriptionContent).toContainText(updatedDescription);
      await expect(projectsPage.issueDetailPrioritySelect).toContainText(/high/i);
    });

    test("issue detail shows timer controls", async ({ projectsPage }, testInfo) => {
      // Create project first
      const namespace = createTestNamespace(testInfo);
      const projectKey = namespace.projectKey("PROJ");
      const issueTitle = namespace.name("Timer Test Issue");

      // Navigate to projects page
      await projectsPage.goto();

      // Create a unique workspace for this test to ensure isolation
      await projectsPage.createWorkspace(namespace.name("Timer WS"));

      // Go back to projects page after workspace creation
      await projectsPage.goto();

      // Create a project (waits for board to be interactive)
      await projectsPage.createProject(namespace.name("Project"), projectKey);

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
