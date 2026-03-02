import { describe, expect, it, vi } from "vitest";
import { checkApiKeyRateLimit } from "./rateLimiter";

// Mock the components object from the generated API
vi.mock("../_generated/api", () => ({
  components: {
    rateLimiter: {
      lib: {
        checkRateLimit: "checkRateLimitQuery",
      },
    },
  },
}));

// Mock @convex-dev/rate-limiter since we can't reliably import it in unit tests without proper setup
vi.mock("@convex-dev/rate-limiter", () => ({
  MINUTE: 60 * 1000,
}));

// Import MINUTE after mocking
import { MINUTE } from "@convex-dev/rate-limiter";

describe("checkApiKeyRateLimit", () => {
  it("should call the rate limiter component with correct arguments", async () => {
    const mockRunQuery = vi.fn().mockResolvedValue({ ok: true });
    const ctx = {
      runQuery: mockRunQuery,
    } as any;

    const keyId = "test-key";
    const limit = 100;

    const result = await checkApiKeyRateLimit(ctx, keyId, limit);

    expect(mockRunQuery).toHaveBeenCalledWith("checkRateLimitQuery", {
      name: `api-key-${keyId}`,
      config: {
        kind: "token bucket",
        rate: limit,
        period: MINUTE,
        capacity: limit,
      },
    });

    expect(result).toEqual({ ok: true });
  });

  it("should return the result from the rate limiter when limited", async () => {
    const retryAfter = 12345;
    const mockRunQuery = vi.fn().mockResolvedValue({ ok: false, retryAfter });
    const ctx = {
      runQuery: mockRunQuery,
    } as any;

    const result = await checkApiKeyRateLimit(ctx, "key", 10);

    expect(result).toEqual({ ok: false, retryAfter });
  });
});
