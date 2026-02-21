import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import * as envLib from "../lib/env";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { handleCallbackHandler, initiateAuthHandler, listReposHandler } from "./githubOAuth";

// Mock env library
vi.mock("../lib/env", () => ({
  getGitHubClientId: vi.fn(),
  getGitHubClientSecret: vi.fn(),
  isGitHubOAuthConfigured: vi.fn(),
  getConvexSiteUrl: vi.fn(),
}));

// Mock fetchWithTimeout
vi.mock("../lib/fetchWithTimeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

describe("GitHub OAuth Flow", () => {
  const mockCtx = {
    runQuery: vi.fn(),
    runMutation: vi.fn(),
  } as unknown as ActionCtx;

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
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "gho_token123" }),
      } as Response);

      // Mock user info response
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
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
      expect(fetchWithTimeout).toHaveBeenCalledTimes(2);
      // Check token exchange call
      expect(vi.mocked(fetchWithTimeout).mock.calls[0][0]).toBe(
        "https://github.com/login/oauth/access_token",
      );
      const tokenBody = JSON.parse(
        (vi.mocked(fetchWithTimeout).mock.calls[0][1] as RequestInit).body as string,
      );
      expect(tokenBody.code).toBe("auth_code");
      expect(tokenBody.client_id).toBe("test-client-id");

      // Check user info call
      expect(vi.mocked(fetchWithTimeout).mock.calls[1][0]).toBe("https://api.github.com/user");
      expect((vi.mocked(fetchWithTimeout).mock.calls[1][1] as RequestInit).headers).toHaveProperty(
        "Authorization",
        "Bearer gho_token123",
      );
    });

    it("should handle token exchange failure", async () => {
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      const request = new Request("https://api.convex.site/github/callback?code=auth_code");
      const response = await handleCallbackHandler(mockCtx, request);

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toContain("Failed to exchange GitHub authorization code");
    });

    it("should handle token exchange error in JSON", async () => {
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: "bad_verification_code",
          error_description: "The code is invalid",
        }),
      } as Response);

      const request = new Request("https://api.convex.site/github/callback?code=auth_code");
      const response = await handleCallbackHandler(mockCtx, request);

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toContain("The code is invalid");
    });

    it("should handle user info fetch failure", async () => {
      // Token success
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "gho_token123" }),
      } as Response);

      // User info failure
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
        ok: false,
      } as Response);

      const request = new Request("https://api.convex.site/github/callback?code=auth_code");
      const response = await handleCallbackHandler(mockCtx, request);

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toContain("Failed to get GitHub user info");
    });
  });

  describe("listReposHandler", () => {
    it("should return 400 if user is not connected to GitHub", async () => {
      vi.mocked(mockCtx.runQuery).mockResolvedValueOnce(null);

      const request = new Request("https://api.convex.site/github/repos");
      const response = await listReposHandler(mockCtx, request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Not connected to GitHub");
      expect(mockCtx.runQuery).toHaveBeenCalledWith(api.github.getConnection);
    });

    it("should return 500 if tokens cannot be retrieved", async () => {
      vi.mocked(mockCtx.runQuery).mockResolvedValueOnce({ userId: "user123" });
      vi.mocked(mockCtx.runMutation).mockResolvedValueOnce(null);

      const request = new Request("https://api.convex.site/github/repos");
      const response = await listReposHandler(mockCtx, request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe("Failed to get GitHub tokens");
      expect(mockCtx.runMutation).toHaveBeenCalledWith(internal.github.getDecryptedGitHubTokens, {
        userId: "user123",
      });
    });

    it("should return 500 if GitHub API fails", async () => {
      vi.mocked(mockCtx.runQuery).mockResolvedValueOnce({ userId: "user123" });
      vi.mocked(mockCtx.runMutation).mockResolvedValueOnce({ accessToken: "token123" });
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const request = new Request("https://api.convex.site/github/repos");
      const response = await listReposHandler(mockCtx, request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toContain("Failed to fetch repositories");
    });

    it("should return repositories on success", async () => {
      vi.mocked(mockCtx.runQuery).mockResolvedValueOnce({ userId: "user123" });
      vi.mocked(mockCtx.runMutation).mockResolvedValueOnce({ accessToken: "token123" });

      const mockRepos = [
        {
          id: 101,
          name: "repo-1",
          full_name: "owner/repo-1",
          owner: { login: "owner" },
          private: false,
          description: "A public repo",
        },
        {
          id: 102,
          name: "repo-2",
          full_name: "owner/repo-2",
          owner: { login: "owner" },
          private: true,
          description: null,
        },
      ];

      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRepos,
      } as Response);

      const request = new Request("https://api.convex.site/github/repos");
      const response = await listReposHandler(mockCtx, request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.repos).toHaveLength(2);
      expect(body.repos[0]).toEqual({
        id: "101",
        name: "repo-1",
        fullName: "owner/repo-1",
        owner: "owner",
        private: false,
        description: "A public repo",
      });
      expect(body.repos[1]).toEqual({
        id: "102",
        name: "repo-2",
        fullName: "owner/repo-2",
        owner: "owner",
        private: true,
        description: null,
      });

      // Verify Convex interactions
      expect(mockCtx.runQuery).toHaveBeenCalledWith(api.github.getConnection);
      expect(mockCtx.runMutation).toHaveBeenCalledWith(internal.github.getDecryptedGitHubTokens, {
        userId: "user123",
      });
      expect(fetchWithTimeout).toHaveBeenCalledWith(
        expect.stringContaining("https://api.github.com/user/repos"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer token123",
          }),
        }),
        30000,
      );
    });
  });
});
