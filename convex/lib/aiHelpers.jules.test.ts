import { describe, expect, it } from "vitest";
import { extractUsage, getTotalTokens } from "./aiHelpers";

describe("extractUsage", () => {
  it("should return zeros for undefined usage", () => {
    const result = extractUsage(undefined);
    expect(result).toEqual({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    });
  });

  it("should return exact values when inputTokens and outputTokens are provided", () => {
    const usage = {
      inputTokens: 15,
      outputTokens: 25,
      totalTokens: 40,
      // Testing with properties that the implementation looks for
    } as any;

    const result = extractUsage(usage);
    expect(result).toEqual({
      promptTokens: 15,
      completionTokens: 25,
      totalTokens: 40,
    });
  });

  it("should estimate usage based on totalTokens when input/output tokens are missing", () => {
    const usage = {
      totalTokens: 100,
    } as any;

    const result = extractUsage(usage);
    expect(result.totalTokens).toBe(100);
    // 70% of 100 = 70
    expect(result.promptTokens).toBe(70);
    // 30% of 100 = 30
    expect(result.completionTokens).toBe(30);
  });

  it("should handle rounding in estimation using Math.floor", () => {
    // 11 * 0.7 = 7.7 -> floor -> 7
    // 11 * 0.3 = 3.3 -> floor -> 3
    const usage = {
      totalTokens: 11,
    } as any;

    const result = extractUsage(usage);
    expect(result.promptTokens).toBe(7);
    expect(result.completionTokens).toBe(3);
    expect(result.totalTokens).toBe(11);
  });

  it("should handle mixed missing tokens (e.g. only inputTokens provided)", () => {
    const usage = {
      totalTokens: 100,
      inputTokens: 60,
    } as any;

    // inputTokens provided: 60
    // outputTokens missing: 100 * 0.3 = 30
    const result = extractUsage(usage);
    expect(result.promptTokens).toBe(60);
    expect(result.completionTokens).toBe(30);
  });

  it("should handle empty usage object (all optional fields missing)", () => {
    const usage = {} as any;
    const result = extractUsage(usage);
    expect(result).toEqual({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    });
  });
});

describe("getTotalTokens", () => {
  it("should return 0 for undefined usage", () => {
    expect(getTotalTokens(undefined)).toBe(0);
  });

  it("should return totalTokens from usage object", () => {
    const usage = {
      totalTokens: 50,
    } as any;
    expect(getTotalTokens(usage)).toBe(50);
  });

  it("should return 0 if totalTokens is missing in usage object", () => {
    const usage = {} as any;
    expect(getTotalTokens(usage)).toBe(0);
  });
});
