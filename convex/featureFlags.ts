import { v } from "convex/values";
import { query } from "./_generated/server";
import { organizationAdminMutation } from "./customFunctions";

const GOOGLE_AUTH_FLAG = "google_auth_enabled";

export const isGoogleAuthEnabled = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const record = await ctx.db
      .query("featureFlags")
      .withIndex("by_name", (q) => q.eq("name", GOOGLE_AUTH_FLAG))
      .first();
    return record?.enabled ?? true;
  },
});

export const setGoogleAuthEnabled = organizationAdminMutation({
  args: {
    enabled: v.boolean(),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("featureFlags")
      .withIndex("by_name", (q) => q.eq("name", GOOGLE_AUTH_FLAG))
      .first();

    const payload = {
      enabled: args.enabled,
      reason: args.reason,
      updatedAt: Date.now(),
      updatedBy: ctx.userId,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return { success: true };
    }

    await ctx.db.insert("featureFlags", {
      name: GOOGLE_AUTH_FLAG,
      description: "Global kill switch for Google authentication button visibility",
      ...payload,
    });

    return { success: true };
  },
});
