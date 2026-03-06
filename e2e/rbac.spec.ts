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

/** Admin Role Tests - view board, create issues, access settings, sprints, analytics */
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

    // 2. Verify board is visible - check for board element or project key in URL
    // URL should be like /:orgSlug/projects/:projectKey/board
    await expect(adminPage).toHaveURL(/\/projects\/.*\/board/);
    console.log("✓ Admin can view project board");

    // 3. Verify create issue button is visible
    const addIssueButton = adminPage.getByRole("button", { name: /add issue/i }).first();
    await expect(addIssueButton).toBeVisible();
    console.log("✓ Admin can see create issue button");

    // 4. Verify settings tab is visible
    const settingsTab = adminProjectsPage.getProjectSettingsTab();
    await expect(settingsTab).toBeVisible();
    console.log("✓ Admin can see settings tab");

    // 5. Navigate to settings and verify access
    // Use the shared project-tab navigation contract instead of spec-local tab clicks.
    await adminProjectsPage.switchToTab("settings");

    // Verify we actually reached the settings page
    try {
      await adminProjectsPage.expectProjectSettingsLoaded();
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

    if (await adminProjectsPage.isProjectTabVisible("sprints")) {
      await adminProjectsPage.switchToTab("sprints");
      await adminProjectsPage.expectCreateSprintVisible();
      console.log("✓ Admin can access sprints and create sprint button");
    } else {
      console.log("⚠ Sprints tab not present (project may not support sprints)");
    }

    // 7. Check analytics access
    if (await adminProjectsPage.isProjectTabVisible("analytics")) {
      await adminProjectsPage.switchToTab("analytics");
      await adminProjectsPage.expectAnalyticsLoaded();
      console.log("✓ Admin can view analytics");
    } else {
      console.log("⚠ Analytics tab not present (feature may be disabled)");
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
    await expect(editorPage).toHaveURL(/\/projects\/.*\/board/);
    console.log("✓ Editor can view project board");

    // 3. Verify create issue button is visible (editors can create issues)
    const addIssueButton = editorPage.getByRole("button", { name: /add issue/i }).first();
    await expect(addIssueButton).toBeVisible();
    console.log("✓ Editor can see create issue button");

    // 4. Verify settings tab is NOT visible
    const hasSettingsTab = await editorProjectsPage.isProjectTabVisible("settings");
    expect(hasSettingsTab).toBe(false);
    console.log("✓ Editor cannot see settings tab");

    // 5. Try to access settings directly - should redirect to board
    await clientSideNavigate(editorPage, `/${rbacOrgSlug}/projects/${rbacProjectKey}/settings`);

    // Wait for redirect to board
    await editorPage.waitForURL(`**/projects/${rbacProjectKey}/board`);
    expect(editorPage.url()).toContain("/board");
    expect(editorPage.url()).not.toContain("/settings");
    console.log("✓ Editor is redirected from settings to board");

    // 6. Check sprints access (already on board page after redirect)
    if (await editorProjectsPage.isProjectTabVisible("sprints")) {
      await editorProjectsPage.switchToTab("sprints");
      await editorProjectsPage.expectCreateSprintVisible();
      console.log("✓ Editor can access sprints and create sprint button");
    } else {
      console.log("⚠ Sprints tab not present (project may not support sprints)");
    }

    // 7. Check analytics access
    if (await editorProjectsPage.isProjectTabVisible("analytics")) {
      await editorProjectsPage.switchToTab("analytics");
      await editorProjectsPage.expectAnalyticsLoaded();
      console.log("✓ Editor can view analytics");
    } else {
      console.log("⚠ Analytics tab not present (feature may be disabled)");
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
      viewerPage.getByRole("heading", { name: new RegExp(RBAC_TEST_CONFIG.projectName, "i") }),
    ).toBeVisible();
    console.log("✓ Viewer can view project board");

    // 3. Verify create issue button is NOT visible to viewers
    const addIssueButtons = viewerPage.getByRole("button", { name: /add issue/i });
    const buttonCount = await addIssueButtons.count();
    expect(buttonCount).toBe(0);
    console.log("✓ Viewer cannot see create issue button");

    // 4. Verify settings tab is NOT visible
    const hasSettingsTab = await viewerProjectsPage.isProjectTabVisible("settings");
    expect(hasSettingsTab).toBe(false);
    console.log("✓ Viewer cannot see settings tab");

    // 5. Try to access settings directly - should redirect to board
    await clientSideNavigate(viewerPage, `/${rbacOrgSlug}/projects/${rbacProjectKey}/settings`);

    // Wait for redirect to board
    await viewerPage.waitForURL(`**/projects/${rbacProjectKey}/board`);
    expect(viewerPage.url()).toContain("/board");
    expect(viewerPage.url()).not.toContain("/settings");
    console.log("✓ Viewer is redirected from settings to board");

    // 6. Check analytics access (viewers can view analytics - already on board page after redirect)
    if (await viewerProjectsPage.isProjectTabVisible("analytics")) {
      await viewerProjectsPage.switchToTab("analytics");
      await viewerProjectsPage.expectAnalyticsLoaded();
      console.log("✓ Viewer can view analytics");
    } else {
      console.log("⚠ Analytics tab not present (feature may be disabled)");
    }

    console.log("\n✅ All viewer permission tests passed");
  },
);
