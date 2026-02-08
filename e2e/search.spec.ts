import { expect, authenticatedTest as test } from "./fixtures";
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

  test("search returns matching issues", async ({ dashboardPage, projectsPage, page }) => {
    const timestamp = Date.now();
    const projectKey = `SRCH${timestamp.toString().slice(-4)}`;
    const uniqueSearchTerm = `UniqueFindMe${timestamp}`;

    // Create a project with a uniquely named issue
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Search Test WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Search Test Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();
    await projectsPage.createIssue(`Issue ${uniqueSearchTerm}`);
    await expect(projectsPage.createIssueModal).not.toBeVisible();
    console.log(`✓ Created issue with unique term: ${uniqueSearchTerm}`);

    // Navigate to dashboard and open global search
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();
    await dashboardPage.openGlobalSearch();

    // Type search query and wait for results
    await dashboardPage.globalSearchInput.fill(uniqueSearchTerm);

    // Wait for search to complete (loading spinner disappears and results appear)
    const searchResults = page.locator("[cmdk-group]");
    await expect(searchResults).toBeVisible();

    // Verify the issue appears in results
    const issueResult = page.getByText(uniqueSearchTerm);
    await expect(issueResult).toBeVisible();
    console.log("✓ Issue found in search results");

    // Verify result shows issue type badge (lowercase "issue" from result.type)
    const issueItem = page.locator("[cmdk-item]").filter({ hasText: uniqueSearchTerm });
    await expect(issueItem).toBeVisible();
    // The Badge renders result.type which is "issue"
    await expect(issueItem.getByText("issue", { exact: true })).toBeVisible();
    console.log("✓ Issue badge visible");

    // Close search
    await dashboardPage.closeGlobalSearch();
  });

  test("search shows 'No results found' for non-matching query", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();

    // Open global search - the page object method has retry logic built in
    await dashboardPage.openGlobalSearch();

    // Verify search modal and input are visible before typing
    await expect(dashboardPage.globalSearchModal).toBeVisible();
    await expect(dashboardPage.globalSearchInput).toBeVisible();

    // Type a query that won't match anything
    const nonExistentTerm = `NonExistent${Date.now()}XYZ`;
    await dashboardPage.globalSearchInput.fill(nonExistentTerm);

    // Wait for loading spinner to disappear (search complete)
    const loadingSpinner = dashboardPage.globalSearchModal.locator(".animate-spin");
    await expect(loadingSpinner).not.toBeVisible();

    // Wait for "No results found" message - use text content since CommandEmpty may not render with test ID
    const noResultsMessage = dashboardPage.globalSearchModal.getByText(/no results found/i);
    await expect(noResultsMessage).toBeVisible();
    console.log("✓ 'No results found' message displayed");

    // Close search
    await dashboardPage.closeGlobalSearch();
  });

  test("search requires minimum 2 characters", async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();
    await dashboardPage.openGlobalSearch();

    // Type only 1 character
    await dashboardPage.globalSearchInput.fill("a");

    // Should show minimum character message
    const minCharMessage = page.getByText(/type at least 2 characters/i);
    await expect(minCharMessage).toBeVisible();
    console.log("✓ Minimum character requirement message shown");

    // Type 2 characters - message should disappear
    await dashboardPage.globalSearchInput.fill("ab");

    // Either results, no results, or loading should appear (not the min char message)
    await expect(minCharMessage).not.toBeVisible();
    console.log("✓ Minimum character message hidden after 2+ chars");

    // Close search
    await dashboardPage.closeGlobalSearch();
  });

  test("search tabs filter results correctly", async ({ dashboardPage, projectsPage, page }) => {
    const timestamp = Date.now();
    const projectKey = `TABS${timestamp.toString().slice(-4)}`;
    const uniqueSearchTerm = `TabFilter${timestamp}`;

    // Create an issue to search for
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Tab Filter WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Tab Filter Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();
    await projectsPage.createIssue(`Issue ${uniqueSearchTerm}`);
    await expect(projectsPage.createIssueModal).not.toBeVisible();

    // Navigate to dashboard and search
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();
    await dashboardPage.openGlobalSearch();
    await dashboardPage.globalSearchInput.fill(uniqueSearchTerm);

    // Wait for results
    const searchResults = page.locator("[cmdk-group]");
    await expect(searchResults).toBeVisible();

    // Verify "All" tab is active by default and shows count
    const allTab = page.getByRole("button", { name: /^all/i });
    await expect(allTab).toBeVisible();
    console.log("✓ All tab visible");

    // Click on "Issues" tab
    const issuesTab = page.getByRole("button", { name: /^issues/i });
    await expect(issuesTab).toBeVisible();
    await issuesTab.click();

    // Issue should still be visible (it's an issue)
    await expect(page.getByText(uniqueSearchTerm)).toBeVisible();
    console.log("✓ Issue visible in Issues tab");

    // Click on "Documents" tab
    const documentsTab = page.getByRole("button", { name: /^documents/i });
    await expect(documentsTab).toBeVisible();
    await documentsTab.click();

    // Wait for tab to switch - check if either no results or no issue visible
    // Since we created an issue but no document, either "no results" shows or our issue is filtered out
    const issueInDocTab = page.locator("[cmdk-item]").filter({ hasText: uniqueSearchTerm });
    const issueCount = await issueInDocTab.count();

    // The issue should NOT appear in Documents tab (it's not a document)
    expect(issueCount).toBe(0);
    console.log("✓ Issue correctly filtered out in Documents tab");

    // Close search
    await dashboardPage.closeGlobalSearch();
  });

  test("search displays result count in tabs", async ({ dashboardPage, projectsPage, page }) => {
    const timestamp = Date.now();
    const projectKey = `CNT${timestamp.toString().slice(-4)}`;
    const uniqueSearchTerm = `CountTest${timestamp}`;

    // Create an issue
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Count Test WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Count Test Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();
    await projectsPage.createIssue(`Issue ${uniqueSearchTerm}`);
    await expect(projectsPage.createIssueModal).not.toBeVisible();

    // Navigate to dashboard and search
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();
    await dashboardPage.openGlobalSearch();
    await dashboardPage.globalSearchInput.fill(uniqueSearchTerm);

    // Wait for results
    const searchResults = page.locator("[cmdk-group]");
    await expect(searchResults).toBeVisible();

    // Check that tabs show counts (e.g., "Issues (1)")
    // The count appears as "(N)" after the tab label
    const issuesTabWithCount = page.getByRole("button", { name: /issues.*\(\d+\)/i });
    await expect(issuesTabWithCount).toBeVisible();
    console.log("✓ Issues tab shows count");

    // Close search
    await dashboardPage.closeGlobalSearch();
  });

  test("can close search with Escape key", async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();
    await dashboardPage.openGlobalSearch();

    // Verify modal is open
    await expect(dashboardPage.globalSearchModal).toBeVisible();

    // Press Escape
    await page.keyboard.press("Escape");

    // Modal should close
    await expect(dashboardPage.globalSearchModal).not.toBeVisible();
    console.log("✓ Search closed with Escape key");
  });

  test("can open search with keyboard shortcut", async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();

    // Ensure search is closed
    await expect(dashboardPage.globalSearchModal).not.toBeVisible();

    // Press Cmd+K (or Ctrl+K on non-Mac)
    await page.keyboard.press("ControlOrMeta+k");

    // Modal should open
    await expect(dashboardPage.globalSearchModal).toBeVisible();
    console.log("✓ Search opened with keyboard shortcut");

    // Close it
    await page.keyboard.press("Escape");
  });
});
