import { describe, expect, it } from "vitest";
import { constantTimeEqual } from "./apiAuth";

describe("constantTimeEqual", () => {
  it("should return true for identical strings", () => {
    expect(constantTimeEqual("secret", "secret")).toBe(true);
    expect(constantTimeEqual("", "")).toBe(true);
    expect(constantTimeEqual("super-secret-key-123", "super-secret-key-123")).toBe(true);
  });

  it("should return false for different strings of same length", () => {
    expect(constantTimeEqual("secret", "s3cret")).toBe(false);
    expect(constantTimeEqual("abc", "abd")).toBe(false);
  });

  it("should return false for strings of different lengths", () => {
    expect(constantTimeEqual("secret", "secret1")).toBe(false);
    expect(constantTimeEqual("secret", "secre")).toBe(false);
    expect(constantTimeEqual("", "a")).toBe(false);
  });

  it("should handle special characters", () => {
    expect(constantTimeEqual("!@#$%", "!@#$%")).toBe(true);
    expect(constantTimeEqual("!@#$%", "!@#$^")).toBe(false);
  });
});
