import { describe, expect, it } from "vitest";
import { _private, run } from "./check-standards.js";

describe("check-standards", () => {
  it("flags raw span usage in production components", () => {
    const violations = _private.collectStandardsViolations(
      "src/components/Example.tsx",
      `
        export function Example() {
          return <span className="truncate">Bad</span>;
        }
      `,
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      filePath: "src/components/Example.tsx",
      line: 3,
      message: "Use <Inline>, <ResponsiveText>, or another ui/ primitive instead of raw <span>.",
    });
  });

  it("allows raw spans in the markdown comment renderer", () => {
    const violations = _private.collectStandardsViolations(
      "src/components/CommentRenderer.tsx",
      `
        export function CommentRenderer() {
          return <span>Allowed</span>;
        }
      `,
    );

    expect(violations).toEqual([]);
  });

  it("passes against the current repo state", { timeout: 15000 }, () => {
    const result = run();

    expect(result.passed).toBe(true);
    expect(result.errors).toBe(0);
  });
});
