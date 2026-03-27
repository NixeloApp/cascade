import { describe, expect, it } from "vitest";
import { run } from "./check-e2e-loading-overrides.js";

describe("check-e2e-loading-overrides", () => {
  it("passes against the current repo state", () => {
    const result = run();

    expect(result.passed).toBe(true);
    expect(result.errors).toBe(0);
  });
});
