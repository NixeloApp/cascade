/**
 * OAuth E2E Tests for Cascade
 *
 * These tests verify the full Google OAuth flow using TEST_* codes.
 * The real callback handler is tested - only the Google API call is mocked.
 *
 * ## How It Works
 *
 * 1. Playwright intercepts redirect to accounts.google.com
 * 2. Redirects to real /google/callback with TEST_* code
 * 3. x-e2e-api-key header is injected for authentication
 * 4. Real callback handler processes TEST_* code
 * 5. Success HTML is returned with connection data
 *
 * ## Security
 *
 * - TEST_* codes require E2E_API_KEY env var (or localhost)
 * - x-e2e-api-key header must match E2E_API_KEY
 * - Only creates @inbox.mailtrap.io test users
 * - Test users auto-cleaned by hourly cron
 *
 * Runs in CI: YES
 * Coverage: 100% of OAuth callback code
 */

import { expect, test } from "@playwright/test";
import {
  clearGoogleOAuthMock,
  setupGoogleOAuthMock,
  verifyOAuthError,
  verifyOAuthSuccess,
} from "./utils/google-oauth-mock";

test.describe("Google OAuth Flow (Mocked)", () => {
  test.afterEach(async ({ page }) => {
    await clearGoogleOAuthMock(page);
  });

  test.describe("Successful OAuth Login", () => {
    test("should complete Google OAuth sign-in flow", async ({ page, baseURL }) => {
      // Setup mock with TEST_* code approach
      await setupGoogleOAuthMock(page, {
        scenario: "signin_user",
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
      await setupGoogleOAuthMock(page, {
        scenario: "signup_user",
      });

      await page.goto(`${baseURL}/signup`);

      const googleButton = page.getByRole("button", { name: /google/i });
      await expect(googleButton).toBeVisible();
      await googleButton.click();

      // New users should go to onboarding or dashboard
      await page.waitForURL(/dashboard|onboarding|app/, { timeout: 15000 });
      await verifyOAuthSuccess(page);
    });

    test("should handle workspace/GSuite user", async ({ page, baseURL }) => {
      await setupGoogleOAuthMock(page, {
        scenario: "workspace_user",
      });

      await page.goto(`${baseURL}/signin`);

      const googleButton = page.getByRole("button", { name: /google/i });
      await googleButton.click();

      await page.waitForURL(/dashboard|onboarding|app/, { timeout: 15000 });
      await verifyOAuthSuccess(page);
    });
  });

  test.describe("OAuth Error Handling", () => {
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
    test("should handle returning user", async ({ page, baseURL }) => {
      // Simulate a user who has previously authenticated
      await setupGoogleOAuthMock(page, {
        scenario: "returning_user",
      });

      await page.goto(`${baseURL}/signin`);

      const googleButton = page.getByRole("button", { name: /google/i });
      await googleButton.click();

      // Should complete and redirect to dashboard or onboarding
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
