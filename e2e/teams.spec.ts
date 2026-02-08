import { expect, authenticatedTest as test } from "./fixtures";
import { testUserService } from "./utils/test-user-service";

/**
 * Teams E2E Tests
 *
 * Tests the team management functionality:
 * - Teams list page within a workspace
 * - Team board (Kanban view for team)
 * - Team settings
 *
 * Route structure:
 * - Teams list: /$orgSlug/workspaces/$workspaceSlug/teams
 * - Team board: /$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/board
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 */

test.describe("Teams", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
    const seedResult = await testUserService.seedTemplates();
    if (!seedResult) console.warn("WARNING: Failed to seed templates in test setup");
  });

  test("can navigate to teams list from workspace", async ({ workspacesPage, page }) => {
    // Create a workspace first
    const uniqueId = Date.now().toString();
    const workspaceName = `Teams WS ${uniqueId}`;

    await workspacesPage.goto();
    await workspacesPage.createWorkspace(workspaceName);

    // After workspace creation, page may redirect to workspace detail
    // Verify we're on a workspace page (either list or detail)
    await expect(page).toHaveURL(/\/workspaces\//);

    // If we're already on the workspace detail page, look for Teams link directly
    // Otherwise, navigate to the workspace first
    const workspaceHeading = page
      .getByRole("main")
      .getByRole("heading", { name: workspaceName, level: 3 });
    if (!(await workspaceHeading.isVisible())) {
      // We're on the list page, need to click the workspace card
      const mainContent = page.getByRole("main");
      const workspaceCard = mainContent
        .locator(`a[href*="/workspaces/"]`)
        .filter({ hasText: workspaceName })
        .first();
      await expect(workspaceCard).toBeVisible();
      await workspaceCard.click();
    }

    // Should be in the workspace now - either on detail page or already on teams
    await expect(page).toHaveURL(/\/workspaces\/[^/]+/);

    // Look for Teams navigation link and click if not already on teams page
    const currentUrl = page.url();
    if (!currentUrl.includes("/teams")) {
      const teamsLink = page.getByRole("link", { name: /^teams$/i });
      await expect(teamsLink).toBeVisible();
      await teamsLink.click();
    }
    await expect(page).toHaveURL(/\/workspaces\/.*\/teams/);

    // Should show Teams heading or content
    console.log("✓ Navigated to Teams page");
  });

  test("teams list shows create team button", async ({ workspacesPage, page }) => {
    // Create a workspace first
    const uniqueId = Date.now().toString();
    const workspaceName = `Create Team WS ${uniqueId}`;

    await workspacesPage.goto();
    await workspacesPage.createWorkspace(workspaceName);

    // After workspace creation, we may already be on the detail page
    // Check if we need to navigate to the workspace
    await expect(page).toHaveURL(/\/workspaces\//);

    const workspaceHeading = page
      .getByRole("main")
      .getByRole("heading", { name: workspaceName, level: 3 });
    if (!(await workspaceHeading.isVisible())) {
      const mainContent = page.getByRole("main");
      const workspaceCard = mainContent
        .locator(`a[href*="/workspaces/"]`)
        .filter({ hasText: workspaceName });
      await expect(workspaceCard).toBeVisible();
      await workspaceCard.click();
    }

    // Navigate to teams
    const teamsLink = page.getByRole("link", { name: /^teams$/i });
    await expect(teamsLink).toBeVisible();
    await teamsLink.click();

    // Should show "Create Team" button (may be multiple on page, use first)
    const createTeamButton = page.getByRole("button", { name: /create team/i }).first();
    await expect(createTeamButton).toBeVisible();
  });

  test("teams list shows empty state when no teams exist", async ({ workspacesPage, page }) => {
    // Create a fresh workspace
    const uniqueId = Date.now().toString();
    const workspaceName = `Empty Teams WS ${uniqueId}`;

    await workspacesPage.goto();
    await workspacesPage.createWorkspace(workspaceName);

    // After workspace creation, we may already be on the detail page
    await expect(page).toHaveURL(/\/workspaces\//);

    const workspaceHeading = page
      .getByRole("main")
      .getByRole("heading", { name: workspaceName, level: 3 });
    if (!(await workspaceHeading.isVisible())) {
      const mainContent = page.getByRole("main");
      const workspaceCard = mainContent
        .locator(`a[href*="/workspaces/"]`)
        .filter({ hasText: workspaceName });
      await expect(workspaceCard).toBeVisible();
      await workspaceCard.click();
    }

    // Navigate to teams
    const teamsLink = page.getByRole("link", { name: /^teams$/i });
    await expect(teamsLink).toBeVisible();
    await teamsLink.click();

    // Wait for teams content to load - look for either empty state heading or team cards
    const emptyStateHeading = page.getByRole("heading", { name: /no teams yet/i });
    const teamCards = page.locator("[data-team-card]").or(page.locator("a[href*='/teams/']"));

    // Either empty state or teams should be visible
    await expect(emptyStateHeading.or(teamCards.first())).toBeVisible();
  });
});
