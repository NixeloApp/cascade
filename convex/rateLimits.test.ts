import { register } from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "./rateLimits";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

describe("rateLimits", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should enforce rate limits for aiChat", async () => {
    const t = convexTest(schema, modules);
    register(t);

    const userId = "user123";

    await t.run(async (ctx) => {
      // 10 calls should succeed (limit is 10)
      for (let i = 0; i < 10; i++) {
        await rateLimit(ctx, "aiChat", { key: userId });
      }
    });

    // The 11th call should fail
    await t.run(async (ctx) => {
      await expect(rateLimit(ctx, "aiChat", { key: userId })).rejects.toThrow();
    });

    // Advance time by 61 seconds (limit window is 60 seconds)
    await vi.advanceTimersByTimeAsync(61000);

    // Should succeed now
    await t.run(async (ctx) => {
      await rateLimit(ctx, "aiChat", { key: userId });
    });
  });
});
