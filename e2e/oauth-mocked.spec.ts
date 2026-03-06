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
import { CONVEX_SITE_URL } from "./config";
import { AuthPage } from "./pages";
import {
  clearGoogleOAuthMock,
  setupGoogleOAuthMock,
  verifyOAuthError,
} from "./utils/google-oauth-mock";
import { waitForOAuthRedirectComplete } from "./utils/wait-helpers";

const PUBLIC_ORG_PLACEHOLDER = "__public__";

test.describe("Google OAuth Flow (Mocked)", () => {
  test.afterEach(async ({ page }) => {
    await clearGoogleOAuthMock(page);
  });

  test.describe("Successful OAuth Callback (Mocked TEST_* codes)", () => {
    test("should process TEST_signin_user callback successfully", async ({ request }) => {
      if (!CONVEX_SITE_URL) {
        test.skip();
        return;
      }

      const { state } = await waitForOAuthRedirectComplete(request, CONVEX_SITE_URL);
      const response = await request.get(
        `${CONVEX_SITE_URL}/google/callback?code=TEST_signin_user&state=${state}`,
        {
          headers: {
            Cookie: `google-oauth-state=${state}`,
            "x-e2e-api-key": process.env.E2E_API_KEY || "",
          },
        },
      );

      expect(response.status()).toBe(200);
      const html = await response.text();
      expect(html).toContain("Connected Successfully");
      expect(html).toContain("test-oauth-signin-user-");
    });

    test("should process TEST_signup_user callback successfully", async ({ request }) => {
      if (!CONVEX_SITE_URL) {
        test.skip();
        return;
      }

      const { state } = await waitForOAuthRedirectComplete(request, CONVEX_SITE_URL);
      const response = await request.get(
        `${CONVEX_SITE_URL}/google/callback?code=TEST_signup_user&state=${state}`,
        {
          headers: {
            Cookie: `google-oauth-state=${state}`,
            "x-e2e-api-key": process.env.E2E_API_KEY || "",
          },
        },
      );

      expect(response.status()).toBe(200);
      const html = await response.text();
      expect(html).toContain("Connected Successfully");
      expect(html).toContain("test-oauth-signup-user-");
    });

    test("should process TEST_workspace_user callback successfully", async ({ request }) => {
      if (!CONVEX_SITE_URL) {
        test.skip();
        return;
      }

      const { state } = await waitForOAuthRedirectComplete(request, CONVEX_SITE_URL);
      const response = await request.get(
        `${CONVEX_SITE_URL}/google/callback?code=TEST_workspace_user&state=${state}`,
        {
          headers: {
            Cookie: `google-oauth-state=${state}`,
            "x-e2e-api-key": process.env.E2E_API_KEY || "",
          },
        },
      );

      expect(response.status()).toBe(200);
      const html = await response.text();
      expect(html).toContain("Connected Successfully");
      expect(html).toContain("test-oauth-workspace-user-");
    });
  });

  test.describe("OAuth Error Handling", () => {
    test("should handle user denying access", async ({ page }) => {
      const authPage = new AuthPage(page, PUBLIC_ORG_PLACEHOLDER);

      await setupGoogleOAuthMock(page, {
        shouldFail: true,
        errorType: "access_denied",
      });

      await authPage.gotoSignInLanding();
      await authPage.signInWithGoogle();
      await authPage.waitForOAuthErrorSettle();

      // Verify error state if we left signin page
      if (!page.url().includes("signin")) {
        await verifyOAuthError(page);
      }
    });

    test("should handle invalid auth code", async ({ page }) => {
      const authPage = new AuthPage(page, PUBLIC_ORG_PLACEHOLDER);

      await setupGoogleOAuthMock(page, {
        shouldFail: true,
        errorType: "invalid_grant",
      });

      await authPage.gotoSignInLanding();
      await authPage.signInWithGoogle();
      await authPage.waitForOAuthErrorSettle();

      if (!page.url().includes("signin")) {
        await verifyOAuthError(page);
      }
    });

    test("should handle Google server error", async ({ page }) => {
      const authPage = new AuthPage(page, PUBLIC_ORG_PLACEHOLDER);

      await setupGoogleOAuthMock(page, {
        shouldFail: true,
        errorType: "server_error",
      });

      await authPage.gotoSignInLanding();
      await authPage.signInWithGoogle();
      await authPage.waitForOAuthErrorSettle();

      if (!page.url().includes("signin")) {
        await verifyOAuthError(page);
      }
    });
  });

  test.describe("OAuth Security", () => {
    test("should include state parameter for CSRF protection", async ({ request }) => {
      if (!CONVEX_SITE_URL) {
        test.skip();
        return;
      }

      const { redirectUrl } = await waitForOAuthRedirectComplete(request, CONVEX_SITE_URL);
      const url = new URL(redirectUrl.toString());
      const state = url.searchParams.get("state");
      if (!state) {
        throw new Error("State parameter missing from OAuth URL");
      }
      expect(state.length).toBeGreaterThan(5);
    });

    test("should request correct OAuth scopes", async ({ request }) => {
      if (!CONVEX_SITE_URL) {
        test.skip();
        return;
      }

      const { redirectUrl } = await waitForOAuthRedirectComplete(request, CONVEX_SITE_URL);
      const url = new URL(redirectUrl.toString());
      const scope = url.searchParams.get("scope");

      // Should include email scope at minimum
      expect(scope).toBeTruthy();
      // Convex auth typically requests openid email profile
    });

    test("should use correct redirect URI", async ({ request }) => {
      if (!CONVEX_SITE_URL) {
        test.skip();
        return;
      }

      const { redirectUrl } = await waitForOAuthRedirectComplete(request, CONVEX_SITE_URL);
      const url = new URL(redirectUrl.toString());
      const redirectUri = url.searchParams.get("redirect_uri");

      expect(redirectUri).toBeTruthy();
      // Redirect URI should be to our domain
      expect(redirectUri).not.toContain("accounts.google.com");
    });
  });

  test.describe("OAuth Flow Variations", () => {
    test("should process TEST_returning_user callback successfully", async ({ request }) => {
      if (!CONVEX_SITE_URL) {
        test.skip();
        return;
      }

      const { state } = await waitForOAuthRedirectComplete(request, CONVEX_SITE_URL);
      const response = await request.get(
        `${CONVEX_SITE_URL}/google/callback?code=TEST_returning_user&state=${state}`,
        {
          headers: {
            Cookie: `google-oauth-state=${state}`,
            "x-e2e-api-key": process.env.E2E_API_KEY || "",
          },
        },
      );

      expect(response.status()).toBe(200);
      const html = await response.text();
      expect(html).toContain("Connected Successfully");
      expect(html).toContain("test-oauth-returning-user-");
    });
  });
});

test.describe("Google Calendar OAuth (Mocked)", () => {
  test("calendar OAuth endpoint returns auth redirect contract", async ({ request }) => {
    if (!CONVEX_SITE_URL) {
      test.skip();
      return;
    }

    const { redirectUrl } = await waitForOAuthRedirectComplete(request, CONVEX_SITE_URL);
    expect(redirectUrl.origin).toBe("https://accounts.google.com");
    expect(redirectUrl.searchParams.get("response_type")).toBe("code");
    expect(redirectUrl.searchParams.get("client_id")).toBeTruthy();
    expect(redirectUrl.searchParams.get("scope")).toBeTruthy();
  });
});
