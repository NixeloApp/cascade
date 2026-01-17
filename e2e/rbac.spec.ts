/**
 * RBAC (Role-Based Access Control) E2E Tests
 *
 * Tests permission boundaries for different user roles:
 * - Admin: Full control (project owner)
 * - Editor: Can create/edit issues, sprints, but not manage project
 * - Viewer: Read-only access, can only view and comment
 *
 * IMPORTANT: Tests are consolidated by role to avoid Convex auth token rotation issues.
 * Each test creates its own browser context with fresh tokens.
 *
 * Test project: RBAC (created in global-setup)
 * - Admin: e2e-teamlead@inbox.mailtrap.io
 * - Editor: e2e-member@inbox.mailtrap.io
 * - Viewer: e2e-viewer@inbox.mailtrap.io
 */

import { RBAC_TEST_CONFIG } from "./config";
import { clientSideNavigate, expect, rbacTest } from "./fixtures";

// Increase timeout for RBAC tests since they involve multiple navigations
rbacTest.setTimeout(90000);

/**
 * Admin Role Tests - Comprehensive test for admin permissions
 * Tests: view board, create issues, access settings, see settings tab, sprints, analytics
 *
 * NOTE: This test requires teamLead auth state which occasionally fails to create.
 * If this test is skipped, it's because the auth state setup failed during global-setup.
 */
// SKIPPED: Flaky - Settings tab visibility timing and session validation issues
// TODO: Investigate session persistence during rapid role switching
rbacTest(
  "admin has full project access",
  async (
    { adminPage, adminProjectsPage, gotoRbacProject, rbacProjectKey, rbacOrgSlug },
    _testInfo,
  ) => {
    // Verify admin auth is available (will throw from assertAuthStateValid in fixture if missing)
    // We no longer skip - if auth is missing, the test should fail.

    adminPage.on("console", (msg) => console.log(`BROWSER: ${msg.text()}`));

    // 1. Navigate to project board
    await gotoRbacProject(adminPage);

    // 2. Verify board is visible - check for project name heading (matches config)
    await expect(
      adminPage.getByRole("heading", { name: RBAC_TEST_CONFIG.projectName }),
    ).toBeVisible({
      timeout: 30000,
    });
    console.log("✓ Admin can view project board");

    // 3. Verify create issue button is visible
    const addIssueButton = adminPage.getByRole("button", { name: /add issue/i }).first();
    await expect(addIssueButton).toBeVisible();
    console.log("✓ Admin can see create issue button");

    // 4. Verify settings tab is visible
    const settingsTab = adminProjectsPage.getProjectSettingsTab();
    await expect(settingsTab).toBeVisible({ timeout: 60000 });
    console.log("✓ Admin can see settings tab");

    // 5. Navigate to settings and verify access
    // Use UI navigation (click tab) instead of goto URL to act more like a real user
    await settingsTab.click();

    // Verify we actually reached the settings page
    try {
      await expect(adminPage).toHaveURL(/.*\/settings/, { timeout: 10000 });
      await adminPage.waitForLoadState("domcontentloaded");
      await expect(adminPage.getByRole("heading", { name: /project settings/i })).toBeVisible({
        timeout: 10000,
      });
      console.log("✓ Admin can access project settings page");
    } catch (e) {
      console.log(`❌ Admin Settings Navigation Failed. Current URL: ${adminPage.url()}`);
      console.log(`Title: ${await adminPage.title()}`);
      const bodyText = await adminPage.evaluate(() => document.body.innerText.substring(0, 500));
      console.log(`Body Snippet: ${bodyText}`);
      throw e;
    }

    // 6. Navigate back to board and check sprints
    await clientSideNavigate(adminPage, `/${rbacOrgSlug}/projects/${rbacProjectKey}/board`);
    await adminPage.waitForLoadState("domcontentloaded");

    const sprintsTab = adminPage
      .getByRole("tab", { name: /sprint/i })
      .or(adminPage.getByRole("link", { name: /sprint/i }));

    if (await sprintsTab.isVisible().catch(() => false)) {
      await sprintsTab.click();
      await adminPage.waitForTimeout(500);

      const createSprintButton = adminPage.getByRole("button", {
        name: /create sprint|new sprint/i,
      });
      await expect(createSprintButton).toBeVisible();
      console.log("✓ Admin can access sprints and create sprint button");
    }

    // 7. Check analytics access
    const analyticsTab = adminPage
      .getByRole("tab", { name: /analytics/i })
      .or(adminPage.getByRole("link", { name: /analytics/i }));

    if (await analyticsTab.isVisible().catch(() => false)) {
      await analyticsTab.click();
      await adminPage.waitForTimeout(500);

      const analyticsContent = adminPage.getByText(/overview|metrics|velocity/i);
      await expect(analyticsContent.first()).toBeVisible();
      console.log("✓ Admin can view analytics");
    }

    console.log("\n✅ All admin permission tests passed");
  },
);

/**
 * Editor Role Tests - Comprehensive test for editor permissions
 * Tests: view board, create issues, no settings tab, redirected from settings, sprints, analytics
 */
rbacTest(
  "editor has limited project access",
  async ({ editorPage, editorProjectsPage, gotoRbacProject, rbacProjectKey, rbacOrgSlug }) => {
    // 1. Navigate to project board
    editorPage.on("console", (msg) => console.log(`[Browser Console] ${msg.text()}`));
    await gotoRbacProject(editorPage);

    // 2. Verify board is visible - check for project name heading
    await expect(
      editorPage.getByRole("heading", { name: RBAC_TEST_CONFIG.projectName }),
    ).toBeVisible({
      timeout: 30000,
    });
    console.log("✓ Editor can view project board");

    // 3. Verify create issue button is visible (editors can create issues)
    const addIssueButton = editorPage.getByRole("button", { name: /add issue/i }).first();
    await expect(addIssueButton).toBeVisible();
    console.log("✓ Editor can see create issue button");

    // 4. Verify settings tab is NOT visible
    const settingsTab = editorProjectsPage.getProjectSettingsTab();
    const settingsTabCount = await settingsTab.count();
    expect(settingsTabCount).toBe(0);
    console.log("✓ Editor cannot see settings tab");

    // 5. Try to access settings directly - should redirect to board
    const html = await editorPage.content();
    console.log("[DEBUG] Editor Page HTML Snapshot:", html);

    // Try multiple selectors
    const debugEl = editorPage.locator('[data-testid="debug-user-role"]');
    if ((await debugEl.count()) > 0) {
      console.log("[DEBUG] Found via locator:", await debugEl.getAttribute("data-role"));
    } else {
      console.log("[DEBUG] Debug element NOT found via locator");
    }

    await clientSideNavigate(editorPage, `/${rbacOrgSlug}/projects/${rbacProjectKey}/settings`);
    await editorPage.waitForLoadState("domcontentloaded");
    await editorPage.waitForTimeout(1000);

    // Wait for redirect to board
    await editorPage.waitForURL(`**/projects/${rbacProjectKey}/board`, { timeout: 15000 });
    expect(editorPage.url()).toContain("/board");
    expect(editorPage.url()).not.toContain("/settings");
    console.log("✓ Editor is redirected from settings to board");

    // 6. Check sprints access
    await clientSideNavigate(editorPage, `/${rbacOrgSlug}/projects/${rbacProjectKey}/board`);
    await editorPage.waitForLoadState("domcontentloaded");

    const sprintsTab = editorPage
      .getByRole("tab", { name: /sprint/i })
      .or(editorPage.getByRole("link", { name: /sprint/i }));

    if (await sprintsTab.isVisible().catch(() => false)) {
      await sprintsTab.click();
      await editorPage.waitForTimeout(500);

      const createSprintButton = editorPage.getByRole("button", {
        name: /create sprint|new sprint/i,
      });
      await expect(createSprintButton).toBeVisible();
      console.log("✓ Editor can access sprints and create sprint button");
    }

    // 7. Check analytics access
    const analyticsTab = editorPage
      .getByRole("tab", { name: /analytics/i })
      .or(editorPage.getByRole("link", { name: /analytics/i }));

    if (await analyticsTab.isVisible().catch(() => false)) {
      await analyticsTab.click();
      await editorPage.waitForTimeout(500);

      const analyticsContent = editorPage.getByText(/overview|metrics|velocity/i);
      await expect(analyticsContent.first()).toBeVisible();
      console.log("✓ Editor can view analytics");
    }

    console.log("\n✅ All editor permission tests passed");
  },
);

/**
 * Viewer Role Tests - Comprehensive test for viewer permissions
 * Tests: view board, NO create issues, no settings tab, redirected from settings, analytics
 */
rbacTest(
  "viewer has read-only project access",
  async ({ viewerPage, viewerProjectsPage, gotoRbacProject, rbacProjectKey, rbacOrgSlug }) => {
    // 1. Navigate to project board
    viewerPage.on("console", (msg) => console.log(`[Browser Console] ${msg.text()}`));
    await gotoRbacProject(viewerPage);

    // 2. Verify board is visible - check for project name heading
    await expect(
      viewerPage.getByRole("heading", { name: RBAC_TEST_CONFIG.projectName }),
    ).toBeVisible({
      timeout: 30000,
    });
    console.log("✓ Viewer can view project board");

    // 3. Verify create issue button is NOT visible to viewers
    const addIssueButtons = viewerPage.getByRole("button", { name: /add issue/i });
    const buttonCount = await addIssueButtons.count();
    expect(buttonCount).toBe(0);
    console.log("✓ Viewer cannot see create issue button");

    // 4. Verify settings tab is NOT visible
    const htmlViewer = await viewerPage.content();
    console.log("[DEBUG] Viewer Page HTML Snapshot:", htmlViewer);

    const settingsTab = viewerProjectsPage.getProjectSettingsTab();
    const settingsTabCount = await settingsTab.count();
    expect(settingsTabCount).toBe(0);
    console.log("✓ Viewer cannot see settings tab");

    // 5. Try to access settings directly - should redirect to board
    await clientSideNavigate(viewerPage, `/${rbacOrgSlug}/projects/${rbacProjectKey}/settings`);
    await viewerPage.waitForLoadState("domcontentloaded");
    await viewerPage.waitForTimeout(1000);

    // Wait for redirect to board
    await viewerPage.waitForURL(`**/projects/${rbacProjectKey}/board`, { timeout: 15000 });
    expect(viewerPage.url()).toContain("/board");
    expect(viewerPage.url()).not.toContain("/settings");
    console.log("✓ Viewer is redirected from settings to board");

    // 6. Check analytics access (viewers can view analytics)
    await clientSideNavigate(viewerPage, `/${rbacOrgSlug}/projects/${rbacProjectKey}/board`);
    await viewerPage.waitForLoadState("domcontentloaded");

    const analyticsTab = viewerPage
      .getByRole("tab", { name: /analytics/i })
      .or(viewerPage.getByRole("link", { name: /analytics/i }));

    if (await analyticsTab.isVisible().catch(() => false)) {
      await analyticsTab.click();
      await viewerPage.waitForTimeout(500);

      const analyticsContent = viewerPage.getByText(/overview|metrics|velocity/i);
      await expect(analyticsContent.first()).toBeVisible();
      console.log("✓ Viewer can view analytics");
    }

    console.log("\n✅ All viewer permission tests passed");
  },
);

/**
 * NOTE: Permission Matrix test removed.
 *
 * This test was causing failures due to Convex auth token rotation:
 * - Tests 1-3 (admin, editor, viewer) each use their respective auth tokens
 * - Each use rotates the refresh token, invalidating the old one
 * - Test 4 (matrix) tried to use all three users, but tokens were already rotated
 *
 * The individual role tests above already verify all the same permissions,
 * so the matrix test was redundant anyway.
 */
