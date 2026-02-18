import { register } from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Email Claim Vulnerability Fix", () => {
  it("should prevent claiming an email immediately and require verification", async () => {
    const t = convexTest(schema, modules);
    register(t);

    // 1. Create Attacker
    const attackerId = await createTestUser(t, { name: "Attacker", email: "attacker@example.com" });
    const asAttacker = asAuthenticatedUser(t, attackerId);

    // 2. Create Victim's target email
    const victimEmail = "victim@example.com";

    // Attacker updates profile to claim victim's email
    await asAttacker.mutation(api.users.updateProfile, {
      email: victimEmail,
    });

    // Verify Attacker has NOT claimed the email yet
    let attacker = await t.run(async (ctx) => ctx.db.get(attackerId));
    expect(attacker?.email).toBe("attacker@example.com"); // Still old email
    expect(attacker?.pendingEmail).toBe(victimEmail);
    expect(attacker?.pendingEmailVerificationToken).toBeDefined();

    // 3. Verify Victim can still register (simulated by creating a user)
    // The previous vulnerability was that Attacker could block this step.
    // Now, since email is not taken, Victim can proceed.
    const victimId = await createTestUser(t, { name: "Victim", email: victimEmail });
    const asVictim = asAuthenticatedUser(t, victimId);

    // Verify Victim got the email
    const victim = await t.run(async (ctx) => ctx.db.get(victimId));
    expect(victim?.email).toBe(victimEmail);

    // 4. Attacker tries to verify the change
    // Should fail because Victim now owns the email
    const token = attacker?.pendingEmailVerificationToken;
    if (!token) throw new Error("Token not found");

    await expect(async () => {
      await asAttacker.mutation(api.users.verifyEmailChange, {
        token,
      });
    }).rejects.toThrow("Email already in use");

    // 5. Verify Attacker email is still unchanged
    attacker = await t.run(async (ctx) => ctx.db.get(attackerId));
    expect(attacker?.email).toBe("attacker@example.com");
  });

  it("should allow legitimate email change with verification", async () => {
    const t = convexTest(schema, modules);
    register(t);
    const userId = await createTestUser(t, { email: "old@example.com" });
    const asUser = asAuthenticatedUser(t, userId);
    const newEmail = "new@example.com";

    // Request change
    await asUser.mutation(api.users.updateProfile, {
      email: newEmail,
    });

    // Get token
    const user = await t.run(async (ctx) => ctx.db.get(userId));
    const token = user?.pendingEmailVerificationToken;
    expect(token).toBeDefined();

    // Verify
    if (!token) throw new Error("Expected token to be defined");
    await asUser.mutation(api.users.verifyEmailChange, {
      token,
    });

    // Check updated
    const updatedUser = await t.run(async (ctx) => ctx.db.get(userId));
    expect(updatedUser?.email).toBe(newEmail);
    expect(updatedUser?.pendingEmail).toBeUndefined();
    expect(updatedUser?.emailVerificationTime).toBeDefined();
  });
});
