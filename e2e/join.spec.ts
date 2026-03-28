import { test } from "./fixtures";
import { JoinPage } from "./pages";

/**
 * Join Page E2E Tests
 *
 * Tests the invitation acceptance flow:
 * - Invalid token shows error state
 * - Loading state while fetching invite details
 *
 * Note: Full acceptance flow requires creating invites via API,
 * which would need test-user-service extension. For now, we test
 * the error states and page structure.
 */

test.describe("Join Page", () => {
  test("shows invalid invitation message for non-existent token", async ({ page }) => {
    const invitePage = new JoinPage(page);

    // Navigate to join page with a fake token
    await invitePage.goto("invalid-token-12345");
    await invitePage.expectInvalidInvitation();
  });

  test("invalid join page has Go to Home button that works", async ({ page, landingPage }) => {
    const invitePage = new JoinPage(page);

    // Navigate to join page with a fake token
    await invitePage.goto("another-fake-token");
    await invitePage.expectInvalidInvitation();
    await invitePage.goHome();
    await landingPage.expectLandingOrSignInPage();
  });

  test("shows loading state initially", async ({ page }) => {
    const invitePage = new JoinPage(page);

    // Navigate to join page
    await invitePage.goto("test-loading-state", "commit");
    await invitePage.expectLoadingOrInvalid();
  });

  test("join page shows branding on invalid token page", async ({ page }) => {
    const invitePage = new JoinPage(page);

    // Navigate to join page (even invalid tokens show the page layout)
    await invitePage.goto("branding-test-token");
    await invitePage.expectInvalidInvitation();
    await invitePage.expectInvalidInvitationBranding();
  });
});
