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
    rate:
      process.env.NODE_ENV === "test" ||
      process.env.NODE_ENV === "development" ||
      process.env.E2E_TEST_MODE ||
      process.env.CI
        ? 100
        : 20,
    period: 60_000,
    capacity:
      process.env.NODE_ENV === "test" ||
      process.env.NODE_ENV === "development" ||
      process.env.E2E_TEST_MODE ||
      process.env.CI
        ? 100
        : 20,
  }, // 20 per minute default to prevent blocking legit users/tests if env detection fails

  // Email Change Verification: Strict limit to prevent OTP brute-forcing
  // User-based (authenticated), so low limit is safe even for parallel tests
  emailChange: { kind: "token bucket", rate: 5, period: 60_000, capacity: 5 },

  // Email Verification: Strict limit to prevent spam/DoS
  // Similar to password reset
  emailVerification: {
    kind: "token bucket",
    rate:
      process.env.NODE_ENV === "test" ||
      process.env.NODE_ENV === "development" ||
      process.env.E2E_TEST_MODE ||
      process.env.CI
        ? 100
        : 20,
    period: 60_000,
    capacity:
      process.env.NODE_ENV === "test" ||
      process.env.NODE_ENV === "development" ||
      process.env.E2E_TEST_MODE ||
      process.env.CI
        ? 100
        : 20,
  },
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
