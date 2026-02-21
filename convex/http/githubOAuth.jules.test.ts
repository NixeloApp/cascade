import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionCtx } from "../_generated/server";
import * as envLib from "../lib/env";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { handleCallbackHandler, listReposHandler } from "./githubOAuth";

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

// Mock Env
vi.mock("../lib/env", () => ({
  getGitHubClientId: vi.fn(),
  getGitHubClientSecret: vi.fn(),
  isGitHubOAuthConfigured: vi.fn(),
  getConvexSiteUrl: vi.fn(),
}));

describe("listReposHandler Error Handling", () => {
  let mockCtx: ActionCtx;
  let mockRequest: Request;

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

    mockRequest = new Request("http://localhost/github/repos");

    // Default mock implementation for DB calls
    (mockCtx.runQuery as any).mockResolvedValue({ userId: "user123" }); // getConnection
    (mockCtx.runMutation as any).mockResolvedValue({ accessToken: "token123" }); // getDecryptedGitHubTokens

    // Default env mocks
    vi.mocked(envLib.getGitHubClientId).mockReturnValue("mock-client-id");
    vi.mocked(envLib.getGitHubClientSecret).mockReturnValue("mock-client-secret");
    vi.mocked(envLib.isGitHubOAuthConfigured).mockReturnValue(true);
    vi.mocked(envLib.getConvexSiteUrl).mockReturnValue("http://localhost:3000");
    process.env.CONVEX_SITE_URL = "http://localhost:3000";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.CONVEX_SITE_URL;
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

describe("handleCallbackHandler XSS Protection", () => {
  let mockCtx: ActionCtx;

  beforeEach(() => {
    vi.resetAllMocks();
    mockCtx = {} as ActionCtx;
    // Mock successful env var reads
    vi.mocked(envLib.getGitHubClientId).mockReturnValue("mock-client-id");
    vi.mocked(envLib.getGitHubClientSecret).mockReturnValue("mock-client-secret");
    vi.mocked(envLib.isGitHubOAuthConfigured).mockReturnValue(true);
    process.env.CONVEX_SITE_URL = "http://localhost:3000";
  });

  afterEach(() => {
    delete process.env.CONVEX_SITE_URL;
  });

  it("should escape XSS in error query parameter", async () => {
    const xssPayload = "<script>alert(1)</script>";
    const request = new Request(
      `http://localhost/github/callback?error=${encodeURIComponent(xssPayload)}`,
    );

    const response = await handleCallbackHandler(mockCtx, request);
    const html = await response.text();

    expect(response.status).toBe(400);
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain(xssPayload);
  });

  it("should escape XSS in error_description query parameter", async () => {
    const xssPayload = "<img src=x onerror=alert(1)>";
    const request = new Request(
      `http://localhost/github/callback?error=access_denied&error_description=${encodeURIComponent(xssPayload)}`,
    );

    const response = await handleCallbackHandler(mockCtx, request);
    const html = await response.text();

    expect(response.status).toBe(400);
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain(xssPayload);
  });

  it("should escape XSS in GitHub username on success", async () => {
    const request = new Request("http://localhost/github/callback?code=mock-code&state=mock-state");

    // Mock successful token exchange
    (fetchWithTimeout as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "mock-token" }),
      })
      // Mock user info with XSS in username
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 12345,
          login: "<script>alert('user')</script>",
        }),
      });

    const response = await handleCallbackHandler(mockCtx, request);
    const html = await response.text();

    if (response.status !== 200) {
      console.error("Test failed with status:", response.status);
      console.error("Response body:", html);
    }

    expect(response.status).toBe(200);
    expect(html).toContain("&lt;script&gt;alert(&#039;user&#039;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert('user')</script>");
  });

  it("should escape XSS in error message when exception occurs", async () => {
    const request = new Request("http://localhost/github/callback?code=mock-code");

    // Mock token exchange failure with XSS in error message
    (fetchWithTimeout as any).mockRejectedValue(new Error("<script>alert('error')</script>"));

    const response = await handleCallbackHandler(mockCtx, request);
    const html = await response.text();

    if (response.status !== 500) {
      console.error("Test failed with status:", response.status);
      console.error("Response body:", html);
    }

    expect(response.status).toBe(500);
    expect(html).toContain("&lt;script&gt;alert(&#039;error&#039;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert('error')</script>");
  });
});
