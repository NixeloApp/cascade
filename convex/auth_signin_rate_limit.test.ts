import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { checkAuthRateLimitHandler } from "./authWrapper";
import { rateLimit } from "./rateLimits";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

// Mock rateLimit
vi.mock("./rateLimits", () => ({
  rateLimit: vi.fn(),
}));

describe("Auth Signin Rate Limiting", () => {
  it("should rate limit by IP address", async () => {
    const t = convexTest(schema, modules);
    const ip = "192.168.1.100";

    await t.run(async (ctx) => {
      await checkAuthRateLimitHandler(ctx, { ip });
    });

    expect(rateLimit).toHaveBeenCalledWith(
      expect.anything(), // ctx
      "authAttempt",
      { key: ip },
    );
  });
});
