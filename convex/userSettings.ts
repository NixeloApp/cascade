import { v } from "convex/values";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { dashboardLayout } from "./validators";

export const get = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .unique();

    return settings;
  },
});

export const update = authenticatedMutation({
  args: {
    dashboardLayout: v.optional(dashboardLayout), // Dashboard widget layout
    theme: v.optional(v.string()),
    sidebarCollapsed: v.optional(v.boolean()),
    emailNotifications: v.optional(v.boolean()),
    desktopNotifications: v.optional(v.boolean()),
    timezone: v.optional(v.string()), // IANA timezone
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const existinghelper = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .unique();

    if (existinghelper) {
      await ctx.db.patch(existinghelper._id, {
        ...args,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userSettings", {
        userId: ctx.userId,
        ...args,
        updatedAt: Date.now(),
      });
    }

    return { success: true } as const;
  },
});
