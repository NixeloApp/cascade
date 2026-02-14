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

      // The auth endpoint is at /api/auth/signin/password
      await fetch(`${getConvexSiteUrl()}/api/auth/signin/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });
    } catch {
      // Silently ignore - don't leak any info
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
 * Secure password reset request
 *
 * Calls the actual auth endpoint internally but always returns success.
 * This prevents attackers from discovering which emails are registered.
 */
export const securePasswordReset = httpAction(async (ctx, request) => {
  try {
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
