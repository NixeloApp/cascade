import { convexTest } from "convex-test";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "../testUtils";
import { register } from "@convex-dev/rate-limiter/test";

// Mock the 'ai' module
vi.mock("ai", () => ({
  generateText: vi.fn(),
  anthropic: vi.fn(),
}));

import { generateText } from "ai";

describe("AI Chat Error Handling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(generateText).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should handle AI generation failure gracefully", async () => {
    const t = convexTest(schema, modules);
    register(t);

    const { asUser, userId, organizationId } = await createTestContext(t);
    const projectId = await createProjectInOrganization(t, userId, organizationId);

    // Mock AI failure
    const error = new Error("API Limit Exceeded");
    vi.mocked(generateText).mockRejectedValue(error);

    // Expect the action to throw
    await expect(asUser.action(api.ai.chat.chat, {
      projectId,
      message: "Hello AI",
    })).rejects.toThrow("API Limit Exceeded");

    // Verify side effects
    // 1. Chat should be created
    const chats = await t.run(async (ctx) => {
      return await ctx.db.query("aiChats").collect();
    });
    expect(chats).toHaveLength(1);

    // 2. User message should be stored
    // 3. System error message should be stored
    const messages = await t.run(async (ctx) => {
      return await ctx.db.query("aiMessages").collect();
    });

    // Should have 2 messages: user message and system error message
    expect(messages).toHaveLength(2);

    const userMessage = messages.find((m) => m.role === "user");
    expect(userMessage).toBeDefined();
    expect(userMessage?.content).toBe("Hello AI");

    const systemMessage = messages.find((m) => m.role === "system");
    expect(systemMessage).toBeDefined();
    expect(systemMessage?.content).toContain("AI generation failed: API Limit Exceeded");

    // 4. Usage should be tracked as failure
    const usage = await t.run(async (ctx) => {
      return await ctx.db.query("aiUsage").collect();
    });
    expect(usage).toHaveLength(1);
    expect(usage[0].success).toBe(false);
    expect(usage[0].errorMessage).toBe("API Limit Exceeded");
    expect(usage[0].totalTokens).toBe(0);
  });
});
