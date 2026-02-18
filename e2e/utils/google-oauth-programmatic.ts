/**
 * Programmatic Google OAuth Helper for E2E Testing
 *
 * This helper provides a way to authenticate with Google OAuth without
 * going through the browser-based OAuth flow. It uses a pre-generated
 * refresh token (from OAuth Playground or OAUTH_MONITOR) to authenticate programmatically.
 *
 * Benefits:
 * - No captchas or flakiness from Google's login UI
 * - Fast and reliable authentication in E2E tests
 * - Still tests real Google API integration
 * - Still tests real user creation/login flow
 *
 * @see https://developers.google.com/oauthplayground - for generating refresh tokens
 */

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { E2E_ENDPOINTS, getE2EHeaders } from "../config";

/**
 * Configuration for programmatic Google OAuth
 */
export interface GoogleOAuthConfig {
  /** Google OAuth refresh token (from OAuth Playground or OAUTH_MONITOR env var) */
  refreshToken?: string;
  /** Skip onboarding for new users */
  skipOnboarding?: boolean;
}

/**
 * Result from programmatic Google OAuth authentication
 */
export interface GoogleOAuthResult {
  /** Whether authentication succeeded */
  success: boolean;
  /** User's email address from Google */
  email?: string;
  /** Convex user ID */
  userId?: string;
  /** Auth token for API calls */
  token?: string;
  /** Refresh token for maintaining session */
  refreshToken?: string;
  /** Recommended redirect URL after authentication */
  redirectUrl?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Authenticate using Google OAuth programmatically (bypasses OAuth UI)
 *
 * This function:
 * 1. Calls the backend E2E endpoint with a refresh token
 * 2. Backend exchanges refresh token with Google for access token
 * 3. Backend creates/logs in user and returns auth tokens
 * 4. Returns tokens for the test to use
 *
 * Note: Unlike StartHub, Cascade uses Convex auth which stores tokens
 * in localStorage, not cookies. You'll need to set the tokens after calling this.
 *
 * @param config - OAuth configuration including refresh token
 * @returns Authentication result with tokens and redirect URL
 *
 * @example
 * ```typescript
 * const result = await loginWithGoogleOAuth({ skipOnboarding: true });
 * // Set tokens in browser localStorage
 * await page.evaluate((tokens) => {
 *   localStorage.setItem('convex_auth_token', tokens.token);
 * }, { token: result.token });
 * await page.goto(result.redirectUrl);
 * ```
 */
export async function loginWithGoogleOAuth(
  config: GoogleOAuthConfig = {},
): Promise<GoogleOAuthResult> {
  const { refreshToken, skipOnboarding = false } = config;

  console.log("[GOOGLE-OAUTH] Starting programmatic authentication...");

  const response = await fetch(E2E_ENDPOINTS.googleOAuthLogin, {
    method: "POST",
    headers: getE2EHeaders(),
    body: JSON.stringify({
      refreshToken,
      skipOnboarding,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[GOOGLE-OAUTH] Authentication failed: ${response.status} - ${errorText}`);
    throw new Error(`Google OAuth failed: ${response.status} - ${errorText}`);
  }

  const result = (await response.json()) as GoogleOAuthResult;

  if (!result.success) {
    console.error(`[GOOGLE-OAUTH] Authentication failed: ${result.error}`);
    throw new Error(`Google OAuth failed: ${result.error}`);
  }

  console.log(`[GOOGLE-OAUTH] Successfully authenticated as ${result.email}`);

  return result;
}

/**
 * Login with Google OAuth and set up browser session
 *
 * This convenience wrapper:
 * 1. Authenticates with Google OAuth via backend
 * 2. Sets auth tokens in browser localStorage
 * 3. Navigates to the redirect URL
 *
 * @param page - Playwright page object
 * @param config - OAuth configuration
 * @returns Authentication result
 *
 * @example
 * ```typescript
 * await loginWithGoogleOAuthAndNavigate(page, { skipOnboarding: true });
 * await expect(page).toHaveURL(/app|onboarding/);
 * ```
 */
export async function loginWithGoogleOAuthAndNavigate(
  page: Page,
  config: GoogleOAuthConfig = {},
): Promise<GoogleOAuthResult> {
  const result = await loginWithGoogleOAuth(config);

  // Get site URL for navigation
  const siteUrl = process.env.SITE_URL || "http://localhost:5173";

  // Navigate to site first to set localStorage
  await page.goto(siteUrl, { waitUntil: "domcontentloaded" });

  // Set auth tokens in localStorage (Convex auth pattern)
  if (result.token) {
    await page.evaluate(
      (tokens) => {
        // Convex stores auth in a specific format
        // This matches the @convex-dev/auth token storage
        localStorage.setItem("__convexAuthJWT", tokens.token);
        if (tokens.refreshToken) {
          localStorage.setItem("__convexAuthRefreshToken", tokens.refreshToken);
        }
      },
      { token: result.token, refreshToken: result.refreshToken },
    );
  }

  // Navigate to the redirect URL
  const redirectUrl = result.redirectUrl || "/app";
  console.log(`[GOOGLE-OAUTH] Navigating to ${redirectUrl}`);
  await page.goto(`${siteUrl}${redirectUrl}`, { waitUntil: "domcontentloaded" });

  return result;
}

/**
 * Verify that Google OAuth authentication was successful
 *
 * Checks:
 * - User is on expected page (dashboard or onboarding)
 * - No error messages are displayed
 * - Auth tokens are present in localStorage
 *
 * @param page - Playwright page object
 */
export async function verifyGoogleOAuthSuccess(page: Page): Promise<void> {
  // Should be on app or onboarding
  await expect(page).toHaveURL(/app|onboarding|dashboard/);

  // Should not have error messages
  const errorAlert = page.locator('[role="alert"], .error-message, [data-testid="error"]');
  await expect(errorAlert).not.toBeVisible();

  // Verify tokens are set in localStorage
  const hasToken = await page.evaluate(() => {
    return !!localStorage.getItem("__convexAuthJWT");
  });

  if (!hasToken) {
    console.warn("[GOOGLE-OAUTH] Auth token may not be set in localStorage");
  }
}

/**
 * Get Google OAuth config from environment variables
 *
 * Uses OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN if available.
 * The token should have: email, profile, openid scopes.
 *
 * @returns OAuth config (with empty refreshToken if not set - backend will use its own)
 */
export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  return {
    // Don't require refresh token - backend will use OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN
    refreshToken: process.env.OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN,
    skipOnboarding: false,
  };
}
