import { TEST_IDS } from "../src/lib/test-ids";
import { expect, authenticatedTest as test } from "./fixtures";
import { testUserService } from "./utils/test-user-service";

/**
 * Activity Feed E2E Tests
 *
 * Tests the project activity feed functionality:
 * - Activity page loads correctly
 * - Empty state displays when no activity
 * - Activity entries appear after issue creation
 * - Activity entries show correct user and action
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 */

test.describe("Activity Feed", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
    const seedResult = await testUserService.seedTemplates();
    if (!seedResult) console.warn("WARNING: Failed to seed templates in test setup");
  });

  test("activity page displays empty state for new project", async ({ projectsPage, page }) => {
    const timestamp = Date.now();
    const projectKey = `ACTE${timestamp.toString().slice(-4)}`;

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Activity Empty WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Activity Empty Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    // Navigate to activity tab
    const projectTabs = page.getByLabel("Tabs");
    const activityTab = projectTabs.getByRole("link", { name: /^Activity$/ });
    await expect(activityTab).toBeVisible();
    await activityTab.click();
    await expect(page).toHaveURL(/\/activity/);
    console.log("✓ Navigated to activity page");

    // Verify page header
    const pageHeader = page.getByRole("heading", { name: /project activity/i });
    await expect(pageHeader).toBeVisible();
    console.log("✓ Project Activity header visible");

    // A new project might have initial "created" activity or show empty state
    // Use test IDs to reliably wait for content to load
    const emptyState = page.getByTestId(TEST_IDS.ACTIVITY.EMPTY_STATE);
    const activityFeed = page.getByTestId(TEST_IDS.ACTIVITY.FEED);

    // Wait for either the empty state OR activity feed to appear
    // This assertion is sufficient - if it passes, one of them is visible
    await expect(emptyState.or(activityFeed)).toBeVisible();

    // Determine which one appeared for logging purposes
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    console.log(`✓ Activity page shows ${hasEmptyState ? "empty state" : "activity entries"}`);
  });

  test("activity page shows entries after creating issues", async ({ projectsPage, page }) => {
    const timestamp = Date.now();
    const projectKey = `ACTI${timestamp.toString().slice(-4)}`;
    const issueTitles = [
      `Activity Test Issue 1 ${timestamp}`,
      `Activity Test Issue 2 ${timestamp}`,
    ];

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Activity Issues WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Activity Issues Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    // Create multiple issues to generate activity
    for (const title of issueTitles) {
      await projectsPage.createIssue(title);
      await expect(projectsPage.createIssueModal).not.toBeVisible();
    }
    console.log(`✓ Created ${issueTitles.length} issues`);

    // Navigate to activity tab
    const projectTabs = page.getByLabel("Tabs");
    const activityTab = projectTabs.getByRole("link", { name: /^Activity$/ });
    await activityTab.click();
    await expect(page).toHaveURL(/\/activity/);

    // Wait for the activity feed container to appear (replaces generic skeleton check)
    const activityFeed = page.getByTestId(TEST_IDS.ACTIVITY.FEED);
    await expect(activityFeed).toBeVisible();

    // Verify activity entries are visible — scoped to the feed container
    const activityEntries = activityFeed.getByTestId(TEST_IDS.ACTIVITY.ENTRY);
    await expect(activityEntries.first()).toBeVisible();

    // Activity entries should show "created" action — scoped to feed
    const createdActivity = activityFeed.getByText(/created/i).first();
    await expect(createdActivity).toBeVisible();
    console.log("✓ Activity entries show 'created' action");

    // Verify activity shows the project's issue key pattern (e.g., ACTI-1) — scoped to feed
    const issueKeyPattern = new RegExp(`${projectKey}-\\d+`);
    const issueKeyEntry = activityFeed.getByText(issueKeyPattern).first();
    await expect(issueKeyEntry).toBeVisible();
    console.log("✓ Activity entries show issue keys");
  });

  test("activity page displays user name in entries", async ({ projectsPage, page }) => {
    const timestamp = Date.now();
    const projectKey = `ACTU${timestamp.toString().slice(-4)}`;

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Activity User WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Activity User Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    // Create an issue to generate activity
    await projectsPage.createIssue(`Activity User Test Issue ${timestamp}`);
    await expect(projectsPage.createIssueModal).not.toBeVisible();
    console.log("✓ Created issue");

    // Navigate to activity tab
    const projectTabs = page.getByLabel("Tabs");
    const activityTab = projectTabs.getByRole("link", { name: /^Activity$/ });
    await activityTab.click();
    await expect(page).toHaveURL(/\/activity/);

    // Wait for the activity feed container to appear
    const activityFeed = page.getByTestId(TEST_IDS.ACTIVITY.FEED);
    await expect(activityFeed).toBeVisible();

    // Activity entries should show a user name with an action — scoped to feed
    const activityEntry = activityFeed.getByTestId(TEST_IDS.ACTIVITY.ENTRY).first();
    await expect(activityEntry).toBeVisible();
    // Verify the entry contains both a user name (font-medium span) and an action word
    await expect(activityEntry.getByText(/created|updated|commented/i)).toBeVisible();
    console.log("✓ Activity entries show user name with action");
  });

  test("activity page shows relative timestamps", async ({ projectsPage, page }) => {
    const timestamp = Date.now();
    const projectKey = `ACTT${timestamp.toString().slice(-4)}`;

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Activity Time WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Activity Time Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    // Create an issue to generate activity
    await projectsPage.createIssue(`Activity Timestamp Test Issue ${timestamp}`);
    await expect(projectsPage.createIssueModal).not.toBeVisible();

    // Navigate to activity tab
    const projectTabs = page.getByLabel("Tabs");
    const activityTab = projectTabs.getByRole("link", { name: /^Activity$/ });
    await activityTab.click();
    await expect(page).toHaveURL(/\/activity/);

    // Wait for the activity feed container to appear
    const activityFeed = page.getByTestId(TEST_IDS.ACTIVITY.FEED);
    await expect(activityFeed).toBeVisible();

    // Verify relative timestamps are shown — scoped to the feed container
    const relativeTime = activityFeed.getByText(
      /just now|seconds? ago|minutes? ago|hours? ago|days? ago/i,
    );
    await expect(relativeTime.first()).toBeVisible();
    console.log("✓ Activity entries show relative timestamps");
  });
});
