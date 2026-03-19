import { v } from "convex/values";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { validate } from "./lib/constrainedValidators";
import { validation } from "./lib/errors";
import { hasSharedOrganization } from "./lib/organizationAccess";
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
      delegateUserId: v.optional(v.id("users")),
      delegate: v.optional(
        v.object({
          _id: v.id("users"),
          name: v.string(),
          image: v.optional(v.string()),
        }),
      ),
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

    const delegateUser =
      status.delegateUserId === undefined ? null : await ctx.db.get(status.delegateUserId);

    return {
      ...status,
      delegate: delegateUser
        ? {
            _id: delegateUser._id,
            name: delegateUser.name || delegateUser.email || "Unknown",
            image: delegateUser.image,
          }
        : undefined,
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
    delegateUserId: v.optional(v.id("users")),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    if (args.endsAt < args.startsAt) {
      throw validation("endsAt", "End date must be on or after the start date");
    }

    validate.bio(args.note, "note");

    if (args.delegateUserId === ctx.userId) {
      throw validation("delegateUserId", "Delegate must be another person");
    }

    if (args.delegateUserId) {
      const delegateUser = await ctx.db.get(args.delegateUserId);
      if (!delegateUser) {
        throw validation("delegateUserId", "Delegate user was not found");
      }

      const sharesOrganization = await hasSharedOrganization(ctx, ctx.userId, args.delegateUserId);
      if (!sharesOrganization) {
        throw validation("delegateUserId", "Delegate must share an organization with you");
      }
    }

    await ctx.db.patch(ctx.userId, {
      outOfOffice: {
        startsAt: args.startsAt,
        endsAt: args.endsAt,
        reason: args.reason,
        note: args.note?.trim() || undefined,
        delegateUserId: args.delegateUserId,
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
