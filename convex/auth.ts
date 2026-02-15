import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { sanitizeUserForCurrent } from "./lib/userUtils";
import { OTPPasswordReset } from "./OTPPasswordReset";
import { OTPVerification } from "./OTPVerification";

// All OTP emails use the universal email provider system
// Provider rotation (SendPulse, Mailtrap, Resend, Mailgun) is automatic
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google,
    Password({
      reset: OTPPasswordReset,
      verify: OTPVerification,
    }),
  ],
});

export const loggedInUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      image: v.optional(v.string()),
      isAnonymous: v.optional(v.boolean()),
      defaultOrganizationId: v.optional(v.id("organizations")),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return sanitizeUserForCurrent(user);
  },
});

import { ROUTES } from "./shared/routes";

/**
 * Get the recommended destination for a user after they authenticate.
 * This is the smart logic that decides between onboarding and dashboard.
 */
export const getRedirectDestination = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    // If the user has an email but it's not verified, don't suggest a redirect destination.
    // This allows them to stay on the signup/signin page to complete verification.
    if (!user || (user.email && !user.emailVerificationTime)) {
      return null;
    }

    // 1. Check onboarding status
    const onboarding = await ctx.db
      .query("userOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const onboardingIncomplete = !onboarding?.onboardingCompleted;

    if (onboardingIncomplete) {
      return ROUTES.onboarding.path;
    }

    // 2. Check for organizations
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (membership) {
      const organization = await ctx.db.get(membership.organizationId);
      if (organization?.slug) {
        return ROUTES.dashboard.build(organization.slug);
      }
    }

    // If they finished onboarding but have no organization,
    // we should send them to /app gateway where initializeDefaultOrganization will handle them.
    return ROUTES.app.path;
  },
});
