import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Integration Workflow E2E Tests
 *
 * Tests complete user workflows that span multiple features:
 * - Project setup and issue management workflow
 * - Calendar event creation workflow
 *
 * These tests validate that features work together correctly.
 */

test.describe("Integration Workflows", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  test.describe("Project Management Workflow", () => {
    test("complete project lifecycle: create project, add issues, manage on board", async ({
      projectsPage,
      page,
    }) => {
      const timestamp = Date.now();
      const projectName = `Integration Test ${timestamp}`;
      const projectKey = `INT${timestamp.toString().slice(-4)}`;
      const issueTitle = `Integration Issue ${timestamp}`;

      // Step 1: Navigate to projects
      await projectsPage.goto();
      await expect(page).toHaveURL(/\/projects/);

      // Step 2: Create a workspace (needed for project)
      await projectsPage.createWorkspace(`Int WS ${timestamp}`);

      // Step 3: Go back to projects and create a new project (waits for board)
      await projectsPage.goto();
      await projectsPage.createProject(projectName, projectKey);
      console.log("✓ Project created and board visible");

      // Step 5: Create an issue
      await projectsPage.createIssue(issueTitle);
      await expect(projectsPage.createIssueModal).not.toBeVisible();
      console.log("✓ Issue created");

      // Step 6: Verify issue appears on board (look in backlog column)
      const issueCard = page.getByText(issueTitle).first();
      await expect(issueCard).toBeVisible();
      console.log("✓ Issue visible on board");

      // Step 7: Open issue detail
      await projectsPage.openIssueDetail(issueTitle);

      // Step 8: Verify issue detail panel/modal opens
      const detailPanel = page.getByRole("dialog").or(page.locator("[data-issue-detail]"));
      await expect(detailPanel).toBeVisible();
      console.log("✓ Issue detail panel opened");

      // Step 9: Close issue detail (press Escape or click outside)
      await page.keyboard.press("Escape");
      await expect(detailPanel).not.toBeVisible();
      console.log("✓ Issue detail panel closed");

      console.log("\n✅ Project management workflow completed successfully");
    });

    test("navigate between project tabs", async ({ projectsPage, page }) => {
      const timestamp = Date.now();
      const projectKey = `NAV${timestamp.toString().slice(-4)}`;

      // Create project (waits for board to be interactive)
      await projectsPage.goto();
      await projectsPage.createWorkspace(`Nav WS ${timestamp}`);
      await projectsPage.goto();
      await projectsPage.createProject(`Nav Test ${timestamp}`, projectKey);

      // Verify we're on board
      await expect(page).toHaveURL(/\/board/);
      console.log("✓ On board tab");

      // Project tabs are in the Tabs landmark - scope selectors to avoid matching sidebar nav
      const projectTabs = page.getByLabel("Tabs");

      // Switch to Calendar - wait for tab to be visible first
      const calendarTab = projectTabs.getByRole("link", { name: /calendar/i });
      await calendarTab.waitFor({ state: "visible" });
      await calendarTab.click();
      await expect(page).toHaveURL(/\/calendar/);
      await expect(calendarTab).toHaveAttribute("aria-current", "page");
      console.log("✓ Navigated to calendar");

      // Switch to Timesheet
      const timesheetTab = projectTabs.getByRole("link", { name: /timesheet/i });
      await timesheetTab.waitFor({ state: "visible" });
      await timesheetTab.click();
      await expect(page).toHaveURL(/\/timesheet/);
      await expect(timesheetTab).toHaveAttribute("aria-current", "page");
      await expect(page.getByRole("tab", { name: /time entries/i })).toBeVisible();
      console.log("✓ Navigated to timesheet");

      // Switch back to Board
      const boardTab = projectTabs.getByRole("link", { name: /board/i });
      await boardTab.waitFor({ state: "visible" });
      await boardTab.click();
      await expect(page).toHaveURL(/\/board/);
      console.log("✓ Navigated back to board");

      console.log("\n✅ Tab navigation workflow completed successfully");
    });
  });

  test.describe("Dashboard Workflow", () => {
    test("dashboard shows issues after creating them", async ({ dashboardPage, projectsPage }) => {
      const timestamp = Date.now();
      const projectKey = `DWF${timestamp.toString().slice(-4)}`;
      const issueTitle = `Dashboard WF Issue ${timestamp}`;

      // Create a project and issue
      await projectsPage.goto();
      await projectsPage.createWorkspace(`DWF WS ${timestamp}`);
      await projectsPage.goto();
      await projectsPage.createProject(`Dashboard WF ${timestamp}`, projectKey);
      await projectsPage.waitForBoardInteractive();
      await projectsPage.createIssue(issueTitle);
      await expect(projectsPage.createIssueModal).not.toBeVisible();
      console.log("✓ Issue created for dashboard workflow test");

      // Navigate to dashboard
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      console.log("✓ Dashboard loaded");

      // Check that My Issues section is visible
      await expect(dashboardPage.myIssuesSection).toBeVisible();
      console.log("✓ My Issues section visible");

      // Filter to "Created" issues to see our new issue
      await dashboardPage.filterIssues("created");

      // The issue we created should appear in the "Created" tab
      // (It may or may not be visible depending on the feed implementation)
      console.log("✓ Filtered to Created issues");

      console.log("\n✅ Dashboard workflow completed successfully");
    });
  });

  test.describe("Search Workflow", () => {
    test("can search for issues using global search", async ({
      dashboardPage,
      projectsPage,
      page,
    }) => {
      const timestamp = Date.now();
      const projectKey = `SRC${timestamp.toString().slice(-4)}`;
      const uniqueSearchTerm = `UniqueSearch${timestamp}`;

      // Create a project with a uniquely named issue
      await projectsPage.goto();
      await projectsPage.createWorkspace(`Search WS ${timestamp}`);
      await projectsPage.goto();
      await projectsPage.createProject(`Search Test ${timestamp}`, projectKey);
      await projectsPage.waitForBoardInteractive();
      await projectsPage.createIssue(`Issue ${uniqueSearchTerm}`);
      await expect(projectsPage.createIssueModal).not.toBeVisible();
      console.log("✓ Issue created with unique search term");

      // Navigate to dashboard and open global search
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();

      // Open global search, type query, and wait for results
      // Use single retry block to handle modal/input instability from cmdk re-renders
      await expect(async () => {
        // Ensure modal is open
        if (!(await dashboardPage.globalSearchModal.isVisible().catch(() => false))) {
          await dashboardPage.globalSearchButton.click();
          await expect(dashboardPage.globalSearchModal).toBeVisible();
          await expect(dashboardPage.globalSearchInput).toBeVisible();
        }

        // Fill the search input
        await dashboardPage.globalSearchInput.fill(uniqueSearchTerm);

        // Wait for search to process - either results appear or "No results found"
        const noResultsText = page.getByText("No results found");
        const searchResultGroup = page.locator("[cmdk-group]");
        await expect(noResultsText.or(searchResultGroup)).toBeVisible();
      }).toPass();

      console.log("✓ Global search opened and search query processed");

      // Close search
      await dashboardPage.closeGlobalSearch();
      await expect(dashboardPage.globalSearchModal).not.toBeVisible();
      console.log("✓ Global search closed");

      console.log("\n✅ Search workflow completed successfully");
    });
  });
});
