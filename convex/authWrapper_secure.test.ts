import { beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { securePasswordResetHandler } from "./authWrapper";
import { getClientIp } from "./lib/ssrf";

// Mock rateLimits to prevent top-level execution requiring components
vi.mock("./rateLimits", () => ({
  rateLimit: vi.fn(),
}));

vi.mock("./_generated/api", () => ({
  internal: {
    authWrapper: {
      checkPasswordResetRateLimit: "checkPasswordResetRateLimit",
      checkPasswordResetRateLimitByEmail: "checkPasswordResetRateLimitByEmail",
      schedulePasswordReset: "schedulePasswordReset",
    },
  },
}));

vi.mock("./lib/ssrf", () => ({
  getClientIp: vi.fn(),
}));

describe("securePasswordResetHandler", () => {
  const mockCtx = {
    runMutation: vi.fn(),
  } as unknown as ActionCtx & { runMutation: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should enforce IP rate limit", async () => {
    vi.mocked(getClientIp).mockReturnValue("127.0.0.1");
    // Mock the IP rate limit check to fail
    mockCtx.runMutation.mockImplementation((mutation) => {
      if (mutation === internal.authWrapper.checkPasswordResetRateLimit) {
        return Promise.reject(new Error("Rate limit exceeded"));
      }
      return Promise.resolve();
    });

    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" }),
    });

    const response = await securePasswordResetHandler(mockCtx, request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toBe("Rate limit exceeded");
    expect(mockCtx.runMutation).toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimit,
      { ip: "127.0.0.1" },
    );
  });

  it("should enforce email rate limit", async () => {
    vi.mocked(getClientIp).mockReturnValue("127.0.0.1");

    mockCtx.runMutation.mockImplementation((mutation) => {
      if (mutation === internal.authWrapper.checkPasswordResetRateLimitByEmail) {
        return Promise.reject(new Error("Rate limit exceeded"));
      }
      return Promise.resolve();
    });

    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ email: "Spammed@Example.com" }),
    });

    const response = await securePasswordResetHandler(mockCtx, request);
    const body = await response.json();

    // Should return success: true (silent fail)
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    // Verify IP check was called
    expect(mockCtx.runMutation).toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimit,
      { ip: "127.0.0.1" },
    );

    // Verify Email check WAS called with normalized email
    expect(mockCtx.runMutation).toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimitByEmail,
      { email: "spammed@example.com" },
    );

    // Verify schedule was NOT called
    expect(mockCtx.runMutation).not.toHaveBeenCalledWith(
      internal.authWrapper.schedulePasswordReset,
      expect.anything(),
    );
  });

  it("should schedule password reset when rate limits pass", async () => {
    vi.mocked(getClientIp).mockReturnValue("127.0.0.1");
    mockCtx.runMutation.mockResolvedValue(undefined);

    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ email: "  Valid@Example.com  " }),
    });

    const response = await securePasswordResetHandler(mockCtx, request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    // Verify IP check was called
    expect(mockCtx.runMutation).toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimit,
      { ip: "127.0.0.1" },
    );

    // Verify Email check was called with normalized email
    expect(mockCtx.runMutation).toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimitByEmail,
      { email: "valid@example.com" },
    );

    // Verify schedule was called with normalized email
    expect(mockCtx.runMutation).toHaveBeenCalledWith(internal.authWrapper.schedulePasswordReset, {
      email: "valid@example.com",
    });
  });
});
