import Resend from "@auth/core/providers/resend";
import { render } from "@react-email/render";
import { internal } from "./_generated/api";
import { sendEmail } from "./email";
import type { ConvexAuthContext } from "./lib/authTypes";
import { generateOTP } from "./lib/crypto";
import { logger } from "./lib/logger";

/**
 * OTP Password Reset Provider
 *
 * Uses the universal sendEmail() which handles:
 * - Provider rotation (SendPulse, Mailtrap, Resend, Mailgun)
 * - Free tier management (daily + monthly limits)
 * - Usage tracking
 *
 * E2E Testing:
 * For test emails (@inbox.mailtrap.io), the plaintext OTP is stored in the
 * testOtpCodes table so E2E tests can retrieve it via /e2e/get-latest-otp.
 */
export const OTPPasswordReset = Resend({
  id: "otp-password-reset",
  apiKey: "unused", // Required by interface but we use our own email system

  generateVerificationToken() {
    return generateOTP();
  },

  // Convex Auth passes ctx as second param, but @auth/core types don't include it
  // Using type assertion to handle the library integration mismatch
  sendVerificationRequest: (async (
    { identifier: email, token }: { identifier: string; token: string },
    ctx: ConvexAuthContext,
  ) => {
    // Check rate limit first
    if (ctx.runMutation) {
      try {
        await ctx.runMutation(internal.authWrapper.checkPasswordResetRateLimitByEmail, { email });
      } catch (_e) {
        throw new Error("Too many password reset requests. Please try again later.");
      }
    }

    const isTestEmail = email.endsWith("@inbox.mailtrap.io");
    const isSafeEnvironment =
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "test" ||
      !!process.env.CI ||
      !!process.env.E2E_API_KEY;

    // For test emails, store plaintext OTP in testOtpCodes table if environment permits
    // This matches OTPVerification behavior - store unconditionally for test emails in safe environments
    if (isTestEmail && isSafeEnvironment && ctx?.runMutation) {
      try {
        await ctx.runMutation(internal.e2e.storeTestOtp, { email, code: token, type: "reset" });
      } catch (e) {
        // Log but don't fail, attempt to send email anyway
        logger.error(`[OTPPasswordReset] Failed to store test OTP: ${e}`);
      }
    }

    // Render email using React Email template
    const { PasswordResetEmail } = await import("../emails/PasswordResetEmail");
    const html = await render(PasswordResetEmail({ code: token, expiryMinutes: 15 }));

    const result = await sendEmail(ctx, {
      to: email,
      subject: "Reset your password",
      html,
      text: `Your password reset code is: ${token}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, you can safely ignore this email.`,
    });

    if (!result.success) {
      // For test emails, don't fail - OTP is stored in testOtpCodes
      if (isTestEmail) {
        logger.warn(
          `[OTPPasswordReset] Email send failed for test user, continuing: ${result.error}`,
        );
        return;
      }
      throw new Error(`Could not send password reset email: ${result.error}`);
    }
  }) as (params: { identifier: string }) => Promise<void>,
});
