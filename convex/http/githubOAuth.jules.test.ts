import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleCallbackHandler, initiateAuthHandler, listReposHandler } from "./githubOAuth";

// Mock dependencies
vi.mock("../lib/env", () => ({
  isGitHubOAuthConfigured: vi.fn(),
  getGitHubClientId: vi.fn(),
  getGitHubClientSecret: vi.fn(),
  getConvexSiteUrl: vi.fn(),
  requireEnv: vi.fn(),
}));

vi.mock("../lib/fetchWithTimeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

vi.mock("../_generated/api", () => ({
  api: {
    github: {
      getConnection: "getConnectionQuery",
    },
  },
  internal: {
    github: {
      getDecryptedGitHubTokens: "getDecryptedGitHubTokensMutation",
    },
  },
}));

import * as env from "../lib/env";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";

describe("GitHub OAuth HTTP Actions", () => {
  const mockCtx: any = {
    runQuery: vi.fn(),
    runMutation: vi.fn(),
  };

  const mockRequest = (url: string, headers: Record<string, string> = {}) =>
    new Request(url, { headers });

  beforeEach(() => {
    vi.resetAllMocks();
    // Default env setup
    vi.mocked(env.isGitHubOAuthConfigured).mockReturnValue(true);
    vi.mocked(env.getGitHubClientId).mockReturnValue("client-id");
    vi.mocked(env.getGitHubClientSecret).mockReturnValue("client-secret");
    vi.mocked(env.getConvexSiteUrl).mockReturnValue("https://convex.site");

    // Mock crypto.randomUUID
    vi.spyOn(crypto, "randomUUID").mockReturnValue("mock-uuid-state" as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initiateAuthHandler", () => {
    it("should return 500 if GitHub OAuth is not configured", async () => {
      vi.mocked(env.isGitHubOAuthConfigured).mockReturnValue(false);

      const response = await initiateAuthHandler(
        mockCtx,
        mockRequest("https://api.example.com/github/auth"),
      );

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toContain("GitHub OAuth not configured");
    });

    it("should return 302 redirect to GitHub authorization URL", async () => {
      const response = await initiateAuthHandler(
        mockCtx,
        mockRequest("https://api.example.com/github/auth"),
      );

      expect(response.status).toBe(302);
      const location = response.headers.get("Location");
      expect(location).toBeDefined();

      // biome-ignore lint/style/noNonNullAssertion: test ensures it is defined
      const url = new URL(location!);
      expect(url.hostname).toBe("github.com");
      expect(url.pathname).toBe("/login/oauth/authorize");
      expect(url.searchParams.get("client_id")).toBe("client-id");
      expect(url.searchParams.get("redirect_uri")).toBe("https://convex.site/github/callback");
      expect(url.searchParams.get("state")).toBe("mock-uuid-state");
      expect(url.searchParams.get("scope")).toBe("repo read:user user:email");
    });

    it("should set the state cookie with correct attributes", async () => {
      const response = await initiateAuthHandler(
        mockCtx,
        mockRequest("https://api.example.com/github/auth"),
      );

      const cookie = response.headers.get("Set-Cookie");
      expect(cookie).toContain("github-oauth-state=mock-uuid-state");
      expect(cookie).toContain("Path=/");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Secure");
      expect(cookie).toContain("SameSite=Lax");
      expect(cookie).toContain("Max-Age=3600");
    });
  });

  describe("handleCallbackHandler", () => {
    it("should return 400 HTML error page if error query param is present", async () => {
      const response = await handleCallbackHandler(
        mockCtx,
        mockRequest(
          "https://api.example.com/github/callback?error=access_denied&error_description=User+denied",
        ),
      );

      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("text/html");
      const text = await response.text();
      expect(text).toContain("Connection Failed");
      expect(text).toContain("User denied");
      // Should clear cookie
      expect(response.headers.get("Set-Cookie")).toContain("Max-Age=0");
    });

    it("should return 400 HTML error page if state is missing or invalid", async () => {
      // Missing cookie
      const response1 = await handleCallbackHandler(
        mockCtx,
        mockRequest("https://api.example.com/github/callback?code=123&state=mock-uuid-state"),
      );
      expect(response1.status).toBe(400);
      expect(await response1.text()).toContain("Invalid state or missing authorization code");

      // Mismatch state
      const response2 = await handleCallbackHandler(
        mockCtx,
        mockRequest("https://api.example.com/github/callback?code=123&state=wrong-state", {
          Cookie: "github-oauth-state=mock-uuid-state",
        }),
      );
      expect(response2.status).toBe(400);
      expect(await response2.text()).toContain("Invalid state or missing authorization code");
    });

    it("should succeed and return HTML with token script", async () => {
      // Mock token exchange
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "gho_token_123",
            token_type: "bearer",
          }),
        ),
      );

      // Mock user info fetch
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 12345,
            login: "testuser",
          }),
        ),
      );

      const response = await handleCallbackHandler(
        mockCtx,
        mockRequest(
          "https://api.example.com/github/callback?code=valid-code&state=mock-uuid-state",
          {
            Cookie: "github-oauth-state=mock-uuid-state",
          },
        ),
      );

      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain("Connected Successfully");
      expect(text).toContain("@testuser");

      // Verify script content
      expect(text).toContain("gho_token_123");
      expect(text).toContain('"githubUserId":"12345"');
      expect(text).toContain('"githubUsername":"testuser"');
      expect(text).toContain("window.opener.postMessage");

      // Verify fetch calls
      expect(fetchWithTimeout).toHaveBeenCalledTimes(2);
      expect(fetchWithTimeout).toHaveBeenCalledWith(
        "https://github.com/login/oauth/access_token",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("valid-code"),
        }),
      );
    });

    it("should return 400/500 if token exchange fails", async () => {
      // Mock token exchange failure
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: "bad_verification_code",
            error_description: "The code is invalid",
          }),
        ),
      );

      const response = await handleCallbackHandler(
        mockCtx,
        mockRequest(
          "https://api.example.com/github/callback?code=invalid-code&state=mock-uuid-state",
          {
            Cookie: "github-oauth-state=mock-uuid-state",
          },
        ),
      );

      // Status depends on implementation - handleOAuthError maps VALIDATION to 400
      // "oauth" error maps to validation -> 400
      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toContain("The code is invalid");
    });
  });

  describe("listReposHandler", () => {
    it("should return 400 if user is not connected", async () => {
      mockCtx.runQuery.mockResolvedValueOnce(null); // getConnection returns null

      const response = await listReposHandler(
        mockCtx,
        mockRequest("https://api.example.com/github/repos"),
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Not connected to GitHub");
    });

    it("should return 500 if failed to get decrypted tokens", async () => {
      mockCtx.runQuery.mockResolvedValueOnce({ userId: "user-123" });
      mockCtx.runMutation.mockResolvedValueOnce(null); // getDecryptedGitHubTokens returns null

      const response = await listReposHandler(
        mockCtx,
        mockRequest("https://api.example.com/github/repos"),
      );

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe("Failed to get GitHub tokens");
    });

    it("should return 200 with repos list", async () => {
      mockCtx.runQuery.mockResolvedValueOnce({ userId: "user-123" });
      mockCtx.runMutation.mockResolvedValueOnce({ accessToken: "gho_token" });

      // Mock GitHub API response
      const mockRepos = [
        {
          id: 101,
          name: "repo-1",
          full_name: "owner/repo-1",
          owner: { login: "owner" },
          private: true,
          description: "A private repo",
        },
        {
          id: 102,
          name: "repo-2",
          full_name: "owner/repo-2",
          owner: { login: "owner" },
          private: false,
          description: null,
        },
      ];
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce(new Response(JSON.stringify(mockRepos)));

      const response = await listReposHandler(
        mockCtx,
        mockRequest("https://api.example.com/github/repos"),
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.repos).toHaveLength(2);
      expect(body.repos[0]).toEqual({
        id: "101",
        name: "repo-1",
        fullName: "owner/repo-1",
        owner: "owner",
        private: true,
        description: "A private repo",
      });

      // Verify Authorization header
      expect(fetchWithTimeout).toHaveBeenCalledWith(
        expect.stringContaining("/user/repos"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer gho_token",
          }),
        }),
        30000,
      );
    });

    it("should handle upstream API errors", async () => {
      mockCtx.runQuery.mockResolvedValueOnce({ userId: "user-123" });
      mockCtx.runMutation.mockResolvedValueOnce({ accessToken: "gho_token" });

      // Mock GitHub API error
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Bad credentials" }), { status: 401 }),
      );

      const response = await listReposHandler(
        mockCtx,
        mockRequest("https://api.example.com/github/repos"),
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Bad credentials");
    });
  });
});
