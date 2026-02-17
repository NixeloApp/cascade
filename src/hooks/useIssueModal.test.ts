import { describe, expect, it } from "vitest";
import { validateIssueSearch } from "./useIssueModal";

// Note: Testing useIssueModal hook directly is complex due to TanStack Router dependencies.
// The hook uses useSearch and useNavigate which require a full router context.
// Instead, we test the validateIssueSearch utility which handles search param validation.

describe("validateIssueSearch", () => {
  it("should return issue key when valid string", () => {
    const result = validateIssueSearch({ issue: "PROJ-123" });

    expect(result.issue).toBe("PROJ-123");
  });

  it("should return undefined when issue is missing", () => {
    const result = validateIssueSearch({});

    expect(result.issue).toBeUndefined();
  });

  it("should return undefined when issue is not a string (number)", () => {
    const result = validateIssueSearch({ issue: 123 });

    expect(result.issue).toBeUndefined();
  });

  it("should return undefined when issue is null", () => {
    const result = validateIssueSearch({ issue: null });

    expect(result.issue).toBeUndefined();
  });

  it("should return undefined when issue is object", () => {
    const result = validateIssueSearch({ issue: { key: "PROJ-123" } });

    expect(result.issue).toBeUndefined();
  });

  it("should return undefined when issue is array", () => {
    const result = validateIssueSearch({ issue: ["PROJ-123"] });

    expect(result.issue).toBeUndefined();
  });

  it("should handle empty string", () => {
    const result = validateIssueSearch({ issue: "" });

    expect(result.issue).toBe("");
  });

  it("should preserve other search params are not included in result", () => {
    const result = validateIssueSearch({
      issue: "PROJ-123",
      otherParam: "value",
    });

    expect(result).toEqual({ issue: "PROJ-123" });
    expect("otherParam" in result).toBe(false);
  });

  it("should handle various issue key formats", () => {
    expect(validateIssueSearch({ issue: "A-1" }).issue).toBe("A-1");
    expect(validateIssueSearch({ issue: "PROJECT-999" }).issue).toBe("PROJECT-999");
    expect(validateIssueSearch({ issue: "PROJ_TEAM-123" }).issue).toBe("PROJ_TEAM-123");
  });
});
