import { beforeEach, describe, expect, it, vi } from "vitest";
import { securePasswordResetHandler } from "./authWrapper";

// Mock internal api
vi.mock("./_generated/api", () => ({
  internal: {
    authWrapper: {
      checkPasswordResetRateLimit: "checkPasswordResetRateLimit",
      checkPasswordResetRateLimitByEmail: "checkPasswordResetRateLimitByEmail",
      schedulePasswordReset: "schedulePasswordReset",
    },
  },
}));

// Mock rateLimits to avoid top-level execution requiring components
vi.mock("./rateLimits", () => ({
  rateLimit: vi.fn(),
  checkRateLimit: vi.fn(),
}));

// Mock logger
vi.mock("./lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("securePasswordResetHandler", () => {
  let mockCtx: any;
  let mockRunMutation: any;

  beforeEach(() => {
    mockRunMutation = vi.fn();
    mockCtx = {
      runMutation: mockRunMutation,
    };
    vi.clearAllMocks();
  });

  const createRequest = (body: any, headers: Record<string, string> = {}) => {
    return new Request("https://api.convex.dev/auth/request-reset", {
      method: "POST",
      headers: new Headers(headers),
      body: JSON.stringify(body),
    });
  };

  it("should return 429 if IP rate limit is exceeded", async () => {
    // Simulate rate limit failure
    mockRunMutation.mockRejectedValueOnce(new Error("Rate limit exceeded"));

    const request = createRequest({ email: "test@example.com" }, { "x-forwarded-for": "1.2.3.4" });
    const response = await securePasswordResetHandler(mockCtx, request);

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body).toEqual({ success: false, error: "Rate limit exceeded" });
    expect(mockRunMutation).toHaveBeenCalledWith("checkPasswordResetRateLimit", { ip: "1.2.3.4" });
  });

  it("should return 200 (silent success) if email is invalid", async () => {
    mockRunMutation.mockResolvedValue(undefined);

    const request = createRequest({ email: 123 }, { "x-forwarded-for": "1.2.3.4" });
    const response = await securePasswordResetHandler(mockCtx, request);

    expect(response.status).toBe(200);
    expect(mockRunMutation).toHaveBeenCalledWith("checkPasswordResetRateLimit", { ip: "1.2.3.4" });
    expect(mockRunMutation).not.toHaveBeenCalledWith("schedulePasswordReset", expect.anything());
  });

  it("should return 200 (silent success) if email is empty", async () => {
    mockRunMutation.mockResolvedValue(undefined);

    const request = createRequest({ email: "" }, { "x-forwarded-for": "1.2.3.4" });
    const response = await securePasswordResetHandler(mockCtx, request);

    expect(response.status).toBe(200);
    expect(mockRunMutation).not.toHaveBeenCalledWith("schedulePasswordReset", expect.anything());
  });

  it("should return 200 (silent success) if email rate limit is exceeded", async () => {
    // IP check passes
    mockRunMutation.mockResolvedValueOnce(undefined);
    // Email check fails
    mockRunMutation.mockRejectedValueOnce(new Error("Rate limit exceeded"));

    const request = createRequest({ email: "test@example.com" }, { "x-forwarded-for": "1.2.3.4" });
    const response = await securePasswordResetHandler(mockCtx, request);

    expect(response.status).toBe(200);
    expect(mockRunMutation).toHaveBeenCalledWith("checkPasswordResetRateLimit", { ip: "1.2.3.4" });
    expect(mockRunMutation).toHaveBeenCalledWith("checkPasswordResetRateLimitByEmail", {
      email: "test@example.com",
    });
    expect(mockRunMutation).not.toHaveBeenCalledWith("schedulePasswordReset", expect.anything());
  });

  it("should return 200 and schedule reset on success", async () => {
    mockRunMutation.mockResolvedValue(undefined);

    const request = createRequest({ email: "Test@Example.Com" }, { "x-forwarded-for": "1.2.3.4" });
    const response = await securePasswordResetHandler(mockCtx, request);

    expect(response.status).toBe(200);

    // Check normalization
    expect(mockRunMutation).toHaveBeenCalledWith("checkPasswordResetRateLimitByEmail", {
      email: "test@example.com",
    });
    expect(mockRunMutation).toHaveBeenCalledWith("schedulePasswordReset", {
      email: "test@example.com",
    });
  });

  it("should default to 127.0.0.1 in test environment if no IP headers provided", async () => {
    mockRunMutation.mockResolvedValue(undefined);

    const request = createRequest({ email: "test@example.com" });
    const response = await securePasswordResetHandler(mockCtx, request);

    expect(response.status).toBe(200);
    expect(mockRunMutation).toHaveBeenCalledWith("checkPasswordResetRateLimit", {
      ip: "127.0.0.1",
    });
  });

  it("should return 200 on unexpected errors", async () => {
    // IP check throws generic error (not rate limit, but treated similarly or just caught)
    // Actually the code catches rate limit specifically for the first try/catch block for IP
    // Wait, the code says:
    /*
    try {
      await ctx.runMutation(internal.authWrapper.checkPasswordResetRateLimit, { ip: clientIp });
    } catch {
      // Rate limit exceeded
      return new Response(...)
    }
    */
    // So ANY error from checkPasswordResetRateLimit will cause a 429.

    // But if something else fails, e.g. request.json() fails
    const badRequest = new Request("https://api.convex.dev/auth/request-reset", {
      method: "POST",
      headers: new Headers({ "x-forwarded-for": "1.2.3.4" }),
      body: "invalid-json",
    });

    const response = await securePasswordResetHandler(mockCtx, badRequest);
    expect(response.status).toBe(200);
  });
});
