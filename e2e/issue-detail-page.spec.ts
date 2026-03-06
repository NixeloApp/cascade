import { TEST_IDS } from "../src/lib/test-ids";
import { expect, authenticatedTest as test } from "./fixtures";
import { testUserService } from "./utils/test-user-service";
import { waitForIssueUpdateSuccess } from "./utils/wait-helpers";

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
    // Navigate directly to a non-existent issue
    await page.goto(`/${orgSlug}/issues/FAKE-99999`);

    // Should show error page
    await expect(page.getByRole("heading", { name: /issue not found/i })).toBeVisible();

    // Should have explanation message
    await expect(page.getByText(/does not exist|don't have access/i)).toBeVisible();

    // Should have "Back to dashboard" button
    await expect(page.getByRole("link", { name: /back to dashboard/i })).toBeVisible();
  });

  test("can navigate directly to issue detail page via URL", async ({
    projectsPage,
    page,
    orgSlug,
  }) => {
    // First create a project and issue
    const uniqueId = Date.now().toString();
    const projectKey = `ISSU${uniqueId.slice(-4)}`;
    const issueTitle = "Direct URL Test Issue";

    await projectsPage.goto();

    // Create workspace for isolation
    await projectsPage.createWorkspace(`Issue URL WS ${uniqueId}`);
    await projectsPage.goto();

    // Create project
    await projectsPage.createProject(`Issue URL Project ${uniqueId}`, projectKey);

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
    await page.goto(`/${orgSlug}/issues/${issueKey}`);

    // Should show the issue detail layout
    // Look for issue key in the header
    await expect(page.getByText(issueKey)).toBeVisible();

    // Should have "Edit Issue" button
    await expect(page.getByRole("button", { name: /edit issue/i })).toBeVisible();
  });

  test("can edit an issue from the direct issue detail page", async ({
    projectsPage,
    page,
    orgSlug,
  }) => {
    const uniqueId = Date.now().toString();
    const projectKey = `IUPD${uniqueId.slice(-4)}`;
    const originalTitle = `Direct Edit Issue ${uniqueId}`;
    const updatedTitle = `Direct Edit Updated ${uniqueId}`;

    await projectsPage.goto();
    await projectsPage.createWorkspace(`Issue Edit WS ${uniqueId}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Issue Edit Project ${uniqueId}`, projectKey);
    await projectsPage.createIssue(originalTitle);
    await projectsPage.switchToTab("backlog");

    await expect(projectsPage.getIssueCard(originalTitle)).toBeVisible();
    const issueKey = await projectsPage.getIssueKey(originalTitle);
    await expect(issueKey).toMatch(new RegExp(`${projectKey}-\\d+`));

    await page.goto(`/${orgSlug}/issues/${issueKey}`);

    const editIssueButton = page.getByRole("button", { name: /edit issue/i });
    await expect(editIssueButton).toBeVisible();

    const issueTitleInput = page.getByPlaceholder("Issue title");
    const saveChangesButton = page.getByRole("button", { name: /save changes/i });

    await expect(async () => {
      if (!(await issueTitleInput.isVisible().catch(() => false))) {
        await editIssueButton.click();
      }

      await expect(issueTitleInput).toBeVisible();
      await issueTitleInput.fill(updatedTitle);
      await expect(issueTitleInput).toHaveValue(updatedTitle);
      await expect(saveChangesButton).toBeVisible();
      await saveChangesButton.click();
      await expect(issueTitleInput).not.toBeVisible();
      await expect(editIssueButton).toBeVisible();
    }).toPass({ timeout: 20000, intervals: [1000] });

    await page.getByRole("link", { name: new RegExp(projectKey, "i") }).click();
    await expect(page).toHaveURL(/\/projects\/.*\/board/);

    await projectsPage.switchToTab("backlog");
    await expect(projectsPage.getIssueCard(updatedTitle)).toBeVisible();
    await expect(projectsPage.getIssueCard(originalTitle)).toHaveCount(0);
  });

  test("can edit issue description and priority from the direct issue detail page", async ({
    projectsPage,
    page,
    orgSlug,
  }) => {
    const uniqueId = Date.now().toString();
    const projectKey = `IMET${uniqueId.slice(-4)}`;
    const issueTitle = `Direct Metadata Issue ${uniqueId}`;
    const updatedDescription = `Direct metadata description ${uniqueId}`;

    await projectsPage.goto();
    await projectsPage.createWorkspace(`Issue Metadata WS ${uniqueId}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Issue Metadata Project ${uniqueId}`, projectKey);
    await projectsPage.createIssue(issueTitle);
    await projectsPage.switchToTab("backlog");

    await expect(projectsPage.getIssueCard(issueTitle)).toBeVisible();
    const issueKey = await projectsPage.getIssueKey(issueTitle);
    await expect(issueKey).toMatch(new RegExp(`${projectKey}-\\d+`));

    await page.goto(`/${orgSlug}/issues/${issueKey}`);

    const editIssueButton = page.getByRole("button", { name: /edit issue/i });
    const issueDescriptionEditor = page.getByTestId(TEST_IDS.ISSUE.DESCRIPTION_EDITOR);
    const issueDescriptionContent = page.getByTestId(TEST_IDS.ISSUE.DESCRIPTION_CONTENT);
    const saveChangesButton = page.getByRole("button", { name: /save changes/i });
    const prioritySelect = page.getByLabel("Change priority");

    await expect(async () => {
      if (!(await issueDescriptionEditor.isVisible().catch(() => false))) {
        await editIssueButton.click();
      }

      await expect(issueDescriptionEditor).toBeVisible();
      await issueDescriptionEditor.fill(updatedDescription);
      await expect(saveChangesButton).toBeVisible();
      await saveChangesButton.click();
      await expect(issueDescriptionEditor).not.toBeVisible();
      await expect(editIssueButton).toBeVisible();
    }).toPass({ timeout: 20000, intervals: [1000] });

    await waitForIssueUpdateSuccess(page);
    await expect(issueDescriptionContent).toContainText(updatedDescription);

    await prioritySelect.click();
    const highOption = page.getByRole("option", { name: /^High$/i });
    await expect(highOption).toBeVisible();
    await highOption.click();

    await expect(prioritySelect).toContainText(/high/i);
    await waitForIssueUpdateSuccess(page);

    await page.getByRole("link", { name: new RegExp(projectKey, "i") }).click();
    await expect(page).toHaveURL(/\/projects\/.*\/board/);

    await projectsPage.switchToTab("backlog");
    await projectsPage.openIssueDetail(issueTitle);
    await expect(projectsPage.issueDetailDescriptionContent).toContainText(updatedDescription);
    await expect(projectsPage.issueDetailPrioritySelect).toContainText(/high/i);
  });

  test("issue detail page has breadcrumb back to project", async ({
    projectsPage,
    page,
    orgSlug,
  }) => {
    // Create project and issue
    const uniqueId = Date.now().toString();
    const projectKey = `BCRM${uniqueId.slice(-4)}`;
    const issueTitle = "Breadcrumb Test Issue";

    await projectsPage.goto();
    await projectsPage.createWorkspace(`Breadcrumb WS ${uniqueId}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Breadcrumb Project ${uniqueId}`, projectKey);
    await projectsPage.createIssue(issueTitle);

    // Switch to backlog to find the issue
    await projectsPage.switchToTab("backlog");

    const issueCard = projectsPage.getIssueCard(issueTitle);
    await expect(issueCard).toBeVisible();
    const issueKey = await projectsPage.getIssueKey(issueTitle);
    await expect(issueKey).toMatch(new RegExp(`${projectKey}-\\d+`));

    // Navigate to issue detail page
    await page.goto(`/${orgSlug}/issues/${issueKey}`);

    // Should have breadcrumb link back to project
    const breadcrumbLink = page.getByRole("link", { name: new RegExp(projectKey, "i") });
    await expect(breadcrumbLink).toBeVisible();

    // Click breadcrumb should navigate back to project board
    await breadcrumbLink.click();
    await expect(page).toHaveURL(/\/projects\/.*\/board/);
  });
});
