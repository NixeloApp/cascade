import { authenticatedTest, expect, test } from "./fixtures";

/**
 * Error Scenario E2E Tests
 *
 * Tests error handling for:
 * - Non-existent projects, documents, issues (authenticated)
 * - Unauthenticated access to protected routes
 *
 * The app shows contextual "not found" messages for invalid resources
 * when authenticated. Unauthenticated users are redirected to landing.
 */

test.describe("Unauthenticated Access", () => {
  test("redirects to signin when accessing protected route", async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto("/some-org/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Should redirect to signin or show landing
    // (Depends on implementation - check for either)
    const isOnSignin = await page
      .getByRole("heading", { name: /welcome back|sign in/i })
      .isVisible()
      .catch(() => false);
    const isOnLanding = await page
      .getByRole("heading", { name: /revolutionize/i })
      .isVisible()
      .catch(() => false);

    expect(isOnSignin || isOnLanding).toBe(true);
  });
});

authenticatedTest.describe("Non-existent Resources", () => {
  authenticatedTest.describe.configure({ mode: "serial" });

  authenticatedTest.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  authenticatedTest(
    "shows not found message for non-existent project",
    async ({ page, dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();

      // Navigate to a non-existent project
      const orgSlug = new URL(page.url()).pathname.split("/")[1];
      await page.goto(`/${orgSlug}/projects/NONEXISTENT99999/board`);
      await page.waitForLoadState("domcontentloaded");

      // Should show project not found heading
      await expect(page.getByRole("heading", { name: /project not found/i })).toBeVisible();
    },
  );

  authenticatedTest("shows error for non-existent document", async ({ page, dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();

    // Navigate to a non-existent document (invalid ID triggers error boundary)
    const orgSlug = new URL(page.url()).pathname.split("/")[1];
    await page.goto(`/${orgSlug}/documents/jf77777777777777777`);
    await page.waitForLoadState("domcontentloaded");

    // Should show error boundary or document not found
    // Note: Error page uses plain text, not headings
    await expect(
      page.getByText(/document not found/i).or(page.getByText(/something went wrong/i)),
    ).toBeVisible();
  });

  authenticatedTest(
    "shows not found message for non-existent issue",
    async ({ page, dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();

      // Navigate to a non-existent issue
      const orgSlug = new URL(page.url()).pathname.split("/")[1];
      await page.goto(`/${orgSlug}/issues/FAKE-99999`);
      await page.waitForLoadState("domcontentloaded");

      // Should show issue not found or error heading
      await expect(
        page
          .getByRole("heading", { name: /issue not found/i })
          .or(page.getByRole("heading", { name: /something went wrong/i })),
      ).toBeVisible();
    },
  );
});
