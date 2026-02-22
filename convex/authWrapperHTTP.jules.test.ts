import { beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import { securePasswordResetHandler } from "./authWrapper";

// Mock logger
const logger = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
}));

vi.mock("./lib/logger", () => ({ logger }));

// Mock internal api
vi.mock("./_generated/api", () => ({
  internal: {
    authWrapper: {
      checkPasswordResetRateLimit: "checkPasswordResetRateLimit",
      checkPasswordResetRateLimitByEmail: "checkPasswordResetRateLimitByEmail",
      schedulePasswordReset: "schedulePasswordReset",
    },
  },
  components: {
    rateLimiter: {},
  },
}));

// Mock console.error to keep test output clean
vi.spyOn(console, "error").mockImplementation(() => {});

describe("securePasswordResetHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    // Default to test environment
    vi.stubEnv("NODE_ENV", "test");
  });

  const createRequest = (body: any, headers: Record<string, string> = {}) => {
    return new Request("http://localhost/api/auth/request-reset", {
      method: "POST",
      headers: new Headers(headers),
      body: JSON.stringify(body),
    });
  };

  const createCtx = () => {
    return {
      runMutation: vi.fn(),
      runAction: vi.fn(),
      scheduler: {
        runAfter: vi.fn(),
      },
    } as any;
  };

  it("should handle a successful request", async () => {
    const ctx = createCtx();
    const request = createRequest(
      { email: "user@example.com" },
      { "cf-connecting-ip": "203.0.113.1" },
    );

    const response = await securePasswordResetHandler(ctx, request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });

    // Verify IP rate limit check
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.authWrapper.checkPasswordResetRateLimit, {
      ip: "203.0.113.1",
    });

    // Verify Email rate limit check
    expect(ctx.runMutation).toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimitByEmail,
      { email: "user@example.com" },
    );

    // Verify Schedule reset
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.authWrapper.schedulePasswordReset, {
      email: "user@example.com",
    });
  });

  it("should use fallback IP in dev/test environment if no headers present", async () => {
    const ctx = createCtx();
    const request = createRequest({ email: "user@example.com" });

    // Ensure we are in test env (already set in beforeEach)
    vi.stubEnv("NODE_ENV", "test");

    const response = await securePasswordResetHandler(ctx, request);
    expect(response.status).toBe(200);

    // Verify IP rate limit check uses fallback IP
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.authWrapper.checkPasswordResetRateLimit, {
      ip: "127.0.0.1",
    });
  });

  it("should fail gracefully in production if no IP headers present", async () => {
    const ctx = createCtx();
    const request = createRequest({ email: "user@example.com" });

    // Simulate production environment
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("E2E_TEST_MODE", "");
    vi.stubEnv("CI", "");

    const response = await securePasswordResetHandler(ctx, request);
    const body = await response.json();

    // Should return 200 { success: true } to prevent info leak
    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });

    // Should log the error
    expect(logger.error).toHaveBeenCalledWith(
      "Secure password reset failed",
      expect.objectContaining({
        error: expect.objectContaining({
          message: "Could not determine client IP for security-sensitive action",
        }),
      }),
    );

    // Should NOT schedule reset
    expect(ctx.runMutation).not.toHaveBeenCalledWith(
      internal.authWrapper.schedulePasswordReset,
      expect.anything(),
    );
  });

  it("should return 429 if IP rate limit is exceeded", async () => {
    const ctx = createCtx();
    const request = createRequest(
      { email: "user@example.com" },
      { "cf-connecting-ip": "203.0.113.1" },
    );

    // Mock IP rate limit failure
    ctx.runMutation.mockImplementation(async (mutation: any) => {
      if (mutation === internal.authWrapper.checkPasswordResetRateLimit) {
        throw new Error("Rate limit exceeded");
      }
    });

    const response = await securePasswordResetHandler(ctx, request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body).toEqual({ success: false, error: "Rate limit exceeded" });

    // Should NOT proceed to email check or schedule
    expect(ctx.runMutation).not.toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimitByEmail,
      expect.anything(),
    );
  });

  it("should return 200 (silent failure) if Email rate limit is exceeded", async () => {
    const ctx = createCtx();
    const request = createRequest(
      { email: "user@example.com" },
      { "cf-connecting-ip": "203.0.113.1" },
    );

    // Mock Email rate limit failure
    ctx.runMutation.mockImplementation(async (mutation: any) => {
      if (mutation === internal.authWrapper.checkPasswordResetRateLimitByEmail) {
        throw new Error("Rate limit exceeded");
      }
    });

    const response = await securePasswordResetHandler(ctx, request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });

    // Should check IP first (implicitly verified by flow reaching email check)

    // Should NOT schedule reset
    expect(ctx.runMutation).not.toHaveBeenCalledWith(
      internal.authWrapper.schedulePasswordReset,
      expect.anything(),
    );
  });

  it("should handle invalid body or missing email gracefully", async () => {
    const ctx = createCtx();
    const request = createRequest({ notEmail: "something" }, { "cf-connecting-ip": "203.0.113.1" });

    const response = await securePasswordResetHandler(ctx, request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });

    // Should check IP first
    expect(ctx.runMutation).toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimit,
      expect.anything(),
    );

    // Should NOT check email rate limit (no email)
    expect(ctx.runMutation).not.toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimitByEmail,
      expect.anything(),
    );

    // Should NOT schedule reset
    expect(ctx.runMutation).not.toHaveBeenCalledWith(
      internal.authWrapper.schedulePasswordReset,
      expect.anything(),
    );
  });

  it("should normalize email address", async () => {
    const ctx = createCtx();
    const request = createRequest(
      { email: "  User@Example.COM  " },
      { "cf-connecting-ip": "203.0.113.1" },
    );

    await securePasswordResetHandler(ctx, request);

    // Verify Email rate limit check uses normalized email
    expect(ctx.runMutation).toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimitByEmail,
      { email: "user@example.com" },
    );

    // Verify Schedule reset uses normalized email
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.authWrapper.schedulePasswordReset, {
      email: "user@example.com",
    });
  });
});
