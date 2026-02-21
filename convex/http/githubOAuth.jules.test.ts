import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionCtx } from "../_generated/server";
import * as envLib from "../lib/env";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { handleCallbackHandler, listReposHandler } from "./githubOAuth";

// Mock env library
vi.mock("../lib/env", () => ({
  getGitHubClientId: vi.fn(),
  getGitHubClientSecret: vi.fn(),
  isGitHubOAuthConfigured: vi.fn(),
  getConvexSiteUrl: vi.fn(),
  validation: (_type: string, msg: string) => new Error(msg),
}));

// Mock dependencies
vi.mock("../lib/fetchWithTimeout", () => ({
  fetchWithTimeout: vi.fn(),
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

describe("GitHub OAuth Handlers", () => {
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

      const request = new Request("https://api.convex.site/github/callback?code=some_code");
      const response = await handleCallbackHandler(mockCtx, request);

      // Should catch the error and return 500 HTML page
      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toContain("Connection Failed");
      expect(text).toContain("Missing required environment variable");
    });

    it("should return 400 if code is missing", async () => {
      const request = new Request("https://api.convex.site/github/callback");
      const response = await handleCallbackHandler(mockCtx, request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe("Missing authorization code");
    });
  });

  describe("listReposHandler", () => {
    let mockRequest: Request;

    beforeEach(() => {
      mockRequest = new Request("http://localhost/github/repos");
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
