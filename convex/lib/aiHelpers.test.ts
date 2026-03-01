import type { LanguageModelUsage } from "ai";
import { describe, expect, it } from "vitest";
import { extractUsage, getTotalTokens } from "./aiHelpers";

describe("aiHelpers", () => {
  describe("extractUsage", () => {
    it("should return zeros when usage is undefined", () => {
      const result = extractUsage(undefined);

      expect(result).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });

    it("should extract tokens when all fields are present", () => {
      const usage: LanguageModelUsage = {
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
      };

      const result = extractUsage(usage);

      expect(result).toEqual({
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      });
    });

    it("should estimate input/output when only totalTokens is present", () => {
      const usage: LanguageModelUsage = {
        totalTokens: 100,
      };

      const result = extractUsage(usage);

      expect(result).toEqual({
        promptTokens: 70, // 70% of total
        completionTokens: 30, // 30% of total
        totalTokens: 100,
      });
    });

    it("should use inputTokens when available but outputTokens missing", () => {
      const usage: LanguageModelUsage = {
        inputTokens: 80,
        totalTokens: 100,
      };

      const result = extractUsage(usage);

      expect(result).toEqual({
        promptTokens: 80,
        completionTokens: 30, // Estimated
        totalTokens: 100,
      });
    });

    it("should use outputTokens when available but inputTokens missing", () => {
      const usage: LanguageModelUsage = {
        outputTokens: 40,
        totalTokens: 100,
      };

      const result = extractUsage(usage);

      expect(result).toEqual({
        promptTokens: 70, // Estimated
        completionTokens: 40,
        totalTokens: 100,
      });
    });

    it("should handle zero totalTokens", () => {
      const usage: LanguageModelUsage = {
        totalTokens: 0,
      };

      const result = extractUsage(usage);

      expect(result).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });
  });

  describe("getTotalTokens", () => {
    it("should return 0 when usage is undefined", () => {
      expect(getTotalTokens(undefined)).toBe(0);
    });

    it("should return totalTokens when present", () => {
      const usage: LanguageModelUsage = {
        totalTokens: 150,
      };

      expect(getTotalTokens(usage)).toBe(150);
    });

    it("should return 0 when totalTokens is not set", () => {
      const usage = {} as LanguageModelUsage;

      expect(getTotalTokens(usage)).toBe(0);
    });
  });
});
