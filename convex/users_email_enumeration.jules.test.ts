import { register } from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

describe("Users Email Enumeration", () => {
  it("should prevent email enumeration via updateProfile", async () => {
    const t = convexTest(schema, modules);
    register(t);

    // Create User A (Attacker)
    const attackerId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Attacker",
        email: "attacker@example.com",
        emailVerificationTime: Date.now(),
      });
    });

    // Create User B (Victim)
    const victimEmail = "victim@example.com";
    await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Victim",
        email: victimEmail,
        emailVerificationTime: Date.now(),
      });
    });

    // Attacker tries to update their email to Victim's email
    // This should succeed (send verification email) instead of throwing "Email already in use"
    const attacker = t.withIdentity({ subject: attackerId });

    await attacker.mutation(api.users.updateProfile, {
      email: victimEmail,
    });

    // Verify that the attacker's pending email is set
    const attackerUser = await t.run(async (ctx) => ctx.db.get(attackerId));
    expect(attackerUser?.pendingEmail).toBe(victimEmail);
    const token = attackerUser?.pendingEmailVerificationToken;
    expect(token).toBeDefined();

    // Now try to verify the change
    // This MUST fail because the email is actually taken
    if (token) {
      await expect(
        attacker.mutation(api.users.verifyEmailChange, {
          token: token,
        }),
      ).rejects.toThrow("Email already in use");
    }
  });
});
