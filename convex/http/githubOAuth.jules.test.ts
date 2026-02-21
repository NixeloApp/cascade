import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionCtx } from "../_generated/server";
import * as envLib from "../lib/env";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { handleCallbackHandler, initiateAuthHandler, listReposHandler } from "./githubOAuth";

// Mock dependencies
vi.mock("../lib/fetchWithTimeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

// Mock env library
vi.mock("../lib/env", () => ({
  getGitHubClientId: vi.fn(),
  getGitHubClientSecret: vi.fn(),
  isGitHubOAuthConfigured: vi.fn(),
  isAppError: (err: any) => err?.data?.code,
  validation: (_type: string, msg: string) => {
    const err = new Error(msg);
    (err as any).data = { code: "VALIDATION", message: msg };
    return err;
  },
}));

// Mock API access
vi.mock("../_generated/api", () => ({
  api: {
    github: {
      getConnection: "getConnection",
    },
  },
  internal: {
    github: {
      getDecryptedGitHubTokens: "getDecryptedGitHubTokens",
    },
  },
}));

describe("GitHub OAuth", () => {
  let mockCtx: ActionCtx;
  let mockRequest: Request;

  beforeEach(() => {
    vi.resetAllMocks();
    mockCtx = {
      runQuery: vi.fn(),
      runMutation: vi.fn(),
    } as unknown as ActionCtx;

    // Default config
    vi.mocked(envLib.getGitHubClientId).mockReturnValue("test-client-id");
    vi.mocked(envLib.getGitHubClientSecret).mockReturnValue("test-client-secret");
    vi.mocked(envLib.isGitHubOAuthConfigured).mockReturnValue(true);
    process.env.CONVEX_SITE_URL = "https://test.convex.site";
  });

  afterEach(() => {
    delete process.env.CONVEX_SITE_URL;
  });

  describe("initiateAuthHandler", () => {
    it("should redirect to GitHub with correct parameters and state cookie", async () => {
      const request = new Request("https://api.convex.site/github/auth");
      const response = await initiateAuthHandler(mockCtx, request);

      expect(response.status).toBe(302);
      const location = response.headers.get("Location");
      const setCookie = response.headers.get("Set-Cookie");

      expect(location).toBeDefined();
      expect(setCookie).toBeDefined();

      // biome-ignore lint/style/noNonNullAssertion: testing convenience
      const url = new URL(location!);
      const state = url.searchParams.get("state");

      expect(state).toBeDefined();
      expect(setCookie).toContain(`github-oauth-state=${state}`);
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("Secure");
      expect(setCookie).toContain("SameSite=Lax");
    });
  });

  describe("handleCallbackHandler", () => {
    it("should return 400 if state is missing", async () => {
      const request = new Request("https://api.convex.site/github/callback?code=some_code");
      const response = await handleCallbackHandler(mockCtx, request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe("Invalid state or missing authorization code");
    });

    it("should return 400 if state mismatches", async () => {
      const request = new Request(
        "https://api.convex.site/github/callback?code=some_code&state=state1",
      );
      request.headers.set("Cookie", "github-oauth-state=state2");
      const response = await handleCallbackHandler(mockCtx, request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe("Invalid state or missing authorization code");
    });

    it("should succeed with valid state and code", async () => {
      // Mock token exchange
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "token" }),
      } as Response);

      // Mock user info
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123, login: "testuser" }),
      } as Response);

      const request = new Request(
        "https://api.convex.site/github/callback?code=some_code&state=valid_state",
      );
      request.headers.set("Cookie", "github-oauth-state=valid_state");

      const response = await handleCallbackHandler(mockCtx, request);

      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain("Connected Successfully");

      // Cookie should be cleared
      const setCookie = response.headers.get("Set-Cookie");
      expect(setCookie).toContain("github-oauth-state=;");
      expect(setCookie).toContain("Max-Age=0");
    });
  });

  describe("listReposHandler Error Handling", () => {
    beforeEach(() => {
      mockRequest = new Request("http://localhost/github/repos");
      (mockCtx.runQuery as any).mockResolvedValue({ userId: "user123" }); // getConnection
      (mockCtx.runMutation as any).mockResolvedValue({ accessToken: "token123" }); // getDecryptedGitHubTokens
    });

    it("should return 401 Unauthorized when GitHub returns 401", async () => {
      // Setup mock to return 401
      (fetchWithTimeout as any).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          message: "Bad credentials",
          documentation_url: "https://docs.github.com/rest",
        }),
        text: async () => JSON.stringify({ message: "Bad credentials" }),
      });

      const response = await listReposHandler(mockCtx, mockRequest);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("Bad credentials");
    });

    it("should return 403 Forbidden when GitHub returns 403", async () => {
      // Setup mock to return 403
      (fetchWithTimeout as any).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          message: "API rate limit exceeded",
        }),
        text: async () => JSON.stringify({ message: "API rate limit exceeded" }),
      });

      const response = await listReposHandler(mockCtx, mockRequest);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toBe("API rate limit exceeded");
    });

    it("should return 500 Internal Server Error when fetch throws (e.g. timeout)", async () => {
      // Setup mock to throw
      (fetchWithTimeout as any).mockRejectedValue(new Error("Request timed out"));

      const response = await listReposHandler(mockCtx, mockRequest);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Request timed out");
    });
  });
});
