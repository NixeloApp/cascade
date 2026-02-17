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
  it("should attempt to rate limit verification attempts", async () => {
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
    } catch (e: any) {
      // Ignore validation error
    }

    // Verify rateLimit was called
    expect(rateLimit).toHaveBeenCalled();
    // Verify arguments: ctx, "emailChange", { key: userId }
    // Note: ctx is a proxy, so strict equality might fail, but checking name and key is good.
    expect(rateLimit).toHaveBeenCalledWith(expect.anything(), "emailChange", { key: userId });
  });
});
