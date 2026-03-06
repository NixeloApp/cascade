import { expect, authenticatedTest as test } from "./fixtures";
import { IssueDetailPage } from "./pages";
import { createTestNamespace } from "./utils/test-helpers";
import { testUserService } from "./utils/test-user-service";

/**
 * Issue Detail Page E2E Tests
 *
 * Tests the dedicated issue detail page (direct URL navigation):
 * - Route: /$orgSlug/issues/$key
 * - Issue not found error page
 * - Direct URL navigation to issue
 * - Issue detail layout and actions
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 */

test.describe("Issue Detail Page", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
    const seedResult = await testUserService.seedTemplates();
    if (!seedResult) console.warn("WARNING: Failed to seed templates in test setup");
  });

  test("shows error page for non-existent issue", async ({ page, orgSlug }) => {
    const issueDetailPage = new IssueDetailPage(page, orgSlug);

    // Navigate directly to a non-existent issue
    await issueDetailPage.gotoIssue("FAKE-99999");
    await issueDetailPage.expectIssueNotFound();
  });

  test("can navigate directly to issue detail page via URL", async ({
    projectsPage,
    page,
    orgSlug,
  }, testInfo) => {
    // First create a project and issue
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("ISSU");
    const issueTitle = namespace.name("Direct URL Test Issue");

    await projectsPage.goto();

    // Create workspace for isolation
    await projectsPage.createWorkspace(namespace.name("Issue URL WS"));
    await projectsPage.goto();

    // Create project
    await projectsPage.createProject(namespace.name("Issue URL Project"), projectKey);

    // Create an issue
    await projectsPage.createIssue(issueTitle);

    // Switch to backlog to find the issue
    await projectsPage.switchToTab("backlog");

    const issueCard = projectsPage.getIssueCard(issueTitle);
    await expect(issueCard).toBeVisible();
    const issueKey = await projectsPage.getIssueKey(issueTitle);
    await expect(issueKey).toMatch(new RegExp(`${projectKey}-\\d+`));

    console.log(`Created issue with key: ${issueKey}`);

    // Navigate directly to the issue detail page via URL
    const issueDetailPage = new IssueDetailPage(page, orgSlug);
    await issueDetailPage.gotoIssue(issueKey);
    await issueDetailPage.expectIssueLoaded(issueKey);
  });

  test("can edit an issue from the direct issue detail page", async ({
    projectsPage,
    page,
    orgSlug,
  }, testInfo) => {
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("IUPD");
    const originalTitle = namespace.name("Direct Edit Issue");
    const updatedTitle = namespace.name("Direct Edit Updated");

    await projectsPage.goto();
    await projectsPage.createWorkspace(namespace.name("Issue Edit WS"));
    await projectsPage.goto();
    await projectsPage.createProject(namespace.name("Issue Edit Project"), projectKey);
    await projectsPage.createIssue(originalTitle);
    await projectsPage.switchToTab("backlog");

    await expect(projectsPage.getIssueCard(originalTitle)).toBeVisible();
    const issueKey = await projectsPage.getIssueKey(originalTitle);
    await expect(issueKey).toMatch(new RegExp(`${projectKey}-\\d+`));

    const issueDetailPage = new IssueDetailPage(page, orgSlug);
    await issueDetailPage.gotoIssue(issueKey);
    await issueDetailPage.expectIssueLoaded(issueKey);
    await issueDetailPage.editTitle(updatedTitle);

    await issueDetailPage.returnToProjectBoard(projectKey);

    await projectsPage.switchToTab("backlog");
    await expect(projectsPage.getIssueCard(updatedTitle)).toBeVisible();
    await expect(projectsPage.getIssueCard(originalTitle)).toHaveCount(0);
  });

  test("can edit issue description and priority from the direct issue detail page", async ({
    projectsPage,
    page,
    orgSlug,
  }, testInfo) => {
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("IMET");
    const issueTitle = namespace.name("Direct Metadata Issue");
    const updatedDescription = namespace.name("Direct metadata description");

    await projectsPage.goto();
    await projectsPage.createWorkspace(namespace.name("Issue Metadata WS"));
    await projectsPage.goto();
    await projectsPage.createProject(namespace.name("Issue Metadata Project"), projectKey);
    await projectsPage.createIssue(issueTitle);
    await projectsPage.switchToTab("backlog");

    await expect(projectsPage.getIssueCard(issueTitle)).toBeVisible();
    const issueKey = await projectsPage.getIssueKey(issueTitle);
    await expect(issueKey).toMatch(new RegExp(`${projectKey}-\\d+`));

    const issueDetailPage = new IssueDetailPage(page, orgSlug);
    await issueDetailPage.gotoIssue(issueKey);
    await issueDetailPage.expectIssueLoaded(issueKey);
    await issueDetailPage.editDescription(updatedDescription);
    await issueDetailPage.changePriority("High");

    await issueDetailPage.returnToProjectBoard(projectKey);

    await projectsPage.switchToTab("backlog");
    await projectsPage.openIssueDetail(issueTitle);
    await expect(projectsPage.issueDetailDescriptionContent).toContainText(updatedDescription);
    await expect(projectsPage.issueDetailPrioritySelect).toContainText(/high/i);
  });

  test("issue detail page has breadcrumb back to project", async ({
    projectsPage,
    page,
    orgSlug,
  }, testInfo) => {
    // Create project and issue
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("BCRM");
    const issueTitle = namespace.name("Breadcrumb Test Issue");

    await projectsPage.goto();
    await projectsPage.createWorkspace(namespace.name("Breadcrumb WS"));
    await projectsPage.goto();
    await projectsPage.createProject(namespace.name("Breadcrumb Project"), projectKey);
    await projectsPage.createIssue(issueTitle);

    // Switch to backlog to find the issue
    await projectsPage.switchToTab("backlog");

    const issueCard = projectsPage.getIssueCard(issueTitle);
    await expect(issueCard).toBeVisible();
    const issueKey = await projectsPage.getIssueKey(issueTitle);
    await expect(issueKey).toMatch(new RegExp(`${projectKey}-\\d+`));

    // Navigate to issue detail page
    const issueDetailPage = new IssueDetailPage(page, orgSlug);
    await issueDetailPage.gotoIssue(issueKey);

    // Should have breadcrumb link back to project
    await issueDetailPage.expectProjectBreadcrumbVisible(projectKey);

    // Click breadcrumb should navigate back to project board
    await issueDetailPage.returnToProjectBoard(projectKey);
  });
});
