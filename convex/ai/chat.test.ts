import { register } from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "../testUtils";

// Mock the 'ai' module
vi.mock("ai", () => ({
  generateText: vi.fn(),
  anthropic: vi.fn(),
}));

// Import the mocked function to set up return values
import { generateText } from "ai";

describe("AI Chat", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset mocks
    vi.mocked(generateText).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should successfully send a message and store the response", async () => {
    const t = convexTest(schema, modules);
    register(t); // Register rate limiter

    const { asUser, userId, organizationId } = await createTestContext(t);

    // Create a project
    const projectId = await createProjectInOrganization(t, userId, organizationId);

    // Mock the AI response
    vi.mocked(generateText).mockResolvedValue({
      text: "I am a helpful AI assistant.",
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
    } as any);

    // Call the chat action
    const result = await asUser.action(api.ai.chat.chat, {
      projectId,
      message: "Hello AI",
    });

    // Verify the result
    expect(result.message).toBe("I am a helpful AI assistant.");
    expect(result.chatId).toBeDefined();

    // Verify that the chat was created in the DB
    const chats = await t.run(async (ctx) => {
      return await ctx.db.query("aiChats").collect();
    });
    expect(chats).toHaveLength(1);
    expect(chats[0].title).toBe("Hello AI"); // First 100 chars
    expect(chats[0].userId).toBe(userId);
    expect(chats[0].projectId).toBe(projectId);

    // Verify that messages were stored (user + assistant)
    const messages = await t.run(async (ctx) => {
      return await ctx.db.query("aiMessages").collect();
    });
    expect(messages).toHaveLength(2);

    const userMessage = messages.find((m) => m.role === "user");
    expect(userMessage).toBeDefined();
    expect(userMessage?.content).toBe("Hello AI");

    const aiMessage = messages.find((m) => m.role === "assistant");
    expect(aiMessage).toBeDefined();
    expect(aiMessage?.content).toBe("I am a helpful AI assistant.");
    expect(aiMessage?.tokensUsed).toBe(30);

    // Verify usage tracking
    const usage = await t.run(async (ctx) => {
      return await ctx.db.query("aiUsage").collect();
    });
    expect(usage).toHaveLength(1);
    expect(usage[0].userId).toBe(userId);
    expect(usage[0].projectId).toBe(projectId);
    expect(usage[0].operation).toBe("chat");
    expect(usage[0].totalTokens).toBe(30);
    expect(usage[0].success).toBe(true);
  });
});
