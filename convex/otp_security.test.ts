import { getFunctionName } from "convex/server";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { otpPasswordReset } from "./otpPasswordReset";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

// Mock React Email templates and render function to avoid JSX transformation issues in tests
vi.mock("@react-email/render", () => ({
  render: vi.fn().mockResolvedValue("<html>Mocked email HTML</html>"),
}));

vi.mock("../emails/PasswordResetEmail", () => ({
  PasswordResetEmail: vi.fn(() => null),
}));

vi.mock("../emails/VerifyEmail", () => ({
  VerifyEmail: vi.fn(() => null),
}));

// Access the sendVerificationRequest function
const sendVerificationRequest = (otpPasswordReset as any).options
  ? (otpPasswordReset as any).options.sendVerificationRequest
  : (otpPasswordReset as any).sendVerificationRequest;

describe("OTP Security", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("should NOT store OTP for non-test email even if E2E_API_KEY is present", async () => {
    process.env.E2E_API_KEY = "test-key";
    process.env.NODE_ENV = "production";

    const t = convexTest(schema, modules);

    const email = "regular@example.com"; // Not @inbox.mailtrap.io
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        email,
        name: "Regular User",
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
    // OTP should NOT be stored - email is not @inbox.mailtrap.io
    expect(otps).toHaveLength(0);
  });

  it("should store OTP for test email when E2E_API_KEY is present even without database flag", async () => {
    process.env.E2E_API_KEY = "test-key";
    process.env.NODE_ENV = "production";

    const t = convexTest(schema, modules);

    // Using a mailtrap email but NOT setting isTestUser: true in DB
    const email = "auto-test@inbox.mailtrap.io";
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        email,
        name: "Regular User",
        // isTestUser is deliberately missing/false
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
    // Should exist because we relaxed the check to trust the email domain in safe envs
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
