import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionCtx } from "../_generated/server";
import * as envLib from "../lib/env";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { handleCallbackHandler, initiateAuthHandler, listReposHandler } from "./githubOAuth";

// Mock env library
vi.mock("../lib/env", () => ({
  getGitHubClientId: vi.fn(() => "test-client-id"),
  getGitHubClientSecret: vi.fn(() => "test-client-secret"),
  isGitHubOAuthConfigured: vi.fn(() => true),
  getConvexSiteUrl: vi.fn(),
  validation: (_type: string, msg: string) => new Error(msg),
}));

vi.mock("../lib/fetchWithTimeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

// Mock crypto.randomUUID
global.crypto.randomUUID = vi.fn(() => "test-uuid-state") as any;

describe("GitHub OAuth Security", () => {
  let mockCtx: ActionCtx;

  beforeEach(() => {
    mockCtx = {} as ActionCtx;
    vi.clearAllMocks();
    process.env.CONVEX_SITE_URL = "https://test.convex.site";
  });

  afterEach(() => {
    delete process.env.CONVEX_SITE_URL;
  });

  describe("initiateAuthHandler", () => {
    it("should redirect to GitHub and set a state cookie", async () => {
      const request = new Request("https://test.convex.site/github/auth");
      const response = await initiateAuthHandler(mockCtx, request);

      expect(response.status).toBe(302);
      const location = response.headers.get("Location");
      expect(location).toContain("https://github.com/login/oauth/authorize");
      expect(location).toContain("state=test-uuid-state");

      // Fix verification: Set-Cookie header should be present
      const setCookie = response.headers.get("Set-Cookie");
      expect(setCookie).toContain("github_oauth_state=test-uuid-state");
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("Secure");
      expect(setCookie).toContain("SameSite=Lax");
    });
  });

  describe("handleCallbackHandler", () => {
    it("should REJECT callback without state parameter", async () => {
      const request = new Request("https://test.convex.site/github/callback?code=mock-code");
      const response = await handleCallbackHandler(mockCtx, request);
      expect(response.status).toBe(400);
      expect(await response.text()).toContain("Invalid state parameter");
    });

    it("should REJECT callback with mismatched state", async () => {
      const request = new Request(
        "https://test.convex.site/github/callback?code=mock-code&state=invalid-state",
        {
          headers: { Cookie: "github_oauth_state=valid-state" },
        },
      );
      const response = await handleCallbackHandler(mockCtx, request);
      expect(response.status).toBe(400);
      expect(await response.text()).toContain("Invalid state parameter");
    });

    it("should REJECT callback with missing cookie", async () => {
      const request = new Request(
        "https://test.convex.site/github/callback?code=mock-code&state=valid-state",
      );
      const response = await handleCallbackHandler(mockCtx, request);
      expect(response.status).toBe(400);
      expect(await response.text()).toContain("Invalid state parameter");
    });

    it("should ACCEPT callback with matching state", async () => {
      // Mock successful token exchange
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "mock-access-token",
            token_type: "bearer",
          }),
        ),
      );

      // Mock successful user info fetch
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 12345,
            login: "testuser",
          }),
        ),
      );

      const request = new Request(
        "https://test.convex.site/github/callback?code=mock-code&state=valid-state",
        {
          headers: { Cookie: "github_oauth_state=valid-state" },
        },
      );
      const response = await handleCallbackHandler(mockCtx, request);

      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain("Connected Successfully");

      // Verify cookie is cleared (optional but recommended)
      const setCookie = response.headers.get("Set-Cookie");
      expect(setCookie).toContain("github_oauth_state=;");
      expect(setCookie).toContain("Max-Age=0");
    });
  });
});

describe("GitHub OAuth Error Handling", () => {
  let mockCtx: ActionCtx;

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Setup mock context
    mockCtx = {
      runQuery: vi.fn(),
      runMutation: vi.fn(),
      scheduler: {} as any,
      auth: {} as any,
      storage: {} as any,
      vectorSearch: {} as any,
      runAction: vi.fn(),
    } as unknown as ActionCtx;

    // Default config
    vi.mocked(envLib.getGitHubClientId).mockReturnValue("test-client-id");
    vi.mocked(envLib.getGitHubClientSecret).mockReturnValue("test-client-secret");
    vi.mocked(envLib.isGitHubOAuthConfigured).mockReturnValue(true);
    process.env.CONVEX_SITE_URL = "https://test.convex.site";

    // Default mock implementation for DB calls
    (mockCtx.runQuery as any).mockResolvedValue({ userId: "user123" });
    (mockCtx.runMutation as any).mockResolvedValue({ accessToken: "token123" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.CONVEX_SITE_URL;
  });

  describe("handleCallbackHandler", () => {
    it("should return HTML error if config is missing (throws)", async () => {
      // Mock getGitHubClientId to throw, simulating missing env var
      vi.mocked(envLib.getGitHubClientId).mockImplementation(() => {
        throw new Error("Missing required environment variable: GITHUB_CLIENT_ID");
      });

      // Need to set valid state to get past CSRF check
      const request = new Request(
        "https://api.convex.site/github/callback?code=some_code&state=valid-state",
        {
          headers: { Cookie: "github_oauth_state=valid-state" },
        },
      );
      const response = await handleCallbackHandler(mockCtx, request);

      // Should catch the error and return 500 HTML page
      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toContain("Connection Failed");
      expect(text).toContain("Missing required environment variable");
    });
  });

  describe("listReposHandler", () => {
    let mockRequest: Request;

    beforeEach(() => {
      mockRequest = new Request("http://localhost/github/repos");
    });

    it("should return 401 Unauthorized when GitHub returns 401", async () => {
      // Setup mock to return 401
      vi.mocked(fetchWithTimeout).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          message: "Bad credentials",
          documentation_url: "https://docs.github.com/rest",
        }),
        text: async () => JSON.stringify({ message: "Bad credentials" }),
      } as Response);

      const response = await listReposHandler(mockCtx, mockRequest);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("Bad credentials");
    });

    it("should return 403 Forbidden when GitHub returns 403", async () => {
      // Setup mock to return 403
      vi.mocked(fetchWithTimeout).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          message: "API rate limit exceeded",
        }),
        text: async () => JSON.stringify({ message: "API rate limit exceeded" }),
      } as Response);

      const response = await listReposHandler(mockCtx, mockRequest);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toBe("API rate limit exceeded");
    });

    it("should return 500 Internal Server Error when fetch throws (e.g. timeout)", async () => {
      // Setup mock to throw
      vi.mocked(fetchWithTimeout).mockRejectedValue(new Error("Request timed out"));

      const response = await listReposHandler(mockCtx, mockRequest);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Request timed out");
    });
  });
});
