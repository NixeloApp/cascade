/**
 * Semantic Search using Vector Embeddings
 *
 * Find similar issues based on meaning, not just keywords
 */

import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";
import { action } from "../_generated/server";
import { unauthenticated } from "../lib/errors";
import { asVectorResults } from "../lib/vectorSearchHelpers";
import { rateLimit } from "../rateLimits";

/**
 * Search for similar issues using semantic search
 */
export const searchSimilarIssues = action({
  args: {
    query: v.string(),
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<(Doc<"issues"> & { similarity: number })[]> => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw unauthenticated();
    }

    // Rate limit: 30 searches per minute per user
    await rateLimit(ctx, "semanticSearch", {
      key: userId.subject,
      throws: true,
    });

    // Generate embedding for search query
    const queryEmbedding = await ctx.runAction(internal.internal.ai.generateEmbedding, {
      text: args.query,
    });

    // Vector search for similar issues
    const results = await ctx.vectorSearch("issues", "by_embedding", {
      vector: queryEmbedding,
      limit: args.limit || 10,
      filter: (q) => q.eq("projectId", args.projectId),
    });

    // Convert vector search results to typed format
    const typedResults = asVectorResults<"issues">(results);

    // Fetch full issue details (batch fetch)
    const issueIds = typedResults.map((result) => result._id);
    const issueDocs = await ctx.runQuery(internal.internal.ai.getIssuesData, {
      issueIds,
    });

    const issues = issueDocs
      .map((issue, index) => {
        if (!issue) return null;
        return {
          ...issue,
          similarity: typedResults[index]._score,
        };
      })
      .filter((i): i is Doc<"issues"> & { similarity: number } => i !== null);

    return issues;
  },
});

/**
 * Get related issues for a specific issue
 */
export const getRelatedIssues = action({
  args: {
    issueId: v.id("issues"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<(Doc<"issues"> & { similarity: number })[]> => {
    // Get the issue
    const issue = await ctx.runQuery(internal.internal.ai.getIssueData, {
      issueId: args.issueId,
    });

    if (!issue?.embedding) {
      return [];
    }

    // Vector search using the issue's embedding
    const rawResults = await ctx.vectorSearch("issues", "by_embedding", {
      vector: issue.embedding,
      limit: (args.limit || 5) + 1, // +1 to exclude self
      filter: (q) => q.eq("projectId", issue.projectId),
    });

    // Convert to typed results
    const results = asVectorResults<"issues">(rawResults);

    // Filter out the original issue
    const filteredResults = results
      .filter((result) => result._id !== args.issueId)
      .slice(0, args.limit || 5);

    // Fetch details (batch fetch)
    const issueIds = filteredResults.map((result) => result._id);
    const issueDocs = await ctx.runQuery(internal.internal.ai.getIssuesData, {
      issueIds,
    });

    const relatedIssues = issueDocs
      .map((issue, index) => {
        if (!issue) return null;
        return {
          ...issue,
          similarity: filteredResults[index]._score,
        };
      })
      .filter((i): i is Doc<"issues"> & { similarity: number } => i !== null);

    return relatedIssues;
  },
});

/**
 * Find duplicate issues using semantic similarity
 */
export const findPotentialDuplicates = action({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    threshold: v.optional(v.number()), // Similarity threshold (0-1)
  },
  handler: async (ctx, args): Promise<(Doc<"issues"> & { similarity: number })[]> => {
    // Combine title and description
    const text = `${args.title}\n\n${args.description || ""}`.trim();

    // Generate embedding
    const embedding = await ctx.runAction(internal.internal.ai.generateEmbedding, {
      text,
    });

    // Search for similar issues
    const rawResults = await ctx.vectorSearch("issues", "by_embedding", {
      vector: embedding,
      limit: 10,
      filter: (q) => q.eq("projectId", args.projectId),
    });

    // Convert to typed results
    const results = asVectorResults<"issues">(rawResults);

    const threshold = args.threshold || 0.85; // High similarity threshold

    // Filter results above threshold
    const filteredResults = results.filter((result) => result._score >= threshold);

    // Fetch issues (batch fetch)
    const issueIds = filteredResults.map((result) => result._id);
    const issueDocs = await ctx.runQuery(internal.internal.ai.getIssuesData, {
      issueIds,
    });

    const duplicates = issueDocs
      .map((issue, index) => {
        if (!issue) return null;
        return {
          ...issue,
          similarity: filteredResults[index]._score,
        };
      })
      .filter((i): i is Doc<"issues"> & { similarity: number } => i !== null);

    return duplicates;
  },
});
