import { beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import { securePasswordResetHandler } from "./authWrapper";
import { shouldRunInlineForE2E } from "./lib/envDetection";
import { logger } from "./lib/logger";

// Mock internal mutations and actions
vi.mock("./_generated/api", () => ({
  internal: {
    authWrapper: {
      checkPasswordResetRateLimit: "internal.authWrapper.checkPasswordResetRateLimit",
      checkPasswordResetRateLimitByEmail: "internal.authWrapper.checkPasswordResetRateLimitByEmail",
      schedulePasswordReset: "internal.authWrapper.schedulePasswordReset",
      performPasswordReset: "internal.authWrapper.performPasswordReset",
    },
  },
  components: {
    rateLimiter: {},
  },
}));

// Mock logger
vi.mock("./lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("securePasswordResetHandler", () => {
  let mockCtx: any;
  let runMutationMock: any;
  let runActionMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    runMutationMock = vi.fn();
    runActionMock = vi.fn();
    mockCtx = {
      runMutation: runMutationMock,
      runAction: runActionMock,
    };
  });

  const createRequest = (body: any, headers: Record<string, string> = {}) => {
    return new Request("https://example.com/api/auth/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
  };

  it("should return 200 and schedule reset for valid request", async () => {
    const email = "test@example.com";
    const request = createRequest({ email });

    // Success scenario
    runMutationMock.mockResolvedValue(undefined);
    runActionMock.mockResolvedValue(undefined);

    const response = await securePasswordResetHandler(mockCtx, request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ success: true });

    // Verify rate limit checks always happen
    expect(runMutationMock).toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimit,
      expect.objectContaining({ ip: expect.any(String) }),
    );
    expect(runMutationMock).toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimitByEmail,
      { email },
    );

    // In CI/E2E mode, uses runAction(performPasswordReset) inline
    // In production mode, uses runMutation(schedulePasswordReset) async
    if (shouldRunInlineForE2E()) {
      expect(runMutationMock).toHaveBeenCalledTimes(2);
      expect(runActionMock).toHaveBeenCalledWith(internal.authWrapper.performPasswordReset, {
        email,
      });
    } else {
      expect(runMutationMock).toHaveBeenCalledTimes(3);
      expect(runMutationMock).toHaveBeenCalledWith(internal.authWrapper.schedulePasswordReset, {
        email,
      });
    }
  });

  it("should return 429 if IP rate limit exceeded", async () => {
    const email = "test@example.com";
    const request = createRequest({ email });

    // Fail first mutation (IP rate limit)
    runMutationMock.mockImplementation((mutation: any) => {
      if (mutation === internal.authWrapper.checkPasswordResetRateLimit) {
        throw new Error("Rate limit exceeded");
      }
      return Promise.resolve();
    });

    const response = await securePasswordResetHandler(mockCtx, request);

    expect(response.status).toBe(429);
    const json = await response.json();
    expect(json).toEqual({ success: false, error: "Rate limit exceeded" });

    // Should verify only IP check was called
    expect(runMutationMock).toHaveBeenCalledTimes(1);
    expect(runMutationMock).toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimit,
      expect.anything(),
    );
  });

  it("should return 200 (silent failure) if Email rate limit exceeded", async () => {
    const email = "test@example.com";
    const request = createRequest({ email });

    // Fail second mutation (Email rate limit)
    runMutationMock.mockImplementation((mutation: any) => {
      if (mutation === internal.authWrapper.checkPasswordResetRateLimitByEmail) {
        throw new Error("Rate limit exceeded");
      }
      return Promise.resolve();
    });

    const response = await securePasswordResetHandler(mockCtx, request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ success: true });

    // Should verify IP and Email checks were called, but NOT schedule
    expect(runMutationMock).toHaveBeenCalledTimes(2);
    expect(runMutationMock).toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimit,
      expect.anything(),
    );
    expect(runMutationMock).toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimitByEmail,
      { email },
    );
    expect(runMutationMock).not.toHaveBeenCalledWith(
      internal.authWrapper.schedulePasswordReset,
      expect.anything(),
    );
  });

  it("should return 200 (silent failure) if email is missing", async () => {
    const request = createRequest({}); // No email

    runMutationMock.mockResolvedValue(undefined);

    const response = await securePasswordResetHandler(mockCtx, request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ success: true });

    // Should verify IP check was called, but nothing else
    expect(runMutationMock).toHaveBeenCalledTimes(1);
    expect(runMutationMock).toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimit,
      expect.anything(),
    );
    expect(runMutationMock).not.toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimitByEmail,
      expect.anything(),
    );
  });

  it("should return 200 (silent failure) if email is invalid type", async () => {
    const request = createRequest({ email: 123 }); // Invalid email type

    runMutationMock.mockResolvedValue(undefined);

    const response = await securePasswordResetHandler(mockCtx, request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ success: true });

    expect(runMutationMock).toHaveBeenCalledTimes(1);
  });

  it("should return 200 (silent failure) and log error on unexpected failure", async () => {
    const email = "test@example.com";
    const request = createRequest({ email });

    // Fail the final step - either:
    // - schedulePasswordReset mutation (production mode)
    // - performPasswordReset action (CI/E2E mode)
    runMutationMock.mockImplementation((mutation: any) => {
      if (mutation === internal.authWrapper.schedulePasswordReset) {
        throw new Error("Database error");
      }
      return Promise.resolve();
    });
    runActionMock.mockImplementation((action: any) => {
      if (action === internal.authWrapper.performPasswordReset) {
        throw new Error("Database error");
      }
      return Promise.resolve();
    });

    const response = await securePasswordResetHandler(mockCtx, request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ success: true });

    expect(logger.error).toHaveBeenCalledWith(
      "Secure password reset failed",
      expect.objectContaining({
        error: expect.any(Error),
      }),
    );
  });

  it("should extract IP from X-Forwarded-For header", async () => {
    const email = "test@example.com";
    const request = createRequest({ email }, { "X-Forwarded-For": "1.2.3.4" });

    runMutationMock.mockResolvedValue(undefined);

    await securePasswordResetHandler(mockCtx, request);

    expect(runMutationMock).toHaveBeenCalledWith(internal.authWrapper.checkPasswordResetRateLimit, {
      ip: "1.2.3.4",
    });
  });
});
