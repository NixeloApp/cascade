/**
 * Auth Wrapper - Secure Password Reset
 *
 * Wraps the auth endpoints to prevent email enumeration.
 * Always returns success regardless of whether email exists.
 */

import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  httpAction,
  internalAction,
  internalMutation,
  type MutationCtx,
} from "./_generated/server";
import { getConvexSiteUrl } from "./lib/env";
import { logger } from "./lib/logger";
import { getClientIp } from "./lib/ssrf";
import { rateLimit } from "./rateLimits";

/**
 * Internal action to perform the actual password reset request (can be slow)
 */
export const performPasswordReset = internalAction({
  args: { email: v.string() },
  handler: async (_ctx, args) => {
    try {
      const formData = new URLSearchParams();
      formData.set("email", args.email);
      formData.set("flow", "reset");

      // Use the backend URL (CONVEX_SITE_URL) directly to avoid frontend proxy issues
      // and circular dependencies with api.auth
      await fetch(`${getConvexSiteUrl()}/api/auth/signin/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });
    } catch (error) {
      // Silently ignore to client - don't leak any info
      // But log to server for debugging (e.g. timeout in CI)
      logger.error("Password reset request failed", { error });
    }
  },
});

/**
 * Internal mutation to schedule the password reset action asynchronously
 */
export const schedulePasswordReset = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internal.authWrapper.performPasswordReset, {
      email: args.email,
    });
  },
});

/**
 * Handler for rate limit check - exported for testing
 */
export const checkPasswordResetRateLimitHandler = async (
  ctx: MutationCtx,
  args: { ip: string },
) => {
  await rateLimit(ctx, "passwordReset", { key: args.ip });
};

/**
 * Check rate limit for password reset
 */
export const checkPasswordResetRateLimit = internalMutation({
  args: { ip: v.string() },
  handler: checkPasswordResetRateLimitHandler,
});

/**
 * Check rate limit for password reset by email (for OTPPasswordReset provider)
 */
export const checkPasswordResetRateLimitByEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    await rateLimit(ctx, "passwordReset", { key: args.email });
  },
});

/**
 * Check rate limit for email verification (for OTPVerification provider)
 */
export const checkEmailVerificationRateLimit = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    await rateLimit(ctx, "emailVerification", { key: args.email });
  },
});

/**
 * Check rate limit for general authentication attempts by IP
 * Used by the HTTP wrapper to protect api/auth/signin
 */
export const checkAuthRateLimitHandler = async (ctx: MutationCtx, args: { ip: string }) => {
  // Limit auth attempts per IP to prevent credential stuffing/spam
  await rateLimit(ctx, "authAttempt", { key: args.ip });
};

export const checkAuthRateLimit = internalMutation({
  args: { ip: v.string() },
  handler: checkAuthRateLimitHandler,
});

/**
 * Secure password reset request
 *
 * Calls the actual auth endpoint internally but always returns success.
 * This prevents attackers from discovering which emails are registered.
 */
export const securePasswordReset = httpAction(async (ctx, request) => {
  try {
    let clientIp = getClientIp(request);

    if (!clientIp) {
      // In test/dev environments (especially CI), we might not have a proxy setting headers
      // so we fallback to a safe default to allow the test to proceed.
      const isTestOrDev =
        process.env.NODE_ENV === "test" ||
        process.env.NODE_ENV === "development" ||
        process.env.E2E_TEST_MODE ||
        process.env.CI;

      if (isTestOrDev) {
        clientIp = "127.0.0.1";
      } else {
        // If we can't determine IP in production, we can't safely rate limit.
        // Rejecting the request is safer than allowing a potential bypass or DoS via shared bucket.
        throw new Error("Could not determine client IP for security-sensitive action");
      }
    }

    try {
      await ctx.runMutation(internal.authWrapper.checkPasswordResetRateLimit, { ip: clientIp });
    } catch {
      // Rate limit exceeded
      return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Schedule the reset asynchronously via internal mutation
    // This returns immediately, preventing timing attacks on email existence
    await ctx.runMutation(internal.authWrapper.schedulePasswordReset, { email });

    // Always return success
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("Secure password reset failed", { error });
    // Even on unexpected errors, return success
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
