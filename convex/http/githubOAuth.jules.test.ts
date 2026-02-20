import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initiateAuthHandler, handleCallbackHandler } from "./githubOAuth";
import * as envLib from "../lib/env";
import { type ActionCtx } from "../_generated/server";

// Mock env library
vi.mock("../lib/env", () => ({
  getGitHubClientId: vi.fn(),
  getGitHubClientSecret: vi.fn(),
  isGitHubOAuthConfigured: vi.fn(),
  getConvexSiteUrl: vi.fn(),
  validation: (_type: string, msg: string) => new Error(msg),
}));

describe("GitHub OAuth Flow", () => {
  const mockCtx = {} as ActionCtx;

  beforeEach(() => {
    vi.resetAllMocks();
    // Default config
    vi.mocked(envLib.getGitHubClientId).mockReturnValue("test-client-id");
    vi.mocked(envLib.getGitHubClientSecret).mockReturnValue("test-client-secret");
    vi.mocked(envLib.isGitHubOAuthConfigured).mockReturnValue(true);
    // process.env.CONVEX_SITE_URL is used in the code, so we need to mock it or the env lib
    // The code uses `process.env.CONVEX_SITE_URL` directly in `getGitHubOAuthConfig`
    process.env.CONVEX_SITE_URL = "https://test.convex.site";
  });

  afterEach(() => {
    delete process.env.CONVEX_SITE_URL;
  });

  describe("initiateAuthHandler", () => {
    it("should redirect to GitHub with correct parameters", async () => {
      const request = new Request("https://api.convex.site/github/auth");
      const response = await initiateAuthHandler(mockCtx, request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(302);

      const location = response.headers.get("Location");
      // biome-ignore lint/style/noNonNullAssertion: testing convenience
      expect(location).toBeDefined();
      // biome-ignore lint/style/noNonNullAssertion: testing convenience
      const url = new URL(location!);

      expect(url.origin).toBe("https://github.com");
      expect(url.pathname).toBe("/login/oauth/authorize");
      expect(url.searchParams.get("client_id")).toBe("test-client-id");
      expect(url.searchParams.get("redirect_uri")).toBe("https://test.convex.site/github/callback");
      expect(url.searchParams.get("scope")).toContain("repo");
      expect(url.searchParams.has("state")).toBe(true);
    });

    it("should return error if not configured", async () => {
      vi.mocked(envLib.isGitHubOAuthConfigured).mockReturnValue(false);

      const request = new Request("https://api.convex.site/github/auth");
      const response = await initiateAuthHandler(mockCtx, request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toContain("not configured");
    });
  });

  describe("handleCallbackHandler", () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    it("should return HTML error if error param exists", async () => {
      const request = new Request("https://api.convex.site/github/callback?error=access_denied");
      const response = await handleCallbackHandler(mockCtx, request);

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toContain("Connection Failed");
      expect(text).toContain("access_denied");
    });

    it("should return 400 if code is missing", async () => {
      const request = new Request("https://api.convex.site/github/callback");
      const response = await handleCallbackHandler(mockCtx, request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe("Missing authorization code");
    });

    it("should exchange code for token and return success HTML", async () => {
      // Mock token exchange response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "gho_token123" }),
      } as Response);

      // Mock user info response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 12345, login: "testuser" }),
      } as Response);

      const request = new Request("https://api.convex.site/github/callback?code=auth_code");
      const response = await handleCallbackHandler(mockCtx, request);

      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain("Connected Successfully");
      expect(text).toContain("@testuser");
      expect(text).toContain("gho_token123");
      expect(text).toContain('"githubUserId":"12345"');

      // Verify fetch calls
      expect(mockFetch).toHaveBeenCalledTimes(2);
      // Check token exchange call
      expect(mockFetch.mock.calls[0][0]).toBe("https://github.com/login/oauth/access_token");
      const tokenBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(tokenBody.code).toBe("auth_code");
      expect(tokenBody.client_id).toBe("test-client-id");

      // Check user info call
      expect(mockFetch.mock.calls[1][0]).toBe("https://api.github.com/user");
      expect(mockFetch.mock.calls[1][1].headers.Authorization).toBe("Bearer gho_token123");
    });

    it("should handle token exchange failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      const request = new Request("https://api.convex.site/github/callback?code=auth_code");
      const response = await handleCallbackHandler(mockCtx, request);

      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toContain("Failed to exchange GitHub authorization code");
    });

    it("should handle token exchange error in JSON", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: "bad_verification_code", error_description: "The code is invalid" }),
      } as Response);

      const request = new Request("https://api.convex.site/github/callback?code=auth_code");
      const response = await handleCallbackHandler(mockCtx, request);

      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toContain("The code is invalid");
    });

    it("should handle user info fetch failure", async () => {
      // Token success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "gho_token123" }),
      } as Response);

      // User info failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      const request = new Request("https://api.convex.site/github/callback?code=auth_code");
      const response = await handleCallbackHandler(mockCtx, request);

      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toContain("Failed to get GitHub user info");
    });
  });
});
