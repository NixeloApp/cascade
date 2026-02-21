/**
 * Google OAuth Mock Helpers for Cascade
 *
 * These helpers intercept Google OAuth endpoints and simulate the OAuth flow
 * without hitting real Google servers. This enables:
 *
 * 1. Testing the full OAuth UI flow locally
 * 2. Testing error scenarios (user denies, Google errors)
 * 3. Faster test execution (no real network calls)
 * 4. No flaky tests due to Google captchas or rate limits
 *
 * IMPORTANT: These mocks only work locally, not in CI.
 * In CI, we use:
 * - e2e/oauth-security.spec.ts for HTTP endpoint testing
 * - Session injection for authenticated E2E tests
 *
 * Usage:
 * ```typescript
 * await setupGoogleOAuthMock(page, { email: 'test@example.com' });
 * await page.getByRole('button', { name: /google/i }).click();
 * // OAuth flow completes automatically with mocked data
 * await expect(page).toHaveURL(/dashboard/);
 * ```
 */

import type { Page, Route } from "@playwright/test";
import { expect } from "@playwright/test";

export interface GoogleOAuthMockOptions {
  /**
   * Email to return from the mocked Google profile
   * @default 'test@example.com'
   */
  email?: string;

  /**
   * Google user ID to return
   * @default '118234567890123456789'
   */
  googleId?: string;

  /**
   * User's name
   * @default 'Test User'
   */
  name?: string;

  /**
   * Profile picture URL
   * @default 'https://lh3.googleusercontent.com/a/default-user=s96-c'
   */
  picture?: string;

  /**
   * If true, simulate a failure scenario
   */
  shouldFail?: boolean;

  /**
   * Type of error to simulate
   */
  errorType?: "access_denied" | "invalid_grant" | "server_error";

  /**
   * Delay before completing the mock (simulates network latency)
   * @default 100
   */
  delayMs?: number;
}

/**
 * Creates a mock Google ID token (JWT format, not cryptographically valid)
 */
function createMockGoogleIdToken(options: GoogleOAuthMockOptions): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");

  const [firstName, lastName] = (options.name || "Test User").split(" ");

  const payload = Buffer.from(
    JSON.stringify({
      iss: "https://accounts.google.com",
      azp: "test-client-id.apps.googleusercontent.com",
      aud: "test-client-id.apps.googleusercontent.com",
      sub: options.googleId || "118234567890123456789",
      email: options.email || "test@example.com",
      email_verified: true,
      at_hash: "mock_at_hash",
      name: options.name || "Test User",
      picture: options.picture || "https://lh3.googleusercontent.com/a/default-user=s96-c",
      given_name: firstName || "Test",
      family_name: lastName || "User",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString("base64url");

  const signature = Buffer.from("mock_signature").toString("base64url");

  return `${header}.${payload}.${signature}`;
}

/**
 * Sets up route interception to mock Google OAuth flow for Cascade
 *
 * Cascade uses @convex-dev/auth which handles OAuth differently.
 * This intercepts the Google OAuth redirect and simulates the flow.
 */
export async function setupGoogleOAuthMock(
  page: Page,
  options: GoogleOAuthMockOptions = {},
): Promise<void> {
  const {
    email = "test@example.com",
    googleId = "118234567890123456789",
    name = "Test User",
    picture = "https://lh3.googleusercontent.com/a/default-user=s96-c",
    shouldFail = false,
    errorType = "access_denied",
    delayMs = 100,
  } = options;

  // Store the state parameter from the initial OAuth request
  let capturedState: string | null = null;

  // Intercept the redirect to Google OAuth
  await page.route("**/accounts.google.com/**", async (route: Route) => {
    const url = new URL(route.request().url());

    // Extract OAuth parameters
    capturedState = url.searchParams.get("state");
    const redirectUri = url.searchParams.get("redirect_uri");

    if (!redirectUri) {
      await route.abort("failed");
      return;
    }

    // Add delay to simulate network latency
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    if (shouldFail) {
      // Simulate error by redirecting with error parameter
      const errorUrl = new URL(redirectUri);
      errorUrl.searchParams.set("error", errorType);
      if (capturedState) {
        errorUrl.searchParams.set("state", capturedState);
      }

      await page.goto(errorUrl.toString());
      await route.abort("failed");
      return;
    }

    // Success: Redirect back to our callback with a mock auth code
    const successUrl = new URL(redirectUri);
    successUrl.searchParams.set("code", `mock_auth_code_${Date.now()}`);
    if (capturedState) {
      successUrl.searchParams.set("state", capturedState);
    }

    // Navigate to the callback URL
    await page.goto(successUrl.toString());
    await route.abort("failed");
  });

  // Intercept Google's token exchange endpoint
  await page.route("**/oauth2.googleapis.com/token", async (route: Route) => {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    if (shouldFail) {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error: errorType === "invalid_grant" ? "invalid_grant" : "access_denied",
          error_description:
            errorType === "invalid_grant"
              ? "Token has been expired or revoked."
              : "User denied access.",
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: `mock_access_token_${Date.now()}`,
        refresh_token: `mock_refresh_token_${Date.now()}`,
        id_token: createMockGoogleIdToken({ email, googleId, name, picture }),
        token_type: "Bearer",
        expires_in: 3600,
        scope: "openid email profile",
      }),
    });
  });

  // Intercept Google's userinfo endpoint
  await page.route("**/www.googleapis.com/oauth2/**", async (route: Route) => {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    if (shouldFail) {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: 401,
            message: "Invalid Credentials",
            status: "UNAUTHENTICATED",
          },
        }),
      });
      return;
    }

    const [firstName, lastName] = name.split(" ");

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: googleId,
        email: email,
        verified_email: true,
        name: name,
        given_name: firstName || "Test",
        family_name: lastName || "User",
        picture: picture,
        locale: "en",
      }),
    });
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
 */
export async function setupGoogleCalendarOAuthMock(
  page: Page,
  options: {
    email?: string;
    calendarId?: string;
    shouldFail?: boolean;
  } = {},
): Promise<void> {
  const { email = "test@example.com", shouldFail = false } = options;

  // Intercept the calendar OAuth redirect
  await page.route("**/accounts.google.com/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const redirectUri = url.searchParams.get("redirect_uri");

    if (!redirectUri) {
      await route.abort("failed");
      return;
    }

    // For Cascade, the calendar callback returns HTML that posts a message
    if (shouldFail) {
      const errorUrl = new URL(redirectUri);
      errorUrl.searchParams.set("error", "access_denied");
      await page.goto(errorUrl.toString());
    } else {
      const successUrl = new URL(redirectUri);
      successUrl.searchParams.set("code", `mock_calendar_code_${Date.now()}`);
      await page.goto(successUrl.toString());
    }

    await route.abort("failed");
  });

  // Mock the token exchange
  await page.route("**/oauth2.googleapis.com/token", async (route: Route) => {
    if (shouldFail) {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "access_denied" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: `mock_calendar_access_token_${Date.now()}`,
        refresh_token: `mock_calendar_refresh_token_${Date.now()}`,
        expires_in: 3600,
      }),
    });
  });

  // Mock the userinfo endpoint (to get email)
  await page.route("**/www.googleapis.com/oauth2/v2/userinfo", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        email: email,
        verified_email: true,
      }),
    });
  });

  // Mock the calendar events endpoint
  await page.route("**/www.googleapis.com/calendar/v3/**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        kind: "calendar#events",
        items: [],
        nextPageToken: null,
      }),
    });
  });
}
