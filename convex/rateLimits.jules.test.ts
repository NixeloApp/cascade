import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Define a spy to capture constructor arguments
const constructorSpy = vi.fn();

// Mock the dependencies
vi.mock("@convex-dev/rate-limiter", () => {
  return {
    RateLimiter: class MockRateLimiter {
      constructor(...args: any[]) {
        constructorSpy(...args);
      }
      limit = vi.fn();
      check = vi.fn();
      reset = vi.fn();
    },
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
    constructorSpy.mockClear();
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

    expect(constructorSpy).toHaveBeenCalledTimes(1);

    // Get the second argument passed to the constructor (the config object)
    const config = constructorSpy.mock.calls[0][1];

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

    expect(constructorSpy).toHaveBeenCalledTimes(1);

    // Get the second argument passed to the constructor (the config object)
    const config = constructorSpy.mock.calls[0][1];

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
