/**
 * Rate Limiting Configuration
 *
 * Protects endpoints from abuse and controls costs
 */

import { RateLimiter } from "@convex-dev/rate-limiter";

import { components } from "./_generated/api";

const rateLimiter = new RateLimiter(components.rateLimiter, {
  // AI Chat: 10 messages per minute per user
  aiChat: { kind: "fixed window", rate: 10, period: 60_000 }, // 1 minute

  // AI Suggestions: 20 per hour per user (more expensive)
  aiSuggestion: { kind: "fixed window", rate: 20, period: 3_600_000 }, // 1 hour

  // Semantic Search: 30 per minute per user
  semanticSearch: { kind: "token bucket", rate: 30, period: 60_000, capacity: 10 },

  // Issue Creation: Prevent spam
  createIssue: { kind: "token bucket", rate: 10, period: 60_000, capacity: 3 },

  // API Endpoints: General rate limit
  apiEndpoint: { kind: "fixed window", rate: 100, period: 60_000 }, // 100/min

  // Password Reset: Strict limit to prevent spam/DoS
  // Increased capacity/rate slightly to accommodate parallel E2E tests
  passwordReset: {
    kind: "token bucket",
    rate: process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development" ? 10 : 3,
    period: 60_000,
    capacity: process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development" ? 10 : 3,
  }, // 3 per minute (higher in dev/test)
});

/**
 * Rate limit an operation - throws if limit exceeded (unless throws: false)
 */
export const rateLimit = rateLimiter.limit.bind(rateLimiter);

/**
 * Check rate limit without consuming tokens
 */
export const checkRateLimit = rateLimiter.check.bind(rateLimiter);

/**
 * Reset rate limit for a key
 */
export const resetRateLimit = rateLimiter.reset.bind(rateLimiter);
