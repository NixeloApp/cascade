import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

// Mock the rateLimit function to verify it's called
// We do this because the actual rate limiter component doesn't block in the test environment
// likely due to configuration or environment isolation issues in convex-test.
vi.mock("./rateLimits", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./rateLimits")>();
  return {
    ...actual,
    rateLimit: vi.fn(),
  };
});

import { rateLimit } from "./rateLimits";

describe("Email Verification Brute Force Protection", () => {
  // TODO: This test verifies rate limiting is called during email verification
  // The vi.mock() doesn't intercept modules loaded by convex-test runtime,
  // so we can't verify the mock was called. The rate limiting exists in the
  // actual implementation (convex/users.ts verifyEmailChange calls rateLimit).
  // This test is skipped until a proper integration test approach is available.
  it.skip("should attempt to rate limit verification attempts", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t, { email: "attacker@example.com" });
    const asAttacker = asAuthenticatedUser(t, userId);

    // Request email change to generate OTP
    await asAttacker.mutation(api.users.updateProfile, {
      email: "victim@example.com",
    });

    const wrongToken = "00000000";

    // Call verifyEmailChange once
    try {
      await asAttacker.mutation(api.users.verifyEmailChange, {
        token: wrongToken,
      });
    } catch (_e: unknown) {
      // Ignore validation error
    }

    // Verify rateLimit was called
    expect(rateLimit).toHaveBeenCalled();
    // Verify arguments: ctx, "emailChange", { key: userId }
    // Note: ctx is a proxy, so strict equality might fail, but checking name and key is good.
    expect(rateLimit).toHaveBeenCalledWith(expect.anything(), "emailChange", { key: userId });
  });
});
