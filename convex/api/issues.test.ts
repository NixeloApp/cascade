import { beforeEach, describe, expect, it, vi } from "vitest";
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
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = {
      runQuery: vi.fn(),
      runMutation: vi.fn(),
      runAction: vi.fn(),
    };
  });

  it("should return 401 when API key is missing", async () => {
    const mockRequest = new Request("https://api.example.com/api/issues?projectId=project-123", {
      headers: {}, // No Authorization header
    });

    const response = await issuesApiHandler(mockCtx, mockRequest);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.message).toBe("Missing API key");
  });

  it("should return 401 when API key is invalid", async () => {
    const mockRequest = new Request("https://api.example.com/api/issues?projectId=project-123", {
      headers: { Authorization: "Bearer invalid-key" },
    });

    // Mock validateApiKey to return null (invalid key)
    mockCtx.runQuery.mockResolvedValueOnce(null);

    const response = await issuesApiHandler(mockCtx, mockRequest);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.message).toBe("Invalid or expired API key");
  });

  it("should return 429 when rate limit is exceeded", async () => {
    const mockRequest = new Request("https://api.example.com/api/issues?projectId=project-123", {
      headers: { Authorization: "Bearer test-api-key" },
    });

    // Mock validateApiKey to return valid auth
    mockCtx.runQuery.mockResolvedValueOnce({
      keyId: "key-123",
      userId: "user-123",
      rateLimit: 100,
      projectId: "project-123",
      scopes: ["issues:read"],
    });

    // Mock rateLimit mutation to return { ok: false }
    mockCtx.runMutation.mockResolvedValueOnce({
      ok: false,
      retryAfter: 60000,
    });

    const response = await issuesApiHandler(mockCtx, mockRequest);
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error.message).toContain("Rate limit exceeded");
  });

  it("should return 400 when projectId is missing", async () => {
    const mockRequest = new Request("https://api.example.com/api/issues", {
      // Missing projectId
      headers: { Authorization: "Bearer test-api-key" },
    });

    // Mock validateApiKey to return valid auth
    mockCtx.runQuery.mockResolvedValueOnce({
      keyId: "key-123",
      userId: "user-123",
      rateLimit: 100,
      projectId: "project-123",
      scopes: ["issues:read"],
    });

    // Mock rateLimit mutation to return { ok: true }
    mockCtx.runMutation.mockResolvedValueOnce({ ok: true });

    const response = await issuesApiHandler(mockCtx, mockRequest);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.message).toBe("projectId required");
  });

  it("should return 403 when API key is not authorized for the requested project", async () => {
    const mockRequest = new Request("https://api.example.com/api/issues?projectId=project-456", {
      headers: { Authorization: "Bearer test-api-key" },
    });

    // Mock validateApiKey to return auth for project-123 only
    mockCtx.runQuery.mockResolvedValueOnce({
      keyId: "key-123",
      userId: "user-123",
      rateLimit: 100,
      projectId: "project-123", // Restricted to project-123
      scopes: ["issues:read"],
    });

    mockCtx.runMutation.mockResolvedValueOnce({ ok: true });

    const response = await issuesApiHandler(mockCtx, mockRequest);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.message).toBe("Not authorized for this project");
  });

  it("should return 403 when API key is missing required scope", async () => {
    const mockRequest = new Request("https://api.example.com/api/issues?projectId=project-123", {
      headers: { Authorization: "Bearer test-api-key" },
    });

    // Mock validateApiKey to return auth without issues:read scope
    mockCtx.runQuery.mockResolvedValueOnce({
      keyId: "key-123",
      userId: "user-123",
      rateLimit: 100,
      projectId: "project-123",
      scopes: ["issues:write"], // Missing read scope
    });

    mockCtx.runMutation.mockResolvedValueOnce({ ok: true });

    const response = await issuesApiHandler(mockCtx, mockRequest);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.message).toBe("Missing scope: issues:read");
  });

  it("should return 404 when path is incorrect", async () => {
    const mockRequest = new Request("https://api.example.com/api/other-endpoint", {
      headers: { Authorization: "Bearer test-api-key" },
    });

    mockCtx.runQuery.mockResolvedValueOnce({
      keyId: "key-123",
      userId: "user-123",
      rateLimit: 100,
      projectId: "project-123",
      scopes: ["issues:read"],
    });

    mockCtx.runMutation.mockResolvedValueOnce({ ok: true });

    const response = await issuesApiHandler(mockCtx, mockRequest);
    expect(response.status).toBe(404);
  });

  it("should return 200 when request is valid", async () => {
    const mockRequest = new Request("https://api.example.com/api/issues?projectId=project-123", {
      headers: { Authorization: "Bearer test-api-key" },
    });

    // Mock validateApiKey
    mockCtx.runQuery.mockImplementation(async (query: string) => {
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
        return [{ id: "issue-1", title: "Test Issue" }];
      }
      return null;
    });

    mockCtx.runMutation.mockResolvedValueOnce({ ok: true });

    const response = await issuesApiHandler(mockCtx, mockRequest);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe("Test Issue");
  });

  it("should return 500 when internal error occurs", async () => {
    const mockRequest = new Request("https://api.example.com/api/issues?projectId=project-123", {
      headers: { Authorization: "Bearer test-api-key" },
    });

    mockCtx.runQuery.mockImplementation(async (query: string) => {
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
        throw new Error("Database error");
      }
      return null;
    });

    mockCtx.runMutation.mockResolvedValueOnce({ ok: true });

    const response = await issuesApiHandler(mockCtx, mockRequest);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.message).toBe("Internal server error");
  });
});
