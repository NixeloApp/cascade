import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireBotApiKey } from "./botAuth";

// Mock QueryCtx/MutationCtx - we only need an empty object as it's unused by requireBotApiKey
const mockCtx = {} as any;

describe("botAuth", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.BOT_SERVICE_API_KEY = "test-bot-key-123";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("requireBotApiKey", () => {
    it("should accept valid API key", () => {
      expect(() => requireBotApiKey(mockCtx, "test-bot-key-123")).not.toThrow();
    });

    it("should throw unauthenticated if API key is missing (undefined)", () => {
      expect(() => requireBotApiKey(mockCtx, undefined)).toThrow("Not authenticated");
    });

    it("should throw unauthenticated if API key is empty string", () => {
      expect(() => requireBotApiKey(mockCtx, "")).toThrow("Not authenticated");
    });

    it("should throw forbidden if API key has different length", () => {
      expect(() => requireBotApiKey(mockCtx, "short-key")).toThrow("Invalid bot service API key");
    });

    it("should throw forbidden if API key has same length but different content", () => {
      expect(() => requireBotApiKey(mockCtx, "test-bot-key-124")).toThrow(
        "Invalid bot service API key",
      );
    });

    it("should throw forbidden if API key is completely different", () => {
      expect(() => requireBotApiKey(mockCtx, "totally-wrong-key")).toThrow(
        "Invalid bot service API key",
      );
    });
  });
});
