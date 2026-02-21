/**
 * Google OAuth Mock Helpers for Cascade
 *
 * These helpers intercept Google OAuth endpoints and redirect to the real
 * callback with TEST_* codes. This tests the actual production code path
 * while bypassing Google's OAuth servers.
 *
 * ## How It Works
 *
 * 1. Intercepts redirect to accounts.google.com
 * 2. Redirects to real /google/callback with TEST_* code
 * 3. Injects x-e2e-api-key header for authentication
 * 4. Real callback handler processes TEST_* code and returns success HTML
 *
 * ## Security
 *
 * - TEST_* codes require E2E_API_KEY env var (or localhost)
 * - x-e2e-api-key header must match E2E_API_KEY
 * - Only creates @inbox.mailtrap.io test users (auto-cleaned by cron)
 *
 * ## Usage
 *
 * ```typescript
 * await setupGoogleOAuthMock(page, { scenario: 'new_user' });
 * await page.getByRole('button', { name: /google/i }).click();
 * // Real callback processes TEST_new_user code
 * await expect(page).toHaveURL(/dashboard/);
 * ```
 *
 * Runs in CI: YES (tests real callback code)
 */

import type { Page, Route } from "@playwright/test";
import { expect } from "@playwright/test";

export interface GoogleOAuthMockOptions {
  /**
   * Test scenario name - becomes TEST_{scenario} code
   * e.g., "new_user" -> TEST_new_user
   * @default 'user'
   */
  scenario?: string;

  /**
   * If true, simulate a failure scenario (user denies access)
   */
  shouldFail?: boolean;

  /**
   * Type of error to simulate when shouldFail is true
   */
  errorType?: "access_denied" | "invalid_grant" | "server_error";

  /**
   * @deprecated No longer used - email is generated from scenario
   */
  email?: string;

  /**
   * @deprecated No longer used - name not needed for TEST_* codes
   */
  name?: string;

  /**
   * @deprecated No longer used - picture not needed for TEST_* codes
   */
  picture?: string;

  /**
   * @deprecated No longer used - delays handled by real callback
   */
  delayMs?: number;
}

/**
 * Sets up route interception to redirect Google OAuth to real callback with TEST_* codes
 *
 * This approach:
 * 1. Intercepts the redirect to Google
 * 2. Redirects to the REAL /google/callback with TEST_* code
 * 3. Injects x-e2e-api-key header for authentication
 * 4. Tests the actual production callback code
 */
export async function setupGoogleOAuthMock(
  page: Page,
  options: GoogleOAuthMockOptions = {},
): Promise<void> {
  const { scenario = "user", shouldFail = false, errorType = "access_denied" } = options;

  // Intercept the callback request to inject the E2E API key header
  await page.route("**/google/callback**", async (route: Route) => {
    const request = route.request();
    const headers = {
      ...request.headers(),
      "x-e2e-api-key": process.env.E2E_API_KEY || "",
    };
    await route.continue({ headers });
  });

  // Intercept the redirect to Google OAuth
  await page.route("**/accounts.google.com/**", async (route: Route) => {
    const url = new URL(route.request().url());

    // Extract OAuth parameters
    const state = url.searchParams.get("state");
    const redirectUri = url.searchParams.get("redirect_uri");

    if (!redirectUri) {
      await route.abort("failed");
      return;
    }

    if (shouldFail) {
      // Simulate error by redirecting with error parameter
      const errorUrl = new URL(redirectUri);
      errorUrl.searchParams.set("error", errorType);
      if (state) {
        errorUrl.searchParams.set("state", state);
      }

      await page.goto(errorUrl.toString());
      await route.abort("failed");
      return;
    }

    // Success: Redirect to real callback with TEST_* code
    const successUrl = new URL(redirectUri);
    successUrl.searchParams.set("code", `TEST_${scenario}`);
    if (state) {
      successUrl.searchParams.set("state", state);
    }

    // Navigate to the real callback URL (route intercept will add header)
    await page.goto(successUrl.toString());
    await route.abort("failed");
  });
}

/**
 * Clears all Google OAuth route mocks
 */
export async function clearGoogleOAuthMock(page: Page): Promise<void> {
  await page.unrouteAll({ behavior: "wait" });
}

/**
 * Verifies that the OAuth flow completed successfully
 */
export async function verifyOAuthSuccess(page: Page): Promise<void> {
  // Should not be on signin/signup page
  await expect(page).not.toHaveURL(/signin|signup/);

  // Should not show error toast
  const errorToast = page.locator('[data-sonner-toast][data-type="error"]');
  await expect(errorToast).not.toBeVisible();
}

/**
 * Verifies that an OAuth error occurred
 */
export async function verifyOAuthError(page: Page): Promise<void> {
  // Should either show error or stay on auth page
  const onAuthPage = /signin|signup/.test(page.url());

  if (!onAuthPage) {
    // If not on auth page, there should be an error toast
    const errorToast = page.locator('[data-sonner-toast][data-type="error"]');
    await expect(errorToast).toBeVisible();
  }
}

/**
 * Sets up mock for Google Calendar OAuth (for calendar integration, not login)
 *
 * Uses TEST_* codes just like the auth flow - tests real callback code.
 */
export async function setupGoogleCalendarOAuthMock(
  page: Page,
  options: {
    scenario?: string;
    shouldFail?: boolean;
  } = {},
): Promise<void> {
  const { scenario = "calendar", shouldFail = false } = options;

  // Intercept the callback request to inject the E2E API key header
  await page.route("**/google/callback**", async (route: Route) => {
    const request = route.request();
    const headers = {
      ...request.headers(),
      "x-e2e-api-key": process.env.E2E_API_KEY || "",
    };
    await route.continue({ headers });
  });

  // Intercept the calendar OAuth redirect
  await page.route("**/accounts.google.com/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const state = url.searchParams.get("state");
    const redirectUri = url.searchParams.get("redirect_uri");

    if (!redirectUri) {
      await route.abort("failed");
      return;
    }

    if (shouldFail) {
      const errorUrl = new URL(redirectUri);
      errorUrl.searchParams.set("error", "access_denied");
      if (state) {
        errorUrl.searchParams.set("state", state);
      }
      await page.goto(errorUrl.toString());
    } else {
      const successUrl = new URL(redirectUri);
      successUrl.searchParams.set("code", `TEST_${scenario}`);
      if (state) {
        successUrl.searchParams.set("state", state);
      }
      await page.goto(successUrl.toString());
    }

    await route.abort("failed");
  });
}
