import { ConvexError } from "convex/values";
import { describe, expect, it, vi } from "vitest";
import type { ConvexAuthContext } from "./lib/authTypes";

// Mock Resend provider to avoid initialization errors
type MockResendConfig = Record<string, unknown> & {
  sendVerificationRequest?: unknown;
};

vi.mock("@auth/core/providers/resend", () => ({
  default: (config: MockResendConfig) => ({
    options: {
      ...config,
      sendVerificationRequest: config.sendVerificationRequest,
    },
  }),
}));

import { otpPasswordReset } from "./otpPasswordReset";
import { otpVerification } from "./otpVerification";

// Mock the internal object
vi.mock("./_generated/api", () => ({
  internal: {
    authWrapper: {
      checkPasswordResetRateLimitByEmail: "checkPasswordResetRateLimitByEmail",
      checkEmailVerificationRateLimit: "checkEmailVerificationRateLimit",
    },
    e2e: {
      storeTestOtp: "storeTestOtp",
    },
  },
}));

type VerificationRequestParams = { identifier: string; token: string };
type VerificationProvider = {
  options: {
    sendVerificationRequest: (
      params: VerificationRequestParams,
      ctx: ConvexAuthContext,
    ) => Promise<void>;
  };
};

function createMockAuthContext(error: Error): ConvexAuthContext {
  return {
    runMutation: vi.fn().mockRejectedValue(error),
  } as unknown as ConvexAuthContext;
}

const passwordResetProvider = otpPasswordReset as unknown as VerificationProvider;
const verificationProvider = otpVerification as unknown as VerificationProvider;

describe("OTP Error Handling", () => {
  describe("otpPasswordReset", () => {
    it("should rethrow generic errors", async () => {
      const error = new Error("DB Error");
      const ctx = createMockAuthContext(error);

      const params = { identifier: "test@example.com", token: "123456" };

      await expect(
        passwordResetProvider.options.sendVerificationRequest(params, ctx),
      ).rejects.toThrow("DB Error");
    });

    it("should handle rate limit errors gracefully", async () => {
      const error = new ConvexError({
        code: "RATE_LIMITED",
        message: "Rate limit exceeded",
      });
      const ctx = createMockAuthContext(error);

      const params = { identifier: "test@example.com", token: "123456" };

      await expect(
        passwordResetProvider.options.sendVerificationRequest(params, ctx),
      ).rejects.toThrow("Too many password reset requests. Please try again later.");
    });
  });

  describe("otpVerification", () => {
    it("should rethrow generic errors", async () => {
      const error = new Error("DB Error");
      const ctx = createMockAuthContext(error);

      const params = { identifier: "test@example.com", token: "123456" };

      await expect(
        verificationProvider.options.sendVerificationRequest(params, ctx),
      ).rejects.toThrow("DB Error");
    });

    it("should handle rate limit errors gracefully", async () => {
      const error = new ConvexError({
        code: "RATE_LIMITED",
        message: "Rate limit exceeded",
      });
      const ctx = createMockAuthContext(error);

      const params = { identifier: "test@example.com", token: "123456" };

      await expect(
        verificationProvider.options.sendVerificationRequest(params, ctx),
      ).rejects.toThrow("Too many verification requests. Please try again later.");
    });
  });
});
