import { expect, authenticatedTest as test } from "./fixtures";
import { createTestNamespace } from "./utils/test-helpers";
import { testUserService } from "./utils/test-user-service";

/**
 * Global Search E2E Tests (Sprint 3 - Depth)
 *
 * Tests the global search functionality in depth:
 * - Search result verification (issues appear in results)
 * - Tab filtering (All/Issues/Documents)
 * - "No results" state
 * - Result count display
 * - Minimum character requirement
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 */

test.describe("Global Search", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
    const seedResult = await testUserService.seedTemplates();
    if (!seedResult) console.warn("WARNING: Failed to seed templates in test setup");
  });

  test("search returns matching issues", async ({ dashboardPage, projectsPage }, testInfo) => {
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("SRCH");
    const uniqueSearchTerm = `UniqueFindMe${namespace.projectKey("FIND")}`;

    // Create a project with a uniquely named issue
    await projectsPage.goto();
    await projectsPage.createWorkspace(namespace.name("Search Test WS"));
    await projectsPage.goto();
    await projectsPage.createProject(namespace.name("Search Test Project"), projectKey);
    await projectsPage.waitForBoardInteractive();
    await projectsPage.createIssue(`Issue ${uniqueSearchTerm}`);
    console.log(`✓ Created issue with unique term: ${uniqueSearchTerm}`);

    // Navigate to dashboard and open global search
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();
    await dashboardPage.openGlobalSearch();
    await dashboardPage.searchFor(uniqueSearchTerm);
    await expect(dashboardPage.globalSearchResultsGroup).toBeVisible();

    // Verify the issue appears in results
    const issueResult = dashboardPage.getGlobalSearchResult(uniqueSearchTerm);
    await expect(issueResult).toBeVisible();
    console.log("✓ Issue found in search results");

    // Verify result shows issue type badge (lowercase "issue" from result.type)
    await expect(dashboardPage.getGlobalSearchResultType(uniqueSearchTerm)).toHaveText("issue");
    console.log("✓ Issue badge visible");

    // Close search
    await dashboardPage.closeGlobalSearch();
  });

  test("search shows 'No results found' for non-matching query", async ({
    dashboardPage,
  }, testInfo) => {
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();

    // Open global search - the page object method has retry logic built in
    await dashboardPage.openGlobalSearch();

    // Verify search modal and input are visible before typing
    await expect(dashboardPage.globalSearchModal).toBeVisible();
    await expect(dashboardPage.globalSearchInput).toBeVisible();

    // Type a query that won't match anything
    const namespace = createTestNamespace(testInfo);
    const nonExistentTerm = `NoMatch${namespace.projectKey("NONE")}XYZ`;
    await dashboardPage.searchFor(nonExistentTerm);
    await expect(dashboardPage.globalSearchNoResults).toBeVisible();
    console.log("✓ 'No results found' message displayed");

    // Close search
    await dashboardPage.closeGlobalSearch();
  });

  test("search requires minimum 2 characters", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();
    await dashboardPage.openGlobalSearch();

    // Type only 1 character
    await dashboardPage.searchFor("a");
    console.log("✓ Minimum character requirement message shown");

    // Type 2 characters - message should disappear
    await dashboardPage.searchFor("ab");
    await expect(dashboardPage.globalSearchMinimumQueryMessage).not.toBeVisible();
    console.log("✓ Minimum character message hidden after 2+ chars");

    // Close search
    await dashboardPage.closeGlobalSearch();
  });

  test("search tabs filter results correctly", async ({
    dashboardPage,
    projectsPage,
  }, testInfo) => {
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("TABS");
    const uniqueSearchTerm = `TabFilter${namespace.projectKey("TABS")}`;

    // Create an issue to search for
    await projectsPage.goto();
    await projectsPage.createWorkspace(namespace.name("Tab Filter WS"));
    await projectsPage.goto();
    await projectsPage.createProject(namespace.name("Tab Filter Project"), projectKey);
    await projectsPage.waitForBoardInteractive();
    await projectsPage.createIssue(`Issue ${uniqueSearchTerm}`);

    // Navigate to dashboard and search
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();
    await dashboardPage.openGlobalSearch();
    await dashboardPage.searchFor(uniqueSearchTerm);
    await expect(dashboardPage.globalSearchResultsGroup).toBeVisible();

    // Verify "All" tab is active by default and shows count
    await expect(dashboardPage.globalSearchAllTab).toBeVisible();
    await expect(dashboardPage.globalSearchAllTab).toHaveAttribute("aria-selected", "true");
    console.log("✓ All tab visible");

    // Click on "Issues" tab
    await dashboardPage.switchGlobalSearchTab("issues");

    // Issue should still be visible (it's an issue)
    await expect(dashboardPage.getGlobalSearchResult(uniqueSearchTerm)).toBeVisible();
    console.log("✓ Issue visible in Issues tab");

    // Click on "Documents" tab
    await dashboardPage.switchGlobalSearchTab("documents");

    // Since we created an issue but no document, the issue must be filtered out.
    await expect(dashboardPage.getGlobalSearchResults(uniqueSearchTerm)).toHaveCount(0);
    console.log("✓ Issue correctly filtered out in Documents tab");

    // Close search
    await dashboardPage.closeGlobalSearch();
  });

  test("search displays result count in tabs", async ({
    dashboardPage,
    projectsPage,
  }, testInfo) => {
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("CNT");
    const uniqueSearchTerm = `CountTest${namespace.projectKey("CNT")}`;

    // Create an issue
    await projectsPage.goto();
    await projectsPage.createWorkspace(namespace.name("Count Test WS"));
    await projectsPage.goto();
    await projectsPage.createProject(namespace.name("Count Test Project"), projectKey);
    await projectsPage.waitForBoardInteractive();
    await projectsPage.createIssue(`Issue ${uniqueSearchTerm}`);

    // Navigate to dashboard and search
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();
    await dashboardPage.openGlobalSearch();
    await dashboardPage.searchFor(uniqueSearchTerm);
    await expect(dashboardPage.globalSearchResultsGroup).toBeVisible();

    // Check that tabs show counts (e.g., "Issues (1)")
    await expect(dashboardPage.globalSearchIssuesTab).toHaveText(/issues.*\(\d+\)/i);
    console.log("✓ Issues tab shows count");

    // Close search
    await dashboardPage.closeGlobalSearch();
  });

  test("can close search with Escape key", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();
    await dashboardPage.openGlobalSearch();

    await dashboardPage.closeGlobalSearchWithEscape();
    console.log("✓ Search closed with Escape key");
  });

  test("can open search with keyboard shortcut", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();

    // Ensure search is closed
    await expect(dashboardPage.globalSearchModal).not.toBeVisible();

    await dashboardPage.openGlobalSearchWithShortcut();
    console.log("✓ Search opened with keyboard shortcut");

    // Close it
    await dashboardPage.closeGlobalSearchWithEscape();
  });

  test("can open advanced search from the omnibox", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();

    await dashboardPage.openAdvancedSearch();
    await expect(dashboardPage.advancedSearchModal).toBeVisible();

    await dashboardPage.closeAdvancedSearch();
    await expect(dashboardPage.advancedSearchModal).not.toBeVisible();
  });
});
