/// <reference types="node" />
/**
 * AI Actions - Convex actions for AI operations
 * These run on Convex backend and can make external API calls
 */

import { v } from "convex/values";
import { api } from "../_generated/api";
import { authenticatedAction } from "../customFunctions";
import { getAIConfig } from "./config";
import { type AIMessage, callAI } from "./providers";

/**
 * Send a chat message to AI assistant
 */
export const sendChatMessage = authenticatedAction({
  args: {
    chatId: v.id("aiChats"),
    message: v.string(),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();

    // Get chat history for context
    const messages = await ctx.runQuery(api.ai.queries.getChatMessages, {
      chatId: args.chatId,
    });

    // Build context from project data if projectId provided
    let systemContext = "You are a helpful AI assistant for Nixelo, a project management platform.";

    if (args.projectId) {
      const projectData = await ctx.runQuery(api.ai.queries.getProjectContext, {
        projectId: args.projectId,
      });

      systemContext += `\n\nCurrent Project Context:
- Project: ${projectData.project.name}
- Active Sprint: ${projectData.activeSprint?.name || "None"}
- Total Issues: ${projectData.stats.totalIssues}
- In Progress: ${projectData.stats.inProgress}
- Completed: ${projectData.stats.completed}
- Team Members: ${projectData.members.map((m: { name?: string }) => m.name).join(", ")}`;
    }

    // Build message array for AI
    const aiMessages: AIMessage[] = [
      { role: "system", content: systemContext },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: args.message },
    ];

    // Call AI provider
    const config = getAIConfig();
    const response = await callAI(config, aiMessages);

    const responseTime = Date.now() - startTime;

    // Store user message
    await ctx.runMutation(api.ai.mutations.addMessage, {
      chatId: args.chatId,
      role: "user",
      content: args.message,
    });

    // Store AI response
    await ctx.runMutation(api.ai.mutations.addMessage, {
      chatId: args.chatId,
      role: "assistant",
      content: response.content,
      modelUsed: config.model,
      tokensUsed: response.usage?.totalTokens,
      responseTime,
    });

    // Track usage
    await ctx.runMutation(api.ai.mutations.trackUsage, {
      projectId: args.projectId,
      provider: config.provider,
      model: config.model,
      operation: "chat",
      promptTokens: response.usage?.promptTokens || 0,
      completionTokens: response.usage?.completionTokens || 0,
      totalTokens: response.usage?.totalTokens || 0,
      responseTime,
      success: true,
    });

    return {
      response: response.content,
      tokensUsed: response.usage?.totalTokens,
    };
  },
});

/**
 * Generate AI suggestions for an issue
 */
export const generateIssueSuggestions = authenticatedAction({
  args: {
    projectId: v.id("projects"),
    issueTitle: v.string(),
    issueDescription: v.optional(v.string()),
    suggestionTypes: v.array(
      v.union(
        v.literal("description"),
        v.literal("priority"),
        v.literal("labels"),
        v.literal("assignee"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();

    // Get project context
    const projectData = await ctx.runQuery(api.ai.queries.getProjectContext, {
      projectId: args.projectId,
    });

    // Build prompt for AI
    const prompt = `Analyze this issue and provide suggestions:

Title: ${args.issueTitle}
${args.issueDescription ? `Description: ${args.issueDescription}` : ""}

Project Context:
- Project: ${projectData.project.name}
- Available Labels: ${projectData.labels.map((l: { name: string }) => l.name).join(", ")}
- Team Members: ${projectData.members.map((m: { name?: string }) => m.name).join(", ")}

Please provide:
${args.suggestionTypes.includes("description") ? "- A detailed description (if missing or brief)\n" : ""}
${args.suggestionTypes.includes("priority") ? "- Suggested priority (lowest, low, medium, high, highest) with reasoning\n" : ""}
${args.suggestionTypes.includes("labels") ? "- Relevant labels from the available labels\n" : ""}
${args.suggestionTypes.includes("assignee") ? "- Suggested assignee based on team expertise\n" : ""}

Format your response as JSON with keys: description, priority, priorityReason, labels (array), assignee, assigneeReason.`;

    const aiMessages: AIMessage[] = [
      {
        role: "system",
        content:
          "You are an AI assistant helping with project management. Provide thoughtful, context-aware suggestions.",
      },
      { role: "user", content: prompt },
    ];

    const config = getAIConfig();
    const response = await callAI(config, aiMessages);

    const responseTime = Date.now() - startTime;

    // Parse AI response
    let suggestions: Record<string, unknown>;
    try {
      // Extract JSON from response (AI might wrap it in markdown code blocks)
      const jsonMatch = response.content.match(/```(?:json)?\n?([\s\S]*?)\n?```/) || [
        null,
        response.content,
      ];
      suggestions = JSON.parse(jsonMatch[1] || response.content) as Record<string, unknown>;
    } catch (_error) {
      suggestions = { raw: response.content };
    }

    // Track usage
    await ctx.runMutation(api.ai.mutations.trackUsage, {
      projectId: args.projectId,
      provider: config.provider,
      model: config.model,
      operation: "suggestion",
      promptTokens: response.usage?.promptTokens || 0,
      completionTokens: response.usage?.completionTokens || 0,
      totalTokens: response.usage?.totalTokens || 0,
      responseTime,
      success: true,
    });

    return suggestions;
  },
});

/**
 * Generate analytics insights for a project
 */
export const generateProjectInsights = authenticatedAction({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();

    // Get comprehensive project analytics
    const analytics = await ctx.runQuery(api.analytics.getProjectAnalytics, {
      projectId: args.projectId,
    });

    const velocity = await ctx.runQuery(api.analytics.getTeamVelocity, {
      projectId: args.projectId,
    });

    const recentActivity = await ctx.runQuery(api.analytics.getRecentActivity, {
      projectId: args.projectId,
      limit: 20,
    });

    // Build comprehensive prompt
    const prompt = `Analyze this project data and provide insights:

Project Overview:
- Total Issues: ${analytics.totalIssues}
- Unassigned: ${analytics.unassignedCount}
- Average Velocity: ${velocity.averageVelocity} points/sprint

Issue Distribution:
- By Status: ${JSON.stringify(analytics.issuesByStatus)}
- By Type: ${JSON.stringify(analytics.issuesByType)}
- By Priority: ${JSON.stringify(analytics.issuesByPriority)}

Team Velocity (last ${velocity.velocityData.length} sprints):
${velocity.velocityData.map((v: { sprintName: string; points: number }) => `- ${v.sprintName}: ${v.points} points`).join("\n")}

Recent Activity (last 20 events):
${recentActivity
  .slice(0, 10)
  .map((a: { action: string; issueTitle?: string }) => `- ${a.action}: ${a.issueTitle}`)
  .join("\n")}

Please provide:
1. Overall project health assessment
2. Key risks or bottlenecks
3. Recommendations for improvement
4. Sprint planning suggestions
5. Team workload analysis

Format as JSON with keys: healthScore (0-100), risks (array), recommendations (array), sprintSuggestions (string), workloadAnalysis (string).`;

    const aiMessages: AIMessage[] = [
      {
        role: "system",
        content:
          "You are an AI project management analyst. Provide actionable insights based on project metrics.",
      },
      { role: "user", content: prompt },
    ];

    const config = getAIConfig();
    const response = await callAI(config, aiMessages);

    const responseTime = Date.now() - startTime;

    // Parse AI response
    let insights: Record<string, unknown>;
    try {
      const jsonMatch = response.content.match(/```(?:json)?\n?([\s\S]*?)\n?```/) || [
        null,
        response.content,
      ];
      insights = JSON.parse(jsonMatch[1] || response.content) as Record<string, unknown>;
    } catch (_error) {
      insights = { raw: response.content };
    }

    // Store insights as suggestions
    if (insights.risks && Array.isArray(insights.risks)) {
      for (const risk of insights.risks) {
        await ctx.runMutation(api.ai.mutations.createSuggestion, {
          projectId: args.projectId,
          suggestionType: "risk_detection",
          suggestion: risk,
          modelUsed: config.model,
        });
      }
    }

    // Track usage
    await ctx.runMutation(api.ai.mutations.trackUsage, {
      projectId: args.projectId,
      provider: config.provider,
      model: config.model,
      operation: "analysis",
      promptTokens: response.usage?.promptTokens || 0,
      completionTokens: response.usage?.completionTokens || 0,
      totalTokens: response.usage?.totalTokens || 0,
      responseTime,
      success: true,
    });

    return insights;
  },
});

/**
 * Answer a natural language question about project data
 */
export const answerQuestion = authenticatedAction({
  args: {
    projectId: v.id("projects"),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();

    // Get project context
    const projectData = await ctx.runQuery(api.ai.queries.getProjectContext, {
      projectId: args.projectId,
    });

    const analytics = await ctx.runQuery(api.analytics.getProjectAnalytics, {
      projectId: args.projectId,
    });

    // Build context
    const context = `Project: ${projectData.project.name}

Statistics:
- Total Issues: ${analytics.totalIssues}
- Unassigned: ${analytics.unassignedCount}

Distribution:
- By Status: ${JSON.stringify(analytics.issuesByStatus)}
- By Type: ${JSON.stringify(analytics.issuesByType)}
- By Priority: ${JSON.stringify(analytics.issuesByPriority)}

Active Sprint: ${projectData.activeSprint?.name || "None"}
Team: ${projectData.members.map((m: { name?: string }) => m.name).join(", ")}`;

    const aiMessages: AIMessage[] = [
      {
        role: "system",
        content:
          "You are a helpful assistant answering questions about project data. Be concise and specific.",
      },
      { role: "user", content: `Context:\n${context}\n\nQuestion: ${args.question}` },
    ];

    const config = getAIConfig();
    const response = await callAI(config, aiMessages);

    const responseTime = Date.now() - startTime;

    // Track usage
    await ctx.runMutation(api.ai.mutations.trackUsage, {
      projectId: args.projectId,
      provider: config.provider,
      model: config.model,
      operation: "chat",
      promptTokens: response.usage?.promptTokens || 0,
      completionTokens: response.usage?.completionTokens || 0,
      totalTokens: response.usage?.totalTokens || 0,
      responseTime,
      success: true,
    });

    return {
      answer: response.content,
      tokensUsed: response.usage?.totalTokens,
    };
  },
});
