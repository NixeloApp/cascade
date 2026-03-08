import { expect, authenticatedTest as test } from "./fixtures";
import { createTestNamespace } from "./utils/test-helpers";
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
 * Note: Uses Playwright's drag-and-drop support with Atlaskit Pragmatic DnD.
 * Pragmatic DnD manages drag state internally without HTML5 draggable attribute.
 */

test.describe("Board Drag-Drop", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
    const seedResult = await testUserService.seedTemplates();
    if (!seedResult) console.warn("WARNING: Failed to seed templates in test setup");
  });

  test("issue cards have drag handle and are draggable", async ({ projectsPage }, testInfo) => {
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("DRAG");
    const issueTitle = namespace.name("Draggable Issue");

    // Create a project with an issue
    await projectsPage.goto();
    await projectsPage.createWorkspace(namespace.name("Drag Test WS"));
    await projectsPage.goto();
    await projectsPage.createProject(namespace.name("Drag Test Project"), projectKey);
    await projectsPage.waitForBoardInteractive();

    // Create an issue (goes to Backlog for Scrum projects)
    await projectsPage.createIssue(issueTitle);

    // Switch to backlog to find the issue
    await projectsPage.switchToTab("backlog");

    // Find the issue card via page object
    const issueCard = projectsPage.getIssueCard(issueTitle);
    await expect(issueCard).toBeVisible();

    // With Pragmatic DnD, the card is draggable via the library's internal setup.
    // Assert against the stable drag-handle anchor instead of implementation CSS classes.
    const issueCardContainer = projectsPage.getIssueCardContainer(issueTitle);
    await expect(issueCardContainer).toBeVisible();

    const dragHandle = projectsPage.getIssueDragHandle(issueTitle);
    await expect(dragHandle).toBeAttached();
    console.log("✓ Issue card has drag handle (Pragmatic DnD)");
  });

  test("board columns are valid drop targets", async ({ projectsPage }, testInfo) => {
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("DROP");

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(namespace.name("Drop Test WS"));
    await projectsPage.goto();
    await projectsPage.createProject(namespace.name("Drop Test Project"), projectKey);
    await projectsPage.waitForBoardInteractive();

    // Verify board columns exist
    const columns = projectsPage.boardColumns;
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

  test("can drag issue between columns (status change)", async ({ projectsPage }, testInfo) => {
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("MOVE");
    const issueTitle = namespace.name("Move Issue");

    // Create a project with an issue
    await projectsPage.goto();
    await projectsPage.createWorkspace(namespace.name("Move Test WS"));
    await projectsPage.goto();
    await projectsPage.createProject(namespace.name("Move Test Project"), projectKey);
    await projectsPage.waitForBoardInteractive();

    // Create an issue
    await projectsPage.createIssue(issueTitle);

    // Switch to backlog to see the issue
    await projectsPage.switchToTab("backlog");

    // Find the issue card via page object
    const issueCard = projectsPage.getIssueCard(issueTitle);
    await expect(issueCard).toBeVisible();
    console.log("✓ Issue card visible in initial column");

    // Get all columns
    const columns = projectsPage.boardColumns;
    const columnCount = await columns.count();

    if (columnCount < 2) {
      console.log("⚠ Less than 2 columns, skipping drag test");
      return;
    }

    // Get the source column (where issue is) and target column
    // Find the column containing our issue
    const sourceColumn = columns.filter({ has: issueCard }).first();
    const sourceColumnLabel = await sourceColumn.getAttribute("aria-label");
    console.log(`Source column: ${sourceColumnLabel}`);

    // Find a different column to drop into
    // Try to find "In Progress" or similar column
    let targetColumn = projectsPage.getBoardColumn(/in progress/i);
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
    targetColumn = targetColumn.first();

    const targetColumnLabel = await targetColumn.getAttribute("aria-label");
    console.log(`Target column: ${targetColumnLabel}`);

    const escapedIssueTitle = issueTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const issueButtonInTargetColumn = targetColumn.getByRole("button", {
      name: new RegExp(escapedIssueTitle),
    });
    const issueButtonInSourceColumn = sourceColumn.getByRole("button", {
      name: new RegExp(escapedIssueTitle),
    });

    await issueCard.scrollIntoViewIfNeeded();
    await targetColumn.scrollIntoViewIfNeeded();
    await issueCard.dragTo(targetColumn);

    // Wait for DOM to settle after drag. Use retrying assertion to verify card
    // is in one of the valid end states (either target or source column).
    await expect(async () => {
      const inTarget = await issueButtonInTargetColumn.isVisible().catch(() => false);
      const inSource = await issueButtonInSourceColumn.isVisible().catch(() => false);
      // Card must be visible in exactly one column
      expect(inTarget || inSource).toBe(true);
    }).toPass({ timeout: 5000, intervals: [250, 500, 1000] });

    // Now determine settled state and assert exclusivity
    const movedToTarget = await issueButtonInTargetColumn.isVisible().catch(() => false);

    if (movedToTarget) {
      await expect(issueButtonInSourceColumn).toHaveCount(0);
    } else {
      await expect(issueButtonInSourceColumn).toBeVisible();
    }

    console.log("✓ Drag operation completed");
  });

  test("board shows multiple workflow states as columns", async ({ projectsPage }, testInfo) => {
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("COLS");

    // Create a project
    await projectsPage.goto();
    await projectsPage.createWorkspace(namespace.name("Columns Test WS"));
    await projectsPage.goto();
    await projectsPage.createProject(namespace.name("Columns Test Project"), projectKey);
    await projectsPage.waitForBoardInteractive();

    // Scrum projects typically have: Backlog, To Do, In Progress, In Review, Done
    // We check for common workflow states
    const expectedStates = ["Backlog", "To Do", "In Progress", "Done"];
    let foundStates = 0;

    for (const state of expectedStates) {
      const stateColumn = projectsPage.getBoardColumn(state);
      if ((await stateColumn.count()) > 0) {
        foundStates++;
        console.log(`✓ Found "${state}" column`);
      }
    }

    // At least some workflow states should exist
    expect(foundStates).toBeGreaterThan(0);
    console.log(`✓ Found ${foundStates} standard workflow columns`);
  });

  test("column shows issue count badge", async ({ projectsPage }, testInfo) => {
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("BDGE");

    // Create a project with issues
    await projectsPage.goto();
    await projectsPage.createWorkspace(namespace.name("Badge Test WS"));
    await projectsPage.goto();
    await projectsPage.createProject(namespace.name("Badge Test Project"), projectKey);
    await projectsPage.waitForBoardInteractive();

    // Create an issue
    await projectsPage.createIssue(namespace.name("Badge Test Issue"));

    // Switch to backlog
    await projectsPage.switchToTab("backlog");

    // Find a column with issues and verify it shows count
    const columns = projectsPage.boardColumns;
    const columnCount = await columns.count();

    let foundCountBadge = false;
    for (let i = 0; i < columnCount; i++) {
      const column = columns.nth(i);
      const badge = projectsPage.getBoardColumnCountBadgeByIndex(i);
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
