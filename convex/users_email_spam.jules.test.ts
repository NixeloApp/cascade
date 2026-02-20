import { register } from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

describe("Users Email Spam & Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("should NOT send verification email if email is already taken (prevents spam)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SKIP_USAGE_RECORDING", "true");

    const t = convexTest(schema, modules);
    register(t);

    const attackerId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Attacker",
        email: "attacker@example.com",
        emailVerificationTime: Date.now(),
      });
    });

    await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Victim",
        email: "victim@example.com",
        emailVerificationTime: Date.now(),
      });
    });

    const attacker = t.withIdentity({ subject: attackerId });

    await attacker.mutation(api.users.updateProfile, {
      email: "victim@example.com",
    });

    // Verify NO action was scheduled
    const scheduled = await t.run(async (ctx) => {
      return await ctx.db.system.query("_scheduled_functions").collect();
    });

    // We expect 0 scheduled functions related to verification
    const verificationJobs = scheduled.filter(job => job.name === "users:sendVerificationEmailAction");
    expect(verificationJobs).toHaveLength(0);

    const attackerUser = await t.run(async (ctx) => ctx.db.get(attackerId));
    expect(attackerUser?.pendingEmail).toBe("victim@example.com");
  });

  it("should send verification email if email is free", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SKIP_USAGE_RECORDING", "true");
    // We don't need other env vars if we are only checking scheduling

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

    await attacker.mutation(api.users.updateProfile, {
      email: "free@example.com",
    });

    // Verify action WAS scheduled
    const scheduled = await t.run(async (ctx) => {
      return await ctx.db.system.query("_scheduled_functions").collect();
    });

    const verificationJobs = scheduled.filter(job => job.name === "users:sendVerificationEmailAction");
    expect(verificationJobs).toHaveLength(1);
    const args = verificationJobs[0].args[0] as any;
    expect(args.email).toBe("free@example.com");
  });
});
