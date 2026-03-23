import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AIConfig } from "./config";
import { type AIMessage, callAI } from "./providers";

// Mock getFallbackAIConfig for fallback tests
vi.mock("./config", async (importOriginal) => {
  const original = await importOriginal<typeof import("./config")>();
  return {
    ...original,
    getFallbackAIConfig: vi.fn(() => null),
  };
});

import { getFallbackAIConfig } from "./config";

// Mock fetchWithTimeout
vi.mock("../lib/fetchWithTimeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

import { fetchWithTimeout } from "../lib/fetchWithTimeout";

describe("AI Providers", () => {
  const mockConfig: AIConfig = {
    provider: "anthropic",
    apiKey: "test-api-key",
    model: "claude-haiku-4-5",
    temperature: 0.7,
    maxTokens: 4096,
  };

  const mockMessages: AIMessage[] = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello!" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("callAI", () => {
    it("should call Anthropic API and return response", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          content: [{ text: "Hello! How can I help you today?" }],
          usage: {
            input_tokens: 10,
            output_tokens: 8,
          },
        }),
      };
      vi.mocked(fetchWithTimeout).mockResolvedValue(mockResponse as unknown as Response);

      const result = await callAI(mockConfig, mockMessages);

      expect(result.content).toBe("Hello! How can I help you today?");
      expect(result.usage).toEqual({
        promptTokens: 10,
        completionTokens: 8,
        totalTokens: 18,
      });
    });

    it("should call Anthropic API with correct parameters", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          content: [{ text: "Response" }],
          usage: { input_tokens: 5, output_tokens: 5 },
        }),
      };
      vi.mocked(fetchWithTimeout).mockResolvedValue(mockResponse as unknown as Response);

      await callAI(mockConfig, mockMessages);

      expect(fetchWithTimeout).toHaveBeenCalledWith(
        "https://api.anthropic.com/v1/messages",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "test-api-key",
            "anthropic-version": "2023-06-01",
          },
        }),
        60000, // 1 minute timeout
      );
    });

    it("should extract system message from messages", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          content: [{ text: "Response" }],
          usage: { input_tokens: 5, output_tokens: 5 },
        }),
      };
      vi.mocked(fetchWithTimeout).mockResolvedValue(mockResponse as unknown as Response);

      await callAI(mockConfig, mockMessages);

      expect(fetchWithTimeout).toHaveBeenCalledTimes(1);
      const [url, options] = vi.mocked(fetchWithTimeout).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.system).toBe("You are a helpful assistant.");
      // System message should be filtered out of messages array
      expect(body.messages).toEqual([{ role: "user", content: "Hello!" }]);
    });

    it("should throw validation error for unsupported provider", async () => {
      const invalidConfig = {
        ...mockConfig,
        provider: "unsupported" as AIConfig["provider"],
      };

      await expect(callAI(invalidConfig, mockMessages)).rejects.toThrow(
        "Unsupported AI provider: unsupported",
      );
    });

    it("should throw error when API returns error", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue("Invalid API key"),
      };
      vi.mocked(fetchWithTimeout).mockResolvedValue(mockResponse as unknown as Response);

      await expect(callAI(mockConfig, mockMessages)).rejects.toThrow(
        "Anthropic API error (401): Invalid API key",
      );
    });

    it("should use default maxTokens and temperature when not specified", async () => {
      const configWithoutDefaults: AIConfig = {
        provider: "anthropic",
        apiKey: "test-api-key",
        model: "claude-haiku-4-5",
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          content: [{ text: "Response" }],
          usage: { input_tokens: 5, output_tokens: 5 },
        }),
      };
      vi.mocked(fetchWithTimeout).mockResolvedValue(mockResponse as unknown as Response);

      await callAI(configWithoutDefaults, mockMessages);

      expect(fetchWithTimeout).toHaveBeenCalledTimes(1);
      const [url, options] = vi.mocked(fetchWithTimeout).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.max_tokens).toBe(4096);
      expect(body.temperature).toBe(0.7);
    });

    it("should fall back to secondary provider on transient error", async () => {
      const openAIConfig: AIConfig = {
        provider: "openai",
        apiKey: "openai-key",
        model: "gpt-4o",
      };
      vi.mocked(getFallbackAIConfig).mockReturnValue(openAIConfig);

      // First call (Anthropic) fails with 503
      const failResponse = {
        ok: false,
        status: 503,
        text: vi.fn().mockResolvedValue("Service temporarily unavailable"),
      };
      // Second call (OpenAI fallback) succeeds
      const successResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: "Fallback response" } }],
          usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
        }),
      };

      vi.mocked(fetchWithTimeout)
        .mockResolvedValueOnce(failResponse as unknown as Response)
        .mockResolvedValueOnce(successResponse as unknown as Response);

      const result = await callAI(mockConfig, mockMessages);

      expect(result.content).toBe("Fallback response");
      expect(result.provider).toBe("openai");
      expect(fetchWithTimeout).toHaveBeenCalledTimes(2);
    });

    it("should not fall back on permanent errors (401)", async () => {
      vi.mocked(getFallbackAIConfig).mockReturnValue({
        provider: "openai",
        apiKey: "openai-key",
        model: "gpt-4o",
      });

      const authError = {
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue("Invalid API key"),
      };
      vi.mocked(fetchWithTimeout).mockResolvedValue(authError as unknown as Response);

      await expect(callAI(mockConfig, mockMessages)).rejects.toThrow("Anthropic API error (401)");
      // Should NOT have tried fallback
      expect(fetchWithTimeout).toHaveBeenCalledTimes(1);
    });
  });
});
