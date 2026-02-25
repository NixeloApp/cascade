import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import { handleCallbackHandler, initiateAuthHandler, listReposHandler } from "./githubOAuth";

// Mock environment variables
const MOCK_ENV = {
  GITHUB_CLIENT_ID: "mock-client-id",
  GITHUB_CLIENT_SECRET: "mock-client-secret",
  CONVEX_SITE_URL: "https://mock-convex.site",
};

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock crypto.randomUUID
const MOCK_STATE = "mock-uuid-state";
Object.defineProperty(global.crypto, "randomUUID", {
  value: vi.fn().mockReturnValue(MOCK_STATE),
});

describe("GitHub OAuth HTTP Handlers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, ...MOCK_ENV };
    mockFetch.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("initiateAuthHandler", () => {
    it("should redirect to GitHub OAuth page with correct params", async () => {
      const request = new Request("https://api.convex.dev/github/auth");
      const ctx = {} as ActionCtx;

      const response = await initiateAuthHandler(ctx, request);

      expect(response.status).toBe(302);
      const location = response.headers.get("Location");
      expect(location).toBeDefined();

      // biome-ignore lint/style/noNonNullAssertion: testing convenience
      const url = new URL(location!);
      expect(url.origin).toBe("https://github.com");
      expect(url.pathname).toBe("/login/oauth/authorize");
      expect(url.searchParams.get("client_id")).toBe(MOCK_ENV.GITHUB_CLIENT_ID);
      expect(url.searchParams.get("redirect_uri")).toBe(
        `${MOCK_ENV.CONVEX_SITE_URL}/github/callback`,
      );
      expect(url.searchParams.get("state")).toBe(MOCK_STATE);
      expect(url.searchParams.get("scope")).toContain("repo");

      // Verify state cookie
      const setCookie = response.headers.get("Set-Cookie");
      expect(setCookie).toContain(`github-oauth-state=${MOCK_STATE}`);
      expect(setCookie).toContain("HttpOnly; Secure; SameSite=Lax");
    });

    it("should return 500 if environment variables are missing", async () => {
      process.env.GITHUB_CLIENT_ID = "";
      const request = new Request("https://api.convex.dev/github/auth");
      const ctx = {} as ActionCtx;

      const response = await initiateAuthHandler(ctx, request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toContain("GitHub OAuth not configured");
    });
  });

  describe("handleCallbackHandler", () => {
    it("should exchange code for tokens and return success HTML", async () => {
      const code = "valid-code";
      const request = new Request(
        `https://api.convex.dev/github/callback?code=${code}&state=${MOCK_STATE}`,
        {
          headers: {
            Cookie: `github-oauth-state=${MOCK_STATE}`,
          },
        },
      );
      const ctx = {} as ActionCtx;

      // Mock token exchange response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "mock-access-token" }),
      });

      // Mock user info response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 12345, login: "mockuser" }),
      });

      const response = await handleCallbackHandler(ctx, request);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/html");
      const html = await response.text();
      expect(html).toContain("Connected Successfully");
      expect(html).toContain("mockuser");
      expect(html).toContain("window.opener.postMessage");
      expect(html).toContain("mock-access-token");

      // Verify fetch calls
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://github.com/login/oauth/access_token",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining(code),
        }),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/user",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer mock-access-token",
          }),
        }),
      );
    });

    it("should return error HTML if user denied access", async () => {
      const request = new Request(
        `https://api.convex.dev/github/callback?error=access_denied&error_description=User+denied`,
      );
      const ctx = {} as ActionCtx;

      const response = await handleCallbackHandler(ctx, request);

      expect(response.status).toBe(400);
      const html = await response.text();
      expect(html).toContain("Connection Failed");
      expect(html).toContain("User denied");
    });

    it("should return error HTML if state does not match", async () => {
      const request = new Request(
        `https://api.convex.dev/github/callback?code=valid-code&state=mismatch-state`,
        {
          headers: {
            Cookie: `github-oauth-state=${MOCK_STATE}`,
          },
        },
      );
      const ctx = {} as ActionCtx;

      const response = await handleCallbackHandler(ctx, request);

      expect(response.status).toBe(400);
      const html = await response.text();
      expect(html).toContain("Invalid state");
    });

    it("should return error HTML if token exchange fails", async () => {
      const request = new Request(
        `https://api.convex.dev/github/callback?code=bad-code&state=${MOCK_STATE}`,
        {
          headers: {
            Cookie: `github-oauth-state=${MOCK_STATE}`,
          },
        },
      );
      const ctx = {} as ActionCtx;

      // Mock token exchange failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => "Bad code",
      });

      const response = await handleCallbackHandler(ctx, request);

      expect(response.status).toBe(400); // Validation error maps to 400
      const html = await response.text();
      expect(html).toContain("Failed to exchange GitHub authorization code");
    });
  });

  describe("listReposHandler", () => {
    it("should return 401 if Authorization header is missing", async () => {
      const ctx = { runQuery: vi.fn() } as unknown as ActionCtx;
      const request = new Request("https://api.convex.dev/github/repos");

      const response = await listReposHandler(ctx, request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 401 if session is invalid", async () => {
      const ctx = { runQuery: vi.fn() } as unknown as ActionCtx;
      const request = new Request("https://api.convex.dev/github/repos", {
        headers: { Authorization: "Bearer invalid-token" },
      });

      vi.mocked(ctx.runQuery).mockResolvedValue(null);

      const response = await listReposHandler(ctx, request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
      expect(ctx.runQuery).toHaveBeenCalledWith(internal.auth.verifySession, {
        sessionId: "invalid-token",
      });
    });

    it("should return list of repositories if connected", async () => {
      const ctx = {
        runQuery: vi.fn(),
        runMutation: vi.fn(),
      } as unknown as ActionCtx;
      const request = new Request("https://api.convex.dev/github/repos", {
        headers: { Authorization: "Bearer valid-token" },
      });

      // Mock session verification
      vi.mocked(ctx.runQuery).mockResolvedValue("user-123");

      // Mock token retrieval
      vi.mocked(ctx.runMutation).mockResolvedValue({ accessToken: "mock-access-token" });

      // Mock GitHub repos fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 101,
            name: "repo-1",
            full_name: "user/repo-1",
            owner: { login: "user" },
            private: false,
            description: "A repo",
          },
          {
            id: 102,
            name: "repo-2",
            full_name: "user/repo-2",
            owner: { login: "user" },
            private: true,
            description: null,
          },
        ],
      });

      const response = await listReposHandler(ctx, request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.repos).toHaveLength(2);
      expect(body.repos[0]).toEqual({
        id: "101",
        name: "repo-1",
        fullName: "user/repo-1",
        owner: "user",
        private: false,
        description: "A repo",
      });

      expect(ctx.runQuery).toHaveBeenCalledWith(internal.auth.verifySession, {
        sessionId: "valid-token",
      });
      expect(ctx.runMutation).toHaveBeenCalledWith(internal.github.getDecryptedGitHubTokens, {
        userId: "user-123",
      });
    });

    it("should return 400 if not connected", async () => {
      const ctx = {
        runQuery: vi.fn(),
        runMutation: vi.fn(),
      } as unknown as ActionCtx;
      const request = new Request("https://api.convex.dev/github/repos", {
        headers: { Authorization: "Bearer valid-token" },
      });

      // Mock session
      vi.mocked(ctx.runQuery).mockResolvedValue("user-123");
      // Mock no connection (tokens null)
      vi.mocked(ctx.runMutation).mockResolvedValue(null);

      const response = await listReposHandler(ctx, request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Not connected to GitHub");
    });

    it("should return error if GitHub API fails", async () => {
      const ctx = {
        runQuery: vi.fn(),
        runMutation: vi.fn(),
      } as unknown as ActionCtx;
      const request = new Request("https://api.convex.dev/github/repos", {
        headers: { Authorization: "Bearer valid-token" },
      });

      vi.mocked(ctx.runQuery).mockResolvedValue("user-123");
      vi.mocked(ctx.runMutation).mockResolvedValue({ accessToken: "token" });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => JSON.stringify({ message: "Rate limit exceeded" }),
      });

      const response = await listReposHandler(ctx, request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe("Rate limit exceeded");
    });
  });
});
