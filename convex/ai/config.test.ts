import { beforeEach, describe, expect, it, vi } from "vitest";
import { CLAUDE_MODELS, DEFAULT_MODELS, getAIConfig, isAIConfigured } from "./config";

// Mock the env functions
vi.mock("../lib/env", () => ({
  getAnthropicApiKey: vi.fn(),
  getAnthropicModel: vi.fn(),
  isAnthropicConfigured: vi.fn(),
}));

import { getAnthropicApiKey, getAnthropicModel, isAnthropicConfigured } from "../lib/env";

describe("AI Config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Constants", () => {
    it("should define Claude models", () => {
      expect(CLAUDE_MODELS.opus).toBe("claude-opus-4-5");
      expect(CLAUDE_MODELS.haiku).toBe("claude-haiku-4-5");
    });

    it("should define default models for each use case", () => {
      expect(DEFAULT_MODELS.chat).toBe(CLAUDE_MODELS.opus);
      expect(DEFAULT_MODELS.suggestions).toBe(CLAUDE_MODELS.haiku);
      expect(DEFAULT_MODELS.summary).toBe(CLAUDE_MODELS.opus);
    });
  });

  describe("getAIConfig", () => {
    it("should return config when API key is set", () => {
      vi.mocked(getAnthropicApiKey).mockReturnValue("test-api-key");
      vi.mocked(getAnthropicModel).mockReturnValue("claude-haiku-4-5");

      const config = getAIConfig();

      expect(config).toEqual({
        provider: "anthropic",
        apiKey: "test-api-key",
        model: "claude-haiku-4-5",
        temperature: 0.7,
        maxTokens: 4096,
      });
    });

    it("should throw validation error when API key is not set", () => {
      vi.mocked(getAnthropicApiKey).mockReturnValue(undefined);

      expect(() => getAIConfig()).toThrow("ANTHROPIC_API_KEY not configured");
    });

    it("should throw validation error when API key is empty string", () => {
      vi.mocked(getAnthropicApiKey).mockReturnValue("");

      expect(() => getAIConfig()).toThrow("ANTHROPIC_API_KEY not configured");
    });
  });

  describe("isAIConfigured", () => {
    it("should return true when Anthropic is configured", () => {
      vi.mocked(isAnthropicConfigured).mockReturnValue(true);

      expect(isAIConfigured()).toBe(true);
    });

    it("should return false when Anthropic is not configured", () => {
      vi.mocked(isAnthropicConfigured).mockReturnValue(false);

      expect(isAIConfigured()).toBe(false);
    });
  });
});
