import { describe, expect, it, vi } from "vitest";
import { issuesApiHandler } from "./issues";

// Mock the API generated file
vi.mock("../_generated/api", () => ({
  components: {
    rateLimiter: {
      lib: {
        rateLimit: "rateLimitMutation", // Mock reference
      },
    },
  },
  internal: {
    apiKeys: {
      validateApiKey: "validateApiKeyQuery",
      recordUsage: "recordUsageMutation",
    },
    issues: {
      queries: {
        listIssuesInternal: "listIssuesInternalQuery",
      },
    },
  },
}));

describe("API Issues Handler", () => {
  // Test case for rate limit exceeded
  it("should return 429 when rate limit is exceeded", async () => {
    const mockCtx = {
      runQuery: vi.fn(),
      runMutation: vi.fn(),
      runAction: vi.fn(),
    };

    const mockRequest = new Request("https://api.example.com/api/issues?projectId=project-123", {
      headers: {
        Authorization: "Bearer test-api-key",
      },
    });

    // Mock validateApiKey to return valid auth
    mockCtx.runQuery.mockResolvedValueOnce({
      keyId: "key-123",
      userId: "user-123",
      rateLimit: 100,
      projectId: "project-123", // Scope to this project
      scopes: ["issues:read"],
    });

    // Mock rateLimit mutation to return { ok: false } (Rate limit exceeded)
    mockCtx.runMutation.mockResolvedValueOnce({
      ok: false,
      retryAfter: 60000,
    });

    // Call the handler
    const response = await issuesApiHandler(mockCtx as any, mockRequest);

    // Expect 429 response
    expect(response.status).toBe(429);

    // If status is 429, we also check body
    if (response.status === 429) {
      const body = await response.json();
      expect(body.error.message).toContain("Rate limit exceeded");
    }
  });

  it("should return 200 when rate limit is allowed", async () => {
    const mockCtx = {
      runQuery: vi.fn(),
      runMutation: vi.fn(),
      runAction: vi.fn(),
    };

    const mockRequest = new Request("https://api.example.com/api/issues?projectId=project-123", {
      headers: {
        Authorization: "Bearer test-api-key",
      },
    });

    // Mock validateApiKey to return valid auth
    mockCtx.runQuery.mockImplementation(async (query) => {
      if (query === "validateApiKeyQuery") {
        return {
          keyId: "key-123",
          userId: "user-123",
          rateLimit: 100,
          projectId: "project-123",
          scopes: ["issues:read"],
        };
      }
      if (query === "listIssuesInternalQuery") {
        return []; // Return empty list of issues
      }
      return null;
    });

    // Mock rateLimit mutation to return { ok: true }
    mockCtx.runMutation.mockResolvedValue({
      ok: true,
    });

    // Call the handler
    const response = await issuesApiHandler(mockCtx as any, mockRequest);

    // Expect 200 response
    expect(response.status).toBe(200);
  });
});
