
import { ConvexError } from "convex/values";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireBotApiKey } from "./botAuth";

describe("convex/lib/botAuth", () => {
  const MOCK_API_KEY = "test-api-key-12345";
  // Mock context - not used by implementation but required by type signature
  const mockCtx = {} as any;

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("BOT_SERVICE_API_KEY", MOCK_API_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("requireBotApiKey", () => {
    it("should succeed with the correct API key", () => {
      expect(() => requireBotApiKey(mockCtx, MOCK_API_KEY)).not.toThrow();
    });

    it("should throw UNAUTHENTICATED if API key is missing (undefined)", () => {
      try {
        requireBotApiKey(mockCtx, undefined);
        expect.fail("Expected requireBotApiKey to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(ConvexError);
        const convexError = error as ConvexError<any>;
        expect(convexError.data.code).toBe("UNAUTHENTICATED");
      }
    });

    it("should throw UNAUTHENTICATED if API key is empty string", () => {
      // The implementation checks `if (!apiKey)`, so empty string is falsy
      try {
        requireBotApiKey(mockCtx, "");
        expect.fail("Expected requireBotApiKey to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(ConvexError);
        const convexError = error as ConvexError<any>;
        expect(convexError.data.code).toBe("UNAUTHENTICATED");
      }
    });

    it("should throw FORBIDDEN if API key is incorrect (same length)", () => {
      // Modify one character to keep same length but different content
      const invalidKey = MOCK_API_KEY.slice(0, -1) + "X";
      expect(invalidKey.length).toBe(MOCK_API_KEY.length);

      try {
        requireBotApiKey(mockCtx, invalidKey);
        expect.fail("Expected requireBotApiKey to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(ConvexError);
        const convexError = error as ConvexError<any>;
        expect(convexError.data.code).toBe("FORBIDDEN");
        expect(convexError.data.message).toBe("Invalid bot service API key");
      }
    });

    it("should throw FORBIDDEN if API key is incorrect (different length)", () => {
      const invalidKey = "wrong-length";

      try {
        requireBotApiKey(mockCtx, invalidKey);
        expect.fail("Expected requireBotApiKey to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(ConvexError);
        const convexError = error as ConvexError<any>;
        expect(convexError.data.code).toBe("FORBIDDEN");
        expect(convexError.data.message).toBe("Invalid bot service API key");
      }
    });

    it("should throw VALIDATION error if server environment is not configured", () => {
      // Unset the env var to simulate misconfiguration
      vi.unstubAllEnvs();
      // Ensure it's not set from process.env
      vi.stubEnv("BOT_SERVICE_API_KEY", "");

      try {
        requireBotApiKey(mockCtx, "some-key");
        expect.fail("Expected requireBotApiKey to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(ConvexError);
        const convexError = error as ConvexError<any>;
        expect(convexError.data.code).toBe("VALIDATION");
        expect(convexError.data.field).toBe("BOT_SERVICE_API_KEY");
      }
    });
  });
});
