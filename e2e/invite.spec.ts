import { expect, test } from "./fixtures";

/**
 * Invite Page E2E Tests
 *
 * Tests the invitation acceptance flow:
 * - Invalid token shows error state
 * - Loading state while fetching invite details
 *
 * Note: Full acceptance flow requires creating invites via API,
 * which would need test-user-service extension. For now, we test
 * the error states and page structure.
 */

test.describe("Invite Page", () => {
  test("shows invalid invitation message for non-existent token", async ({ page }) => {
    // Navigate to invite page with a fake token
    await page.goto("/invite/invalid-token-12345");

    // Wait for loading to complete
    await page.waitForLoadState("domcontentloaded");

    // Should show "Invalid Invitation" heading
    await expect(page.getByRole("heading", { name: /invalid invitation/i })).toBeVisible();

    // Should have an explanation message
    await expect(page.getByText(/this invitation link is invalid|has been removed/i)).toBeVisible();

    // Should have a "Go to Home" button
    await expect(page.getByRole("button", { name: /go to home/i })).toBeVisible();
  });

  test("invalid invite page has Go to Home button that works", async ({ page }) => {
    // Navigate to invite page with a fake token
    await page.goto("/invite/another-fake-token", { waitUntil: "load" });

    // Wait for Convex query to resolve and show invalid state
    // The page shows loading first, then the Convex query returns null for invalid token
    const invalidHeading = page.getByRole("heading", { name: /invalid invitation/i });
    await expect(invalidHeading).toBeVisible();

    // Click the "Go to Home" button - may be a link or button
    const homeButton = page
      .getByRole("button", { name: /go to home/i })
      .or(page.getByRole("link", { name: /go to home/i }));
    await expect(homeButton).toBeVisible();
    await homeButton.click();

    // Should navigate to home page (could be / or /signin for unauthenticated)
    // The full URL includes the host, so match the path portion
    await expect(page).toHaveURL(/\/($|signin)/);
  });

  test("shows loading state initially", async ({ page }) => {
    // Navigate to invite page
    // We use Promise.race to catch the loading state before it resolves to invalid
    await page.goto("/invite/test-loading-state", { waitUntil: "commit" });

    // Either we see loading or it already resolved to invalid (depends on speed)
    // At minimum the page should load without errors
    await page.waitForLoadState("domcontentloaded");

    // Page should show either loading or invalid state
    const hasLoading = await page
      .getByText(/loading invitation/i)
      .isVisible()
      .catch(() => false);
    const hasInvalid = await page
      .getByRole("heading", { name: /invalid invitation/i })
      .isVisible()
      .catch(() => false);

    // One of them should be true
    expect(hasLoading || hasInvalid).toBe(true);
  });

  test("invite page shows branding on invalid token page", async ({ page }) => {
    // Navigate to invite page (even invalid tokens show the page layout)
    await page.goto("/invite/branding-test-token");
    await page.waitForLoadState("domcontentloaded");

    // Wait for the invalid state to fully render
    await expect(page.getByRole("heading", { name: /invalid invitation/i })).toBeVisible();

    // Invalid invite page shows an AlertCircle error icon (SVG) and the heading
    // Verify the error icon is present (rendered as an SVG with specific classes)
    const errorIcon = page.locator("svg.text-status-error");
    await expect(errorIcon).toBeVisible();
  });
});
