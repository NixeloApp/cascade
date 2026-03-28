import { register } from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "../testUtils";

const mockGenerateText = vi.fn();
vi.mock("ai", () => ({ generateText: mockGenerateText }));

vi.mock("./config", () => ({
  getModel: vi.fn(() => ({ modelId: "test-model", provider: "test" })),
  getActiveProvider: vi.fn(() => "anthropic"),
  getModelId: vi.fn(() => "test-model"),
}));

function expectDefined<T>(value: T | undefined, label: string): T {
  expect(value, `${label} should be defined`).not.toBeUndefined();
  if (value === undefined) {
    throw new Error(`${label} should be defined`);
  }
  return value;
}

describe("AI Chat", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGenerateText.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should successfully send a message and store the response", async () => {
    const t = convexTest(schema, modules);
    register(t);

    const { asUser, userId, organizationId } = await createTestContext(t);
    const projectId = await createProjectInOrganization(t, userId, organizationId);

    mockGenerateText.mockResolvedValue({
      text: "I am a helpful AI assistant.",
      usage: {
        inputTokens: 10,
        outputTokens: 20,
        totalTokens: 30,
      },
    });

    const result = await asUser.action(api.ai.chat.chat, {
      projectId,
      message: "Hello AI",
    });

    expect(result.message).toBe("I am a helpful AI assistant.");
    expect(typeof result.chatId).toBe("string");
    expect(result.chatId.length).toBeGreaterThan(0);

    const chats = await t.run(async (ctx) => {
      return await ctx.db.query("aiChats").collect();
    });
    expect(chats).toHaveLength(1);
    expect(chats[0].title).toBe("Hello AI");
    expect(chats[0].userId).toBe(userId);
    expect(chats[0].projectId).toBe(projectId);

    const messages = await t.run(async (ctx) => {
      return await ctx.db.query("aiMessages").collect();
    });
    expect(messages).toHaveLength(2);

    const userMessage = expectDefined(
      messages.find((m) => m.role === "user"),
      "user message",
    );
    expect(userMessage.content).toBe("Hello AI");

    const aiMessage = expectDefined(
      messages.find((m) => m.role === "assistant"),
      "assistant message",
    );
    expect(aiMessage.content).toBe("I am a helpful AI assistant.");
    expect(aiMessage.tokensUsed).toBe(30);

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

  it("should handle AI generation failure gracefully", async () => {
    const t = convexTest(schema, modules);
    register(t);

    const { asUser, userId, organizationId } = await createTestContext(t);
    const projectId = await createProjectInOrganization(t, userId, organizationId);

    mockGenerateText.mockRejectedValue(new Error("API Limit Exceeded"));

    await expect(
      asUser.action(api.ai.chat.chat, {
        projectId,
        message: "Hello AI",
      }),
    ).rejects.toThrow("API Limit Exceeded");

    const chats = await t.run(async (ctx) => {
      return await ctx.db.query("aiChats").collect();
    });
    expect(chats).toHaveLength(1);

    const messages = await t.run(async (ctx) => {
      return await ctx.db.query("aiMessages").collect();
    });
    expect(messages).toHaveLength(2);

    const userMessage = expectDefined(
      messages.find((m) => m.role === "user"),
      "user message",
    );
    expect(userMessage.content).toBe("Hello AI");

    const systemMessage = expectDefined(
      messages.find((m) => m.role === "system"),
      "system message",
    );
    expect(systemMessage.content).toContain("AI generation failed: API Limit Exceeded");

    const usage = await t.run(async (ctx) => {
      return await ctx.db.query("aiUsage").collect();
    });
    expect(usage).toHaveLength(1);
    expect(usage[0].success).toBe(false);
    expect(usage[0].errorMessage).toBe("API Limit Exceeded");
    expect(usage[0].totalTokens).toBe(0);
  });
});
