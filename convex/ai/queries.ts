/**
 * AI Queries - Fetch AI chat history and context
 */

import { v } from "convex/values";
import { authenticatedQuery } from "../customFunctions";
import { batchFetchUsers } from "../lib/batchHelpers";
import { forbidden, notFound, requireOwned } from "../lib/errors";
import { MAX_PAGE_SIZE } from "../lib/queryLimits";
import { getUserName } from "../lib/userUtils";
import type { AIProvider } from "./config";

// Reasonable limits for AI-related queries
const MAX_CHATS = 100;
const MAX_MESSAGES_PER_CHAT = 500;
const MAX_SUGGESTIONS = 200;
const MAX_USAGE_RECORDS = 1000;
const MAX_PROJECT_ISSUES_FOR_AI = 500;

type AIOperation = "chat" | "suggestion" | "automation" | "analysis";

/**
 * Get all AI chats for current user
 */
export const getUserChats = authenticatedQuery({
  args: {
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const chats = await ctx.db
      .query("aiChats")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .take(MAX_CHATS);

    // Filter by project if specified
    const filtered = args.projectId
      ? chats.filter((chat) => chat.projectId === args.projectId)
      : chats;

    // Sort by most recent
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * Get messages for a specific chat
 */
export const getChatMessages = authenticatedQuery({
  args: {
    chatId: v.id("aiChats"),
  },
  handler: async (ctx, args) => {
    // Verify user owns this chat
    const chat = await ctx.db.get(args.chatId);
    requireOwned(chat, ctx.userId, "chat");

    const messages = await ctx.db
      .query("aiMessages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .take(MAX_MESSAGES_PER_CHAT);

    return messages.sort((a, b) => a._creationTime - b._creationTime);
  },
});

/**
 * Get project context for AI
 */
export const getProjectContext = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Get project
    const project = await ctx.db.get(args.projectId);
    if (!project) throw notFound("project", args.projectId);

    // Check access
    const member = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", ctx.userId),
      )
      .first();

    if (!member && project.createdBy !== ctx.userId && !project.isPublic) {
      throw forbidden();
    }

    // Get active sprint
    const activeSprint = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    // Get issues (limit for AI context - don't need all issues)
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(MAX_PROJECT_ISSUES_FOR_AI);

    // Calculate stats
    const stats = {
      totalIssues: issues.length,
      inProgress: issues.filter((i) => {
        const state = project.workflowStates.find((s) => s.id === i.status);
        return state?.category === "inprogress";
      }).length,
      completed: issues.filter((i) => {
        const state = project.workflowStates.find((s) => s.id === i.status);
        return state?.category === "done";
      }).length,
      todo: issues.filter((i) => {
        const state = project.workflowStates.find((s) => s.id === i.status);
        return state?.category === "todo";
      }).length,
    };

    // Get project members with details
    const memberRecords = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(MAX_PAGE_SIZE);

    // Batch fetch users to avoid N+1 queries
    const userIds = memberRecords.map((m) => m.userId);
    const userMap = await batchFetchUsers(ctx, userIds);

    const members = memberRecords.map((m) => ({
      id: m.userId,
      name: getUserName(userMap.get(m.userId)),
      role: m.role,
    }));

    // Get labels
    const labels = await ctx.db
      .query("labels")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(MAX_PAGE_SIZE);

    return {
      project: {
        id: project._id,
        name: project.name,
        key: project.key,
        description: project.description,
      },
      activeSprint: activeSprint
        ? {
            id: activeSprint._id,
            name: activeSprint.name,
            goal: activeSprint.goal,
            startDate: activeSprint.startDate,
            endDate: activeSprint.endDate,
          }
        : null,
      stats,
      members,
      labels: labels.map((l) => ({ name: l.name, color: l.color })),
      issues: issues.map((i) => ({
        key: i.key,
        title: i.title,
        type: i.type,
        status: i.status,
        priority: i.priority,
      })),
    };
  },
});

/**
 * Get AI suggestions for a project
 */
export const getProjectSuggestions = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
    suggestionType: v.optional(
      v.union(
        v.literal("issue_description"),
        v.literal("issue_priority"),
        v.literal("issue_labels"),
        v.literal("issue_assignee"),
        v.literal("sprint_planning"),
        v.literal("risk_detection"),
        v.literal("insight"),
      ),
    ),
    includeResponded: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const suggestions = await ctx.db
      .query("aiSuggestions")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(MAX_SUGGESTIONS);

    // Filter by type if specified
    let filtered = args.suggestionType
      ? suggestions.filter((s) => s.suggestionType === args.suggestionType)
      : suggestions;

    // Filter out responded suggestions unless requested
    if (!args.includeResponded) {
      filtered = filtered.filter((s) => !(s.accepted || s.dismissed));
    }

    // Sort by most recent
    return filtered.sort((a, b) => b._creationTime - a._creationTime);
  },
});

/**
 * Get AI usage statistics
 */
export const getUsageStats = authenticatedQuery({
  args: {
    projectId: v.optional(v.id("projects")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Query usage records
    const usage = await ctx.db
      .query("aiUsage")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .take(MAX_USAGE_RECORDS);

    // Filter by project and date range
    let filtered = usage;
    if (args.projectId) {
      filtered = filtered.filter((u) => u.projectId === args.projectId);
    }
    if (args.startDate !== undefined) {
      const startDate = args.startDate;
      filtered = filtered.filter((u) => u._creationTime >= startDate);
    }
    if (args.endDate !== undefined) {
      const endDate = args.endDate;
      filtered = filtered.filter((u) => u._creationTime <= endDate);
    }

    // Calculate aggregates
    const totalTokens = filtered.reduce((sum, u) => sum + u.totalTokens, 0);
    const totalCost = filtered.reduce((sum, u) => sum + (u.estimatedCost || 0), 0);
    const avgResponseTime =
      filtered.length > 0
        ? filtered.reduce((sum, u) => sum + u.responseTime, 0) / filtered.length
        : 0;

    const byProvider = filtered.reduce<Record<AIProvider, number>>(
      (acc, u) => {
        if (u.provider === "anthropic") {
          acc[u.provider] = (acc[u.provider] || 0) + u.totalTokens;
        }
        return acc;
      },
      { anthropic: 0 },
    );

    const byOperation = filtered.reduce<Record<AIOperation, number>>(
      (acc, u) => {
        if (
          u.operation === "chat" ||
          u.operation === "suggestion" ||
          u.operation === "automation" ||
          u.operation === "analysis"
        ) {
          acc[u.operation] = (acc[u.operation] || 0) + 1;
        }
        return acc;
      },
      { chat: 0, suggestion: 0, automation: 0, analysis: 0 },
    );

    return {
      totalRequests: filtered.length,
      totalTokens,
      totalCost, // in cents
      avgResponseTime, // in ms
      byProvider,
      byOperation,
      successRate:
        filtered.length > 0
          ? (filtered.filter((u) => u.success).length / filtered.length) * 100
          : 0,
    };
  },
});
