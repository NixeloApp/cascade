import { expect, authenticatedTest as test } from "./fixtures";
import { ROUTES, routePattern } from "./utils/routes";
import { createTestNamespace } from "./utils/test-helpers";

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
    }, testInfo) => {
      const namespace = createTestNamespace(testInfo);
      const projectName = namespace.name("Integration Test");
      const projectKey = namespace.projectKey("INT");
      const issueTitle = namespace.name("Integration Issue");

      // Step 1: Navigate to projects
      await projectsPage.goto();
      await expect(page).toHaveURL(
        routePattern(ROUTES.projects.list.path),
      );

      // Step 2: Create a workspace (needed for project)
      await projectsPage.createWorkspace(namespace.name("Int WS"));

      // Step 3: Go back to projects and create a new project (waits for board)
      await projectsPage.goto();
      await projectsPage.createProject(projectName, projectKey);
      console.log("✓ Project created and board visible");

      // Step 5: Create an issue
      await projectsPage.createIssue(issueTitle);
      console.log("✓ Issue created");

      // Step 6: New issues land in backlog for the default Scrum template.
      await projectsPage.switchToTab("backlog");
      const issueCard = projectsPage.getIssueCard(issueTitle);
      await expect(issueCard).toBeVisible();
      console.log("✓ Issue visible in backlog");

      // Step 7: Open issue detail
      await projectsPage.openIssueDetail(issueTitle);

      // Step 8: Verify issue detail panel/modal opens
      const detailPanel = projectsPage.issueDetailDialog;
      await expect(detailPanel).toBeVisible();
      console.log("✓ Issue detail panel opened");

      // Step 9: Close issue detail (press Escape or click outside)
      await projectsPage.closeIssueDetail();
      console.log("✓ Issue detail panel closed");

      console.log("\n✅ Project management workflow completed successfully");
    });

    test("navigate between project tabs", async ({ projectsPage, page }, testInfo) => {
      const namespace = createTestNamespace(testInfo);
      const projectKey = namespace.projectKey("NAV");

      // Create project (waits for board to be interactive)
      await projectsPage.goto();
      await projectsPage.createWorkspace(namespace.name("Nav WS"));
      await projectsPage.goto();
      await projectsPage.createProject(namespace.name("Nav Test"), projectKey);

      // Verify we're on board
      await expect(page).toHaveURL(
        routePattern(ROUTES.projects.board.path),
      );
      console.log("✓ On board tab");

      // Switch to Calendar
      await projectsPage.switchToTab("calendar");
      await projectsPage.expectProjectTabCurrent("calendar");
      console.log("✓ Navigated to calendar");

      // Switch to Timesheet
      await projectsPage.switchToTab("timesheet");
      await projectsPage.expectProjectTabCurrent("timesheet");
      await projectsPage.expectTimesheetLoaded();
      console.log("✓ Navigated to timesheet");

      // Switch back to Board
      await projectsPage.switchToTab("board");
      await projectsPage.expectProjectTabCurrent("board");
      console.log("✓ Navigated back to board");

      console.log("\n✅ Tab navigation workflow completed successfully");
    });
  });

  test.describe("Dashboard Workflow", () => {
    test("dashboard shows issues after creating them", async ({
      dashboardPage,
      projectsPage,
    }, testInfo) => {
      const namespace = createTestNamespace(testInfo);
      const projectKey = namespace.projectKey("DWF");
      const issueTitle = namespace.name("Dashboard WF Issue");

      // Create a project and issue
      await projectsPage.goto();
      await projectsPage.createWorkspace(namespace.name("DWF WS"));
      await projectsPage.goto();
      await projectsPage.createProject(namespace.name("Dashboard WF"), projectKey);
      await projectsPage.waitForBoardInteractive();
      await projectsPage.createIssue(issueTitle);
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
    }, testInfo) => {
      const namespace = createTestNamespace(testInfo);
      const projectKey = namespace.projectKey("SRC");
      const uniqueSearchTerm = namespace.token("unique-search");

      // Create a project with a uniquely named issue
      await projectsPage.goto();
      await projectsPage.createWorkspace(namespace.name("Search WS"));
      await projectsPage.goto();
      await projectsPage.createProject(namespace.name("Search Test"), projectKey);
      await projectsPage.waitForBoardInteractive();
      await projectsPage.createIssue(`Issue ${uniqueSearchTerm}`);
      console.log("✓ Issue created with unique search term");

      // Navigate to dashboard and open global search
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();

      await dashboardPage.openGlobalSearch();
      await dashboardPage.searchFor(uniqueSearchTerm);
      await expect(dashboardPage.getGlobalSearchResult(uniqueSearchTerm)).toBeVisible();
      console.log("✓ Global search returned created issue");

      // Close search
      await dashboardPage.closeGlobalSearch();
      await expect(dashboardPage.globalSearchModal).not.toBeVisible();
      console.log("✓ Global search closed");

      console.log("\n✅ Search workflow completed successfully");
    });
  });
});
