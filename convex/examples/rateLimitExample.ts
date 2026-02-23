/**
 * Example: Using Rate Limiter with AI Chat
 *
 * Add rate limiting to protect expensive AI endpoints
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { unauthenticated } from "../lib/errors";
import { rateLimit } from "../rateLimits";

/**
 * Rate-limited AI chat
 */
export const chatWithRateLimit = action({
  args: {
    chatId: v.optional(v.id("aiChats")),
    projectId: v.optional(v.id("projects")),
    message: v.string(),
  },
  handler: async (ctx, _args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw unauthenticated();
    }

    // Rate limit: 10 messages per minute per user
    await rateLimit(ctx, "aiChat", {
      key: userId.subject,
      throws: true,
    });

    // Now call the actual AI chat function
    // (Your existing ai.chat implementation)
    // ...

    return { success: true };
  },
});
