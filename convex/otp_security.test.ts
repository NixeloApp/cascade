import { getFunctionName } from "convex/server";
import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OTPPasswordReset } from "./OTPPasswordReset";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

// Access the sendVerificationRequest function
const sendVerificationRequest = (OTPPasswordReset as any).options
  ? (OTPPasswordReset as any).options.sendVerificationRequest
  : (OTPPasswordReset as any).sendVerificationRequest;

describe("OTP Security", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // Helper to create a mocked context that skips rate limiting
  const createMockCtx = (ctx: any) => ({
    ...ctx,
    runMutation: async (mutation: any, args: any) => {
      // Check if it matches by name, as reference equality might fail across imports
      // internal.authWrapper.checkPasswordResetRateLimitByEmail
      const mutationName = getFunctionName(mutation);

      if (mutationName.includes("checkPasswordResetRateLimitByEmail")) {
        return;
      }
      return ctx.runMutation(mutation, args);
    },
  });

  it("should store OTP for mailtrap emails in safe environments (regardless of isTestUser)", async () => {
    // Note: We store OTPs unconditionally for test emails (@inbox.mailtrap.io) in safe
    // environments. This matches OTPVerification behavior and fixes E2E test flakiness
    // where the isTestUser flag wasn't set in time for password reset flows.
    process.env.E2E_API_KEY = "test-key";
    process.env.NODE_ENV = "production";

    const t = convexTest(schema, modules);

    const email = "regular@inbox.mailtrap.io";
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        email,
        name: "Regular User",
        // Note: isTestUser is NOT set - this should still work for test emails
      });
    });

    vi.mock("./email", () => ({
      sendEmail: vi.fn().mockResolvedValue({ success: true }),
    }));

    await t.run(async (ctx) => {
      const mockCtx = createMockCtx(ctx);
      await sendVerificationRequest({ identifier: email, token: "123456" }, mockCtx);
    });

    const otps = await t.run(async (ctx) => {
      return await ctx.db.query("testOtpCodes").collect();
    });
    // OTP should be stored since email is @inbox.mailtrap.io and E2E_API_KEY is present
    expect(otps).toHaveLength(1);
    expect(otps[0].email).toBe(email);
  });

  it("should store OTP for test user when E2E_API_KEY is present", async () => {
    process.env.E2E_API_KEY = "test-key";
    process.env.NODE_ENV = "production";

    const t = convexTest(schema, modules);

    const email = "test@inbox.mailtrap.io";
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        email,
        name: "Test User",
        isTestUser: true,
      });
    });

    vi.mock("./email", () => ({
      sendEmail: vi.fn().mockResolvedValue({ success: true }),
    }));

    await t.run(async (ctx) => {
      const mockCtx = createMockCtx(ctx);
      await sendVerificationRequest({ identifier: email, token: "123456" }, mockCtx);
    });

    const otps = await t.run(async (ctx) => {
      return await ctx.db.query("testOtpCodes").collect();
    });
    expect(otps).toHaveLength(1);
    expect(otps[0].email).toBe(email);
    expect(otps[0].code).toMatch(/^enc:/);
  });

  it("should NOT store OTP if email is not from mailtrap", async () => {
    process.env.E2E_API_KEY = "test-key";

    const t = convexTest(schema, modules);

    const email = "test@example.com";
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        email,
        name: "Test User",
        isTestUser: true,
      });
    });

    vi.mock("./email", () => ({
      sendEmail: vi.fn().mockResolvedValue({ success: true }),
    }));

    await t.run(async (ctx) => {
      const mockCtx = createMockCtx(ctx);
      await sendVerificationRequest({ identifier: email, token: "123456" }, mockCtx);
    });

    const otps = await t.run(async (ctx) => {
      return await ctx.db.query("testOtpCodes").collect();
    });
    expect(otps).toHaveLength(0);
  });
});
