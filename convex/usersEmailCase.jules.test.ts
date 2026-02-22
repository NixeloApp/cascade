
import { register } from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser } from "./testUtils";

describe("Users Email Case Sensitivity", () => {
  it("should prevent duplicate emails with different casing", async () => {
    const t = convexTest(schema, modules);
    register(t);

    // Create first user
    const user1Id = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "User 1",
        email: "user@example.com",
        emailVerificationTime: Date.now(),
      });
    });

    // Create second user
    const user2Id = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "User 2",
        email: "other@example.com",
        emailVerificationTime: Date.now(),
      });
    });

    const asUser2 = asAuthenticatedUser(t, user2Id);

    // Try to update User 2's email to match User 1's email but with different case
    await asUser2.mutation(api.users.updateProfile, {
      email: "User@Example.com",
    });

    // Verify User 2 has the pending email
    let user2 = await t.run(async (ctx) => ctx.db.get(user2Id));
    // After fix, this should be normalized. Before fix, it's original case.
    // We'll assert the normalization behavior first as part of the fix verification.
    expect(user2?.pendingEmail).toBe("user@example.com");

    // Manually verify the email change
    const token = user2?.pendingEmailVerificationToken;
    if (!token) throw new Error("Token missing");

    // This should FAIL because "user@example.com" is already taken by User 1
    await expect(asUser2.mutation(api.users.verifyEmailChange, { token })).rejects.toThrow(
      "Email already in use",
    );
  });
});
