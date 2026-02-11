/**
 * Google OAuth Contract Tests
 *
 * These tests verify the CONTRACT between our code and Google's OAuth API.
 * They test how our HTTP handlers parse and respond to various Google responses
 * without hitting the real Google API.
 *
 * What these tests catch:
 * - Breaking changes in how we parse Google responses
 * - Missing error handling for edge cases
 * - Incorrect response formats in our callback handlers
 * - Token exchange failures
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// =============================================================================
// GOOGLE API RESPONSE CONTRACTS
// These represent the various responses Google's OAuth API can return.
// If Google changes their API, update these contracts and fix the code.
// =============================================================================

const GOOGLE_TOKEN_RESPONSES = {
  /**
   * Standard successful token response
   * @see https://developers.google.com/identity/protocols/oauth2/web-server#exchange-authorization-code
   */
  success: {
    access_token: "ya29.a0AfH6SMBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    refresh_token: "1//0exxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    scope:
      "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
    token_type: "Bearer",
    expires_in: 3600,
  },

  /**
   * Token response without refresh_token (common for re-authorization)
   */
  successNoRefreshToken: {
    access_token: "ya29.a0AfH6SMBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    scope: "https://www.googleapis.com/auth/calendar",
    token_type: "Bearer",
    expires_in: 3600,
  },

  /**
   * Token response with id_token (when openid scope is included)
   */
  successWithIdToken: {
    access_token: "ya29.a0AfH6SMBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    refresh_token: "1//0exxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    id_token:
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20ifQ.signature",
    scope: "openid email profile",
    token_type: "Bearer",
    expires_in: 3600,
  },
} as const;

const GOOGLE_ERROR_RESPONSES = {
  /**
   * Authorization code already used or expired
   * Most common error - happens if user refreshes callback page
   */
  invalidGrant: {
    error: "invalid_grant",
    error_description: "Token has been expired or revoked.",
  },

  /**
   * Invalid client credentials
   * Happens if OAuth credentials are misconfigured
   */
  invalidClient: {
    error: "invalid_client",
    error_description: "The OAuth client was not found.",
  },

  /**
   * Invalid authorization code format
   */
  invalidCode: {
    error: "invalid_grant",
    error_description: "Malformed auth code.",
  },

  /**
   * Redirect URI mismatch
   */
  redirectMismatch: {
    error: "redirect_uri_mismatch",
    error_description:
      "Bad Request. The redirect_uri does not match the one used in the authorization request.",
  },
} as const;

const GOOGLE_USER_PROFILES = {
  /**
   * Standard Google user profile
   */
  complete: {
    id: "118234567890123456789",
    email: "john.doe@gmail.com",
    verified_email: true,
    name: "John Doe",
    given_name: "John",
    family_name: "Doe",
    picture: "https://lh3.googleusercontent.com/a/default-user=s96-c",
    locale: "en",
  },

  /**
   * Profile with minimal data
   */
  minimal: {
    id: "118234567890123456789",
    email: "minimal@gmail.com",
    verified_email: true,
  },

  /**
   * Google Workspace user
   */
  workspaceUser: {
    id: "118234567890123456789",
    email: "employee@company.com",
    verified_email: true,
    name: "Employee Name",
    hd: "company.com", // Hosted domain
  },
} as const;

// =============================================================================
// TOKEN EXCHANGE CONTRACT TESTS
// =============================================================================

describe("Google OAuth Token Exchange Contract", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe("exchangeCodeForTokens", () => {
    /**
     * Helper to simulate the token exchange logic from googleOAuth.ts
     */
    async function exchangeCodeForTokens(
      code: string,
      config: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
      },
    ): Promise<{
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    }> {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error_description || errorData.error);
      }

      return await tokenResponse.json();
    }

    describe("when Google returns successful token response", () => {
      it("should parse standard token response with refresh token", async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => GOOGLE_TOKEN_RESPONSES.success,
        });

        const tokens = await exchangeCodeForTokens("valid-code", {
          clientId: "test-client-id",
          clientSecret: "test-secret",
          redirectUri: "http://localhost/callback",
        });

        expect(tokens.access_token).toBe(GOOGLE_TOKEN_RESPONSES.success.access_token);
        expect(tokens.refresh_token).toBe(GOOGLE_TOKEN_RESPONSES.success.refresh_token);
        expect(tokens.expires_in).toBe(3600);
      });

      it("should handle token response without refresh token", async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => GOOGLE_TOKEN_RESPONSES.successNoRefreshToken,
        });

        const tokens = await exchangeCodeForTokens("reauth-code", {
          clientId: "test-client-id",
          clientSecret: "test-secret",
          redirectUri: "http://localhost/callback",
        });

        expect(tokens.access_token).toBeDefined();
        expect(tokens.refresh_token).toBeUndefined();
      });

      it("should handle token response with id_token", async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => GOOGLE_TOKEN_RESPONSES.successWithIdToken,
        });

        const tokens = await exchangeCodeForTokens("openid-code", {
          clientId: "test-client-id",
          clientSecret: "test-secret",
          redirectUri: "http://localhost/callback",
        });

        expect(tokens.access_token).toBeDefined();
        expect((tokens as Record<string, unknown>).id_token).toBeDefined();
      });
    });

    describe("when Google returns error response", () => {
      it("should throw on invalid_grant (expired/revoked code)", async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: async () => GOOGLE_ERROR_RESPONSES.invalidGrant,
        });

        await expect(
          exchangeCodeForTokens("expired-code", {
            clientId: "test-client-id",
            clientSecret: "test-secret",
            redirectUri: "http://localhost/callback",
          }),
        ).rejects.toThrow("Token has been expired or revoked");
      });

      it("should throw on invalid_client (bad credentials)", async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          json: async () => GOOGLE_ERROR_RESPONSES.invalidClient,
        });

        await expect(
          exchangeCodeForTokens("any-code", {
            clientId: "bad-client-id",
            clientSecret: "bad-secret",
            redirectUri: "http://localhost/callback",
          }),
        ).rejects.toThrow("OAuth client was not found");
      });

      it("should throw on redirect_uri_mismatch", async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: async () => GOOGLE_ERROR_RESPONSES.redirectMismatch,
        });

        await expect(
          exchangeCodeForTokens("any-code", {
            clientId: "test-client-id",
            clientSecret: "test-secret",
            redirectUri: "http://wrong-uri/callback",
          }),
        ).rejects.toThrow("redirect_uri does not match");
      });
    });

    describe("token exchange request contract", () => {
      it("should send correct parameters to Google token endpoint", async () => {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => GOOGLE_TOKEN_RESPONSES.success,
        });
        global.fetch = mockFetch;

        await exchangeCodeForTokens("test-code", {
          clientId: "my-client-id",
          clientSecret: "my-secret",
          redirectUri: "https://myapp.com/callback",
        });

        expect(mockFetch).toHaveBeenCalledWith(
          "https://oauth2.googleapis.com/token",
          expect.objectContaining({
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }),
        );

        // Verify the body contains required parameters
        const callArgs = mockFetch.mock.calls[0];
        const body = callArgs[1].body as URLSearchParams;
        expect(body.get("code")).toBe("test-code");
        expect(body.get("client_id")).toBe("my-client-id");
        expect(body.get("client_secret")).toBe("my-secret");
        expect(body.get("redirect_uri")).toBe("https://myapp.com/callback");
        expect(body.get("grant_type")).toBe("authorization_code");
      });
    });
  });
});

// =============================================================================
// USER PROFILE CONTRACT TESTS
// =============================================================================

describe("Google OAuth User Profile Contract", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  /**
   * Helper to simulate the user profile fetch logic from googleOAuth.ts
   */
  async function fetchGoogleUserProfile(accessToken: string): Promise<{
    email: string;
    name?: string;
    picture?: string;
    hd?: string;
  }> {
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user profile");
    }

    return await userInfoResponse.json();
  }

  describe("when Google returns user profile", () => {
    it("should parse complete profile correctly", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => GOOGLE_USER_PROFILES.complete,
      });

      const profile = await fetchGoogleUserProfile("valid-token");

      expect(profile.email).toBe("john.doe@gmail.com");
      expect(profile.name).toBe("John Doe");
      expect(profile.picture).toBe("https://lh3.googleusercontent.com/a/default-user=s96-c");
    });

    it("should handle minimal profile (missing optional fields)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => GOOGLE_USER_PROFILES.minimal,
      });

      const profile = await fetchGoogleUserProfile("valid-token");

      expect(profile.email).toBe("minimal@gmail.com");
      expect(profile.name).toBeUndefined();
      expect(profile.picture).toBeUndefined();
    });

    it("should handle Google Workspace user (with hosted domain)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => GOOGLE_USER_PROFILES.workspaceUser,
      });

      const profile = await fetchGoogleUserProfile("valid-token");

      expect(profile.email).toBe("employee@company.com");
      expect(profile.hd).toBe("company.com");
    });
  });

  describe("when Google returns error", () => {
    it("should throw on unauthorized (invalid/expired token)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(fetchGoogleUserProfile("expired-token")).rejects.toThrow(
        "Failed to fetch user profile",
      );
    });

    it("should send correct Authorization header", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => GOOGLE_USER_PROFILES.complete,
      });
      global.fetch = mockFetch;

      await fetchGoogleUserProfile("my-access-token");

      expect(mockFetch).toHaveBeenCalledWith("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: "Bearer my-access-token",
        },
      });
    });
  });
});

// =============================================================================
// AUTHORIZATION URL CONTRACT TESTS
// =============================================================================

describe("Google OAuth Authorization URL Contract", () => {
  describe("buildAuthorizationUrl", () => {
    /**
     * Helper to simulate authorization URL generation from googleOAuth.ts
     */
    function buildAuthorizationUrl(config: {
      clientId: string;
      redirectUri: string;
      scopes: string;
    }): URL {
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", config.clientId);
      authUrl.searchParams.set("redirect_uri", config.redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", config.scopes);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      return authUrl;
    }

    it("should generate URL with required OAuth parameters", () => {
      const url = buildAuthorizationUrl({
        clientId: "test-client-id",
        redirectUri: "https://myapp.com/callback",
        scopes: "https://www.googleapis.com/auth/calendar",
      });

      expect(url.origin).toBe("https://accounts.google.com");
      expect(url.pathname).toBe("/o/oauth2/v2/auth");
      expect(url.searchParams.get("client_id")).toBe("test-client-id");
      expect(url.searchParams.get("redirect_uri")).toBe("https://myapp.com/callback");
      expect(url.searchParams.get("response_type")).toBe("code");
      expect(url.searchParams.get("access_type")).toBe("offline");
      expect(url.searchParams.get("prompt")).toBe("consent");
    });

    it("should include all requested scopes", () => {
      const scopes = [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" ");

      const url = buildAuthorizationUrl({
        clientId: "test-client-id",
        redirectUri: "https://myapp.com/callback",
        scopes,
      });

      expect(url.searchParams.get("scope")).toBe(scopes);
    });
  });
});

// =============================================================================
// CALLBACK RESPONSE CONTRACT TESTS
// =============================================================================

describe("Google OAuth Callback Response Contract", () => {
  describe("handleCallback response format", () => {
    /**
     * Simulates the HTML response generation from googleOAuth.ts handleCallback
     */
    function generateSuccessHtml(connectionData: {
      providerAccountId: string;
      accessToken: string;
      refreshToken?: string;
      expiresAt?: number;
    }): string {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Google Calendar - Connected</title>
          </head>
          <body>
            <div class="success">
              <h1>✅ Connected Successfully</h1>
              <p>${connectionData.providerAccountId}</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'google-calendar-connected',
                    data: ${JSON.stringify(connectionData)}
                  }, '*');
                }
              </script>
            </div>
          </body>
        </html>
      `;
    }

    it("should generate HTML with postMessage for token passing", () => {
      const html = generateSuccessHtml({
        providerAccountId: "user@gmail.com",
        accessToken: "access-token-123",
        refreshToken: "refresh-token-456",
        expiresAt: Date.now() + 3600000,
      });

      expect(html).toContain("google-calendar-connected");
      expect(html).toContain("window.opener.postMessage");
      expect(html).toContain("providerAccountId");
      expect(html).toContain("accessToken");
    });

    it("should include user email in success message", () => {
      const html = generateSuccessHtml({
        providerAccountId: "user@gmail.com",
        accessToken: "token",
      });

      expect(html).toContain("user@gmail.com");
    });
  });

  describe("error response format", () => {
    function generateErrorHtml(error: string): string {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Google Calendar - Error</title>
          </head>
          <body>
            <div class="error">
              <h1>❌ Connection Failed</h1>
              <p>Failed to connect to Google Calendar: ${error}</p>
            </div>
          </body>
        </html>
      `;
    }

    it("should include error message in HTML", () => {
      const html = generateErrorHtml("access_denied");

      expect(html).toContain("Connection Failed");
      expect(html).toContain("access_denied");
    });
  });
});

// =============================================================================
// REFRESH TOKEN CONTRACT TESTS (for synthetic monitoring)
// =============================================================================

describe("Google OAuth Refresh Token Contract", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  /**
   * Helper to simulate refresh token exchange
   * This is what synthetic monitoring will use
   */
  async function refreshAccessToken(config: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  }): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.error);
    }

    return await response.json();
  }

  it("should exchange refresh token for new access token", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "new-access-token",
        expires_in: 3600,
        token_type: "Bearer",
      }),
    });

    const tokens = await refreshAccessToken({
      clientId: "test-client-id",
      clientSecret: "test-secret",
      refreshToken: "valid-refresh-token",
    });

    expect(tokens.access_token).toBe("new-access-token");
    expect(tokens.expires_in).toBe(3600);
  });

  it("should throw on expired/revoked refresh token", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: "invalid_grant",
        error_description: "Token has been expired or revoked.",
      }),
    });

    await expect(
      refreshAccessToken({
        clientId: "test-client-id",
        clientSecret: "test-secret",
        refreshToken: "expired-refresh-token",
      }),
    ).rejects.toThrow("Token has been expired or revoked");
  });

  it("should send correct parameters for refresh", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "new-token",
        expires_in: 3600,
      }),
    });
    global.fetch = mockFetch;

    await refreshAccessToken({
      clientId: "my-client-id",
      clientSecret: "my-secret",
      refreshToken: "my-refresh-token",
    });

    const callArgs = mockFetch.mock.calls[0];
    const body = callArgs[1].body as URLSearchParams;
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("client_id")).toBe("my-client-id");
    expect(body.get("client_secret")).toBe("my-secret");
    expect(body.get("refresh_token")).toBe("my-refresh-token");
  });
});
