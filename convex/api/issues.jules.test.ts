import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionCtx } from "../_generated/server";
import { issuesApiHandler } from "./issues";

// Mock dependencies
vi.mock("../_generated/api", () => ({
  internal: {
    apiKeys: {
      validateApiKey: "validateApiKey",
      recordUsage: "recordUsage",
    },
    ipRestrictions: {
      checkProjectIpAllowed: "checkProjectIpAllowed",
    },
    issues: {
      queries: {
        listIssuesInternal: "listIssuesInternal",
      },
    },
  },
  components: {
    rateLimiter: {
      lib: {
        rateLimit: "rateLimit",
      },
    },
  },
}));

vi.mock("../lib/ssrf", () => ({
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

vi.mock("../lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock crypto.subtle for environments where it might be missing or slow (though edge-runtime has it)
// But since we are mocking apiAuth implicitly by letting it run, we rely on real crypto.
// If needed we can mock hashApiKey.
// For now, let's assume crypto works as checked.

describe("issuesApiHandler", () => {
  let mockCtx: ActionCtx;
  let mockRequest: Request;

  beforeEach(() => {
    vi.resetAllMocks();
    mockCtx = {
      runQuery: vi.fn(),
      runMutation: vi.fn(),
      auth: { getUserIdentity: vi.fn() },
      scheduler: { runAfter: vi.fn() },
      vectorSearch: vi.fn(),
    } as unknown as ActionCtx;
  });

  const createRequest = (url: string, headers: Record<string, string> = {}) => {
    return new Request(url, {
      method: "GET",
      headers: new Headers(headers),
    });
  };

  it("should return 401 if API key is missing", async () => {
    const request = createRequest("https://api.convex.site/api/issues?projectId=p1");
    const response = await issuesApiHandler(mockCtx, request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe("Missing API key");
  });

  it("should return 401 if API key is invalid", async () => {
    const request = createRequest("https://api.convex.site/api/issues?projectId=p1", {
      Authorization: "Bearer invalid-key",
    });

    // validateApiKey returns null
    (mockCtx.runQuery as any).mockResolvedValueOnce(null);

    const response = await issuesApiHandler(mockCtx, request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe("Invalid or expired API key");
  });

  it("should return 429 if rate limit exceeded", async () => {
    const request = createRequest("https://api.convex.site/api/issues?projectId=p1", {
      Authorization: "Bearer valid-key",
    });

    // validateApiKey returns auth context
    (mockCtx.runQuery as any).mockResolvedValueOnce({
      userId: "user1",
      keyId: "key1",
      scopes: ["issues:read"],
      rateLimit: 100,
    });

    // rateLimit mutation returns not ok
    (mockCtx.runMutation as any).mockResolvedValueOnce({
      ok: false,
      retryAfter: 60000,
    });

    const response = await issuesApiHandler(mockCtx, request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.message).toBe("Rate limit exceeded");
  });

  it("should return 400 if projectId is missing", async () => {
    const request = createRequest("https://api.convex.site/api/issues", {
      Authorization: "Bearer valid-key",
    });

    (mockCtx.runQuery as any).mockResolvedValueOnce({
      userId: "user1",
      keyId: "key1",
      scopes: ["issues:read"],
      rateLimit: 100,
    });

    (mockCtx.runMutation as any).mockResolvedValueOnce({ ok: true }); // rate limit ok

    const response = await issuesApiHandler(mockCtx, request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe("projectId required");
  });

  it("should return 403 if IP address is not allowed", async () => {
    const request = createRequest("https://api.convex.site/api/issues?projectId=p1", {
      Authorization: "Bearer valid-key",
    });

    (mockCtx.runQuery as any)
      .mockResolvedValueOnce({
        userId: "user1",
        keyId: "key1",
        scopes: ["issues:read"],
        rateLimit: 100,
      })
      .mockResolvedValueOnce(false); // checkProjectIpAllowed returns false

    (mockCtx.runMutation as any).mockResolvedValueOnce({ ok: true }); // rate limit ok

    const response = await issuesApiHandler(mockCtx, request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.message).toBe("IP address not allowed");
  });

  it("should return 403 if scope is missing", async () => {
    const request = createRequest("https://api.convex.site/api/issues?projectId=p1", {
      Authorization: "Bearer valid-key",
    });

    // auth has wrong scope
    (mockCtx.runQuery as any).mockResolvedValueOnce({
      userId: "user1",
      keyId: "key1",
      scopes: ["other:scope"],
      rateLimit: 100,
    });

    (mockCtx.runMutation as any).mockResolvedValueOnce({ ok: true }); // rate limit ok

    const response = await issuesApiHandler(mockCtx, request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.message).toBe("Missing scope: issues:read");
  });

  it("should return 403 if key is scoped to another project", async () => {
    const request = createRequest("https://api.convex.site/api/issues?projectId=p1", {
      Authorization: "Bearer valid-key",
    });

    // auth has project restriction
    (mockCtx.runQuery as any).mockResolvedValueOnce({
      userId: "user1",
      keyId: "key1",
      scopes: ["issues:read"],
      projectId: "p2", // different project
      rateLimit: 100,
    });

    (mockCtx.runMutation as any).mockResolvedValueOnce({ ok: true });

    // Mock IP check to pass
    (mockCtx.runQuery as any).mockResolvedValueOnce(true);

    const response = await issuesApiHandler(mockCtx, request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.message).toBe("Not authorized for this project");
  });

  it("should return 200 and data if all checks pass", async () => {
    const request = createRequest("https://api.convex.site/api/issues?projectId=p1", {
      Authorization: "Bearer valid-key",
    });

    const mockIssues = [{ id: "issue1", title: "Test Issue" }];

    // 1. validateApiKey
    (mockCtx.runQuery as any).mockResolvedValueOnce({
      userId: "user1",
      keyId: "key1",
      scopes: ["issues:read"],
      rateLimit: 100,
    });

    // 2. rateLimit
    (mockCtx.runMutation as any).mockResolvedValueOnce({ ok: true });

    // 3. checkProjectIpAllowed
    (mockCtx.runQuery as any).mockResolvedValueOnce(true);

    // 4. listIssuesInternal
    (mockCtx.runQuery as any).mockResolvedValueOnce(mockIssues);

    const response = await issuesApiHandler(mockCtx, request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: mockIssues });
  });

  it("should record API usage on success", async () => {
    const request = createRequest("https://api.convex.site/api/issues?projectId=p1", {
      Authorization: "Bearer valid-key",
    });

    (mockCtx.runQuery as any)
      .mockResolvedValueOnce({
        userId: "user1",
        keyId: "key1",
        scopes: ["issues:read"],
        rateLimit: 100,
      })
      .mockResolvedValueOnce(true) // checkProjectIpAllowed
      .mockResolvedValueOnce([]); // listIssuesInternal

    (mockCtx.runMutation as any).mockResolvedValueOnce({ ok: true }); // rateLimit

    await issuesApiHandler(mockCtx, request);

    // recordUsage should be called
    expect(mockCtx.runMutation).toHaveBeenCalledWith(
      expect.anything(), // internal.apiKeys.recordUsage (we mocked the object, but here we just check call)
      expect.objectContaining({
        keyId: "key1",
        endpoint: "/api/issues",
        statusCode: 200,
      }),
    );
  });

  it("should record API usage on failure (if authenticated)", async () => {
    const request = createRequest("https://api.convex.site/api/issues?projectId=p1", {
      Authorization: "Bearer valid-key",
    });

    // Authenticated but fails later (e.g. IP check)
    (mockCtx.runQuery as any)
      .mockResolvedValueOnce({
        userId: "user1",
        keyId: "key1",
        scopes: ["issues:read"],
        rateLimit: 100,
      })
      .mockResolvedValueOnce(false); // checkProjectIpAllowed fails

    (mockCtx.runMutation as any).mockResolvedValueOnce({ ok: true }); // rateLimit

    await issuesApiHandler(mockCtx, request);

    expect(mockCtx.runMutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        keyId: "key1",
        statusCode: 403,
        error: "IP address not allowed",
      }),
    );
  });
});
