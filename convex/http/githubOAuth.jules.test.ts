import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionCtx } from "../_generated/server";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { listReposHandler } from "./githubOAuth";

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
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
