import { register } from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Email Change Verification", () => {
  it("should allow verifying email with correct token", async () => {
    const t = convexTest(schema, modules);
    register(t);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    const newEmail = "new.email@example.com";
    await asUser.mutation(api.users.updateProfile, {
      email: newEmail,
    });

    const user = await t.run(async (ctx) => ctx.db.get(userId));
    const token = user?.pendingEmailVerificationToken;
    expect(token).toBeDefined();

    if (!token) throw new Error("Expected token to be defined");

    await asUser.mutation(api.users.verifyEmailChange, {
      token,
    });

    const updatedUser = await t.run(async (ctx) => ctx.db.get(userId));
    expect(updatedUser?.email).toBe(newEmail);
  });

  it("should reject verifying email with incorrect token", async () => {
    const t = convexTest(schema, modules);
    register(t);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    const newEmail = "new.email@example.com";
    await asUser.mutation(api.users.updateProfile, {
      email: newEmail,
    });

    const user = await t.run(async (ctx) => ctx.db.get(userId));
    const token = user?.pendingEmailVerificationToken;
    expect(token).toBeDefined();

    await expect(
      asUser.mutation(api.users.verifyEmailChange, {
        token: "wrong-token",
      }),
    ).rejects.toThrow("Invalid verification token");
  });
});
