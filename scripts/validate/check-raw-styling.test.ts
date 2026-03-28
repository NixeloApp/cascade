import { describe, expect, it } from "vitest";
import {
  collectUtilityLikeClassLiterals,
  findSingleConsumerSurfaceClassNameHelpers,
  run,
} from "./check-raw-styling.js";

describe("check-raw-styling", () => {
  it("collects utility-like class string literals from helper modules", () => {
    expect(
      collectUtilityLikeClassLiterals(`
        export function getShellClassName() {
          return "overflow-auto min-w-160 bg-ui-bg-secondary";
        }
      `),
    ).toEqual([
      {
        line: 3,
        literal: "overflow-auto min-w-160 bg-ui-bg-secondary",
      },
    ]);
  });

  it("flags single-consumer surface classname helpers", () => {
    const violations = findSingleConsumerSurfaceClassNameHelpers({
      "src/components/ui/exampleSurfaceClassNames.ts": `
        export function getExampleShellClassName() {
          return "overflow-auto min-w-160";
        }
      `,
      "src/components/Example.tsx": `
        import { getExampleShellClassName } from "./ui/exampleSurfaceClassNames";
        export function Example() {
          return <div className={getExampleShellClassName()} />;
        }
      `,
    });

    expect(violations).toEqual({
      "src/components/ui/exampleSurfaceClassNames.ts": [
        {
          consumers: ["src/components/Example.tsx"],
          line: 3,
          replacement:
            "single-consumer class helper for src/components/Example.tsx — inline locally or promote to a shared semantic primitive API",
        },
      ],
    });
  });

  it("allows helpers that are reused by multiple product consumers", () => {
    const violations = findSingleConsumerSurfaceClassNameHelpers({
      "src/components/ui/exampleSurfaceClassNames.ts": `
        export function getExampleShellClassName() {
          return "overflow-auto min-w-160";
        }
      `,
      "src/components/ExampleA.tsx": `
        import { getExampleShellClassName } from "./ui/exampleSurfaceClassNames";
        export function ExampleA() {
          return <div className={getExampleShellClassName()} />;
        }
      `,
      "src/components/ExampleB.tsx": `
        import { getExampleShellClassName } from "./ui/exampleSurfaceClassNames";
        export function ExampleB() {
          return <div className={getExampleShellClassName()} />;
        }
      `,
    });

    expect(violations).toEqual({});
  });

  it("passes against the current repo state", () => {
    const result = run();

    expect(result.passed).toBe(true);
    expect(result.errors).toBe(0);
  });
});
