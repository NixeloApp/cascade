import { beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import { securePasswordResetHandler } from "./authWrapper";

// Mock logger
vi.mock("./lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock ssrf
vi.mock("./lib/ssrf", () => ({
  getClientIp: vi.fn(),
}));

// Mock generated API to allow strict equality checks
vi.mock("./_generated/api", () => ({
  internal: {
    authWrapper: {
      checkPasswordResetRateLimit: Symbol("checkPasswordResetRateLimit"),
      checkPasswordResetRateLimitByEmail: Symbol("checkPasswordResetRateLimitByEmail"),
      schedulePasswordReset: Symbol("schedulePasswordReset"),
      performPasswordReset: Symbol("performPasswordReset"),
      checkAuthRateLimit: Symbol("checkAuthRateLimit"),
    },
  },
  components: {
    rateLimiter: {},
  },
}));

// Mock rateLimits module entirely to avoid initialization issues
vi.mock("./rateLimits", () => ({
  rateLimit: vi.fn(),
  rateLimitConfig: {},
}));

import { logger } from "./lib/logger";
// Get the mocked getClientIp
import { getClientIp } from "./lib/ssrf";

describe("securePasswordResetHandler", () => {
  let mockCtx: any;
  let mockRequest: Request;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = {
      runMutation: vi.fn(),
    };
    mockRequest = {
      json: vi.fn().mockResolvedValue({ email: "test@example.com" }),
      headers: new Headers(),
    } as any;
  });

  it("should return 429 if IP rate limit is exceeded", async () => {
    (getClientIp as any).mockReturnValue("1.2.3.4");

    mockCtx.runMutation.mockImplementation((mutation: any, _args: any) => {
      if (mutation === internal.authWrapper.checkPasswordResetRateLimit) {
        throw new Error("Rate limit exceeded");
      }
      return Promise.resolve();
    });

    const response = await securePasswordResetHandler(mockCtx, mockRequest);

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("should return 200 (silent failure) if email rate limit is exceeded", async () => {
    (getClientIp as any).mockReturnValue("1.2.3.4");

    mockCtx.runMutation.mockImplementation((mutation: any, _args: any) => {
      if (mutation === internal.authWrapper.checkPasswordResetRateLimit) {
        return Promise.resolve();
      }
      if (mutation === internal.authWrapper.checkPasswordResetRateLimitByEmail) {
        throw new Error("Rate limit exceeded");
      }
      return Promise.resolve();
    });

    const response = await securePasswordResetHandler(mockCtx, mockRequest);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    // Verify schedulePasswordReset was NOT called
    expect(mockCtx.runMutation).not.toHaveBeenCalledWith(
      internal.authWrapper.schedulePasswordReset,
      expect.anything(),
    );
  });

  it("should return 200 and schedule reset on success", async () => {
    (getClientIp as any).mockReturnValue("1.2.3.4");

    // Normalize input email
    mockRequest.json = vi.fn().mockResolvedValue({ email: "  TeSt@ExAmPlE.CoM  " });

    mockCtx.runMutation.mockResolvedValue(undefined);

    const response = await securePasswordResetHandler(mockCtx, mockRequest);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    // Verify schedulePasswordReset called with normalized email
    expect(mockCtx.runMutation).toHaveBeenCalledWith(internal.authWrapper.schedulePasswordReset, {
      email: "test@example.com",
    });
  });

  it("should fallback to 127.0.0.1 if IP is missing in test environment", async () => {
    (getClientIp as any).mockReturnValue(null);
    mockCtx.runMutation.mockResolvedValue(undefined);

    await securePasswordResetHandler(mockCtx, mockRequest);

    expect(mockCtx.runMutation).toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimit,
      { ip: "127.0.0.1" },
    );
  });

  it("should return 200 (silent failure) and log error if IP is missing in production", async () => {
    (getClientIp as any).mockReturnValue(null);

    // Stub env variables to simulate production
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("E2E_TEST_MODE", "");
    vi.stubEnv("CI", "");

    const response = await securePasswordResetHandler(mockCtx, mockRequest);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    expect(logger.error).toHaveBeenCalledWith(
      "Secure password reset failed",
      expect.objectContaining({
        error: expect.objectContaining({
          message: "Could not determine client IP for security-sensitive action",
        }),
      }),
    );

    // Restore env
    vi.unstubAllEnvs();
  });
});
