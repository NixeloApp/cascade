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
    ipRestrictions: {
      checkProjectIpAllowed: "checkProjectIpAllowedQuery",
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
    // Default to IP allowed for existing tests
    mockCtx.runQuery.mockImplementation(async (query: string) => {
      if (query === "checkProjectIpAllowedQuery") return true;
      return null;
    });
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
    // Note: authenticateAndRateLimit calls runQuery twice (validateApiKey, checkRateLimit is mutation)
    // But actually checkProjectIpAllowed is called AFTER auth in my code?
    // Wait, let's check issuesApiHandler order.
    // authenticateAndRateLimit happens first.
    // Then handleList happens.
    // Inside handleList is where I added IP check.
    // But wait, my implementation in issues.ts put IP check inside handleList?
    // Let's re-read issues.ts.

    // Actually, looking at the previous patch:
    // I put it inside `handleList`.
    // authenticateAndRateLimit is called BEFORE handleList.
    // So for 401 (auth fail), handleList is NOT called, so checkProjectIpAllowed is NOT called.
    // So the existing test setup for 401 should be fine regarding IP check order.
    // EXCEPT that my beforeEach mockImplementation might override the mockResolvedValueOnce if I'm not careful.
    // mockResolvedValueOnce stacks. So if I set up a default in beforeEach, mockResolvedValueOnce will take precedence for the FIRST call.
    // authenticateAndRateLimit calls validateApiKey.

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

    mockCtx.runQuery.mockImplementation(async (query: string) => {
      if (query === "validateApiKeyQuery") {
        return {
          keyId: "key-123",
          userId: "user-123",
          rateLimit: 100,
          projectId: "project-123", // Restricted to project-123
          scopes: ["issues:read"],
        };
      }
      // IP allowed
      if (query === "checkProjectIpAllowedQuery") return true;
      return null;
    });

    mockCtx.runMutation.mockResolvedValueOnce({ ok: true });

    const response = await issuesApiHandler(mockCtx, mockRequest);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.message).toBe("Not authorized for this project");
  });

  it("should return 403 when IP address is not allowed", async () => {
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
      // IP NOT allowed
      if (query === "checkProjectIpAllowedQuery") return false;
      return null;
    });

    mockCtx.runMutation.mockResolvedValueOnce({ ok: true });

    const response = await issuesApiHandler(mockCtx, mockRequest);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.message).toBe("IP address not allowed");
  });

  it("should return 403 when API key is missing required scope", async () => {
    const mockRequest = new Request("https://api.example.com/api/issues?projectId=project-123", {
      headers: { Authorization: "Bearer test-api-key" },
    });

    // Mock validateApiKey to return auth without issues:read scope
    // Note: Scope check happens inside handleList, BEFORE IP check?
    // Let's check api/issues.ts.
    // handleList:
    // 1. check scope
    // 2. check IP
    // So if scope is missing, it should return 403 before calling checkProjectIpAllowed.
    // So we don't strictly need to mock checkProjectIpAllowed here, but safer to have the default from beforeEach.

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
      if (query === "checkProjectIpAllowedQuery") return true;
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
      if (query === "checkProjectIpAllowedQuery") return true;
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
