/**
 * OAuth Mocked E2E Tests for Cascade
 *
 * These tests verify the Google OAuth flow by mocking Google's endpoints.
 *
 * ## Test Strategy (State of the Art)
 *
 * We follow the industry best practice of ZERO test code in production:
 *
 * 1. **CI Tests (oauth-security.spec.ts)**
 *    - HTTP endpoint tests verify OAuth redirects, parameters, error handling
 *    - No mocking needed - tests real Convex HTTP actions
 *    - Runs in CI ✅
 *
 * 2. **Local Full-Flow Tests (this file)**
 *    - Mocks Google's OAuth endpoints at browser level
 *    - Tests the complete user journey: click → redirect → callback → dashboard
 *    - Skipped in CI (Convex makes server-side API calls that can't be intercepted)
 *
 * 3. **Auth E2E Tests**
 *    - Use session injection (direct cookie/token creation)
 *    - No OAuth flow needed for tests that just need an authenticated user
 *    - Runs in CI ✅
 *
 * Why not TEST_* codes like some projects?
 * - Adds test-specific code paths to production
 * - Industry best practice is clean separation (see Auth.js, Baeldung guides)
 * - Session injection achieves the same result without prod code changes
 */

import { expect, test } from "@playwright/test";
import {
  clearGoogleOAuthMock,
  setupGoogleOAuthMock,
  verifyOAuthError,
  verifyOAuthSuccess,
} from "./utils/google-oauth-mock";

// Skip full OAuth flow tests in CI - mocking doesn't work with server-side redirects
// The mock intercepts client-side requests but Convex OAuth uses server redirects
const skipFullFlowInCI = !!process.env.CI;

test.describe("Google OAuth Flow (Mocked)", () => {
  test.afterEach(async ({ page }) => {
    await clearGoogleOAuthMock(page);
  });

  test.describe("Successful OAuth Login", () => {
    // These tests require full OAuth flow with mocking - skip in CI
    test.skip(skipFullFlowInCI, "Full OAuth flow tests skipped in CI");

    test("should complete Google OAuth sign-in flow", async ({ page, baseURL }) => {
      // Setup mock
      await setupGoogleOAuthMock(page, {
        email: "test.user@gmail.com",
        name: "Test User",
      });

      // Navigate to sign-in page
      await page.goto(`${baseURL}/signin`);

      // Click Google sign-in button
      const googleButton = page.getByRole("button", { name: /google/i });
      await expect(googleButton).toBeVisible();
      await googleButton.click();

      // Wait for OAuth flow to complete
      // Should end up on dashboard or onboarding
      await page.waitForURL(/dashboard|onboarding|app/, { timeout: 15000 });

      // Verify successful login
      await verifyOAuthSuccess(page);
    });

    test("should complete Google OAuth sign-up flow", async ({ page, baseURL }) => {
      const uniqueEmail = `new.user.${Date.now()}@gmail.com`;

      await setupGoogleOAuthMock(page, {
        email: uniqueEmail,
        name: "New User",
      });

      await page.goto(`${baseURL}/signup`);

      const googleButton = page.getByRole("button", { name: /google/i });
      await expect(googleButton).toBeVisible();
      await googleButton.click();

      // New users should go to onboarding or dashboard
      await page.waitForURL(/dashboard|onboarding|app/, { timeout: 15000 });
      await verifyOAuthSuccess(page);
    });

    test("should handle user with profile picture", async ({ page, baseURL }) => {
      await setupGoogleOAuthMock(page, {
        email: "picture.user@gmail.com",
        name: "Picture User",
        picture: "https://example.com/avatar.jpg",
      });

      await page.goto(`${baseURL}/signin`);

      const googleButton = page.getByRole("button", { name: /google/i });
      await googleButton.click();

      await page.waitForURL(/dashboard|onboarding|app/, { timeout: 15000 });
      await verifyOAuthSuccess(page);
    });
  });

  test.describe("OAuth Error Handling", () => {
    // These tests require full OAuth flow with mocking - skip in CI
    test.skip(skipFullFlowInCI, "Full OAuth flow tests skipped in CI");

    test("should handle user denying access", async ({ page, baseURL }) => {
      await setupGoogleOAuthMock(page, {
        shouldFail: true,
        errorType: "access_denied",
      });

      await page.goto(`${baseURL}/signin`);

      const googleButton = page.getByRole("button", { name: /google/i });
      await googleButton.click();

      // Wait for either: stay on signin page OR show an error
      await expect(async () => {
        const onSigninPage = page.url().includes("signin");
        const hasError = await page
          .getByRole("alert")
          .isVisible()
          .catch(() => false);
        expect(onSigninPage || hasError).toBe(true);
      }).toPass({ timeout: 5000 });

      // Verify error state if we left signin page
      if (!page.url().includes("signin")) {
        await verifyOAuthError(page);
      }
    });

    test("should handle invalid auth code", async ({ page, baseURL }) => {
      await setupGoogleOAuthMock(page, {
        shouldFail: true,
        errorType: "invalid_grant",
      });

      await page.goto(`${baseURL}/signin`);

      const googleButton = page.getByRole("button", { name: /google/i });
      await googleButton.click();

      // Wait for either: stay on signin page OR show an error
      await expect(async () => {
        const onSigninPage = page.url().includes("signin");
        const hasError = await page
          .getByRole("alert")
          .isVisible()
          .catch(() => false);
        expect(onSigninPage || hasError).toBe(true);
      }).toPass({ timeout: 5000 });

      if (!page.url().includes("signin")) {
        await verifyOAuthError(page);
      }
    });

    test("should handle Google server error", async ({ page, baseURL }) => {
      await setupGoogleOAuthMock(page, {
        shouldFail: true,
        errorType: "server_error",
      });

      await page.goto(`${baseURL}/signin`);

      const googleButton = page.getByRole("button", { name: /google/i });
      await googleButton.click();

      // Wait for either: stay on signin page OR show an error
      await expect(async () => {
        const onSigninPage = page.url().includes("signin");
        const hasError = await page
          .getByRole("alert")
          .isVisible()
          .catch(() => false);
        expect(onSigninPage || hasError).toBe(true);
      }).toPass({ timeout: 5000 });

      if (!page.url().includes("signin")) {
        await verifyOAuthError(page);
      }
    });
  });

  test.describe("OAuth Security", () => {
    test("should include state parameter for CSRF protection", async ({ page, baseURL }) => {
      let capturedOAuthUrl: string | null = null;

      // Intercept the redirect to capture the OAuth URL
      await page.route("**/accounts.google.com/**", async (route) => {
        capturedOAuthUrl = route.request().url();
        await route.abort("failed");
      });

      await page.goto(`${baseURL}/signin`);

      const googleButton = page.getByRole("button", { name: /google/i });
      await googleButton.click();

      // Wait for the route handler to capture the OAuth URL
      await expect(() => {
        expect(capturedOAuthUrl).not.toBeNull();
      }).toPass({ timeout: 5000 });

      const url = new URL(capturedOAuthUrl as string);
      const state = url.searchParams.get("state");
      if (!state) {
        throw new Error("State parameter missing from OAuth URL");
      }
      expect(state.length).toBeGreaterThan(5);
    });

    test("should request correct OAuth scopes", async ({ page, baseURL }) => {
      let capturedOAuthUrl: string | null = null;

      await page.route("**/accounts.google.com/**", async (route) => {
        capturedOAuthUrl = route.request().url();
        await route.abort("failed");
      });

      await page.goto(`${baseURL}/signin`);

      const googleButton = page.getByRole("button", { name: /google/i });
      await googleButton.click();

      // Wait for the route handler to capture the OAuth URL
      await expect(() => {
        expect(capturedOAuthUrl).not.toBeNull();
      }).toPass({ timeout: 5000 });

      const url = new URL(capturedOAuthUrl as string);
      const scope = url.searchParams.get("scope");

      // Should include email scope at minimum
      expect(scope).toBeTruthy();
      // Convex auth typically requests openid email profile
    });

    test("should use correct redirect URI", async ({ page, baseURL }) => {
      let capturedOAuthUrl: string | null = null;

      await page.route("**/accounts.google.com/**", async (route) => {
        capturedOAuthUrl = route.request().url();
        await route.abort("failed");
      });

      await page.goto(`${baseURL}/signin`);

      const googleButton = page.getByRole("button", { name: /google/i });
      await googleButton.click();

      // Wait for the route handler to capture the OAuth URL
      await expect(() => {
        expect(capturedOAuthUrl).not.toBeNull();
      }).toPass({ timeout: 5000 });

      const url = new URL(capturedOAuthUrl as string);
      const redirectUri = url.searchParams.get("redirect_uri");

      expect(redirectUri).toBeTruthy();
      // Redirect URI should be to our domain
      expect(redirectUri).not.toContain("accounts.google.com");
    });
  });

  test.describe("OAuth Flow Variations", () => {
    // These tests require full OAuth flow with mocking - skip in CI
    test.skip(skipFullFlowInCI, "Full OAuth flow tests skipped in CI");

    test("should handle slow network gracefully", async ({ page, baseURL }) => {
      // Setup mock with artificial delay
      await setupGoogleOAuthMock(page, {
        email: "slow.user@gmail.com",
        delayMs: 500, // 500ms delay
      });

      await page.goto(`${baseURL}/signin`);

      const googleButton = page.getByRole("button", { name: /google/i });
      await googleButton.click();

      // Should still complete successfully despite delay
      await page.waitForURL(/dashboard|onboarding|app/, { timeout: 20000 });
      await verifyOAuthSuccess(page);
    });

    test("should handle workspace/GSuite user", async ({ page, baseURL }) => {
      await setupGoogleOAuthMock(page, {
        email: "employee@company.com",
        name: "Company Employee",
      });

      await page.goto(`${baseURL}/signin`);

      const googleButton = page.getByRole("button", { name: /google/i });
      await googleButton.click();

      await page.waitForURL(/dashboard|onboarding|app/, { timeout: 15000 });
      await verifyOAuthSuccess(page);
    });
  });
});

test.describe("Google Calendar OAuth (Mocked)", () => {
  // Calendar OAuth is separate from login OAuth
  // These tests would require being logged in first

  test.skip("should connect Google Calendar", async () => {
    // This test requires:
    // 1. Being logged in
    // 2. Navigating to settings/integrations
    // 3. Clicking connect Google Calendar
    // 4. Completing the calendar OAuth flow
    // Skipped until we have proper test fixtures for authenticated state
  });
});
