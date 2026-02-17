import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import { rateLimit } from "./rateLimits";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

// Mock rateLimit module
vi.mock("./rateLimits", () => ({
  rateLimit: vi.fn(),
}));

describe("Email Change Spam Protection", () => {
  it("should call rate limit on email change", async () => {
    const t = convexTest(schema, modules);

    const userId = await createTestUser(t, { email: "user@example.com" });
    const asUser = asAuthenticatedUser(t, userId);

    const targetEmail = "target@example.com";

    // Call updateProfile to change email
    await asUser.mutation(api.users.updateProfile, {
      email: targetEmail,
    });

    // Expect rateLimit to have been called with "emailChange" and userId
    expect(rateLimit).toHaveBeenCalledWith(
      expect.anything(), // ctx
      "emailChange",
      { key: userId },
    );
  });

  it("should NOT call rate limit if email is unchanged", async () => {
    const t = convexTest(schema, modules);
    (rateLimit as any).mockClear();

    const userId = await createTestUser(t, { email: "user@example.com" });
    const asUser = asAuthenticatedUser(t, userId);

    // Call updateProfile with SAME email
    await asUser.mutation(api.users.updateProfile, {
      email: "user@example.com",
    });

    // Should NOT be called
    expect(rateLimit).not.toHaveBeenCalled();
  });
});
