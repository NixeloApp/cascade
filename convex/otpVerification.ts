/**
 * OTP Email Verification Provider
 *
 * Sends verification emails using the universal email provider system.
 * Provider rotation and usage tracking are handled automatically.
 *
 * E2E Testing:
 * For test emails (@inbox.mailtrap.io), the plaintext OTP is stored in the
 * testOtpCodes table so E2E tests can retrieve it via /e2e/get-latest-otp.
 * The authVerificationCodes table stores hashed codes, making them unreadable.
 */
import Resend from "@auth/core/providers/resend";
import { render } from "@react-email/render";
import type { FunctionReference } from "convex/server";
import { internal } from "./_generated/api";
import { sendEmail } from "./email";
import type { ConvexAuthContext } from "./lib/authTypes";
import { generateOTP } from "./lib/crypto";
import { logger } from "./lib/logger";

/**
 * Helper to store test OTPs in the testOtpCodes table
 */
async function storeTestOtp(ctx: ConvexAuthContext, email: string, token: string) {
  const isTestEmail = email.endsWith("@inbox.mailtrap.io");

  // Only allow storing test OTPs if environment is configured for testing/dev OR if E2E API key is present
  const isSafeEnvironment =
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test" ||
    !!process.env.CI ||
    !!process.env.E2E_API_KEY;

  // Store OTPs for test emails ONLY if environment permits it.
  // This allows E2E tests to run against preview/prod environments where NODE_ENV might be "production"
  // and process.env.CI might be missing, BUT explicitly requires E2E_API_KEY to be set.
  if (isTestEmail && isSafeEnvironment && ctx?.runMutation) {
    await ctx.runMutation(internal.e2e.storeTestOtp, {
      email,
      code: token,
      type: "verification",
    });
  }
}

/**
 * OTP Verification Provider for email verification during signup
 *
 * Uses the universal sendEmail() which handles:
 * - Provider rotation (SendPulse, Mailtrap, Resend, Mailgun)
 * - Free tier management (daily + monthly limits)
 * - Usage tracking
 *
 * E2E Testing:
 * All emails are sent normally through the email provider system.
 * When MAILTRAP_MODE=sandbox, emails land in the Mailtrap inbox.
 * E2E tests use Mailtrap API to fetch emails and extract OTP codes.
 */
export const otpVerification = Resend({
  id: "otp-verification",
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
    try {
      // Check rate limit first
      if (ctx.runMutation) {
        try {
          // Type assertion needed because codegen hasn't run to update the type definition
          // Cast internal.authWrapper to a type that includes the new mutation
          // This avoids 'any' and Biome suppression
          const authWrapper = internal.authWrapper as unknown as {
            checkEmailVerificationRateLimit: FunctionReference<"mutation">;
          };

          await ctx.runMutation(authWrapper.checkEmailVerificationRateLimit, {
            email,
          });
        } catch (_e) {
          throw new Error("Too many verification requests. Please try again later.");
        }
      }

      // Store test OTP if applicable
      await storeTestOtp(ctx, email, token);

      // Render email using React Email template
      const { VerifyEmail } = await import("../emails/VerifyEmail");
      const html = await render(VerifyEmail({ code: token, expiryMinutes: 15 }));

      // Send verification email through the email provider system
      // In dev/E2E (MAILTRAP_MODE=sandbox), emails go to Mailtrap inbox
      const result = await sendEmail(ctx, {
        to: email,
        subject: "Verify your email",
        html,
        text: `Your verification code is: ${token}\n\nThis code expires in 15 minutes.\n\nIf you didn't create an account, you can safely ignore this email.`,
      });

      if (!result.success) {
        const isTestEmail = email.endsWith("@inbox.mailtrap.io");
        // For test emails, don't fail on email send errors (e.g., Mailtrap rate limiting)
        // E2E tests can retrieve the OTP via /e2e/get-latest-otp endpoint instead
        if (isTestEmail) {
          logger.warn(
            `[otpVerification] Email send failed for test user, continuing: ${result.error}`,
          );
          return; // Don't throw - OTP is already stored in testOtpCodes
        }
        throw new Error(`Could not send verification email: ${result.error}`);
      }
    } catch (err) {
      const isTestEmail = email.endsWith("@inbox.mailtrap.io");
      // For test emails, don't fail on email send errors
      if (isTestEmail) {
        logger.warn(`[otpVerification] Email send failed for test user, continuing: ${err}`);
        return; // Don't throw - OTP is already stored in testOtpCodes
      }
      // Fail fast so users aren't stuck without a verification code.
      throw err instanceof Error ? err : new Error("Could not send verification email");
    }
  }) as (params: { identifier: string }) => Promise<void>,
});
