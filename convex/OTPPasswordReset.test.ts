import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import { OTPPasswordReset } from "./OTPPasswordReset";

// Mock internal object
vi.mock("./_generated/api", () => ({
  internal: {
    authWrapper: {
      checkPasswordResetRateLimitByEmail: "checkPasswordResetRateLimitByEmail",
    },
    users: {
      getInternalByEmail: "getInternalByEmail",
    },
    e2e: {
      storeTestOtp: "storeTestOtp",
    },
  },
}));

// Mock sendEmail
const mockSendEmail = vi.fn();
vi.mock("./email", () => ({
  sendEmail: (...args: any[]) => mockSendEmail(...args),
}));

describe("OTPPasswordReset", () => {
  // Access the custom sendVerificationRequest method from the provider
  const sendVerificationRequest = (OTPPasswordReset as any).options.sendVerificationRequest;
  const generateVerificationToken = (OTPPasswordReset as any).options.generateVerificationToken;

  const mockCtx = {
    runMutation: vi.fn(),
    runQuery: vi.fn(),
    scheduler: { runAfter: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmail.mockResolvedValue({ success: true, id: "msg-id" });
    mockCtx.runQuery.mockResolvedValue({ isTestUser: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should generate a verification token", () => {
    const token = generateVerificationToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("should send verification email with correct parameters", async () => {
    const params = { identifier: "user@example.com", token: "123456" };
    await sendVerificationRequest(params, mockCtx);

    expect(mockSendEmail).toHaveBeenCalledWith(
      mockCtx,
      expect.objectContaining({
        to: "user@example.com",
        subject: "Reset your password",
        html: expect.stringContaining("123456"),
      }),
    );
  });

  it("should check rate limit before sending email", async () => {
    const params = { identifier: "user@example.com", token: "123456" };
    await sendVerificationRequest(params, mockCtx);

    expect(mockCtx.runMutation).toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimitByEmail,
      { email: "user@example.com" },
    );
  });

  it("should throw error when rate limit is exceeded", async () => {
    mockCtx.runMutation.mockImplementationOnce((mutation) => {
      if (mutation === internal.authWrapper.checkPasswordResetRateLimitByEmail) {
        throw new Error("Rate limit exceeded");
      }
      return Promise.resolve();
    });

    const params = { identifier: "user@example.com", token: "123456" };
    await expect(sendVerificationRequest(params, mockCtx)).rejects.toThrow(
      "Too many password reset requests. Please try again later.",
    );
  });

  it("should store OTP for test emails", async () => {
    // Override NODE_ENV for this test if needed, but default test env should work
    // The code checks process.env.NODE_ENV === "test" which is true in vitest

    const params = { identifier: "test@inbox.mailtrap.io", token: "123456" };
    await sendVerificationRequest(params, mockCtx);

    // Verify rate limit check happened first
    expect(mockCtx.runMutation).toHaveBeenCalledWith(
      internal.authWrapper.checkPasswordResetRateLimitByEmail,
      expect.anything(),
    );

    // Verify OTP storage happened
    expect(mockCtx.runMutation).toHaveBeenCalledWith(internal.e2e.storeTestOtp, {
      email: "test@inbox.mailtrap.io",
      code: "123456",
      type: "reset",
    });
  });

  it("should not store OTP for normal emails", async () => {
    const params = { identifier: "user@example.com", token: "123456" };
    await sendVerificationRequest(params, mockCtx);

    expect(mockCtx.runMutation).not.toHaveBeenCalledWith(
      internal.e2e.storeTestOtp,
      expect.anything(),
    );
  });

  it("should throw error if sendEmail fails", async () => {
    mockSendEmail.mockResolvedValue({ success: false, error: "SMTP Error" });
    const params = { identifier: "user@example.com", token: "123456" };

    await expect(sendVerificationRequest(params, mockCtx)).rejects.toThrow(
      "Could not send password reset email: SMTP Error",
    );
  });

  it("should NOT throw if sendEmail fails for test emails (suppress error)", async () => {
    mockSendEmail.mockResolvedValue({ success: false, error: "SMTP Error" });
    const params = { identifier: "test@inbox.mailtrap.io", token: "123456" };

    // Should not throw
    await expect(sendVerificationRequest(params, mockCtx)).resolves.not.toThrow();
  });
});
