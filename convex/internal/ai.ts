/**
 * Internal AI Functions
 *
 * These internal functions are called by public actions in convex/ai.ts
 */

import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { getVoyageApiKey } from "../lib/env";
import { notFound, validation } from "../lib/errors";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { MINUTE } from "../lib/timeUtils";
import { assertCanAccessProject } from "../projectAccess";
import { chatRoles } from "../validators";

/**
 * Generate embedding for text using Voyage AI (Anthropic recommended)
 *
 * Voyage AI offers:
 * - 50M tokens/month free tier
 * - voyage-3-lite: 512 dimensions, fast & cheap
 * - voyage-3: 1024 dimensions, better quality
 */
export const generateEmbedding = internalAction({
  args: {
    text: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = getVoyageApiKey();
    if (!apiKey) {
      throw validation("VOYAGE_API_KEY", "VOYAGE_API_KEY not configured");
    }

    const response = await fetchWithTimeout(
      "https://api.voyageai.com/v1/embeddings",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          input: [args.text],
          model: "voyage-3-lite", // 512 dimensions, fast & cheap
        }),
      },
      MINUTE,
    );

    if (!response.ok) {
      const error = await response.text();
      throw validation("voyageAI", `Voyage AI error: ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  },
});

/**
 * Internal query to fetch issue data
 */
export const getIssueData = internalQuery({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.issueId);
  },
});

/**
 * Internal query to fetch multiple issues (batch optimized)
 */
export const getIssuesData = internalQuery({
  args: { issueIds: v.array(v.id("issues")) },
  handler: async (ctx, args) => {
    return await Promise.all(args.issueIds.map((id) => ctx.db.get(id)));
  },
});

/**
 * Store embedding in issue document
 */
export const storeIssueEmbedding = internalMutation({
  args: {
    issueId: v.id("issues"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.issueId, {
      embedding: args.embedding,
    });
  },
});

/**
 * Create new AI chat
 */
export const createChat = internalMutation({
  args: {
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by ID (direct get is more efficient than filter on _id)
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw notFound("user");
    }

    return await ctx.db.insert("aiChats", {
      userId: user._id as Id<"users">,
      projectId: args.projectId,
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Add message to chat
 */
export const addMessage = internalMutation({
  args: {
    chatId: v.id("aiChats"),
    role: chatRoles,
    content: v.string(),
    modelUsed: v.optional(v.string()),
    tokensUsed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiMessages", {
      chatId: args.chatId,
      role: args.role,
      content: args.content,
      modelUsed: args.modelUsed,
      tokensUsed: args.tokensUsed,
    });

    // Update chat timestamp
    await ctx.db.patch(args.chatId, {
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get project context for AI
 */
export const getProjectContext = internalQuery({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await assertCanAccessProject(ctx, args.projectId, args.userId);

    const project = await ctx.db.get(args.projectId);
    if (!project) return "";

    // Get active sprint
    const activeSprint = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    // Get issues summary
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(100); // Limit for context

    const issuesByStatus = issues.reduce(
      (acc, issue) => {
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return `
Project: ${project.name} (${project.key})
Description: ${project.description || "No description"}
Active Sprint: ${activeSprint ? activeSprint.name : "None"}
Total Issues: ${issues.length}
Issues by Status: ${Object.entries(issuesByStatus)
      .map(([status, count]) => `${status}: ${count}`)
      .join(", ")}
    `.trim();
  },
});

/**
 * Track AI usage
 */
export const trackUsage = internalMutation({
  args: {
    userId: v.id("users"),
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
    responseTime: v.number(),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Find user by ID (direct get is more efficient than filter on _id)
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw notFound("user");
    }

    await ctx.db.insert("aiUsage", {
      userId: user._id as Id<"users">,
      projectId: args.projectId,
      provider: args.provider,
      model: args.model,
      operation: args.operation,
      promptTokens: args.promptTokens,
      completionTokens: args.completionTokens,
      totalTokens: args.totalTokens,
      responseTime: args.responseTime,
      success: args.success,
    });
  },
});
