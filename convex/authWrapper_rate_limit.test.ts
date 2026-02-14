import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { checkPasswordResetRateLimit } from "./authWrapper";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { rateLimit } from "./rateLimits";

vi.mock("./rateLimits", () => ({
  rateLimit: vi.fn(),
}));

describe("Password Reset Rate Limiting", () => {
  it("should call rateLimit with correct key", async () => {
    const t = convexTest(schema, modules);
    const ip = "127.0.0.1";

    await t.run(async (ctx) => {
      await checkPasswordResetRateLimit(ctx, { ip });
    });

    expect(rateLimit).toHaveBeenCalledWith(
      expect.anything(),
      "passwordReset",
      { key: ip },
    );
  });
});
