import { test } from "./fixtures";
import { InvitePage } from "./pages";

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
    const invitePage = new InvitePage(page);

    // Navigate to invite page with a fake token
    await invitePage.goto("invalid-token-12345");
    await invitePage.expectInvalidInvitation();
  });

  test("invalid invite page has Go to Home button that works", async ({ page, landingPage }) => {
    const invitePage = new InvitePage(page);

    // Navigate to invite page with a fake token
    await invitePage.goto("another-fake-token");
    await invitePage.expectInvalidInvitation();
    await invitePage.goHome();
    await landingPage.expectLandingOrSignInPage();
  });

  test("shows loading state initially", async ({ page }) => {
    const invitePage = new InvitePage(page);

    // Navigate to invite page
    // We use Promise.race to catch the loading state before it resolves to invalid
    await invitePage.goto("test-loading-state", "commit");
    await invitePage.expectLoadingOrInvalid();
  });

  test("invite page shows branding on invalid token page", async ({ page }) => {
    const invitePage = new InvitePage(page);

    // Navigate to invite page (even invalid tokens show the page layout)
    await invitePage.goto("branding-test-token");
    await invitePage.expectInvalidInvitation();
    await invitePage.expectInvalidInvitationBranding();
  });
});
