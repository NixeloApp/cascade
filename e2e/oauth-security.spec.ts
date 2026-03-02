/**
 * OAuth Security E2E Tests
 *
 * Testing OAuth security features:
 * 1. CSRF protection via state parameter
 * 2. Redirect URI validation (open redirect prevention)
 * 3. Error handling (no sensitive info leakage)
 * 4. OAuth endpoint availability
 *
 * These tests verify the Google Calendar OAuth integration endpoints
 * at the HTTP action level.
 */

import { expect, test } from "@playwright/test";
import { waitForOAuthRedirectComplete } from "./utils/wait-helpers";

// Convex site URL for HTTP actions
const CONVEX_SITE_URL = process.env.VITE_CONVEX_URL?.replace(".cloud", ".site") || "";

test.describe("OAuth Security", () => {
  test.describe("Endpoint Availability", () => {
    test("should have /google/auth endpoint that redirects to Google", async ({ request }) => {
      // Skip if Convex not configured
      if (!CONVEX_SITE_URL) {
        test.skip();
        return;
      }

      const { redirectUrl } = await waitForOAuthRedirectComplete(request, CONVEX_SITE_URL);
      expect(redirectUrl.toString()).toContain("accounts.google.com");
    });

    test("should include required OAuth parameters in redirect", async ({ request }) => {
      if (!CONVEX_SITE_URL) {
        test.skip();
        return;
      }

      const { redirectUrl } = await waitForOAuthRedirectComplete(request, CONVEX_SITE_URL);

      // Required OAuth parameters
      expect(redirectUrl.searchParams.get("client_id")).toBeTruthy();
      expect(redirectUrl.searchParams.get("redirect_uri")).toBeTruthy();
      expect(redirectUrl.searchParams.get("response_type")).toBe("code");
      expect(redirectUrl.searchParams.get("scope")).toBeTruthy();

      // Should request offline access for refresh token
      expect(redirectUrl.searchParams.get("access_type")).toBe("offline");
    });

    test("should request calendar scopes", async ({ request }) => {
      if (!CONVEX_SITE_URL) {
        test.skip();
        return;
      }

      const { redirectUrl } = await waitForOAuthRedirectComplete(request, CONVEX_SITE_URL);
      const scope = redirectUrl.searchParams.get("scope") || "";

      // Should include calendar scopes
      expect(scope).toContain("calendar");
      expect(scope).toContain("userinfo.email");
    });
  });

  test.describe("Callback Security", () => {
    test("should handle callback without code parameter", async ({ request }) => {
      if (!CONVEX_SITE_URL) {
        test.skip();
        return;
      }

      const response = await request.get(`${CONVEX_SITE_URL}/google/callback`);

      // Should return error (400 Bad Request)
      expect(response.status()).toBe(400);

      const text = await response.text();
      expect(text).toMatch(/missing authorization code/i);
    });

    test("should handle callback with error parameter (user denied access)", async ({
      request,
    }) => {
      if (!CONVEX_SITE_URL) {
        test.skip();
        return;
      }

      const response = await request.get(`${CONVEX_SITE_URL}/google/callback?error=access_denied`);

      // Should return error page
      expect(response.status()).toBe(400);

      const text = await response.text();
      expect(text).toContain("Connection Failed");
      expect(text).toContain("declined the Google Calendar permission request");
    });

    test("should handle callback with invalid code gracefully", async ({ request }) => {
      if (!CONVEX_SITE_URL) {
        test.skip();
        return;
      }

      const response = await request.get(
        `${CONVEX_SITE_URL}/google/callback?code=invalid_code_12345`,
      );

      // Should return error page (500 from failed token exchange)
      expect([400, 500]).toContain(response.status());

      const text = await response.text();

      // Should show user-friendly error, not internal details
      expect(text).toContain("Connection Failed");

      // Should NOT expose internal error details
      expect(text).not.toMatch(/\/home\//);
      expect(text).not.toMatch(/at Object\./);
      expect(text).not.toMatch(/node_modules/);
      expect(text).not.toMatch(/client_secret/i);
    });
  });

  test.describe("Redirect URI Security", () => {
    test("should use correct redirect URI pointing to Convex site", async ({ request }) => {
      if (!CONVEX_SITE_URL) {
        test.skip();
        return;
      }

      const { redirectUrl } = await waitForOAuthRedirectComplete(request, CONVEX_SITE_URL);
      const callbackUri = redirectUrl.searchParams.get("redirect_uri");

      expect(callbackUri).toBeTruthy();
      // Should point back to our Convex site
      expect(callbackUri).toContain("/google/callback");
      // Should NOT point to attacker domains
      expect(callbackUri).not.toContain("evil.com");
      expect(callbackUri).not.toContain("attacker.com");
    });
  });

  test.describe("Error Response Security", () => {
    test("should not leak sensitive information in error responses", async ({ request }) => {
      if (!CONVEX_SITE_URL) {
        test.skip();
        return;
      }

      // Try various error scenarios
      const errorScenarios = [
        `${CONVEX_SITE_URL}/google/callback?error=server_error`,
        `${CONVEX_SITE_URL}/google/callback?code=malformed`,
        `${CONVEX_SITE_URL}/google/callback`,
      ];

      for (const url of errorScenarios) {
        const response = await request.get(url);
        const text = await response.text();

        // Should not expose sensitive info
        expect(text).not.toMatch(/AUTH_GOOGLE_SECRET/);
        expect(text).not.toMatch(/client_secret/i);
        expect(text).not.toMatch(/refresh_token/i);
        expect(text).not.toMatch(/access_token.*[a-zA-Z0-9]{20,}/); // Long token strings
      }
    });
  });
});

test.describe("OAuth Flow Security (Redirect Contract)", () => {
  test("Google OAuth redirect includes state parameter", async ({ request }) => {
    if (!CONVEX_SITE_URL) {
      test.skip();
      return;
    }

    const { redirectUrl } = await waitForOAuthRedirectComplete(request, CONVEX_SITE_URL);

    const state = redirectUrl.searchParams.get("state");
    expect(state).toBeTruthy();
    expect(state?.length).toBeGreaterThan(5);
  });

  test("OAuth redirect URI should not allow open redirects", async ({ request }) => {
    if (!CONVEX_SITE_URL) {
      test.skip();
      return;
    }

    const { redirectUrl } = await waitForOAuthRedirectComplete(request, CONVEX_SITE_URL);
    const redirectUri = redirectUrl.searchParams.get("redirect_uri");

    expect(redirectUri).toBeTruthy();
    expect(redirectUri).not.toContain("evil.com");
    expect(redirectUri).not.toContain("attacker.com");
    expect(redirectUri).not.toContain("javascript:");
    expect(redirectUri).not.toContain("data:");
  });
});
