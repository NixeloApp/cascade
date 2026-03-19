import { v } from "convex/values";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { validate } from "./lib/constrainedValidators";
import { validation } from "./lib/errors";
import { isOutOfOfficeActive } from "./lib/outOfOffice";
import { outOfOfficeReasons } from "./validators";

export const getCurrent = authenticatedQuery({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      startsAt: v.number(),
      endsAt: v.number(),
      reason: outOfOfficeReasons,
      note: v.optional(v.string()),
      updatedAt: v.number(),
      isActive: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.userId);
    const status = user?.outOfOffice;

    if (!status) {
      return null;
    }

    return {
      ...status,
      isActive: isOutOfOfficeActive(status),
    };
  },
});

export const upsert = authenticatedMutation({
  args: {
    startsAt: v.number(),
    endsAt: v.number(),
    reason: outOfOfficeReasons,
    note: v.optional(v.string()),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    if (args.endsAt < args.startsAt) {
      throw validation("endsAt", "End date must be on or after the start date");
    }

    validate.bio(args.note, "note");

    await ctx.db.patch(ctx.userId, {
      outOfOffice: {
        startsAt: args.startsAt,
        endsAt: args.endsAt,
        reason: args.reason,
        note: args.note?.trim() || undefined,
        updatedAt: Date.now(),
      },
    });

    return { success: true as const };
  },
});

export const clear = authenticatedMutation({
  args: {},
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx) => {
    await ctx.db.patch(ctx.userId, {
      outOfOffice: undefined,
    });

    return { success: true as const };
  },
});
