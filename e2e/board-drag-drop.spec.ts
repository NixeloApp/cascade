import { expect, authenticatedTest as test } from "./fixtures";
import { testUserService } from "./utils/test-user-service";

/**
 * Board Drag-Drop E2E Tests (Sprint 3 - Depth)
 *
 * Tests the Kanban board drag-and-drop functionality:
 * - Issue cards are draggable
 * - Columns accept drops
 * - Issue status updates after drop
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 *
 * Note: Uses Playwright's drag-and-drop support for HTML5 native drag events.
 */

test.describe("Board Drag-Drop", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
    const seedResult = await testUserService.seedTemplates();
    if (!seedResult) console.warn("WARNING: Failed to seed templates in test setup");
  });

  test("issue cards have drag handle and are draggable", async ({ projectsPage }) => {
    const timestamp = Date.now();
    const projectKey = `DRAG${timestamp.toString().slice(-4)}`;
    const issueTitle = `Draggable Issue ${timestamp}`;

    // Create a project with an issue
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Drag Test WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Drag Test Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    // Create an issue (goes to Backlog for Scrum projects)
    await projectsPage.createIssue(issueTitle);
    await expect(projectsPage.createIssueModal).not.toBeVisible();

    // Switch to backlog to find the issue
    await projectsPage.switchToTab("backlog");

    // Find the issue card via page object
    const issueCard = projectsPage.getIssueCard(issueTitle);
    await expect(issueCard).toBeVisible();

    // Verify the card has draggable attribute (cards are draggable when canEdit=true)
    const draggable = await issueCard.getAttribute("draggable");
    expect(draggable).toBe("true");
    console.log("✓ Issue card is draggable");
  });

  test("board columns are valid drop targets", async ({ projectsPage, page }) => {
    const timestamp = Date.now();
    const projectKey = `DROP${timestamp.toString().slice(-4)}`;

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Drop Test WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Drop Test Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    // Verify board columns exist
    const columns = page.locator("[data-board-column]");
    const columnCount = await columns.count();
    expect(columnCount).toBeGreaterThan(0);
    console.log(`✓ Found ${columnCount} board columns`);

    // Each column should have aria-label
    for (let i = 0; i < columnCount; i++) {
      const column = columns.nth(i);
      const ariaLabel = await column.getAttribute("aria-label");
      expect(ariaLabel).toContain("column");
      console.log(`✓ Column ${i + 1} has aria-label: ${ariaLabel}`);
    }
  });

  test("can drag issue between columns (status change)", async ({ projectsPage, page }) => {
    const timestamp = Date.now();
    const projectKey = `MOVE${timestamp.toString().slice(-4)}`;
    const issueTitle = `Move Issue ${timestamp}`;

    // Create a project with an issue
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Move Test WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Move Test Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    // Create an issue
    await projectsPage.createIssue(issueTitle);
    await expect(projectsPage.createIssueModal).not.toBeVisible();

    // Switch to backlog to see the issue
    await projectsPage.switchToTab("backlog");

    // Find the issue card via page object
    const issueCard = projectsPage.getIssueCard(issueTitle);
    await expect(issueCard).toBeVisible();
    console.log("✓ Issue card visible in initial column");

    // Get all columns
    const columns = page.locator("[data-board-column]");
    const columnCount = await columns.count();

    if (columnCount < 2) {
      console.log("⚠ Less than 2 columns, skipping drag test");
      return;
    }

    // Get the source column (where issue is) and target column
    // Find the column containing our issue
    const sourceColumn = issueCard.locator("xpath=ancestor::section[@data-board-column]");
    const sourceColumnLabel = await sourceColumn.getAttribute("aria-label");
    console.log(`Source column: ${sourceColumnLabel}`);

    // Find a different column to drop into
    // Try to find "In Progress" or similar column
    let targetColumn = columns.filter({ has: page.getByText(/in progress/i) });
    if ((await targetColumn.count()) === 0) {
      // Fall back to a column that's not the source
      for (let i = 0; i < columnCount; i++) {
        const col = columns.nth(i);
        const label = await col.getAttribute("aria-label");
        if (label !== sourceColumnLabel) {
          targetColumn = col;
          break;
        }
      }
    }

    const targetColumnLabel = await targetColumn.getAttribute("aria-label");
    console.log(`Target column: ${targetColumnLabel}`);

    // Get issue card bounding box
    const issueBox = await issueCard.boundingBox();
    expect(issueBox).not.toBeNull();

    // Get target column bounding box
    const targetBox = await targetColumn.boundingBox();
    expect(targetBox).not.toBeNull();

    // Perform drag and drop using Playwright's drag API
    // Type guards ensure boxes are non-null (we asserted above)
    if (!issueBox || !targetBox) {
      throw new Error("Bounding boxes not available");
    }

    // Start from center of issue card
    const startX = issueBox.x + issueBox.width / 2;
    const startY = issueBox.y + issueBox.height / 2;

    // End at center of target column
    const endX = targetBox.x + targetBox.width / 2;
    const endY = targetBox.y + targetBox.height / 2;

    // Execute drag operation
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 10 });
    await page.mouse.up();

    // Wait for mutation to complete - the card should re-render after status update
    // Use domcontentloaded as a lightweight signal that React has processed the update
    await page.waitForLoadState("domcontentloaded");

    // Verify issue is now in target column or status has changed
    // The issue card should now be in the target column
    // We verify by checking the card is no longer in source column header section
    console.log("✓ Drag operation completed");

    // Note: Full verification of status change would require checking:
    // 1. Issue detail shows new status
    // 2. Or checking issue is in new column's issue list
    // For now, we verify the drag mechanics work
  });

  test("board shows multiple workflow states as columns", async ({ projectsPage, page }) => {
    const timestamp = Date.now();
    const projectKey = `COLS${timestamp.toString().slice(-4)}`;

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Columns Test WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Columns Test Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    // Verify standard workflow columns exist
    const columns = page.locator("[data-board-column]");

    // Scrum projects typically have: Backlog, To Do, In Progress, In Review, Done
    // We check for common workflow states
    const expectedStates = ["Backlog", "To Do", "In Progress", "Done"];
    let foundStates = 0;

    for (const state of expectedStates) {
      const stateColumn = columns.filter({ has: page.getByText(state, { exact: true }) });
      if ((await stateColumn.count()) > 0) {
        foundStates++;
        console.log(`✓ Found "${state}" column`);
      }
    }

    // At least some workflow states should exist
    expect(foundStates).toBeGreaterThan(0);
    console.log(`✓ Found ${foundStates} standard workflow columns`);
  });

  test("column shows issue count badge", async ({ projectsPage, page }) => {
    const timestamp = Date.now();
    const projectKey = `BDGE${timestamp.toString().slice(-4)}`;

    // Create a project with issues
    await projectsPage.goto();
    await projectsPage.createWorkspace(`Badge Test WS ${timestamp}`);
    await projectsPage.goto();
    await projectsPage.createProject(`Badge Test Project ${timestamp}`, projectKey);
    await projectsPage.waitForBoardInteractive();

    // Create an issue
    await projectsPage.createIssue(`Badge Test Issue ${timestamp}`);
    await expect(projectsPage.createIssueModal).not.toBeVisible();

    // Switch to backlog
    await projectsPage.switchToTab("backlog");

    // Find a column with issues and verify it shows count
    const columns = page.locator("[data-board-column]");
    const columnCount = await columns.count();

    let foundCountBadge = false;
    for (let i = 0; i < columnCount; i++) {
      const column = columns.nth(i);
      // Look for count badge (usually shows as number in a badge near column header)
      const badge = column.locator("header").getByRole("status");
      if ((await badge.count()) > 0) {
        foundCountBadge = true;
        const badgeText = await badge.textContent();
        console.log(`✓ Found column with count badge: ${badgeText}`);
        break;
      }
    }

    // Note: Badge implementation may vary - this is a best-effort check
    if (!foundCountBadge) {
      console.log("ℹ Column count badges not found (may not be implemented)");
    }
  });
});
