/**
 * Stickies / Quick Notes
 *
 * Personal quick-capture notes on the dashboard.
 * Scoped to user + organization. Supports colored notes
 * with drag-to-reorder and inline editing.
 */

import { v } from "convex/values";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";

const MAX_STICKIES = 20;
const STICKIES_QUERY_LIMIT = 50;
const VALID_COLORS = ["yellow", "blue", "green", "pink", "purple"] as const;

/** List all stickies for the current user in an organization. */
export const list = authenticatedQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stickies")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", ctx.userId).eq("organizationId", args.organizationId),
      )
      .take(STICKIES_QUERY_LIMIT);
  },
});

/** Create a new sticky note. */
export const create = authenticatedMutation({
  args: {
    organizationId: v.id("organizations"),
    content: v.string(),
    color: v.optional(v.string()),
  },
  returns: v.object({ stickyId: v.id("stickies") }),
  handler: async (ctx, args) => {
    // Enforce limit
    const existing = await ctx.db
      .query("stickies")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", ctx.userId).eq("organizationId", args.organizationId),
      )
      .take(STICKIES_QUERY_LIMIT);

    if (existing.length >= MAX_STICKIES) {
      throw new Error(`Maximum of ${MAX_STICKIES} stickies reached. Delete some to add more.`);
    }

    const now = Date.now();
    const order = existing.length;
    const color =
      args.color && VALID_COLORS.includes(args.color as (typeof VALID_COLORS)[number])
        ? args.color
        : "yellow";

    const stickyId = await ctx.db.insert("stickies", {
      userId: ctx.userId,
      organizationId: args.organizationId,
      content: args.content,
      color,
      order,
      updatedAt: now,
    });

    return { stickyId };
  },
});

/** Update a sticky note's content or color. */
export const update = authenticatedMutation({
  args: {
    id: v.id("stickies"),
    content: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const sticky = await ctx.db.get(args.id);
    if (!sticky || sticky.userId !== ctx.userId) {
      throw new Error("Sticky not found or not owned by you");
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.content !== undefined) patch.content = args.content;
    if (args.color !== undefined) {
      patch.color = VALID_COLORS.includes(args.color as (typeof VALID_COLORS)[number])
        ? args.color
        : sticky.color;
    }

    await ctx.db.patch(args.id, patch);
    return { success: true } as const;
  },
});

/** Delete a sticky note. */
export const remove = authenticatedMutation({
  args: { id: v.id("stickies") },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const sticky = await ctx.db.get(args.id);
    if (!sticky || sticky.userId !== ctx.userId) {
      throw new Error("Sticky not found or not owned by you");
    }

    await ctx.db.delete(args.id);
    return { success: true } as const;
  },
});
