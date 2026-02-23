/**
 * AI-Powered Suggestions
 *
 * Generate intelligent suggestions for issues, sprints, and projects
 * Uses Claude Haiku 4.5 for fast, cost-effective suggestions
 */

import { anthropic } from "@ai-sdk/anthropic";
import { ActionCache } from "@convex-dev/action-cache";
import { generateText } from "ai";
import { v } from "convex/values";
import { api, components, internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import {
  authenticatedAction,
  authenticatedMutation,
  authenticatedQuery,
} from "../customFunctions";
import { extractUsage } from "../lib/aiHelpers";
import { BOUNDED_LIST_LIMIT } from "../lib/boundedQueries";
import { notFound } from "../lib/errors";
import { HOUR } from "../lib/timeUtils";
import { assertCanAccessProject, assertCanEditProject } from "../projectAccess";
import { rateLimit } from "../rateLimits";
import { issueTypes } from "../validators";

// Claude Haiku 4.5 for fast, cheap suggestions (alias auto-points to latest)
const CLAUDE_HAIKU = "claude-haiku-4-5";

/**
 * Action cache for AI suggestions
 * Caches expensive AI calls to save money and improve speed
 */
/**
 * Generate description text
 */
export const generateDescription = internalAction({
  args: { prompt: v.string() },
  handler: async (_ctx, args) => {
    const response = await generateText({
      model: anthropic(CLAUDE_HAIKU),
      prompt: args.prompt,
    });
    return {
      text: response.text,
      usage: extractUsage(response.usage),
    };
  },
});

const descriptionCache = new ActionCache(components.actionCache, {
  action: internal.ai.suggestions.generateDescription,
});

/**
 * Generate priority text
 */
export const generatePriority = internalAction({
  args: { prompt: v.string() },
  handler: async (_ctx, args) => {
    const response = await generateText({
      model: anthropic(CLAUDE_HAIKU),
      prompt: args.prompt,
    });
    return {
      text: response.text,
      usage: extractUsage(response.usage),
    };
  },
});

const priorityCache = new ActionCache(components.actionCache, {
  action: internal.ai.suggestions.generatePriority,
});

/**
 * Generate labels text
 */
export const generateLabels = internalAction({
  args: { prompt: v.string() },
  handler: async (_ctx, args) => {
    const response = await generateText({
      model: anthropic(CLAUDE_HAIKU),
      prompt: args.prompt,
    });
    return {
      text: response.text,
      usage: extractUsage(response.usage),
    };
  },
});

const labelsCache = new ActionCache(components.actionCache, {
  action: internal.ai.suggestions.generateLabels,
});

/**
 * Generate AI suggestion for issue description
 */
export const suggestIssueDescription = authenticatedAction({
  args: {
    title: v.string(),
    type: issueTypes,
    projectId: v.id("projects"),
  },
  handler: async (ctx, args): Promise<string> => {
    // Rate limit: 20 suggestions per hour per user
    await rateLimit(ctx, "aiSuggestion", {
      key: ctx.userId,
      throws: true,
    });

    // Get project context
    const project = await ctx.runQuery(api.ai.queries.getProjectContext, {
      projectId: args.projectId,
    });

    const prompt = `Generate a clear, concise issue description for the following ${args.type}:

Title: ${args.title}

Project Context:
${project}

Requirements:
- Write 2-3 sentences
- Include acceptance criteria if applicable
- Be specific and actionable
- Use professional project management language

Description:`;

    // Use cache with 1 hour TTL - same prompt = cached result
    const startTime = Date.now();
    const result = await descriptionCache.fetch(ctx, { prompt }, { ttl: HOUR });
    const responseTime = Date.now() - startTime;

    // Handle backward compatibility (cache might contain strings)
    const suggestion = typeof result === "string" ? result : result.text;
    const usage =
      typeof result === "string"
        ? { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
        : result.usage;

    // Store suggestion
    await ctx.runMutation(api.ai.mutations.createSuggestion, {
      projectId: args.projectId,
      suggestionType: "issue_description",
      targetId: args.title,
      suggestion,
      modelUsed: CLAUDE_HAIKU,
    });

    // Track usage
    await ctx.runMutation(api.ai.mutations.trackUsage, {
      projectId: args.projectId,
      provider: "anthropic",
      model: CLAUDE_HAIKU,
      operation: "suggestion",
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      responseTime,
      success: true,
    });

    return suggestion;
  },
});

/**
 * Suggest priority based on issue details
 */
export const suggestPriority = authenticatedAction({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    type: issueTypes,
    projectId: v.id("projects"),
  },
  handler: async (ctx, args): Promise<"highest" | "high" | "medium" | "low" | "lowest"> => {
    // Rate limit: 20 suggestions per hour per user
    await rateLimit(ctx, "aiSuggestion", {
      key: ctx.userId,
      throws: true,
    });

    const prompt = `Analyze this issue and suggest a priority (highest, high, medium, low, lowest):

Type: ${args.type}
Title: ${args.title}
Description: ${args.description || "No description"}

Consider:
- Urgency and impact
- Issue type (bugs are typically higher priority)
- Business value
- Dependencies

Respond with ONLY ONE of these words: highest, high, medium, low, lowest

Priority:`;

    // Use cache with 1 hour TTL - same prompt = cached result
    const startTime = Date.now();
    const result = await priorityCache.fetch(ctx, { prompt }, { ttl: HOUR });
    const responseTime = Date.now() - startTime;

    // Handle backward compatibility
    const responseText = typeof result === "string" ? result : result.text;
    const usage =
      typeof result === "string"
        ? { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
        : result.usage;

    const priority = responseText.trim().toLowerCase();

    // Validate priority
    const validPriorities = ["highest", "high", "medium", "low", "lowest"];
    const suggestedPriority = validPriorities.includes(priority) ? priority : "medium";

    // Store suggestion
    await ctx.runMutation(api.ai.mutations.createSuggestion, {
      projectId: args.projectId,
      suggestionType: "issue_priority",
      targetId: args.title,
      suggestion: suggestedPriority,
      modelUsed: CLAUDE_HAIKU,
    });

    // Track usage
    await ctx.runMutation(api.ai.mutations.trackUsage, {
      projectId: args.projectId,
      provider: "anthropic",
      model: CLAUDE_HAIKU,
      operation: "suggestion",
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      responseTime,
      success: true,
    });

    return suggestedPriority as "highest" | "high" | "medium" | "low" | "lowest";
  },
});

/**
 * Suggest labels for an issue
 */
export const suggestLabels = authenticatedAction({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    type: issueTypes,
    projectId: v.id("projects"),
  },
  handler: async (ctx, args): Promise<string[]> => {
    // Rate limit: 20 suggestions per hour per user
    await rateLimit(ctx, "aiSuggestion", {
      key: ctx.userId,
      throws: true,
    });

    // Get existing project labels
    const existingLabels = await ctx.runQuery(api.ai.suggestions.getProjectLabels, {
      projectId: args.projectId,
    });

    const prompt = `Suggest 2-4 relevant labels for this issue:

Type: ${args.type}
Title: ${args.title}
Description: ${args.description || "No description"}

${existingLabels.length > 0 ? `Existing project labels: ${existingLabels.join(", ")}` : ""}

Guidelines:
- Prefer existing labels when applicable
- Suggest new labels only if needed
- Labels should be lowercase, kebab-case (e.g., "bug-fix", "frontend", "high-priority")
- Be specific but concise

Respond with a comma-separated list of labels only.

Labels:`;

    // Use cache with 1 hour TTL - same prompt = cached result
    const startTime = Date.now();
    const result = await labelsCache.fetch(ctx, { prompt }, { ttl: HOUR });
    const responseTime = Date.now() - startTime;

    // Handle backward compatibility
    const responseText = (typeof result === "string" ? result : result.text) as string;
    const usage =
      typeof result === "string"
        ? { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
        : result.usage;

    const suggestedLabels = responseText
      .split(",")
      .map((label) => label.trim().toLowerCase())
      .filter((label) => label.length > 0)
      .slice(0, 4);

    // Store suggestion
    await ctx.runMutation(api.ai.mutations.createSuggestion, {
      projectId: args.projectId,
      suggestionType: "issue_labels",
      targetId: args.title,
      suggestion: suggestedLabels.join(", "),
      modelUsed: CLAUDE_HAIKU,
    });

    // Track usage
    await ctx.runMutation(api.ai.mutations.trackUsage, {
      projectId: args.projectId,
      provider: "anthropic",
      model: CLAUDE_HAIKU,
      operation: "suggestion",
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      responseTime,
      success: true,
    });

    return suggestedLabels;
  },
});

/**
 * Get project labels
 */
export const getProjectLabels = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    await assertCanAccessProject(ctx, args.projectId, ctx.userId);

    const labels = await ctx.db
      .query("labels")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(BOUNDED_LIST_LIMIT);

    return labels.map((label) => label.name);
  },
});

/**
 * Accept or dismiss a suggestion
 */
export const respondToSuggestion = authenticatedMutation({
  args: {
    suggestionId: v.id("aiSuggestions"),
    accepted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) throw notFound("suggestion", args.suggestionId);

    // Ensure user has edit access to the project
    await assertCanEditProject(ctx, suggestion.projectId, ctx.userId);

    await ctx.db.patch(args.suggestionId, {
      accepted: args.accepted,
      dismissed: !args.accepted,
      respondedAt: Date.now(),
    });
  },
});
