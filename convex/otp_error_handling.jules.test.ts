import { ConvexError } from "convex/values";
import { describe, expect, it, vi } from "vitest";

// Mock Resend provider to avoid initialization errors
vi.mock("@auth/core/providers/resend", () => ({
  default: (config: any) => ({
    ...config,
    sendVerificationRequest: config.sendVerificationRequest,
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

describe("OTP Error Handling", () => {
  describe("otpPasswordReset", () => {
    it("should rethrow generic errors", async () => {
      const error = new Error("DB Error");
      const ctx = {
        runMutation: vi.fn().mockRejectedValue(error),
      };

      const params = { identifier: "test@example.com", token: "123456" };

      await expect(
        // @ts-expect-error - Mock context
        otpPasswordReset.sendVerificationRequest(params, ctx),
      ).rejects.toThrow("DB Error");
    });

    it("should handle rate limit errors gracefully", async () => {
      const error = new ConvexError({
        code: "RATE_LIMITED",
        message: "Rate limit exceeded",
      });
      const ctx = {
        runMutation: vi.fn().mockRejectedValue(error),
      };

      const params = { identifier: "test@example.com", token: "123456" };

      await expect(
        // @ts-expect-error - Mock context
        otpPasswordReset.sendVerificationRequest(params, ctx),
      ).rejects.toThrow("Too many password reset requests. Please try again later.");
    });
  });

  describe("otpVerification", () => {
    it("should rethrow generic errors", async () => {
      const error = new Error("DB Error");
      const ctx = {
        runMutation: vi.fn().mockRejectedValue(error),
      };

      const params = { identifier: "test@example.com", token: "123456" };

      await expect(
        // @ts-expect-error - Mock context
        otpVerification.sendVerificationRequest(params, ctx),
      ).rejects.toThrow("DB Error");
    });

    it("should handle rate limit errors gracefully", async () => {
      const error = new ConvexError({
        code: "RATE_LIMITED",
        message: "Rate limit exceeded",
      });
      const ctx = {
        runMutation: vi.fn().mockRejectedValue(error),
      };

      const params = { identifier: "test@example.com", token: "123456" };

      await expect(
        // @ts-expect-error - Mock context
        otpVerification.sendVerificationRequest(params, ctx),
      ).rejects.toThrow("Too many verification requests. Please try again later.");
    });
  });
});
