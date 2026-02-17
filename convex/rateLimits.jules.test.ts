import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the dependencies
// We need to use vi.doMock because we want to reset the module cache in each test
// but hoisting vi.mock is fine as long as we use doMock for the dynamic behavior if needed
// Actually, simple vi.mock works fine if we just want to spy on the constructor
vi.mock("@convex-dev/rate-limiter", () => {
  return {
    RateLimiter: vi.fn(() => ({
      limit: vi.fn(),
      check: vi.fn(),
      reset: vi.fn(),
    })),
  };
});

vi.mock("./_generated/api", () => ({
  components: {
    rateLimiter: {},
  },
}));

describe("Rate Limits Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("should use high limits in test environment", async () => {
    process.env.NODE_ENV = "test";

    // Dynamic import to trigger re-execution of the module code
    await import("./rateLimits");

    const { RateLimiter } = await import("@convex-dev/rate-limiter");
    expect(RateLimiter).toHaveBeenCalledTimes(1);

    // Get the second argument passed to the constructor (the config object)
    const config = (RateLimiter as any).mock.calls[0][1];

    // Verify password reset limits
    expect(config.passwordReset).toBeDefined();
    expect(config.passwordReset.rate).toBe(1000);
    expect(config.passwordReset.capacity).toBe(1000);

    // Verify email verification limits
    expect(config.emailVerification).toBeDefined();
    expect(config.emailVerification.rate).toBe(1000);
    expect(config.emailVerification.capacity).toBe(1000);
  });

  it("should use strict limits in production environment", async () => {
    process.env.NODE_ENV = "production";
    // Ensure these are unset so they don't trigger the test condition
    delete process.env.E2E_TEST_MODE;
    delete process.env.CI;

    // Dynamic import to trigger re-execution of the module code
    await import("./rateLimits");

    const { RateLimiter } = await import("@convex-dev/rate-limiter");
    expect(RateLimiter).toHaveBeenCalledTimes(1);

    // Get the second argument passed to the constructor (the config object)
    const config = (RateLimiter as any).mock.calls[0][1];

    // Verify password reset limits
    expect(config.passwordReset).toBeDefined();
    expect(config.passwordReset.rate).toBe(20);
    expect(config.passwordReset.capacity).toBe(20);

    // Verify email verification limits
    expect(config.emailVerification).toBeDefined();
    expect(config.emailVerification.rate).toBe(20);
    expect(config.emailVerification.capacity).toBe(20);
  });
});
