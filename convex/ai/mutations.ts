/**
 * AI Mutations - Create chats, add messages, track usage
 */

import { v } from "convex/values";
import { authenticatedMutation } from "../customFunctions";
import { BOUNDED_LIST_LIMIT } from "../lib/boundedQueries";
import { notFound, requireOwned } from "../lib/errors";
import { assertCanAccessProject, assertCanEditProject } from "../projectAccess";
import { chatRoles } from "../validators";

/**
 * Create a new AI chat
 */
export const createChat = authenticatedMutation({
  args: {
    title: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
  },
  returns: v.object({ chatId: v.id("aiChats") }),
  handler: async (ctx, args) => {
    if (args.projectId) {
      await assertCanAccessProject(ctx, args.projectId, ctx.userId);
    }

    const now = Date.now();

    const chatId = await ctx.db.insert("aiChats", {
      userId: ctx.userId,
      projectId: args.projectId,
      title: args.title || "New Chat",
      updatedAt: now,
    });

    return { chatId };
  },
});

/**
 * Update chat title
 */
export const updateChatTitle = authenticatedMutation({
  args: {
    chatId: v.id("aiChats"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    requireOwned(chat, ctx.userId, "chat");

    await ctx.db.patch(args.chatId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a chat and all its messages
 */
export const deleteChat = authenticatedMutation({
  args: {
    chatId: v.id("aiChats"),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    requireOwned(chat, ctx.userId, "chat");

    // Delete all messages in batches
    const messages = await ctx.db
      .query("aiMessages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .take(BOUNDED_LIST_LIMIT);

    await Promise.all(messages.map((message) => ctx.db.delete(message._id)));

    // Delete chat
    await ctx.db.delete(args.chatId);
  },
});

/**
 * Add a message to a chat
 */
export const addMessage = authenticatedMutation({
  args: {
    chatId: v.id("aiChats"),
    role: chatRoles,
    content: v.string(),
    modelUsed: v.optional(v.string()),
    tokensUsed: v.optional(v.number()),
    responseTime: v.optional(v.number()),
  },
  returns: v.object({ messageId: v.id("aiMessages") }),
  handler: async (ctx, args) => {
    // Verify chat ownership
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }
    requireOwned(chat, ctx.userId, "chat");

    const messageId = await ctx.db.insert("aiMessages", {
      chatId: args.chatId,
      role: args.role,
      content: args.content,
      modelUsed: args.modelUsed,
      tokensUsed: args.tokensUsed,
      responseTime: args.responseTime,
    });

    // Update chat's updatedAt
    await ctx.db.patch(args.chatId, {
      updatedAt: Date.now(),
    });

    // Auto-generate title from first user message if chat title is "New Chat"
    if (chat.title === "New Chat" && args.role === "user") {
      const truncated = args.content.length > 50 ? `${args.content.slice(0, 50)}...` : args.content;
      await ctx.db.patch(args.chatId, {
        title: truncated,
      });
    }

    return { messageId };
  },
});

/**
 * Create an AI suggestion
 */
export const createSuggestion = authenticatedMutation({
  args: {
    projectId: v.id("projects"),
    suggestionType: v.union(
      v.literal("issue_description"),
      v.literal("issue_priority"),
      v.literal("issue_labels"),
      v.literal("issue_assignee"),
      v.literal("sprint_planning"),
      v.literal("risk_detection"),
      v.literal("insight"),
    ),
    targetId: v.optional(v.string()),
    suggestion: v.string(),
    reasoning: v.optional(v.string()),
    modelUsed: v.string(),
    confidence: v.optional(v.number()),
  },
  returns: v.object({ suggestionId: v.id("aiSuggestions") }),
  handler: async (ctx, args) => {
    await assertCanEditProject(ctx, args.projectId, ctx.userId);

    const suggestionId = await ctx.db.insert("aiSuggestions", {
      userId: ctx.userId,
      projectId: args.projectId,
      suggestionType: args.suggestionType,
      targetId: args.targetId,
      suggestion: args.suggestion,
      reasoning: args.reasoning,
      modelUsed: args.modelUsed,
      confidence: args.confidence,
    });

    return { suggestionId };
  },
});

/**
 * Accept an AI suggestion
 */
export const acceptSuggestion = authenticatedMutation({
  args: {
    suggestionId: v.id("aiSuggestions"),
  },
  handler: async (ctx, args) => {
    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) throw notFound("suggestion", args.suggestionId);

    await assertCanEditProject(ctx, suggestion.projectId, ctx.userId);

    await ctx.db.patch(args.suggestionId, {
      accepted: true,
      dismissed: false,
      respondedAt: Date.now(),
    });
  },
});

/**
 * Dismiss an AI suggestion
 */
export const dismissSuggestion = authenticatedMutation({
  args: {
    suggestionId: v.id("aiSuggestions"),
  },
  handler: async (ctx, args) => {
    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) throw notFound("suggestion", args.suggestionId);

    await assertCanEditProject(ctx, suggestion.projectId, ctx.userId);

    await ctx.db.patch(args.suggestionId, {
      accepted: false,
      dismissed: true,
      respondedAt: Date.now(),
    });
  },
});

/**
 * Track AI usage
 */
export const trackUsage = authenticatedMutation({
  args: {
    projectId: v.optional(v.id("projects")),
    provider: v.literal("anthropic"),
    model: v.string(),
    operation: v.union(
      v.literal("chat"),
      v.literal("suggestion"),
      v.literal("automation"),
      v.literal("analysis"),
    ),
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    estimatedCost: v.optional(v.number()),
    responseTime: v.number(),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  },
  returns: v.object({ usageId: v.id("aiUsage") }),
  handler: async (ctx, args) => {
    if (args.projectId) {
      await assertCanAccessProject(ctx, args.projectId, ctx.userId);
    }

    const usageId = await ctx.db.insert("aiUsage", {
      userId: ctx.userId,
      projectId: args.projectId,
      provider: args.provider,
      model: args.model,
      operation: args.operation,
      promptTokens: args.promptTokens,
      completionTokens: args.completionTokens,
      totalTokens: args.totalTokens,
      estimatedCost: args.estimatedCost,
      responseTime: args.responseTime,
      success: args.success,
      errorMessage: args.errorMessage,
    });

    return { usageId };
  },
});
