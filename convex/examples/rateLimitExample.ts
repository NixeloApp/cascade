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
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw unauthenticated();
    }

    // Rate limit: 10 messages per minute per user
    await rateLimit(ctx, "aiChat", {
      key: userId.subject,
      throws: true,
    });

    // Example: Use the args in your AI chat implementation
    // In a real implementation, you would call your AI service here
    // e.g., await ctx.runAction(internal.ai.chat, { chatId: args.chatId, message: args.message });

    return { success: true, messageLength: args.message.length };
  },
});
