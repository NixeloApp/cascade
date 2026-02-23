/**
 * AI Chat and Helper Actions
 *
 * This file replaces the shadowed convex/ai.ts to resolve naming collisions.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { getAuthUserId } from "@convex-dev/auth/server";
import { generateText } from "ai";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action, internalAction } from "../_generated/server";
import { extractUsage } from "../lib/aiHelpers";
import { notFound, unauthenticated } from "../lib/errors";
import { rateLimit } from "../rateLimits";

// Claude model (using alias - auto-points to latest snapshot)
const CLAUDE_OPUS = "claude-opus-4-5";

/**
 * Generate embedding for text using Voyage AI (Anthropic recommended)
 */
export const generateEmbedding = internalAction({
  args: {
    text: v.string(),
  },
  returns: v.array(v.float64()),
  handler: async (ctx, args): Promise<number[]> => {
    return await ctx.runAction(internal.internal.ai.generateEmbedding, args);
  },
});

/**
 * Generate and store embedding for an issue
 * Called automatically when issue is created/updated
 */
export const generateIssueEmbedding = internalAction({
  args: {
    issueId: v.id("issues"),
  },
  returns: v.array(v.float64()),
  handler: async (ctx, args): Promise<number[]> => {
    // Calling internal.internal.ai.getIssueData (which is an internalQuery)
    const issue = await ctx.runQuery(internal.internal.ai.getIssueData, {
      issueId: args.issueId,
    });

    if (!issue) {
      throw notFound("issue", args.issueId);
    }

    // Combine title and description for embedding
    const text = `${issue.title}\n\n${issue.description || ""}`.trim();

    // Generate embedding
    const embedding = await ctx.runAction(internal.internal.ai.generateEmbedding, {
      text,
    });

    // Store embedding
    await ctx.runMutation(internal.internal.ai.storeIssueEmbedding, {
      issueId: args.issueId,
      embedding,
    });

    return embedding;
  },
});

/**
 * AI Chat - Send message and get AI response
 * Uses Claude Opus 4.5 for high-quality responses
 */
export const chat = action({
  args: {
    chatId: v.optional(v.id("aiChats")),
    projectId: v.optional(v.id("projects")),
    message: v.string(),
  },
  handler: async (ctx, args): Promise<{ chatId: Id<"aiChats">; message: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw unauthenticated();
    }

    // Rate limit: 10 messages per minute per user
    await rateLimit(ctx, "aiChat", {
      key: userId,
      throws: true,
    });

    // Create or get chat
    const chatId: Id<"aiChats"> =
      args.chatId ??
      (
        await ctx.runMutation(api.ai.mutations.createChat, {
          projectId: args.projectId,
          title: args.message.slice(0, 100), // First 100 chars as title
        })
      ).chatId;

    // Store user message
    await ctx.runMutation(api.ai.mutations.addMessage, {
      chatId,
      role: "user",
      content: args.message,
    });

    // Get project context if available
    let context = "";
    if (args.projectId) {
      context = await ctx.runQuery(internal.internal.ai.getProjectContext, {
        projectId: args.projectId,
        userId,
      });
    }

    // Generate AI response using Claude Opus 4.5
    const systemPrompt = `You are a helpful project management assistant for Nixelo, a collaborative project management platform.

${context ? `Project Context:\n${context}\n\n` : ""}

Help users with:
- Understanding their projects and issues
- Finding information quickly
- Suggesting improvements
- Answering questions about project status

Be concise, helpful, and professional.`;

    // Track response time
    const startTime = Date.now();
    const response = await generateText({
      model: anthropic(CLAUDE_OPUS),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: args.message },
      ],
    });
    const responseTime = Date.now() - startTime;

    // Extract usage information type-safely
    const usage = extractUsage(response.usage);

    // Store AI response
    await ctx.runMutation(api.ai.mutations.addMessage, {
      chatId,
      role: "assistant",
      content: response.text,
      modelUsed: CLAUDE_OPUS,
      tokensUsed: usage.totalTokens,
    });

    // Track usage
    await ctx.runMutation(api.ai.mutations.trackUsage, {
      projectId: args.projectId,
      provider: "anthropic",
      model: CLAUDE_OPUS,
      operation: "chat",
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      responseTime,
      success: true,
    });

    return {
      chatId,
      message: response.text,
    };
  },
});
