import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGenerateText = vi.hoisted(() => vi.fn());

vi.mock("ai", () => ({ generateText: mockGenerateText }));
vi.mock("./config", () => ({
  getModel: vi.fn(() => ({ modelId: "test-model", provider: "test" })),
}));

// Import after mocks are set up
const { callAI } = await import("./providers");

describe("callAI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls generateText and returns formatted response", async () => {
    mockGenerateText.mockResolvedValue({
      text: "Hello from AI",
      usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
    });

    const result = await callAI([{ role: "user", content: "Hello" }]);

    expect(result.content).toBe("Hello from AI");
    expect(result.provider).toBe("test");
    expect(result.usage).toEqual({
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
    });
  });

  it("handles missing usage gracefully", async () => {
    mockGenerateText.mockResolvedValue({ text: "Response" });

    const result = await callAI([{ role: "user", content: "Test" }]);

    expect(result.content).toBe("Response");
    expect(result.usage).toBeUndefined();
  });

  it("propagates errors from generateText", async () => {
    mockGenerateText.mockRejectedValue(new Error("API error"));

    await expect(callAI([{ role: "user", content: "Test" }])).rejects.toThrow("API error");
  });
});
