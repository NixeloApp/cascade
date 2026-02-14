/**
 * Auth Wrapper - Secure Password Reset
 *
 * Wraps the auth endpoints to prevent email enumeration.
 * Always returns success regardless of whether email exists.
 */

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { httpAction, internalAction, internalMutation } from "./_generated/server";
import { getConvexSiteUrl } from "./lib/env";
import { logger } from "./lib/logger";
import { rateLimit } from "./rateLimits";

const RESET_TIMEOUT_MS = 30000;

/**
 * Internal action to perform the actual password reset request (can be slow)
 */
export const performPasswordReset = internalAction({
  args: { email: v.string() },
  handler: async (_ctx, args) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RESET_TIMEOUT_MS);

    try {
      const formData = new URLSearchParams();
      formData.set("email", args.email);
      formData.set("flow", "reset");

      // The auth endpoint is at /api/auth/signin/password
      await fetch(`${getConvexSiteUrl()}/api/auth/signin/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        signal: controller.signal,
      });
    } catch (error) {
      // Silently ignore to client - don't leak any info
      // But log to server for debugging (e.g. timeout in CI)
      logger.error("Password reset request failed", { error: String(error) });
    } finally {
      clearTimeout(timeoutId);
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
 * Check rate limit for password reset
 */
export const checkPasswordResetRateLimit = internalMutation({
  args: { ip: v.string() },
  handler: async (ctx, args) => {
    await rateLimit(ctx, "passwordReset", { key: args.ip });
  },
});

/**
 * Secure password reset request
 *
 * Calls the actual auth endpoint internally but always returns success.
 * This prevents attackers from discovering which emails are registered.
 */
export const securePasswordReset = httpAction(async (ctx, request) => {
  try {
    // Check rate limit first
    const clientIp = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();

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
  } catch {
    // Even on unexpected errors, return success
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
