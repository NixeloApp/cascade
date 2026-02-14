import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { checkPasswordResetRateLimitHandler } from "./authWrapper";
import { rateLimit } from "./rateLimits";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

// Mock rateLimit
vi.mock("./rateLimits", () => ({
  rateLimit: vi.fn(),
}));

describe("Password Reset Rate Limiting", () => {
  it("should call rateLimit with correct key", async () => {
    const t = convexTest(schema, modules);
    const ip = "127.0.0.1";

    await t.run(async (ctx) => {
      await checkPasswordResetRateLimitHandler(ctx, { ip });
    });

    expect(rateLimit).toHaveBeenCalledWith(
      expect.anything(), // ctx
      "passwordReset",
      { key: ip },
    );
  });
});
