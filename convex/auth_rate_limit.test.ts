
import { describe, expect, it, vi } from "vitest";

// Mock internalMutation to return the handler
vi.mock("./_generated/server", () => ({
  internalMutation: vi.fn((opts) => opts.handler), // Return the handler directly
  internalAction: vi.fn(),
  httpAction: vi.fn(),
  query: vi.fn(),
  mutation: vi.fn(),
  action: vi.fn(),
}));

// Mock other dependencies
vi.mock("./_generated/api", () => ({
  internal: {},
}));

vi.mock("./lib/env", () => ({
  getConvexSiteUrl: vi.fn(),
}));

vi.mock("./lib/logger", () => ({
  logger: { error: vi.fn() },
}));

vi.mock("./lib/ssrf", () => ({
  getClientIp: vi.fn(),
}));

// Mock rateLimit function
vi.mock("./rateLimits", () => ({
  rateLimit: vi.fn(),
}));

// Import AFTER mocking
import { checkAuthRateLimit } from "./authWrapper";
import { rateLimit } from "./rateLimits";

describe("Auth Rate Limit", () => {
  it("should call rateLimit with correct arguments", async () => {
    const mockCtx = { runMutation: vi.fn() };
    const args = { ip: "1.2.3.4" };

    // checkAuthRateLimit is now the async handler function due to the mock
    // We cast it to any because TypeScript thinks it's a FunctionReference
    await (checkAuthRateLimit as any)(mockCtx, args);

    expect(rateLimit).toHaveBeenCalledWith(mockCtx, "authAttempt", { key: "1.2.3.4" });
  });
});
