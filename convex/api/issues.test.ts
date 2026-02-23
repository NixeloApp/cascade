import { getFunctionName } from "convex/server";
import { describe, expect, test, vi } from "vitest";
import { components, internal } from "../_generated/api";
import { forbidden, notFound } from "../lib/errors";
import { issuesApiHandler } from "./issues";

describe("issuesApiHandler", () => {
  // Common setup
  const createMockCtx = () =>
    ({
      runQuery: vi.fn(),
      runMutation: vi.fn(),
    }) as any;

  const createRequest = (url: string = "https://api.example.com/api/issues?projectId=proj_123") =>
    new Request(url, {
      method: "GET",
      headers: {
        Authorization: "Bearer test-key",
      },
    });

  const validAuth = {
    userId: "user123",
    keyId: "key123",
    scopes: ["issues:read"],
    rateLimit: 100,
    projectId: undefined,
  };

  const safeGetFunctionName = (fn: any) => {
    try {
      return getFunctionName(fn);
    } catch (e) {
      return null;
    }
  };

  const isRateLimitMutation = (mutation: any) => {
    if (mutation === components.rateLimiter.lib.rateLimit) return true;
    try {
      getFunctionName(mutation);
    } catch (e: any) {
      // biome-ignore lint/complexity/useOptionalChain: safe check
      if (e.message && e.message.includes("rateLimiter/lib/rateLimit")) {
        return true;
      }
    }
    return false;
  };

  test("returns 429 when rate limit exceeded (ok: false)", async () => {
    const mockCtx = createMockCtx();
    const mockRequest = createRequest();

    mockCtx.runQuery.mockImplementation(async (query: any) => {
      const name = safeGetFunctionName(query);
      if (name === getFunctionName(internal.apiKeys.validateApiKey)) {
        return validAuth;
      }
      // Mock IP check success to ensure we don't fail on 403 if rate limit logic is skipped
      if (name === getFunctionName(internal.ipRestrictions.checkProjectIpAllowed)) {
        return true;
      }
      return null;
    });

    mockCtx.runMutation.mockImplementation(async (mutation: any) => {
      if (isRateLimitMutation(mutation)) {
        return { ok: false, retryAfter: 60000 };
      }
      return { ok: true };
    });

    const response = await issuesApiHandler(mockCtx, mockRequest);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.message).toBe("Rate limit exceeded");
  });

  test("returns 429 when rate limit throws error", async () => {
    const mockCtx = createMockCtx();
    const mockRequest = createRequest();

    mockCtx.runQuery.mockImplementation(async (query: any) => {
      const name = safeGetFunctionName(query);
      if (name === getFunctionName(internal.apiKeys.validateApiKey)) {
        return validAuth;
      }
      if (name === getFunctionName(internal.ipRestrictions.checkProjectIpAllowed)) {
        return true;
      }
      return null;
    });

    mockCtx.runMutation.mockImplementation(async (mutation: any) => {
      if (isRateLimitMutation(mutation)) {
        throw new Error("Rate limit exceeded");
      }
      return { ok: true };
    });

    const response = await issuesApiHandler(mockCtx, mockRequest);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.message).toBe("Rate limit exceeded");
  });

  test("returns 403 when missing scope", async () => {
    const mockCtx = createMockCtx();
    const mockRequest = createRequest();

    mockCtx.runQuery.mockImplementation(async (query: any) => {
      const name = safeGetFunctionName(query);
      if (name === getFunctionName(internal.apiKeys.validateApiKey)) {
        return { ...validAuth, scopes: [] };
      }
      return null;
    });

    mockCtx.runMutation.mockImplementation(async () => ({ ok: true }));

    const response = await issuesApiHandler(mockCtx, mockRequest);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.message).toContain("Missing scope");
  });

  test("returns 403 when project access mismatch", async () => {
    const mockCtx = createMockCtx();
    const mockRequest = createRequest("https://api.example.com/api/issues?projectId=proj_target");

    mockCtx.runQuery.mockImplementation(async (query: any) => {
      const name = safeGetFunctionName(query);
      if (name === getFunctionName(internal.apiKeys.validateApiKey)) {
        return { ...validAuth, projectId: "proj_other" }; // Key is scoped to another project
      }
      // Mock IP check success
      if (name === getFunctionName(internal.ipRestrictions.checkProjectIpAllowed)) {
        return true;
      }
      return null;
    });

    mockCtx.runMutation.mockImplementation(async () => ({ ok: true }));

    const response = await issuesApiHandler(mockCtx, mockRequest);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.message).toBe("Not authorized for this project");
  });

  test("returns 403 when IP not allowed", async () => {
    const mockCtx = createMockCtx();
    const mockRequest = createRequest();

    mockCtx.runQuery.mockImplementation(async (query: any) => {
      const name = safeGetFunctionName(query);
      if (name === getFunctionName(internal.apiKeys.validateApiKey)) {
        return validAuth;
      }
      if (name === getFunctionName(internal.ipRestrictions.checkProjectIpAllowed)) {
        return false;
      }
      return null;
    });

    mockCtx.runMutation.mockImplementation(async () => ({ ok: true }));

    const response = await issuesApiHandler(mockCtx, mockRequest);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.message).toBe("IP address not allowed");
  });

  test("returns 200 on success", async () => {
    const mockCtx = createMockCtx();
    const mockRequest = createRequest();

    mockCtx.runQuery.mockImplementation(async (query: any) => {
      const name = safeGetFunctionName(query);
      if (name === getFunctionName(internal.apiKeys.validateApiKey)) {
        return validAuth;
      }
      if (name === getFunctionName(internal.ipRestrictions.checkProjectIpAllowed)) {
        return true;
      }
      if (name === getFunctionName(internal.issues.queries.listIssuesInternal)) {
        return [{ id: "issue_1", title: "Test Issue" }];
      }
      return null;
    });

    mockCtx.runMutation.mockImplementation(async (mutation: any) => {
      // Handle component mutation safely
      if (isRateLimitMutation(mutation)) {
        return { ok: true };
      }

      // Handle internal mutation
      const name = safeGetFunctionName(mutation);
      if (name === getFunctionName(internal.apiKeys.recordUsage)) {
        return null;
      }
      return { ok: true };
    });

    const response = await issuesApiHandler(mockCtx, mockRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: [{ id: "issue_1", title: "Test Issue" }] });
  });

  test("returns 400 for validation error (Validator failed)", async () => {
    const mockCtx = createMockCtx();
    const mockRequest = createRequest("https://api.example.com/api/issues?projectId=invalid");

    mockCtx.runQuery.mockImplementation(async (query: any) => {
      const name = safeGetFunctionName(query);
      if (name === getFunctionName(internal.apiKeys.validateApiKey)) {
        return validAuth;
      }
      if (name === getFunctionName(internal.ipRestrictions.checkProjectIpAllowed)) {
        throw new Error('Validator failed for argument "projectId": Invalid ID "invalid"');
      }
      return null;
    });

    mockCtx.runMutation.mockImplementation(async () => ({ ok: true }));

    const response = await issuesApiHandler(mockCtx, mockRequest);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe("Invalid request parameters");
  });

  test("returns 404 for NOT_FOUND error", async () => {
    const mockCtx = createMockCtx();
    const mockRequest = createRequest("https://api.example.com/api/issues?projectId=jx76ss...");

    mockCtx.runQuery.mockImplementation(async (query: any) => {
      const name = safeGetFunctionName(query);
      if (name === getFunctionName(internal.apiKeys.validateApiKey)) {
        return validAuth;
      }
      if (name === getFunctionName(internal.ipRestrictions.checkProjectIpAllowed)) {
        return true;
      }
      if (name === getFunctionName(internal.issues.queries.listIssuesInternal)) {
        throw notFound("project", "jx76ss...");
      }
      return null;
    });

    mockCtx.runMutation.mockImplementation(async () => ({ ok: true }));

    const response = await issuesApiHandler(mockCtx, mockRequest);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.message).toContain("Project not found");
  });

  test("returns 403 for FORBIDDEN error", async () => {
    const mockCtx = createMockCtx();
    const mockRequest = createRequest("https://api.example.com/api/issues?projectId=jx76ss...");

    mockCtx.runQuery.mockImplementation(async (query: any) => {
      const name = safeGetFunctionName(query);
      if (name === getFunctionName(internal.apiKeys.validateApiKey)) {
        return validAuth;
      }
      if (name === getFunctionName(internal.ipRestrictions.checkProjectIpAllowed)) {
        return true;
      }
      if (name === getFunctionName(internal.issues.queries.listIssuesInternal)) {
        throw forbidden("viewer", "You do not have access");
      }
      return null;
    });

    mockCtx.runMutation.mockImplementation(async () => ({ ok: true }));

    const response = await issuesApiHandler(mockCtx, mockRequest);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.message).toContain("You do not have access");
  });

  test("returns 401 when missing API key", async () => {
    const mockCtx = createMockCtx();
    const mockRequest = new Request("https://api.example.com/api/issues?projectId=proj_123", {
      method: "GET",
      // No Authorization header
    });

    const response = await issuesApiHandler(mockCtx, mockRequest);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe("Missing API key");
  });

  test("returns 401 when invalid API key", async () => {
    const mockCtx = createMockCtx();
    const mockRequest = createRequest();

    mockCtx.runQuery.mockImplementation(async (query: any) => {
      const name = safeGetFunctionName(query);
      if (name === getFunctionName(internal.apiKeys.validateApiKey)) {
        return null; // Invalid key
      }
      return null;
    });

    const response = await issuesApiHandler(mockCtx, mockRequest);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe("Invalid or expired API key");
  });

  test("returns 400 when missing projectId", async () => {
    const mockCtx = createMockCtx();
    const mockRequest = new Request("https://api.example.com/api/issues", {
      // Missing projectId
      method: "GET",
      headers: {
        Authorization: "Bearer test-key",
      },
    });

    mockCtx.runQuery.mockImplementation(async (query: any) => {
      const name = safeGetFunctionName(query);
      if (name === getFunctionName(internal.apiKeys.validateApiKey)) {
        return validAuth;
      }
      return null;
    });

    mockCtx.runMutation.mockImplementation(async () => ({ ok: true }));

    const response = await issuesApiHandler(mockCtx, mockRequest);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe("projectId required");
  });
});
