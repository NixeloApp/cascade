import { describe, expect, it } from "vitest";
import { getOptionalAuthFlowEmail } from "./authFlowSearch";

describe("getOptionalAuthFlowEmail", () => {
  it("normalizes valid email-like search values", () => {
    expect(getOptionalAuthFlowEmail("  USER@Example.com ")).toBe("user@example.com");
  });

  it("returns undefined for empty or non-string values", () => {
    expect(getOptionalAuthFlowEmail("   ")).toBeUndefined();
    expect(getOptionalAuthFlowEmail(undefined)).toBeUndefined();
    expect(getOptionalAuthFlowEmail(null)).toBeUndefined();
    expect(getOptionalAuthFlowEmail(42)).toBeUndefined();
  });
});
