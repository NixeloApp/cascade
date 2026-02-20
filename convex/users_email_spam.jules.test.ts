import { register } from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

// Mock rateLimit
vi.mock("./rateLimits", () => ({
  rateLimit: vi.fn(),
}));

// Mock sendEmail
vi.mock("./email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, id: "mock-id" }),
}));

import { sendEmail } from "./email";
import { rateLimit } from "./rateLimits";

describe("Users Email Spam & Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call rateLimit when changing email", async () => {
    const t = convexTest(schema, modules);
    register(t);

    const attackerId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Attacker",
        email: "attacker@example.com",
        emailVerificationTime: Date.now(),
      });
    });

    const attacker = t.withIdentity({ subject: attackerId });

    // Change email
    await attacker.mutation(api.users.updateProfile, {
      email: "newemail@example.com",
    });

    // Verify rateLimit was called
    expect(rateLimit).toHaveBeenCalledWith(expect.anything(), "emailChange", { key: attackerId });
  });

  it("should NOT send verification email if email is already taken (prevents spam)", async () => {
    const t = convexTest(schema, modules);
    register(t);

    // Create Attacker
    const attackerId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Attacker",
        email: "attacker@example.com",
        emailVerificationTime: Date.now(),
      });
    });

    // Create Victim
    await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Victim",
        email: "victim@example.com",
        emailVerificationTime: Date.now(),
      });
    });

    const attacker = t.withIdentity({ subject: attackerId });

    // Try to change email to victim's email
    await attacker.mutation(api.users.updateProfile, {
      email: "victim@example.com",
    });

    // Verify rateLimit was called
    expect(rateLimit).toHaveBeenCalledWith(expect.anything(), "emailChange", { key: attackerId });

    // Verify sendEmail was NOT called
    expect(sendEmail).not.toHaveBeenCalled();

    // Verify DB state updated (to prevent enumeration)
    const attackerUser = await t.run(async (ctx) => ctx.db.get(attackerId));
    expect(attackerUser?.pendingEmail).toBe("victim@example.com");
  });

  it("should send verification email if email is free", async () => {
    const t = convexTest(schema, modules);
    register(t);

    const attackerId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Attacker",
        email: "attacker@example.com",
        emailVerificationTime: Date.now(),
      });
    });

    const attacker = t.withIdentity({ subject: attackerId });

    // Change email to free email
    await attacker.mutation(api.users.updateProfile, {
      email: "free@example.com",
    });

    // Verify sendEmail WAS called
    expect(sendEmail).toHaveBeenCalled();
  });
});
