import { beforeEach, describe, expect, it, vi } from "vitest";
import { getActiveProvider, getFastModel, getModel, isAIConfigured } from "./config";

vi.mock("../lib/env");
vi.mock("../lib/errors", () => ({
  validation: vi.fn((_field: string, msg: string) => new Error(msg)),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: vi.fn(() => (model: string) => ({ modelId: model, provider: "anthropic" })),
}));

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => (model: string) => ({ modelId: model, provider: "openai" })),
}));

import {
  getAnthropicApiKey,
  getAnthropicBaseUrl,
  getOpenAIApiKey,
  getOpenAIBaseUrl,
  isAnthropicConfigured,
  isOpenAIConfigured,
} from "../lib/env";

function setupAnthropicMocks() {
  vi.mocked(isAnthropicConfigured).mockReturnValue(true);
  vi.mocked(getAnthropicApiKey).mockReturnValue("test-anthropic-key");
  vi.mocked(getAnthropicBaseUrl).mockReturnValue(undefined);
}

function setupOpenAIMocks() {
  vi.mocked(isOpenAIConfigured).mockReturnValue(true);
  vi.mocked(getOpenAIApiKey).mockReturnValue("test-openai-key");
  vi.mocked(getOpenAIBaseUrl).mockReturnValue(undefined);
}

describe("AI Config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAnthropicConfigured).mockReturnValue(false);
    vi.mocked(isOpenAIConfigured).mockReturnValue(false);
  });

  describe("isAIConfigured", () => {
    it("returns true when Anthropic is configured", () => {
      setupAnthropicMocks();
      expect(isAIConfigured()).toBe(true);
    });

    it("returns true when OpenAI is configured", () => {
      setupOpenAIMocks();
      expect(isAIConfigured()).toBe(true);
    });

    it("returns false when neither is configured", () => {
      expect(isAIConfigured()).toBe(false);
    });
  });

  describe("getActiveProvider", () => {
    it("returns anthropic when configured", () => {
      setupAnthropicMocks();
      expect(getActiveProvider()).toBe("anthropic");
    });

    it("returns openai when configured", () => {
      setupOpenAIMocks();
      expect(getActiveProvider()).toBe("openai");
    });

    it("prefers anthropic when both configured", () => {
      setupAnthropicMocks();
      setupOpenAIMocks();
      expect(getActiveProvider()).toBe("anthropic");
    });

    it("throws when neither configured", () => {
      expect(() => getActiveProvider()).toThrow();
    });
  });

  describe("getModel", () => {
    it("returns claude-opus-4-5 when Anthropic is configured", () => {
      setupAnthropicMocks();
      const model = getModel();
      expect(model).toHaveProperty("modelId", "claude-opus-4-5");
    });

    it("returns gpt-4o when OpenAI is configured", () => {
      setupOpenAIMocks();
      const model = getModel();
      expect(model).toHaveProperty("modelId", "gpt-4o");
    });

    it("throws when no provider configured", () => {
      expect(() => getModel()).toThrow();
    });
  });

  describe("getFastModel", () => {
    it("returns claude-haiku-4-5 when Anthropic is configured", () => {
      setupAnthropicMocks();
      const model = getFastModel();
      expect(model).toHaveProperty("modelId", "claude-haiku-4-5");
    });

    it("returns gpt-4o-mini when OpenAI is configured", () => {
      setupOpenAIMocks();
      const model = getFastModel();
      expect(model).toHaveProperty("modelId", "gpt-4o-mini");
    });
  });
});
