import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("API Keys Rate Limit Security", () => {
  it("should NOT allow creating a key with excessive rate limit", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    await expect(async () => {
      await asUser.mutation(api.apiKeys.generate, {
        name: "Excessive Limit Key",
        scopes: ["issues:read"],
        rateLimit: 1000000000, // 1 billion requests per minute
      });
    }).rejects.toThrow("Rate limit cannot exceed 1000 requests per minute");
  });

  it("should NOT allow updating a key to have excessive rate limit", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    const { id } = await asUser.mutation(api.apiKeys.generate, {
      name: "Normal Key",
      scopes: ["issues:read"],
      rateLimit: 100,
    });

    await expect(async () => {
      await asUser.mutation(api.apiKeys.update, {
        keyId: id,
        rateLimit: 1000000000,
      });
    }).rejects.toThrow("Rate limit cannot exceed 1000 requests per minute");
  });

  it("should NOT allow negative rate limits", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    await expect(async () => {
      await asUser.mutation(api.apiKeys.generate, {
        name: "Negative Key",
        scopes: ["issues:read"],
        rateLimit: -1,
      });
    }).rejects.toThrow("Rate limit must be at least 1 request per minute");
  });
});
