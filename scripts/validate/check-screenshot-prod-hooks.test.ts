import { describe, expect, it } from "vitest";
import { collectBannedScreenshotProdHooks, run } from "./check-screenshot-prod-hooks.js";

describe("check-screenshot-prod-hooks", () => {
  it("flags removed screenshot-only editor hook strings in production code", () => {
    const violations = collectBannedScreenshotProdHooks(
      `
        window.addEventListener("nixelo:e2e-open-slash-menu", handleOpen);
        if (window.__NIXELO_E2E_MARKDOWN_IMPORT__) {
          return;
        }
      `,
      "/tmp/example.tsx",
    );

    expect(violations).toHaveLength(2);
    expect(violations[0]).toMatchObject({
      line: 2,
      pattern: "nixelo:e2e-open-slash-menu",
    });
    expect(violations[0]?.file.endsWith("tmp/example.tsx")).toBe(true);
    expect(violations[1]).toMatchObject({
      line: 3,
      pattern: "__NIXELO_E2E_MARKDOWN_IMPORT__",
    });
    expect(violations[1]?.file.endsWith("tmp/example.tsx")).toBe(true);
  });

  it("passes against the current repo state", () => {
    const result = run();

    expect(result.passed).toBe(true);
    expect(result.errors).toBe(0);
  });
});
